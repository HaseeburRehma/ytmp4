import { NextResponse } from "next/server"
import { getQueueLength, getAllActiveDownloads } from "@/lib/redis"
import { QUEUE_KEYS } from "@/lib/redis"
import { getCompletedDownloadsCount } from "@/lib/db"

export async function GET() {
  try {
    // Get pending downloads count
    const pendingCount = await getQueueLength(QUEUE_KEYS.DOWNLOADS)

    // Get processing downloads count
    const processingDownloads = await getAllActiveDownloads()
    const processingCount = Object.keys(processingDownloads || {}).length

    // Get completed downloads count (last 24 hours)
    let completedCount = 0
    try {
      completedCount = await getCompletedDownloadsCount()
    } catch (error) {
      console.error("Error fetching completed downloads:", error)
    }

    return NextResponse.json({
      pending: pendingCount,
      processing: processingCount,
      completed: completedCount,
    })
  } catch (error) {
    console.error("Error fetching queue stats:", error)
    return NextResponse.json(
      {
        pending: 0,
        processing: 0,
        completed: 0,
        error: "Failed to fetch queue stats",
      },
      { status: 500 },
    )
  }
}
