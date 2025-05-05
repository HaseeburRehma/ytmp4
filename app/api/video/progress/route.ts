import { type NextRequest, NextResponse } from "next/server"
import { downloadManager } from "@/lib/download-manager"
import { getProgress } from "@/lib/global-store"

export async function GET(request: NextRequest) {
  try {
    const taskId = request.nextUrl.searchParams.get("taskId")

    if (!taskId) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 })
    }

    console.log(`Progress request received for task ${taskId}`)

    // First check the download manager for the most up-to-date information
    const download = downloadManager.getDownload(taskId)
    if (download) {
      // Log the actual values for debugging
      console.log(`Download manager progress for ${taskId}:`, {
        progress: download.progress,
        eta: download.eta,
        status: download.status,
        lastUpdated: new Date(download.lastUpdated).toISOString(),
      })

      // Return the progress data from the download manager
      return NextResponse.json({
        percentage: download.progress,
        estimated: download.eta,
        fileSize: download.fileSize,
        status: download.status,
        format: download.format,
        audioOnly: download.isAudioOnly,
      })
    }

    // Then check the global progress store
    const progress = getProgress(taskId)
    if (progress) {
      // Log the actual values for debugging
      console.log(`Global progress store data for ${taskId}:`, {
        percentage: progress.percentage,
        status: progress.status,
        lastUpdated: new Date(progress.lastUpdated).toISOString(),
      })

      // Return the progress data from the store
      return NextResponse.json({
        percentage: progress.percentage,
        estimated: progress.estimated,
        fileSize: progress.fileSize,
        status: progress.status,
        format: progress.format,
        audioOnly: progress.audioOnly,
      })
    }

    // If no progress found, return a default response with 200 status
    console.log(`No progress found for ${taskId}, returning default values`)
    return NextResponse.json({
      percentage: 0,
      estimated: 60,
      fileSize: null,
      status: "processing",
      format: null,
    })
  } catch (error) {
    console.error(`Error fetching progress for task ${request.nextUrl.searchParams.get("taskId")}:`, error)
    return NextResponse.json({ error: "Failed to fetch progress" }, { status: 500 })
  }
}
