// Global progress store that persists between requests using Node.js global object
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
  
  // Declare a global interface for TypeScript
  declare global {
    var progressStore: Map<string, ProgressData> | undefined
    var progressDebug: boolean | undefined
  }
  
  // Initialize the global store if it doesn't exist
  if (!global.progressStore) {
    global.progressStore = new Map<string, ProgressData>()
    global.progressDebug = true
    console.log("Initialized global progress store")
  }
  
  export function updateProgress(
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
  
    // Store the progress data in the global store
    global.progressStore!.set(taskId, {
      percentage: validPercentage,
      estimated,
      fileSize,
      status,
      format,
      timestamp: Date.now(),
      audioOnly,
      lastUpdated: Date.now(),
    })
  
    if (global.progressDebug) {
      console.log(`Global progress stored for ${taskId}: ${validPercentage}% (${status}) at ${new Date().toISOString()}`)
    }
  }
  
  export function getProgress(taskId: string): ProgressData | undefined {
    const progress = global.progressStore!.get(taskId)
  
    if (global.progressDebug && progress) {
      console.log(
        `Retrieved progress for ${taskId}: ${progress.percentage}% (${progress.status}) from ${new Date(progress.lastUpdated).toISOString()}`,
      )
    }
  
    return progress
  }
  
  export function getAllProgress(): Map<string, ProgressData> {
    return global.progressStore!
  }
  
  export function removeProgress(taskId: string): boolean {
    if (global.progressDebug) {
      console.log(`Removing progress for ${taskId}`)
    }
    return global.progressStore!.delete(taskId)
  }
  
  // Export the global store for direct access if needed
  export const progressStore = global.progressStore!
  