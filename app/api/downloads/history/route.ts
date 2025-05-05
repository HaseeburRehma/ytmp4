import { NextResponse } from "next/server"
import { getRecentDownloads } from "@/lib/db"

export async function GET() {
  try {
    const downloads = await getRecentDownloads(20)
    return NextResponse.json(downloads)
  } catch (error) {
    console.error("Error fetching download history:", error)
    return NextResponse.json({ error: "Failed to fetch download history" }, { status: 500 })
  }
}
