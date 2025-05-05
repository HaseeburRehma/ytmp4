export interface VideoInfoType {
  title?: string
  thumbnail?: string
  duration?: number
  uploader?: string
  view_count?: number
}

export interface DownloadTask {
  id: string
  url: string
  format: string
  status: "pending" | "processing" | "completed" | "failed" | "cancelled"
  progress: number
  result?: {
    download_url: string
    filename: string
  }
  error?: string
  created_at: Date
  updated_at: Date
}

export interface ProgressUpdate {
  job_id: string
  percentage: number
  estimated?: number
  timestamp?: string
}

export interface CompletionUpdate {
  job_id: string
  download_url: string
  message?: string
  timestamp?: string
}

export interface ErrorUpdate {
  job_id: string
  error: string
  timestamp?: string
}
