"use client"

import { useEffect, useState, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, X, Loader2 } from "lucide-react"

interface ProgressModalProps {
  isOpen: boolean
  title: string
  progress: number
  eta: number | null
  fileSize: number | null
  format: string | null
  taskId?: string | null
  onCancel: () => void
  onDownload: () => void
  status?: string
  isAudioOnly?: boolean
}

export function ProgressModal({
  isOpen,
  title,
  progress,
  eta,
  fileSize,
  format,
  taskId,
  onCancel,
  onDownload,
  status = "processing",
  isAudioOnly = false,
}: ProgressModalProps) {
  const [formattedEta, setFormattedEta] = useState<string>("")
  const [formattedSize, setFormattedSize] = useState<string>("")
  const [isComplete, setIsComplete] = useState(false)
  const [displayProgress, setDisplayProgress] = useState(0)
  const [conversionPhase, setConversionPhase] = useState<string>("downloading")
  const [conversionDetails, setConversionDetails] = useState<string>("Preparing download...")
  const lastProgressRef = useRef(0)
  const animationFrameRef = useRef<number | null>(null)
  const completionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const downloadTriggeredRef = useRef<boolean>(false)
  const progressUpdateTimeRef = useRef<number>(Date.now())
  const simulatedProgressRef = useRef<NodeJS.Timeout | null>(null)
  const lastProgressUpdateRef = useRef<number>(Date.now())
  const progressHistoryRef = useRef<number[]>([])
  const progressTrendRef = useRef<"increasing" | "stalled" | "decreasing">("stalled")
  const downloadAttemptsRef = useRef<number>(0)
  const debugRef = useRef<boolean>(true)

  // Debug logging function
  const debugLog = (...args: any[]) => {
    if (debugRef.current) {
      console.log(...args)
    }
  }

  // Debug logging
  useEffect(() => {
    debugLog("Progress Modal - Current progress:", progress, "Status:", status, "TaskId:", taskId)
    progressUpdateTimeRef.current = Date.now()
    lastProgressUpdateRef.current = Date.now()

    // Track progress history to detect trends
    progressHistoryRef.current.push(progress)
    if (progressHistoryRef.current.length > 10) {
      progressHistoryRef.current.shift()
    }

    // Determine trend
    if (progressHistoryRef.current.length >= 3) {
      const recent = progressHistoryRef.current.slice(-3)
      if (recent[2] > recent[0]) {
        progressTrendRef.current = "increasing"
      } else if (recent[2] < recent[0]) {
        progressTrendRef.current = "decreasing"
      } else {
        progressTrendRef.current = "stalled"
      }
    }
  }, [progress, status, taskId])

  // Smooth progress updates with requestAnimationFrame
  useEffect(() => {
    // Always update the display progress, even if it's the same as before
    // This ensures the UI reflects the actual progress

    // Cancel any existing animation frame
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    // Animate progress smoothly
    const animateProgress = () => {
      setDisplayProgress((prev) => {
        // If progress is higher, move towards it
        if (progress > prev) {
          const newValue = Math.min(progress, prev + 0.5)
          if (newValue < progress) {
            animationFrameRef.current = requestAnimationFrame(animateProgress)
          }
          return newValue
        }
        // If progress is lower (shouldn't happen normally), jump to it
        else if (progress < prev) {
          return progress
        }
        // If progress is the same, keep it
        return prev
      })
    }

    animationFrameRef.current = requestAnimationFrame(animateProgress)
    lastProgressRef.current = progress

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [progress])

  // Add a simulated progress effect when real progress stalls
  useEffect(() => {
    // Clear any existing simulation
    if (simulatedProgressRef.current) {
      clearInterval(simulatedProgressRef.current)
    }

    // Only simulate progress if we're not complete and not failed
    if (!isComplete && status !== "failed" && progress < 95) {
      simulatedProgressRef.current = setInterval(() => {
        const now = Date.now()
        const timeSinceUpdate = now - lastProgressUpdateRef.current

        // If no progress update for more than 2 seconds, simulate small increments
        if (timeSinceUpdate > 2000) {
          setDisplayProgress((prev) => {
            // Add a tiny increment (0.1-0.3%) to show activity, but don't exceed 95%
            const increment = Math.random() * 0.2 + 0.1
            const newValue = Math.min(prev + increment, 95)
            debugLog(`Simulating progress in modal: ${prev.toFixed(2)}% -> ${newValue.toFixed(2)}%`)
            return newValue
          })
        }
      }, 1000)
    }

    return () => {
      if (simulatedProgressRef.current) {
        clearInterval(simulatedProgressRef.current)
      }
    }
  }, [isComplete, status, progress])

  // Set a completion timeout as a fallback
  useEffect(() => {
    // If progress is high (> 95%) for a while, consider it completed
    if (progress > 95 && !isComplete) {
      // Clear any existing timeout
      if (completionTimeoutRef.current) {
        clearTimeout(completionTimeoutRef.current)
      }

      // Set a timeout to force completion after 30 seconds at high progress
      completionTimeoutRef.current = setTimeout(() => {
        debugLog("Progress has been high for a while, marking as complete")
        setIsComplete(true)
        setDisplayProgress(100)
        setFormattedEta("Complete")
        setConversionPhase("completed")
        setConversionDetails("Download complete!")
      }, 30000) // 30 seconds
    }

    return () => {
      if (completionTimeoutRef.current) {
        clearTimeout(completionTimeoutRef.current)
      }
    }
  }, [progress, isComplete])

  // Update completion status based on status prop
  useEffect(() => {
    if (status === "completed") {
      setIsComplete(true)
      setDisplayProgress(100)

      // Auto-trigger download if not already triggered
      if (!downloadTriggeredRef.current) {
        setTimeout(() => {
          downloadTriggeredRef.current = true
          onDownload()
        }, 500)
      }
    } else if (status === "failed") {
      setConversionDetails("Download failed. Please try again.")
    }
  }, [status, onDownload])

  // Reset download triggered flag when modal closes
  useEffect(() => {
    if (!isOpen) {
      downloadTriggeredRef.current = false
      downloadAttemptsRef.current = 0

      // Clear any simulated progress
      if (simulatedProgressRef.current) {
        clearInterval(simulatedProgressRef.current)
      }

      // Reset progress history
      progressHistoryRef.current = []
    }
  }, [isOpen])

  useEffect(() => {
    // Format the estimated time
    if (eta === null) {
      setFormattedEta("Calculating...")
    } else if (eta === 0) {
      setFormattedEta("Complete")
      setIsComplete(true)
    } else {
      const minutes = Math.floor(eta / 60)
      const seconds = eta % 60

      if (minutes > 0) {
        setFormattedEta(`${minutes}m ${seconds}s remaining`)
      } else {
        setFormattedEta(`${seconds}s remaining`)
      }
    }

    // Format the file size
    if (fileSize === null) {
      setFormattedSize("")
    } else {
      // Convert bytes to appropriate unit
      const kb = fileSize / 1024
      const mb = kb / 1024
      const gb = mb / 1024

      if (gb >= 1) {
        setFormattedSize(`${gb.toFixed(2)} GB`)
      } else if (mb >= 1) {
        setFormattedSize(`${mb.toFixed(2)} MB`)
      } else {
        setFormattedSize(`${kb.toFixed(2)} KB`)
      }
    }

    // Set completion state
    if (progress >= 100) {
      setIsComplete(true)
    }
  }, [eta, fileSize, progress])

  // Update conversion phase based on progress
  useEffect(() => {
    // Determine phase based on progress and trend
    if (progress < 30) {
      setConversionPhase("downloading")
      setConversionDetails("Downloading video data...")
    } else if (progress < 60) {
      setConversionPhase("downloading")
      setConversionDetails("Retrieving audio and video streams...")
    } else if (progress < 90) {
      setConversionPhase("processing")
      setConversionDetails("Processing with FFmpeg...")
    } else if (progress < 100) {
      setConversionPhase("processing")
      setConversionDetails("Finalizing download...")
    } else {
      setConversionPhase("completed")
      setConversionDetails("Download complete!")
    }

    // Add more detailed status based on trend
    if (progressTrendRef.current === "stalled" && progress > 0 && progress < 95) {
      if (progress < 30) {
        setConversionDetails("Downloading video data... (buffering)")
      } else if (progress < 60) {
        setConversionDetails("Retrieving streams... (please wait)")
      } else {
        setConversionDetails("Processing... (this may take a moment)")
      }
    }

    // Update the last progress update time
    lastProgressUpdateRef.current = Date.now()
  }, [progress])

  // Handle manual download click
  const handleDownloadClick = () => {
    downloadTriggeredRef.current = true
    downloadAttemptsRef.current += 1
    onDownload()
  }

  // Prevent closing the modal by clicking outside or pressing escape
  // Only allow closing via the cancel button
  const handleOpenChange = (open: boolean) => {
    if (!open && !isComplete && status !== "failed" && status !== "cancelled") {
      // If trying to close while download is in progress, prevent it
      return
    }

    if (!open) {
      onCancel()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md bg-gray-900 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">
            {isComplete ? "Download Complete" : "Processing Your Download"}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {isComplete ? "Your file is ready to download" : "Please wait while we process your download"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <h3 className="font-medium text-lg text-gray-200 line-clamp-2">{title}</h3>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-300 flex items-center">
                {isComplete ? (
                  "Ready to download"
                ) : status === "failed" ? (
                  "Download failed"
                ) : (
                  <>
                    {conversionPhase === "downloading" ? "Downloading..." : "Converting..."}
                    {!isComplete && <Loader2 className="ml-2 h-3 w-3 animate-spin" />}
                  </>
                )}
              </span>
              <span className="text-gray-300">{Math.round(displayProgress)}%</span>
            </div>

            <div className="relative h-2 w-full bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full ${
                  status === "failed"
                    ? "bg-red-600"
                    : displayProgress < 100
                      ? "progress-bar-animation bg-red-600"
                      : "bg-green-600"
                }`}
                style={{ width: `${Math.max(1, displayProgress)}%` }}
              />
            </div>

            <div className="text-sm text-gray-400 mt-1">{conversionDetails}</div>

            <div className="flex justify-between text-sm mt-2">
              <span className="text-gray-400">{formattedEta}</span>
              <span className="text-gray-400">
                {format && (format.includes("mp3") ? "MP3" : isAudioOnly ? "MP4 (Audio Only)" : "MP4")}
                {formattedSize && ` • ${formattedSize}`}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex sm:justify-between">
          {!isComplete ? (
            <Button
              variant="outline"
              onClick={onCancel}
              className="w-full border-gray-600 text-white hover:bg-gray-700"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          ) : (
            <Button onClick={handleDownloadClick} className="w-full bg-red-600 hover:bg-red-700 text-white">
              <Download className="h-4 w-4 mr-2" />
              {downloadAttemptsRef.current > 0 ? "Download Again" : "Download Now"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
