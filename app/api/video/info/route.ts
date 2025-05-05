import { type NextRequest, NextResponse } from "next/server"
import ytdl from "ytdl-core"

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

    try {
      // Get video info with a timeout
      const info = (await Promise.race([
        ytdl.getBasicInfo(url),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Request timed out")), 15000)),
      ])) as ytdl.videoInfo

      // Extract relevant information
      const videoInfo = {
        title: info.videoDetails.title,
        thumbnail: info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1].url,
        duration: Number.parseInt(info.videoDetails.lengthSeconds),
        uploader: info.videoDetails.author.name,
        view_count: Number.parseInt(info.videoDetails.viewCount),
      }

      return NextResponse.json(videoInfo)
    } catch (ytdlError) {
      console.error("ytdl error:", ytdlError)

      // Fallback method using oEmbed
      try {
        const videoId = extractVideoId(url)
        if (!videoId) {
          throw new Error("Could not extract video ID")
        }

        const response = await fetch(
          `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
        )

        if (!response.ok) {
          throw new Error("Failed to fetch video info from oEmbed")
        }

        const data = await response.json()

        // Create a simplified video info object
        return NextResponse.json({
          title: data.title,
          thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          uploader: data.author_name,
          // These values are not available from oEmbed
          duration: 0,
          view_count: 0,
        })
      } catch (fallbackError) {
        console.error("Fallback error:", fallbackError)
        throw new Error("Could not fetch video information. Please try again later.")
      }
    }
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

// Helper function to extract video ID
function extractVideoId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)
  return match && match[2].length === 11 ? match[2] : null
}
