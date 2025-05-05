// Global progress store that persists between requests
type ProgressData = {
    percentage: number
    estimated: number | null
    fileSize: number | null
    status: "pending" | "processing" | "completed" | "failed" | "cancelled"
    format: string | null
    timestamp: number
    audioOnly?: boolean
    lastUpdated: number
  }
  
  // In-memory progress tracking with Map
  class ProgressStore {
    private store: Map<string, ProgressData>
  
    constructor() {
      this.store = new Map()
    }
  
    updateProgress(
      taskId: string,
      percentage: number,
      estimated: number | null,
      fileSize: number | null,
      format: string | null,
      status: "pending" | "processing" | "completed" | "failed" | "cancelled",
      audioOnly?: boolean,
    ) {
      // Ensure percentage is a valid number
      const validPercentage = isNaN(percentage) ? 0 : Math.max(0, Math.min(100, percentage))
  
      this.store.set(taskId, {
        percentage: validPercentage,
        estimated,
        fileSize,
        status,
        format,
        timestamp: Date.now(),
        audioOnly,
        lastUpdated: Date.now(),
      })
  
      console.log(`Progress stored for ${taskId}: ${validPercentage}% (${status})`)
    }
  
    getProgress(taskId: string): ProgressData | undefined {
      return this.store.get(taskId)
    }
  
    getAllProgress(): Map<string, ProgressData> {
      return this.store
    }
  
    removeProgress(taskId: string): boolean {
      return this.store.delete(taskId)
    }
  }
  
  // Create a singleton instance
  export const progressStore = new ProgressStore()
  