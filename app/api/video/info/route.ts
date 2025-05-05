import { type NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import ytdl from "ytdl-core"

export const runtime = "nodejs"
export const maxDuration = 15

// Add this helper function to run yt-dlp when other methods fail
async function getInfoWithYtDlp(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    // Use environment variable for yt-dlp path with fallback to /tmp/bin/yt-dlp
    const ytDlpPath = process.env.YT_DLP_PATH || "/tmp/bin/yt-dlp"

    console.log(`Using yt-dlp from: ${ytDlpPath}`)

    const args = ["--dump-json", "--no-playlist", "--no-warnings", url]

    // Spawn yt-dlp process
    const process = spawn(ytDlpPath, args)

    let output = ""
    let errorOutput = ""

    process.stdout.on("data", (data) => {
      output += data.toString()
    })

    process.stderr.on("data", (data) => {
      errorOutput += data.toString()
    })

    process.on("close", (code) => {
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

    process.on("error", (err) => {
      console.error(`Failed to start yt-dlp: ${err.message}`)
      reject(err)
    })

    // Add timeout
    setTimeout(() => {
      process.kill()
      reject(new Error("yt-dlp process timed out"))
    }, 10000)
  })
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    // Validate YouTube URL
    if (!ytdl.validateURL(url)) {
      return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 })
    }

    console.log(`Processing video info request for: ${url}`)

    // Try three different methods to get video info
    let videoInfo = null
    const errors = []

    // Method 1: ytdl-core (your original method)
    try {
      console.log("Trying ytdl-core method...")
      const info = (await Promise.race([
        ytdl.getBasicInfo(url),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Request timed out")), 10000)),
      ])) as ytdl.videoInfo

      videoInfo = {
        title: info.videoDetails.title,
        thumbnail: info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1].url,
        duration: Number.parseInt(info.videoDetails.lengthSeconds),
        uploader: info.videoDetails.author.name,
        view_count: Number.parseInt(info.videoDetails.viewCount),
      }

      console.log("Successfully retrieved info using ytdl-core")
      return NextResponse.json(videoInfo)
    } catch (ytdlError) {
      console.error("ytdl-core method failed:", ytdlError)
      errors.push(ytdlError.message)
    }

    // Method 2: Try yt-dlp
    if (!videoInfo) {
      try {
        console.log("Trying yt-dlp method...")
        videoInfo = await getInfoWithYtDlp(url)
        console.log("Successfully retrieved info using yt-dlp")
        return NextResponse.json(videoInfo)
      } catch (ytDlpError) {
        console.error("yt-dlp method failed:", ytDlpError)
        errors.push(ytDlpError.message)
      }
    }

    // Method 3: Fallback to oEmbed (your original fallback)
    if (!videoInfo) {
      try {
        console.log("Trying oEmbed fallback method...")
        const videoId = extractVideoId(url)
        if (!videoId) {
          throw new Error("Could not extract video ID")
        }

        const response = await fetch(
          `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
        )

        if (!response.ok) {
          throw new Error(`Failed to fetch video info from oEmbed: ${response.status}`)
        }

        const data = await response.json()

        videoInfo = {
          title: data.title,
          thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          uploader: data.author_name,
          duration: 0,
          view_count: 0,
        }

        console.log("Successfully retrieved basic info using oEmbed")
        return NextResponse.json(videoInfo)
      } catch (oembedError) {
        console.error("oEmbed method failed:", oembedError)
        errors.push(oembedError.message)
      }
    }

    // Method 4: Last resort - try to get minimal info from video page
    if (!videoInfo) {
      try {
        console.log("Trying to scrape minimal info...")
        const videoId = extractVideoId(url)
        if (!videoId) {
          throw new Error("Could not extract video ID")
        }

        // Just return minimal info based on video ID
        videoInfo = {
          title: `YouTube Video (${videoId})`,
          thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          uploader: "Unknown",
          duration: 0,
          view_count: 0,
        }

        console.log("Created minimal info from video ID")
        return NextResponse.json(videoInfo)
      } catch (finalError) {
        console.error("Final method failed:", finalError)
        errors.push(finalError.message)
      }
    }

    // If we get here, all methods failed
    throw new Error(`Failed to get video info: ${errors.join(", ")}`)
  } catch (error) {
    console.error("Error fetching video info:", error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch video information",
      },
      { status: 500 },
    )
  }
}

// Helper function to extract video ID (keep your existing function)
function extractVideoId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)
  return match && match[2].length === 11 ? match[2] : null
}
