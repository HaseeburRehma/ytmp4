import { type NextRequest, NextResponse } from "next/server"
import { downloadManager } from "@/lib/download-manager"
import { v4 as uuidv4 } from "uuid"
import { updateProgress } from "@/lib/global-store"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, format } = body

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    if (!format) {
      return NextResponse.json({ error: "Format is required" }, { status: 400 })
    }

    // Generate a task ID
    const taskId = uuidv4().slice(0, 8)
    console.log(`Generated new task ID: ${taskId} for URL: ${url}`)

    // Get video title (for display purposes)
    let title = "YouTube Video"
    try {
      const info = await downloadManager.getVideoInfo(url)
      title = info.title
      console.log(`Retrieved video title: "${title}" for task ${taskId}`)
    } catch (error) {
      console.error(`Error getting video title for task ${taskId}:`, error)
      // Continue with default title
    }

    // Initialize progress in the global store BEFORE starting the download
    updateProgress(
      taskId,
      0,
      60, // Initial estimate of 60 seconds
      null,
      format,
      "processing",
      format.includes("mp3"),
    )

    console.log(`Initialized progress for task ${taskId} in global store`)

    // Start the download process
    const startedTaskId = await downloadManager.startDownload(url, format, title, taskId)

    if (startedTaskId !== taskId) {
      console.warn(`Warning: Task ID mismatch. Generated: ${taskId}, Returned: ${startedTaskId}`)
    }

    console.log(`Download started for task ${taskId}`)

    return NextResponse.json({ task_id: taskId, title })
  } catch (error) {
    console.error("Error starting download:", error)
    return NextResponse.json({ error: "Failed to start download" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { taskId } = body

    if (!taskId) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 })
    }

    console.log(`Received cancel request for task ${taskId}`)

    // Try to cancel the download
    const cancelled = downloadManager.cancelDownload(taskId)

    if (!cancelled) {
      console.log(`Failed to cancel download ${taskId} - not found or already completed`)
      // Even if not found, we'll update the global progress store to mark as cancelled
      updateProgress(taskId, 0, null, null, null, "cancelled")
      return NextResponse.json({ success: true, message: "Download not found but marked as cancelled" })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error cancelling download:", error)
    return NextResponse.json({ error: "Failed to cancel download" }, { status: 500 })
  }
}
