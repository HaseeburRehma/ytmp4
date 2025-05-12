import { type NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import ytdl from "ytdl-core"
import { config } from "@/lib/config"
import path from "path"
import fs from "fs"
import os from "os"
import { convertJsonCookiesToNetscape } from "@/lib/cookie-converter"
import { proxyManager } from "@/lib/proxy-manager"

export const runtime = "nodejs"
export const maxDuration = 30

// Create a cookies file from the environment variable
async function createCookiesFile(): Promise<string> {
  try {
    // Create a temporary directory for cookies if it doesn't exist
    const cookiesDir = path.join(os.tmpdir(), "youtube-downloader", "cookies")
    if (!fs.existsSync(cookiesDir)) {
      fs.mkdirSync(cookiesDir, { recursive: true })
    }

    // Create a temporary cookies file
    const cookiesPath = path.join(cookiesDir, "youtube-cookies.txt")

    // Check if we have cookies in the environment variable
    const cookiesContent = process.env.YOUTUBE_COOKIES || ""

    if (cookiesContent) {
      // Check if the cookies are in JSON format and convert if needed
      if (cookiesContent.trim().startsWith("[") || cookiesContent.trim().startsWith("{")) {
        console.log("Detected JSON format cookies, converting to Netscape format")
        const netscapeCookies = convertJsonCookiesToNetscape(cookiesContent)
        fs.writeFileSync(cookiesPath, netscapeCookies)
        console.log("Created cookies file from environment variable (converted from JSON)")
      } else {
        // Assume it's already in Netscape format
        fs.writeFileSync(cookiesPath, cookiesContent)
        console.log("Created cookies file from environment variable (Netscape format)")
      }
    } else {
      // Create a minimal cookies file with default values
      const minimalCookies = `# Netscape HTTP Cookie File
.youtube.com	TRUE	/	FALSE	1735689600	CONSENT	YES+cb
.youtube.com	TRUE	/	FALSE	1735689600	VISITOR_INFO1_LIVE	random_alphanumeric_string
.youtube.com	TRUE	/	FALSE	1735689600	YSC	random_alphanumeric_string
.youtube.com	TRUE	/	FALSE	1735689600	GPS	1
`
      fs.writeFileSync(cookiesPath, minimalCookies)
      console.log("Created minimal cookies file")
    }

    // Debug: Log the first few lines of the cookies file
    const cookiesFileContent = fs.readFileSync(cookiesPath, "utf8")
    console.log("Cookies file first 3 lines:", cookiesFileContent.split("\n").slice(0, 3).join("\n"))

    return cookiesPath
  } catch (error) {
    console.error("Error creating cookies file:", error)
    throw error
  }
}

// Add this helper function to run yt-dlp when other methods fail
async function getInfoWithYtDlp(url: string, retryCount = 0): Promise<any> {
  return new Promise(async (resolve, reject) => {
    try {
      // Create cookies file
      const cookiesPath = await createCookiesFile()

      // Use environment variable for yt-dlp path with fallback to /tmp/bin/yt-dlp
      const ytDlpPath: string = config.ytdl.ytDlpPath

      console.log(`Using yt-dlp from: ${ytDlpPath}`)

      // Generate a random user agent
      const userAgents = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
      ]
      const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)]

      // Add cookies and user-agent to bypass YouTube's bot detection
      const args = [
        "--dump-json",
        "--no-playlist",
        "--no-warnings",
        "--cookies",
        cookiesPath,
        "--user-agent",
        randomUserAgent,
        "--add-header",
        "Accept-Language:en-US,en;q=0.9",
        "--add-header",
        "Accept:text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
        "--add-header",
        "Sec-Fetch-Mode:navigate",
        "--add-header",
        "Sec-Fetch-Site:none",
        "--add-header",
        "Sec-Fetch-User:?1",
        "--add-header",
        "Upgrade-Insecure-Requests:1",
        "--geo-bypass",
        "--no-check-certificate",
        "--extractor-retries",
        "5",
        "--sleep-requests",
        "1",
        "--sleep-interval",
        "1",
        "--max-sleep-interval",
        "5",
        "--ignore-errors",
      ]

      // Add proxy if available
      const proxyArgs = proxyManager.getProxyArgs()
      if (proxyArgs.length > 0) {
        args.push(...proxyArgs)
        console.log(`Using proxy: ${proxyArgs.join(" ")}`)
      }

      // Add URL as the last argument
      args.push(url)

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

      ytDlpProcess.on("close", async (code: number | null) => {
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

          // Check for specific errors
          if (
            errorOutput.includes("Sign in to confirm you're not a bot") ||
            errorOutput.includes("HTTP Error 403") ||
            errorOutput.includes("Forbidden")
          ) {
            // If we have retries left, try with a different proxy
            if (retryCount < 3) {
              console.log(`Bot detection or 403 error, rotating proxy and retrying (${retryCount + 1}/3)...`)
              proxyManager.rotateProxy()
              try {
                const result = await getInfoWithYtDlp(url, retryCount + 1)
                resolve(result)
                return
              } catch (retryError) {
                console.error(`Retry ${retryCount + 1} failed:`, retryError)
              }
            }

            // If we've exhausted retries or as a fallback, try to extract minimal info
            try {
              const videoId = extractVideoId(url)
              if (videoId) {
                console.log(`Bot detection triggered, falling back to minimal info for video ID: ${videoId}`)

                // Try to get title from oEmbed
                try {
                  const response = await fetch(
                    `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
                    {
                      headers: {
                        "User-Agent": randomUserAgent,
                        "Accept-Language": "en-US,en;q=0.9",
                        Accept: "application/json",
                        Referer: "https://www.google.com/",
                      },
                    },
                  )

                  if (response.ok) {
                    const data = await response.json()
                    resolve({
                      title: data.title,
                      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
                      uploader: data.author_name,
                      duration: 0,
                      view_count: 0,
                    })
                    return
                  }
                } catch (oembedError) {
                  console.error("oEmbed fallback failed:", oembedError)
                }

                // If oEmbed fails, use minimal info
                resolve({
                  title: `YouTube Video (${videoId})`,
                  thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
                  uploader: "Unknown",
                  duration: 0,
                  view_count: 0,
                })
                return
              }
            } catch (e) {
              console.error("Failed to extract minimal info:", e)
            }
          }

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
      }, 20000) // Increased timeout

      // Clear timeout when process ends
      ytDlpProcess.on("close", () => {
        clearTimeout(timeoutId)
      })
    } catch (error) {
      reject(error)
    }
  })
}

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
    const errors: string[] = []

    // Method 1: ytdl-core (your original method)
    try {
      console.log("Trying ytdl-core method...")
      const info = (await Promise.race([
        ytdl.getBasicInfo(url),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Request timed out")), 10000)),
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
    } catch (ytdlError: any) {
      console.error("ytdl-core method failed:", ytdlError)
      errors.push(ytdlError.message || "Unknown ytdl-core error")
    }

    // Method 2: Try yt-dlp
    if (!videoInfo) {
      try {
        console.log("Trying yt-dlp method...")
        videoInfo = await getInfoWithYtDlp(url)
        console.log("Successfully retrieved info using yt-dlp")
        return NextResponse.json(videoInfo)
      } catch (ytDlpError: any) {
        console.error("yt-dlp method failed:", ytDlpError)
        errors.push(ytDlpError.message || "Unknown yt-dlp error")
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

        // Generate a random user agent
        const userAgents = [
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0",
        ]
        const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)]

        const response = await fetch(
          `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
          {
            headers: {
              "User-Agent": randomUserAgent,
              "Accept-Language": "en-US,en;q=0.9",
              Accept: "application/json",
              Referer: "https://www.google.com/",
            },
          },
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
      } catch (oembedError: any) {
        console.error("oEmbed method failed:", oembedError)
        errors.push(oembedError.message || "Unknown oEmbed error")
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
      } catch (finalError: any) {
        console.error("Final method failed:", finalError)
        errors.push(finalError.message || "Unknown error in final method")
      }
    }

    // If we get here, all methods failed
    throw new Error(`Failed to get video info: ${errors.join(", ")}`)
  } catch (error: any) {
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
