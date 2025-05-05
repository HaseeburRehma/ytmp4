import { EventEmitter } from "events"
import { downloadManager } from "./download-manager"
import { updateProgress } from "./global-store"

// Queue configuration
const MAX_CONCURRENT_DOWNLOADS = 3 // Maximum number of concurrent downloads
const MAX_QUEUE_SIZE = 100 // Maximum queue size

interface QueueItem {
  taskId: string
  url: string
  format: string
  title: string
  priority: number // Higher number = higher priority
  addedAt: number
  status: "queued" | "processing" | "completed" | "failed" | "cancelled"
}

class DownloadQueue extends EventEmitter {
  private queue: QueueItem[] = []
  private activeDownloads: Set<string> = new Set()
  private isProcessing = false

  constructor() {
    super()
    // Start processing the queue
    this.processQueue()
  }

  /**
   * Add a download to the queue
   */
  public addToQueue(taskId: string, url: string, format: string, title: string, priority = 1): boolean {
    // Check if queue is full
    if (this.queue.length >= MAX_QUEUE_SIZE) {
      console.log(`Queue is full, rejecting download: ${taskId}`)
      return false
    }

    // Check if this download is already in the queue
    if (this.queue.some((item) => item.taskId === taskId) || this.activeDownloads.has(taskId)) {
      console.log(`Download already in queue or active: ${taskId}`)
      return false
    }

    // Add to queue
    this.queue.push({
      taskId,
      url,
      format,
      title,
      priority,
      addedAt: Date.now(),
      status: "queued",
    })

    // Sort queue by priority (higher first) and then by added time (older first)
    this.queue.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority
      }
      return a.addedAt - b.addedAt
    })

    console.log(`Added download to queue: ${taskId}, queue size: ${this.queue.length}`)

    // Update progress to show queued status
    updateProgress(taskId, 0, null, null, format, "pending", format.includes("mp3"))

    // Trigger queue processing
    this.processQueue()

    return true
  }

  /**
   * Cancel a download in the queue
   */
  public cancelDownload(taskId: string): boolean {
    // Check if it's in the queue
    const queueIndex = this.queue.findIndex((item) => item.taskId === taskId)

    if (queueIndex >= 0) {
      // Remove from queue
      this.queue.splice(queueIndex, 1)
      console.log(`Removed download from queue: ${taskId}`)

      // Update progress to show cancelled status
      updateProgress(taskId, 0, null, null, null, "cancelled")

      return true
    }

    // If it's active, cancel it in the download manager
    if (this.activeDownloads.has(taskId)) {
      const result = downloadManager.cancelDownload(taskId)
      if (result) {
        this.activeDownloads.delete(taskId)
      }
      return result
    }

    return false
  }

  /**
   * Get the current queue status
   */
  public getQueueStatus() {
    return {
      queueLength: this.queue.length,
      activeDownloads: Array.from(this.activeDownloads),
      isProcessing: this.isProcessing,
    }
  }

  /**
   * Process the download queue
   */
  private async processQueue() {
    // Prevent multiple concurrent processing
    if (this.isProcessing) return

    this.isProcessing = true

    try {
      // Process queue while there are items and we haven't reached max concurrent downloads
      while (this.queue.length > 0 && this.activeDownloads.size < MAX_CONCURRENT_DOWNLOADS) {
        // Get next item from queue
        const nextItem = this.queue.shift()

        if (!nextItem) continue

        // Mark as active
        this.activeDownloads.add(nextItem.taskId)

        // Start the download (async)
        this.startDownload(nextItem)
      }
    } finally {
      this.isProcessing = false
    }
  }

  /**
   * Start a download and handle its completion
   */
  private async startDownload(item: QueueItem) {
    try {
      console.log(`Starting download from queue: ${item.taskId}`)

      // Update progress to show processing status
      updateProgress(
        item.taskId,
        0,
        60, // Initial estimate of 60 seconds
        null,
        item.format,
        "processing",
        item.format.includes("mp3"),
      )

      // Start the download
      await downloadManager.startDownload(item.url, item.format, item.title)

      // The download manager will handle progress updates via events
    } catch (error) {
      console.error(`Error starting download from queue: ${item.taskId}`, error)

      // Update progress to show failed status
      updateProgress(item.taskId, 0, null, null, item.format, "failed", item.format.includes("mp3"))
    } finally {
      // Remove from active downloads when done (after a short delay to ensure all events are processed)
      setTimeout(() => {
        this.activeDownloads.delete(item.taskId)

        // Process queue again
        this.processQueue()
      }, 1000)
    }
  }
}

// Create a singleton instance
export const downloadQueue = new DownloadQueue()
