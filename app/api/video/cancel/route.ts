import { type NextRequest, NextResponse } from "next/server"
import { downloadManager } from "@/lib/download-manager"

export async function POST(request: NextRequest) {
  try {
    const { task_id, socket_id } = await request.json()

    if (!task_id) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 })
    }

    // Cancel the download
    const result = await downloadManager.cancelDownload(task_id, socket_id)

    if (!result) {
      return NextResponse.json({ error: "Task not found or already completed" }, { status: 404 })
    }

    return NextResponse.json({ status: "cancelled" })
  } catch (error) {
    console.error("Error cancelling download:", error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to cancel download",
      },
      { status: 500 },
    )
  }
}
