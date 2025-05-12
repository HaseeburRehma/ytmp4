import { type NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import { randomUUID } from "crypto"
import fs from "fs"
import path from "path"
import os from "os"
import { config } from "@/lib/config"

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
      fs.writeFileSync(cookiesPath, cookiesContent)
      console.log("Created cookies file from environment variable")
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

async function startDownloadProcess(taskId: string, url: string, format: string) {
  try {
    // Get video title for the filename
    let videoTitle = ""
    try {
      const ytDlpPath = config.ytdl.ytDlpPath
      const cookiesPath = await createCookiesFile()

      const titleProcess = spawn(ytDlpPath, [
        "--get-title",
        "--no-warnings",
        "--cookies",
        cookiesPath,
        "--user-agent",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        url,
      ])

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

    // Prepare yt-dlp arguments
    const ytDlpArgs = getYtDlpArgs(url, format, outputPath, isAudioOnly, cookiesPath)

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
      console.error(`yt-dlp process error: ${data.toString()}`)
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
          // Download failed
          task.status = "failed"
          console.log(`Download ${taskId} failed with code ${code}`)
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

function getYtDlpArgs(url: string, format: string, outputPath: string, isAudioOnly: boolean, cookiesPath: string) {
  const baseArgs = [
    "--newline",
    "--progress",
    "--no-playlist",
    "--no-warnings",
    "--verbose",
    "--cookies",
    cookiesPath,
    "--referer",
    "https://www.youtube.com/",
  ]

  // Add user agent to avoid bot detection
  baseArgs.push(
    "--user-agent",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  )
  baseArgs.push("--add-header", "Accept-Language:en-US,en;q=0.9")
  baseArgs.push(
    "--add-header",
    "Accept:text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
  )
  baseArgs.push("--add-header", "Sec-Fetch-Mode:navigate")
  baseArgs.push("--add-header", "Sec-Fetch-Site:none")
  baseArgs.push("--add-header", "Sec-Fetch-User:?1")
  baseArgs.push("--add-header", "Upgrade-Insecure-Requests:1")
  baseArgs.push("--geo-bypass")
  baseArgs.push("--extractor-retries", "3")
  baseArgs.push("--socket-timeout", "30")

  if (isAudioOnly) {
    // Audio format
    baseArgs.push("--extract-audio", "--audio-format", "mp3")

    // Audio quality based on format
    if (format === "mp3_320") {
      baseArgs.push("--audio-quality", "0") // Best quality
    } else if (format === "mp3_256") {
      baseArgs.push("--audio-quality", "2") // Medium quality
    } else {
      baseArgs.push("--audio-quality", "5") // Lower quality
    }
  } else {
    // Video format
    if (format === "mp4_best") {
      baseArgs.push("--format", "best[ext=mp4]/best")
    } else if (format === "mp4_1024") {
      baseArgs.push("--format", "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080][ext=mp4]/best")
    } else if (format === "mp4_720") {
      baseArgs.push("--format", "bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720][ext=mp4]/best")
    } else {
      baseArgs.push("--format", "best[ext=mp4]/best")
    }

    baseArgs.push("--merge-output-format", "mp4")
  }

  // Output path
  baseArgs.push("--output", outputPath)

  // URL must be the last argument
  baseArgs.push(url)

  return baseArgs
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
