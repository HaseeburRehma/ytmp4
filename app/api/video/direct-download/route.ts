// app/api/video/direct-download/route.ts
import { NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"

// (Optional) Force this to run on the Node.js runtime
export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url")
  const format = request.nextUrl.searchParams.get("format") || "mp4"

  if (!url) {
    return NextResponse.json(
      { error: "Missing `url` parameter" },
      { status: 400 }
    )
  }

  // Select yt-dlp format specifier
  const ytdlpFormat =
    format === "mp3"
      ? "bestaudio[ext=m4a]/best[ext=m4a]"
      : "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]"

  // Spawn yt-dlp to write to stdout
  const ytDlp = spawn(
    process.env.YT_DLP_PATH || "yt-dlp",
    [
      "--no-playlist",
      "--format",
      ytdlpFormat,
      "--output",
      "-",  // write to stdout
      url,
    ],
    { stdio: ["ignore", "pipe", "pipe"] }
  )

  // If MP3 was requested, pipe yt-dlp → ffmpeg → client
  let inputStream = ytDlp.stdout
  if (format === "mp3") {
    const ffmpeg = spawn(
      process.env.FFMPEG_PATH || "ffmpeg",
      [
        "-i",
        "pipe:0",      // read from stdin
        "-f",
        "mp3",
        "-b:a",
        "192k",
        "pipe:1",      // write to stdout
      ],
      { stdio: ["pipe", "pipe", "inherit"] }
    )
    inputStream.pipe(ffmpeg.stdin)
    inputStream = ffmpeg.stdout
  }

  // Prepare download headers
  const filename = `download.${format}`
  const headers = {
    "Content-Type": format === "mp3" ? "audio/mpeg" : "video/mp4",
    "Content-Disposition": `attachment; filename="${filename}"`,
  }

  // Build a Web ReadableStream from the Node.js stream
  const stream = new ReadableStream({
    start(controller) {
      // If the client disconnects, kill child processes
      const onAbort = () => {
        ytDlp.kill("SIGINT")
        controller.error("Client aborted")
      }
      request.signal.addEventListener("abort", onAbort)

      inputStream.on("data", (chunk: Buffer) => {
        controller.enqueue(chunk)
      })
      inputStream.on("end", () => {
        request.signal.removeEventListener("abort", onAbort)
        controller.close()
      })
      inputStream.on("error", (err) => {
        request.signal.removeEventListener("abort", onAbort)
        controller.error(err)
      })
    },
  })

  return new NextResponse(stream, { headers })
}
