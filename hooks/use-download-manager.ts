"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useToast } from "@/components/ui/use-toast"

export function useDownloadManager() {
  const [activeDownload, setActiveDownload] = useState<string | null>(null)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null)
  const [fileSize, setFileSize] = useState<number | null>(null)
  const [format, setFormat] = useState<string | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [videoTitle, setVideoTitle] = useState<string>("")
  const { toast } = useToast()
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [currentUrl, setCurrentUrl] = useState<string | null>(null)
  const [lastProgressUpdate, setLastProgressUpdate] = useState<number>(0)
  const [downloadComplete, setDownloadComplete] = useState<boolean>(false)
  const downloadTriggeredRef = useRef<boolean>(false)
  const progressRef = useRef<number>(0)
  const lastProgressValueRef = useRef<number>(0)
  const realProgressReceivedRef = useRef<boolean>(false)
  const completionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [downloadStatus, setDownloadStatus] = useState<string>("pending")
  const [isAudioOnly, setIsAudioOnly] = useState<boolean>(false)
  const downloadLinkRef = useRef<HTMLAnchorElement | null>(null)
  const errorCountRef = useRef<number>(0)
  const noProgressCountRef = useRef<number>(0)
  const lastProgressTimeRef = useRef<number>(Date.now())
  const consecutiveErrorsRef = useRef<number>(0)
  const forcedProgressUpdateRef = useRef<NodeJS.Timeout | null>(null)
  const simulatedProgressRef = useRef<NodeJS.Timeout | null>(null)
  const progressStallDetectionRef = useRef<NodeJS.Timeout | null>(null)
  const downloadAttemptRef = useRef<number>(0)
  const [modalVisible, setModalVisible] = useState<boolean>(false)
  const debugRef = useRef<boolean>(true)
  const downloadTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Debug logging function
  const debugLog = useCallback((...args: any[]) => {
    if (debugRef.current) {
      console.log(...args)
    }
  }, [])

  // Create a hidden download link
  useEffect(() => {
    // Create a hidden anchor element for downloads
    const link = document.createElement("a")
    link.style.display = "none"
    document.body.appendChild(link)
    downloadLinkRef.current = link

    return () => {
      if (link && document.body.contains(link)) {
        document.body.removeChild(link)
      }
    }
  }, [])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
      if (completionTimeoutRef.current) {
        clearTimeout(completionTimeoutRef.current)
      }
      if (forcedProgressUpdateRef.current) {
        clearInterval(forcedProgressUpdateRef.current)
      }
      if (simulatedProgressRef.current) {
        clearInterval(simulatedProgressRef.current)
      }
      if (progressStallDetectionRef.current) {
        clearTimeout(progressStallDetectionRef.current)
      }
      if (downloadTimeoutRef.current) {
        clearTimeout(downloadTimeoutRef.current)
      }
    }
  }, [])

  // Function to simulate progress when real progress stalls
  const startSimulatedProgress = useCallback(() => {
    // Clear any existing simulation
    if (simulatedProgressRef.current) {
      clearInterval(simulatedProgressRef.current)
    }

    // Only simulate progress if we're not complete and not failed
    if (downloadStatus !== "completed" && downloadStatus !== "failed" && downloadProgress < 95) {
      debugLog("Starting simulated progress updates")

      simulatedProgressRef.current = setInterval(() => {
        const now = Date.now()
        const timeSinceUpdate = now - lastProgressTimeRef.current

        // If no progress update for more than 2 seconds, simulate small increments
        if (timeSinceUpdate > 2000) {
          setDownloadProgress((prev) => {
            // Add a tiny increment (0.1-0.3%) to show activity, but don't exceed 95%
            const increment = Math.random() * 0.2 + 0.1
            const newValue = Math.min(prev + increment, 95)
            debugLog(`Simulating progress: ${prev.toFixed(2)}% -> ${newValue.toFixed(2)}%`)
            return newValue
          })
        }
      }, 1000)
    }
  }, [downloadProgress, downloadStatus, debugLog])

  const startDownload = async (url: string, format: string, title: string) => {
    try {
      debugLog("Starting download with format:", format)

      // Reset download triggered flag
      downloadTriggeredRef.current = false
      setDownloadComplete(false)
      progressRef.current = 0
      lastProgressValueRef.current = 0
      realProgressReceivedRef.current = false
      setDownloadStatus("processing")
      errorCountRef.current = 0
      noProgressCountRef.current = 0
      lastProgressTimeRef.current = Date.now()
      consecutiveErrorsRef.current = 0
      downloadAttemptRef.current = 0

      // Set active download first to show modal immediately
      setActiveDownload("initializing")
      setDownloadProgress(0)
      setEstimatedTime(60) // Set initial estimate to 60 seconds
      setFileSize(null)
      setFormat(format)
      setVideoTitle(title)
      setDownloadUrl(null)
      setCurrentUrl(url)
      setLastProgressUpdate(Date.now())
      setIsAudioOnly(format.includes("mp3"))
      setModalVisible(true) // Show the modal and keep it visible

      // Start simulated progress immediately to show activity
      startSimulatedProgress()

      // Initialize the stream on the server
      debugLog("Sending request to /api/video/stream")
      const response = await fetch("/api/video/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url, format }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to initialize download")
      }

      const data = await response.json()
      const taskId = data.task_id

      debugLog(`Download initialized with task ID: ${taskId}`)

      // Set the active download ID
      setActiveDownload(taskId)

      // Start polling for progress
      startProgressPolling(taskId)

      // Create the download URL
      const downloadPath = `/api/video/download?taskId=${taskId}`
      setDownloadUrl(downloadPath)

      return { task_id: taskId }
    } catch (error) {
      setActiveDownload(null)
      setModalVisible(false)

      // Clean up any intervals
      if (simulatedProgressRef.current) {
        clearInterval(simulatedProgressRef.current)
      }

      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start download",
        variant: "destructive",
      })
      throw error
    }
  }

  const startProgressPolling = (taskId: string) => {
    // Clear any existing interval
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
    }

    if (forcedProgressUpdateRef.current) {
      clearInterval(forcedProgressUpdateRef.current)
    }

    debugLog("Starting progress polling for task:", taskId)

    // Set up stall detection
    progressStallDetectionRef.current = setTimeout(() => {
      debugLog("No initial progress detected, starting simulated progress")
      startSimulatedProgress()
    }, 3000)

    // Poll for progress updates
    progressIntervalRef.current = setInterval(async () => {
      try {
        debugLog(`Polling progress for task ${taskId}`)
        const response = await fetch(`/api/video/progress?taskId=${taskId}`)

        // Reset consecutive errors on successful response
        consecutiveErrorsRef.current = 0

        const data = await response.json()
        debugLog("Progress update received:", data)

        // Update last progress update timestamp
        setLastProgressUpdate(Date.now())

        // Update download status
        if (data.status) {
          setDownloadStatus(data.status)
        }

        // Check for audio-only flag
        if (data.audioOnly !== undefined) {
          setIsAudioOnly(data.audioOnly)
        }

        // Ensure we have valid percentage values
        const percentage = typeof data.percentage === "number" ? data.percentage : 0

        // Check if progress has changed
        const hasProgressChanged = Math.abs(percentage - lastProgressValueRef.current) > 0.1

        // If progress has changed, update the last progress time
        if (hasProgressChanged) {
          lastProgressTimeRef.current = Date.now()
          noProgressCountRef.current = 0

          // Clear stall detection if this is the first real progress
          if (progressStallDetectionRef.current) {
            clearTimeout(progressStallDetectionRef.current)
            progressStallDetectionRef.current = null
          }

          // If we got real progress, we can stop simulated progress
          if (percentage > 1 && simulatedProgressRef.current) {
            debugLog("Real progress detected, stopping simulation")
            clearInterval(simulatedProgressRef.current)
            simulatedProgressRef.current = null
          }
        } else {
          // If no progress for a while, increment counter
          noProgressCountRef.current += 1

          // If progress has stalled for too long, restart simulation
          if (noProgressCountRef.current > 10 && !simulatedProgressRef.current) {
            debugLog("Progress has stalled, restarting simulation")
            startSimulatedProgress()
          }
        }

        // Mark if we've received real progress
        if (percentage > 5 && !realProgressReceivedRef.current) {
          realProgressReceivedRef.current = true
          debugLog("Real progress received in hook:", percentage)
        }

        // Only update if the percentage has changed or is higher
        if (percentage > lastProgressValueRef.current || (hasProgressChanged && realProgressReceivedRef.current)) {
          lastProgressValueRef.current = percentage
          progressRef.current = percentage
          setDownloadProgress(percentage)
          debugLog("UI progress updated to:", percentage)
        }

        if (data.estimated !== undefined && data.estimated !== null) {
          setEstimatedTime(data.estimated)
        }

        if (data.fileSize) {
          setFileSize(data.fileSize)
        }

        // If download is complete, stop polling and set download URL
        if (data.status === "completed" || percentage >= 100) {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current)
          }

          if (forcedProgressUpdateRef.current) {
            clearInterval(forcedProgressUpdateRef.current)
          }

          if (simulatedProgressRef.current) {
            clearInterval(simulatedProgressRef.current)
          }

          setDownloadProgress(100)
          progressRef.current = 100
          lastProgressValueRef.current = 100
          setEstimatedTime(0)
          setDownloadComplete(true)
          setDownloadStatus("completed")

          toast({
            title: "Download Ready",
            description: "Your file is ready to download.",
          })
        }

        // If download failed, stop polling and show error
        if (data.status === "failed") {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current)
          }

          if (forcedProgressUpdateRef.current) {
            clearInterval(forcedProgressUpdateRef.current)
          }

          if (simulatedProgressRef.current) {
            clearInterval(simulatedProgressRef.current)
          }

          setDownloadStatus("failed")

          toast({
            title: "Download Failed",
            description: "There was an error downloading your file.",
            variant: "destructive",
          })
        }

        // If download was cancelled, stop polling
        if (data.status === "cancelled") {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current)
          }

          if (forcedProgressUpdateRef.current) {
            clearInterval(forcedProgressUpdateRef.current)
          }

          if (simulatedProgressRef.current) {
            clearInterval(simulatedProgressRef.current)
          }

          setDownloadStatus("cancelled")
          setModalVisible(false) // Hide modal on cancel
        }

        // If no updates for a long time and progress is high, consider it complete
        const now = Date.now()
        if (percentage > 95 && now - lastProgressUpdate > 30000) {
          // 30 seconds
          debugLog("Progress is high and no updates for a while, marking as complete")
          setDownloadProgress(100)
          progressRef.current = 100
          lastProgressValueRef.current = 100
          setEstimatedTime(0)
          setDownloadComplete(true)
          setDownloadStatus("completed")

          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current)
          }

          if (forcedProgressUpdateRef.current) {
            clearInterval(forcedProgressUpdateRef.current)
          }

          if (simulatedProgressRef.current) {
            clearInterval(simulatedProgressRef.current)
          }

          toast({
            title: "Download Ready",
            description: "Your file is ready to download.",
          })
        }

        // If no real progress for a very long time (3 minutes), consider it failed
        if (now - lastProgressTimeRef.current > 180000 && percentage < 95) {
          debugLog("No progress for 3 minutes, marking as failed")
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current)
          }

          if (forcedProgressUpdateRef.current) {
            clearInterval(forcedProgressUpdateRef.current)
          }

          if (simulatedProgressRef.current) {
            clearInterval(simulatedProgressRef.current)
          }

          setDownloadStatus("failed")
          toast({
            title: "Download Failed",
            description: "Download timed out. Please try again.",
            variant: "destructive",
          })
        }
      } catch (error) {
        // Increment consecutive errors
        consecutiveErrorsRef.current += 1

        // Only log error after a few attempts to reduce console spam
        if (consecutiveErrorsRef.current <= 3 || consecutiveErrorsRef.current % 10 === 0) {
          console.error(`Error polling progress (attempt ${consecutiveErrorsRef.current}):`, error)
        }

        // If we've had too many consecutive errors, consider the download failed
        if (consecutiveErrorsRef.current > 20) {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current)
          }

          if (forcedProgressUpdateRef.current) {
            clearInterval(forcedProgressUpdateRef.current)
          }

          if (simulatedProgressRef.current) {
            clearInterval(simulatedProgressRef.current)
          }

          setDownloadStatus("failed")
          toast({
            title: "Download Failed",
            description: "Lost connection to the download server.",
            variant: "destructive",
          })
        }
      }
    }, 500) // Poll every 500ms for more responsive updates
  }

  const cancelDownload = async () => {
    if (!activeDownload || activeDownload === "initializing") return false

    try {
      // Stop progress polling
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
        progressIntervalRef.current = null
      }

      if (forcedProgressUpdateRef.current) {
        clearInterval(forcedProgressUpdateRef.current)
        forcedProgressUpdateRef.current = null
      }

      if (simulatedProgressRef.current) {
        clearInterval(simulatedProgressRef.current)
        simulatedProgressRef.current = null
      }

      if (progressStallDetectionRef.current) {
        clearTimeout(progressStallDetectionRef.current)
        progressStallDetectionRef.current = null
      }

      if (downloadTimeoutRef.current) {
        clearTimeout(downloadTimeoutRef.current)
        downloadTimeoutRef.current = null
      }

      debugLog(`Sending cancel request for task ${activeDownload}`)
      // Cancel the download on the server
      const response = await fetch("/api/video/stream", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ taskId: activeDownload }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to cancel download")
      }

      setActiveDownload(null)
      setDownloadStatus("cancelled")
      setModalVisible(false) // Hide modal on successful cancel

      toast({
        title: "Download Cancelled",
        description: "The download was cancelled",
      })

      return true
    } catch (error) {
      console.error("Error cancelling download:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to cancel download",
        variant: "destructive",
      })
      return false
    }
  }

  // Update the handleDownloadNow function in the hook
  const handleDownloadNow = async () => {
    // If we have a download URL, trigger the download
    if (downloadUrl) {
      try {
        // Increment download attempt counter
        downloadAttemptRef.current += 1
        const attemptCount = downloadAttemptRef.current

        // Create a safe filename
        const safeTitle = (videoTitle || "youtube-video").replace(/[^\w\s-]/g, "").replace(/\s+/g, "-")
        const fileExt = format?.includes("mp3") ? "mp3" : "mp4"
        const filename = `${safeTitle}.${fileExt}`

        // Add timestamp to URL to prevent caching issues
        const timestampedUrl = `${downloadUrl}&t=${Date.now()}&attempt=${attemptCount}`

        debugLog(`Initiating download attempt ${attemptCount}: ${timestampedUrl}`)

        // Show loading toast
        toast({
          title: "Starting Download",
          description: "Preparing your file for download...",
        })

        // First check if the file is available with a HEAD request
        try {
          const checkResponse = await fetch(timestampedUrl, { method: "HEAD" })

          if (!checkResponse.ok) {
            throw new Error(`File not available (status ${checkResponse.status})`)
          }
        } catch (error) {
          console.error("Error checking file availability:", error)
          // Continue anyway, as the HEAD request might fail for various reasons
        }

        // Set a timeout to detect if the download doesn't start
        if (downloadTimeoutRef.current) {
          clearTimeout(downloadTimeoutRef.current)
        }

        downloadTimeoutRef.current = setTimeout(() => {
          toast({
            title: "Download Issue",
            description: "If the download didn't start, please try again or refresh the page.",
            variant: "destructive",
          })
        }, 5000)

        // Use the download link ref to trigger the download
        if (downloadLinkRef.current) {
          downloadLinkRef.current.href = timestampedUrl
          downloadLinkRef.current.download = filename
          downloadLinkRef.current.click()
        } else {
          // Fallback if ref is not available
          const a = document.createElement("a")
          a.href = timestampedUrl
          a.download = filename
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
        }

        toast({
          title: "Download Started",
          description: "Your file is being downloaded to your device.",
        })

        // Don't hide the modal until user explicitly closes it
        // This allows them to retry the download if needed
      } catch (error) {
        console.error("Error triggering download:", error)
        toast({
          title: "Download Error",
          description:
            error instanceof Error ? error.message : "There was a problem starting your download. Please try again.",
          variant: "destructive",
        })
      }
    } else {
      toast({
        title: "Download Not Ready",
        description: "The download is not ready yet. Please wait.",
        variant: "destructive",
      })
    }
  }

  // Function to close the modal manually
  const closeModal = () => {
    setModalVisible(false)
    setActiveDownload(null)
    setDownloadProgress(0)
    progressRef.current = 0
    lastProgressValueRef.current = 0
    setEstimatedTime(null)
    setFileSize(null)
    setFormat(null)
    setDownloadUrl(null)
    setVideoTitle("")
    setCurrentUrl(null)
    setDownloadComplete(false)
    downloadTriggeredRef.current = false
    realProgressReceivedRef.current = false
    setDownloadStatus("pending")
    setIsAudioOnly(false)

    if (downloadTimeoutRef.current) {
      clearTimeout(downloadTimeoutRef.current)
      downloadTimeoutRef.current = null
    }
  }

  return {
    startDownload,
    cancelDownload,
    downloadProgress,
    estimatedTime,
    fileSize,
    format,
    downloadUrl,
    activeDownload,
    videoTitle,
    downloadStatus,
    handleDownloadNow,
    isAudioOnly,
    modalVisible,
    closeModal,
  }
}
