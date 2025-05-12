import { type NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import { randomUUID } from "crypto"
import fs from "fs"
import path from "path"
import os from "os"
import { config } from "@/lib/config"
import { convertJsonCookiesToNetscape } from "@/lib/cookie-converter"
import { proxyManager } from "@/lib/proxy-manager"

// Global store for download tasks
const downloadTasks = new Map()

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

    return cookiesPath
  } catch (error) {
    console.error("Error creating cookies file:", error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url, format } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    if (!format) {
      return NextResponse.json({ error: "Format is required" }, { status: 400 })
    }

    // Generate a unique task ID
    const taskId = randomUUID()
    console.log(`Generated new task ID: ${taskId} for URL: ${url}`)

    // Initialize task in global store
    downloadTasks.set(taskId, {
      id: taskId,
      url,
      format,
      progress: 0,
      status: "initializing",
      startTime: Date.now(),
    })

    // Start the download process asynchronously
    startDownloadProcess(taskId, url, format)

    return NextResponse.json({ taskId })
  } catch (error: any) {
    console.error("Error starting download:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to start download",
      },
      { status: 500 },
    )
  }
}

async function startDownloadProcess(taskId: string, url: string, format: string, retryCount = 0) {
  try {
    // Get video title for the filename
    let videoTitle = ""
    try {
      const ytDlpPath = config.ytdl.ytDlpPath
      const cookiesPath = await createCookiesFile()

      // Generate a random user agent
      const userAgents = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0",
      ]
      const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)]

      // Get proxy arguments
      const proxyArgs = proxyManager.getProxyArgs()

      const titleArgs = [
        "--get-title",
        "--no-warnings",
        "--cookies",
        cookiesPath,
        "--user-agent",
        randomUserAgent,
        "--geo-bypass",
        "--no-check-certificate",
      ]

      // Add proxy if available
      if (proxyArgs.length > 0) {
        titleArgs.push(...proxyArgs)
      }

      // Add URL as the last argument
      titleArgs.push(url)

      const titleProcess = spawn(ytDlpPath, titleArgs)

      let titleOutput = ""
      titleProcess.stdout.on("data", (data) => {
        titleOutput += data.toString()
      })

      await new Promise((resolve, reject) => {
        titleProcess.on("close", (code) => {
          if (code === 0) {
            resolve(null)
          } else {
            reject(new Error(`Failed to get video title with code ${code}`))
          }
        })

        titleProcess.on("error", reject)
      })

      videoTitle = titleOutput
        .trim()
        .replace(/[^\w\s]/gi, "")
        .replace(/\s+/g, "_")
    } catch (error) {
      console.error(`Error getting video title for task ${taskId}:`, error)
      videoTitle = `video_${taskId}`
    }

    // Update task with title
    const task = downloadTasks.get(taskId)
    if (task) {
      task.title = videoTitle || `video_${taskId}`
      downloadTasks.set(taskId, task)
    }

    // Ensure temp directory exists
    const tempDir = config.ytdl.tempDir
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }

    // Determine output format and options
    const isAudioOnly = format.startsWith("mp3")
    const outputFormat = isAudioOnly ? "mp3" : "mp4"
    const outputPath = path.join(tempDir, `${taskId}.${outputFormat}`)

    // Get cookies file
    const cookiesPath = await createCookiesFile()

    // Generate a random user agent
    const userAgents = [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0",
    ]
    const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)]

    // Prepare yt-dlp arguments
    const ytDlpArgs = [
      "--newline",
      "--progress",
      "--no-playlist",
      "--no-warnings",
      "--verbose",
      "--cookies",
      cookiesPath,
      "--referer",
      "https://www.youtube.com/",
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
      ytDlpArgs.push(...proxyArgs)
      console.log(`Using proxy for download: ${proxyArgs.join(" ")}`)
    }

    if (isAudioOnly) {
      // Audio format
      ytDlpArgs.push("--extract-audio", "--audio-format", "mp3")

      // Audio quality based on format
      if (format === "mp3_320") {
        ytDlpArgs.push("--audio-quality", "0") // Best quality
      } else if (format === "mp3_256") {
        ytDlpArgs.push("--audio-quality", "2") // Medium quality
      } else {
        ytDlpArgs.push("--audio-quality", "5") // Lower quality
      }
    } else {
      // Video format
      if (format === "mp4_best") {
        ytDlpArgs.push("--format", "best[ext=mp4]/best")
      } else if (format === "mp4_1024") {
        ytDlpArgs.push(
          "--format",
          "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080][ext=mp4]/best",
        )
      } else if (format === "mp4_720") {
        ytDlpArgs.push("--format", "bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720][ext=mp4]/best")
      } else {
        ytDlpArgs.push("--format", "best[ext=mp4]/best")
      }

      ytDlpArgs.push("--merge-output-format", "mp4")
    }

    // Output path
    ytDlpArgs.push("--output", outputPath)

    // URL must be the last argument
    ytDlpArgs.push(url)

    console.log(`Starting yt-dlp with args:`, ytDlpArgs)

    // Start the download process
    const ytDlpProcess = spawn(config.ytdl.ytDlpPath, ytDlpArgs)

    console.log(`Download started for task ${taskId}`)

    // Update task status
    if (downloadTasks.has(taskId)) {
      const task = downloadTasks.get(taskId)
      task.status = "processing"
      task.progress = 0
      downloadTasks.set(taskId, task)

      console.log(
        `Global progress stored for ${taskId}: ${task.progress}% (${task.status}) at ${new Date().toISOString()}`,
      )
    }

    // Handle progress updates
    ytDlpProcess.stdout.on("data", (data) => {
      const output = data.toString()

      // Parse progress information
      const progressMatch = output.match(/(\d+\.\d+)%/)
      if (progressMatch && progressMatch[1]) {
        const progress = Number.parseFloat(progressMatch[1])

        // Update task with progress
        if (downloadTasks.has(taskId)) {
          const task = downloadTasks.get(taskId)
          task.progress = progress

          // Extract ETA if available
          const etaMatch = output.match(/ETA\s+(\d+:\d+)/)
          if (etaMatch && etaMatch[1]) {
            task.estimatedTime = etaMatch[1]
          }

          // Extract file size if available
          const sizeMatch = output.match(/(\d+\.\d+)(K|M|G)iB/)
          if (sizeMatch) {
            task.fileSize = `${sizeMatch[1]} ${sizeMatch[2]}B`
          }

          downloadTasks.set(taskId, task)

          // Emit progress event
          console.log(`Progress for ${taskId}: ${progress}%`)
        }
      }
    })

    // Handle errors
    ytDlpProcess.stderr.on("data", (data) => {
      const errorOutput = data.toString()
      console.error(`yt-dlp process error: ${errorOutput}`)

      // Check for bot detection or 403 errors
      if (
        errorOutput.includes("Sign in to confirm you're not a bot") ||
        errorOutput.includes("HTTP Error 403") ||
        errorOutput.includes("Forbidden")
      ) {
        // If we have retries left, try with a different proxy
        if (retryCount < 3) {
          console.log(`Bot detection or 403 error, rotating proxy and retrying download (${retryCount + 1}/3)...`)

          // Kill the current process
          ytDlpProcess.kill()

          // Rotate proxy
          proxyManager.rotateProxy()

          // Retry with new proxy
          setTimeout(() => {
            startDownloadProcess(taskId, url, format, retryCount + 1)
          }, 1000)
        }
      }
    })

    // Handle process completion
    ytDlpProcess.on("close", (code) => {
      console.log(`yt-dlp process exited with code ${code}`)

      if (downloadTasks.has(taskId)) {
        const task = downloadTasks.get(taskId)

        if (code === 0) {
          // Download completed successfully
          task.status = "completed"
          task.progress = 100
          task.downloadUrl = `/api/video/download/${taskId}.${outputFormat}`
          console.log(`Download ${taskId} completed successfully`)
        } else {
          // If this was a retry failure, mark the proxy as failed
          if (retryCount > 0) {
            proxyManager.markCurrentProxyAsFailed()
          }

          // If we have retries left and it's a 403 error, we'll retry in the stderr handler
          // Otherwise, mark as failed
          if (retryCount >= 3) {
            task.status = "failed"
            console.log(`Download ${taskId} failed with code ${code} after ${retryCount} retries`)
          }
        }

        downloadTasks.set(taskId, task)
      }
    })

    // Handle process errors
    ytDlpProcess.on("error", (error) => {
      console.error(`yt-dlp process error: ${error.message}`)

      if (downloadTasks.has(taskId)) {
        const task = downloadTasks.get(taskId)
        task.status = "failed"
        task.error = error.message
        downloadTasks.set(taskId, task)

        console.log(`Download ${taskId} failed: ${error.message}`)
      }
    })
  } catch (error) {
    console.error(`Error in download process for task ${taskId}:`, error)

    if (downloadTasks.has(taskId)) {
      const task = downloadTasks.get(taskId)
      task.status = "failed"
      task.error = error instanceof Error ? error.message : "Unknown error"
      downloadTasks.set(taskId, task)
    }
  }
}

export async function GET(request: NextRequest) {
  // This endpoint will be used to download the file
  const url = request.nextUrl.pathname
  const taskIdMatch = url.match(/\/api\/video\/download\/(.+)$/)

  if (!taskIdMatch) {
    return NextResponse.json({ error: "Invalid download URL" }, { status: 400 })
  }

  const fileId = taskIdMatch[1]
  const tempDir = config.ytdl.tempDir

  // Find the file
  const files = fs.readdirSync(tempDir)
  const matchingFile = files.find((file) => file.startsWith(fileId.split(".")[0]))

  if (!matchingFile) {
    return NextResponse.json({ error: "File not found" }, { status: 404 })
  }

  const filePath = path.join(tempDir, matchingFile)
  const fileStats = fs.statSync(filePath)

  // Get file extension
  const ext = path.extname(matchingFile).substring(1)

  // Set appropriate content type
  const contentType = ext === "mp3" ? "audio/mpeg" : "video/mp4"

  // Create readable stream
  const fileStream = fs.createReadStream(filePath)

  // Return the file as a stream
  return new NextResponse(fileStream as any, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="download.${ext}"`,
      "Content-Length": fileStats.size.toString(),
    },
  })
}
