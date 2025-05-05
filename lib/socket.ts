// Dummy implementation to avoid errors
export function getSocketIO() {
    return {
      on: () => {},
      to: () => ({ emit: () => {} }),
      emit: () => {},
    }
  }
  
  export function emitProgressUpdate(taskId: string, data: any) {
    // Just log the progress for debugging
    console.log(`Progress update for ${taskId}: ${data.percentage}%`)
  }
  
  export function emitDownloadComplete(taskId: string, data: any) {
    console.log(`Download complete for ${taskId}`)
  }
  
  export function emitDownloadError(taskId: string, error: string) {
    console.log(`Download error for ${taskId}: ${error}`)
  }
  
  export function emitConversionStatus(taskId: string, status: string, details: any = {}) {
    console.log(`Conversion status for ${taskId}: ${status} - ${details.details || ""}`)
  }
  