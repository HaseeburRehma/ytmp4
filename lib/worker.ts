import { getFromQueue, QUEUE_KEYS, moveToProcessing, markAsCompleted, storeProgress } from "@/lib/redis"
import { updateJobStatus, updateJobFile } from "@/lib/db"
import { downloadManager } from "@/lib/download-manager"

// Worker configuration
const POLLING_INTERVAL = 1000 // 1 second
let isRunning = false
let workerInterval: NodeJS.Timeout | null = null

// Start the worker
export function startWorker() {
  if (isRunning) return

  isRunning = true
  console.log("Starting download worker...")

  workerInterval = setInterval(processQueue, POLLING_INTERVAL)
}

// Stop the worker
export function stopWorker() {
  if (!isRunning) return

  isRunning = false
  if (workerInterval) {
    clearInterval(workerInterval)
    workerInterval = null
  }

  console.log("Download worker stopped")
}

// Process jobs from the queue
async function processQueue() {
  try {
    // Get a job from the queue
    const job = await getFromQueue(QUEUE_KEYS.DOWNLOADS)
    if (!job) return

    console.log(`Processing download job: ${job.id}`)

    // Move to processing
    await moveToProcessing(job.id, job.data)

    // Update job status
    await updateJobStatus(job.id, "processing", 0)

    // Register progress handler
    const progressHandler = async (progress: number, eta?: number) => {
      await storeProgress(job.id, progress, eta)
      await updateJobStatus(job.id, "processing", progress)
    }

    // Register completion handler
    const completionHandler = async (filePath: string, fileSize: number) => {
      await updateJobFile(job.id, filePath, fileSize)
      await updateJobStatus(job.id, "completed", 100)
      await markAsCompleted(job.id, { filePath, fileSize })
    }

    // Register error handler
    const errorHandler = async (error: string) => {
      await updateJobStatus(job.id, "failed", 0, error)
    }

    try {
      // Start the download
      const taskId = await downloadManager.startDownload(
        job.data.url,
        job.data.format,
        job.data.title || "YouTube Video",
        job.id,
        job.data.socketId,
      )

      // Set up event listeners for this specific download
      const downloadEventHandler = (data: any) => {
        if (data.taskId === taskId) {
          progressHandler(data.percentage, data.estimated)

          if (data.status === "completed" && data.outputFile) {
            completionHandler(data.outputFile, data.fileSize || 0)
          } else if (data.status === "failed") {
            errorHandler(data.error || "Download failed")
          }
        }
      }

      // Add event listener
      downloadManager.on("progress", downloadEventHandler)

      // Clean up event listener after a timeout (30 minutes)
      setTimeout(
        () => {
          downloadManager.removeListener("progress", downloadEventHandler)
        },
        30 * 60 * 1000,
      )
    } catch (error) {
      console.error(`Error processing job ${job.id}:`, error)
      await errorHandler(error instanceof Error ? error.message : String(error))
    }
  } catch (error) {
    console.error("Error processing download queue:", error)
  }
}

// Export worker functions
export const worker = {
  start: startWorker,
  stop: stopWorker,
}
