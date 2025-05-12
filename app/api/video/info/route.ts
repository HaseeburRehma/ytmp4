import { type NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import { config } from "@/lib/config"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const url = searchParams.get("url")

  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 })
  }

  try {
    const info = await getInfoWithYtDlp(url)
    return NextResponse.json(info)
  } catch (error: any) {
    console.error("Error getting video info:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Update the getInfoWithYtDlp function to handle YouTube's bot detection
async function getInfoWithYtDlp(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    // Use environment variable for yt-dlp path with fallback to /tmp/bin/yt-dlp
    const ytDlpPath: string = config.ytdl.ytDlpPath

    console.log(`Using yt-dlp from: ${ytDlpPath}`)

    // Add cookies and user-agent to bypass YouTube's bot detection
    const args = [
      "--dump-json",
      "--no-playlist",
      "--no-warnings",
      "--user-agent",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      "--add-header",
      "Accept-Language:en-US,en;q=0.9",
      "--geo-bypass",
      "--no-check-certificate",
      url,
    ]

    console.log(`Executing: ${ytDlpPath} ${args.join(" ")}`)

    // Spawn yt-dlp process
    const ytDlpProcess = spawn(ytDlpPath, args)

    let output = ""
    let errorOutput = ""

    ytDlpProcess.stdout.on("data", (data: Buffer) => {
      output += data.toString()
    })

    ytDlpProcess.stderr.on("data", (data: Buffer) => {
      errorOutput += data.toString()
      console.log(`yt-dlp stderr: ${data.toString()}`)
    })

    ytDlpProcess.on("close", (code: number | null) => {
      console.log(`yt-dlp process exited with code ${code}`)
      if (code === 0 && output.trim()) {
        try {
          const info = JSON.parse(output.trim())
          resolve({
            title: info.title,
            thumbnail: info.thumbnail,
            duration: info.duration,
            uploader: info.uploader,
            view_count: info.view_count || 0,
          })
        } catch (error) {
          console.error("Error parsing yt-dlp output:", error)
          reject(new Error("Failed to parse video information"))
        }
      } else {
        console.error(`yt-dlp exited with code ${code}: ${errorOutput}`)
        reject(new Error(`Failed to get video info with yt-dlp: ${errorOutput}`))
      }
    })

    ytDlpProcess.on("error", (err: Error) => {
      console.error(`Failed to start yt-dlp: ${err.message}`)
      reject(err)
    })

    // Add timeout
    const timeoutId = setTimeout(() => {
      ytDlpProcess.kill()
      reject(new Error("yt-dlp process timed out"))
    }, 10000)

    // Clear timeout when process ends
    ytDlpProcess.on("close", () => {
      clearTimeout(timeoutId)
    })
  })
}
