import { type NextRequest, NextResponse } from "next/server"
import ytdl from "ytdl-core"

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get("url")
    const format = request.nextUrl.searchParams.get("format")

    if (!url || !format) {
      return NextResponse.json({ success: false, message: "Missing url or format parameter" }, { status: 400 })
    }

    const videoId = ytdl.getVideoID(url)
    const videoInfo = await ytdl.getInfo(videoId)

    const download = videoInfo.formats.find((f) => f.container === format)

    if (!download) {
      return NextResponse.json({ success: false, message: "Invalid format" }, { status: 400 })
    }

    const stream = ytdl(url, { format: download })

    const headers = new Headers()
    headers.set("Content-Type", download.format.includes("mp3") ? "audio/mpeg" : "video/mp4")
    headers.set("Content-Disposition", `attachment; filename="${videoInfo.videoDetails.title}.${download.container}"`)

    return new NextResponse(stream as any, {
      headers,
    })
  } catch (error: any) {
    console.error("Download error:", error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
