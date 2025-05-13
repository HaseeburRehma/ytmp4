import ffmpeg from "fluent-ffmpeg"
import fs from "fs"
import path from "path"
import { v4 as uuidv4 } from "uuid"
import os from "os"
import { spawn } from "child_process"
import { EventEmitter } from "events"
import { updateProgress } from "@/lib/global-store"
import { config } from "@/lib/config"
import { convertJsonCookiesToNetscape } from "@/lib/cookie-converter"

// In-memory store for active downloads
interface DownloadRecord {
  url: string
  format: string
  title: string
  process: any
  status: "processing" | "completed" | "failed" | "cancelled"
  progress: number
  eta: number | null
  fileSize: number | null
  outputFile?: string
  originalFile?: string // Store the original file path as fallback
  isAudioOnly?: boolean
  lastUpdated: number
}

const activeDownloads = new Map<string, DownloadRecord>()

// Configure ffmpeg/ffprobe if custom paths are provided
if (config.ytdl.ffmpegPath) {
  ffmpeg.setFfmpegPath(config.ytdl.ffmpegPath)
  console.log(`Using custom FFmpeg path: ${config.ytdl.ffmpegPath}`)
}
if (config.ytdl.ffprobePath) {
  ffmpeg.setFfprobePath(config.ytdl.ffprobePath)
  console.log(`Using custom FFprobe path: ${config.ytdl.ffprobePath}`)
}

export class DownloadManager extends EventEmitter {
  private tempDir: string
  private cookiesDir: string
  private ytDlpPath: string
  private debug = true
  private cookiesPath: string | null = null

  constructor() {
    super()
    this.tempDir = config.ytdl.tempDir || path.join(os.tmpdir(), "youtube-downloader", "temp")
    this.cookiesDir = path.join(os.tmpdir(), "youtube-downloader", "cookies")
    this.ytDlpPath = config.ytdl.ytDlpPath || "ytdlp"

    // Ensure temp directory exists
    try {
      fs.mkdirSync(this.tempDir, { recursive: true })
      console.log(`Ensured temp directory exists: ${this.tempDir}`)

      // Also ensure cookies directory exists
      fs.mkdirSync(this.cookiesDir, { recursive: true })
      console.log(`Ensured cookies directory exists: ${this.cookiesDir}`)

      // Initialize cookies file
      this.initializeCookiesFile()
    } catch (err) {
      console.error(`Error creating directories:`, err)
    }

    // Relay progress events into store
    this.on("progress", (data) => {
      if (this.debug) {
        console.log(`Emitting progress event for ${data.taskId}: ${data.percentage}% at ${new Date().toISOString()}`)
      }

      // Update the active download record
      const download = activeDownloads.get(data.taskId)
      if (download) {
        download.progress = data.percentage
        download.eta = data.estimated
        download.fileSize = data.fileSize || download.fileSize
        download.status = data.status
        download.lastUpdated = Date.now()

        if (data.audioOnly !== undefined) {
          download.isAudioOnly = data.audioOnly
        }
      }

      // Update the global progress store
      updateProgress(
        data.taskId,
        data.percentage,
        data.estimated,
        data.fileSize,
        data.format,
        data.status,
        data.audioOnly,
      )
    })

    // Set up periodic cleanup
    setInterval(() => {
      this.cleanupCompletedDownloads()
    }, config.ytdl.cleanupInterval || 300000) // Default: 5 minutes

    // Refresh cookies periodically
    setInterval(() => {
      this.initializeCookiesFile()
    }, 3600000) // Refresh cookies every hour
  }

  /**
   * Initialize cookies file from environment variable
   */
  private async initializeCookiesFile(): Promise<string> {
    try {
      // Create a temporary cookies file
      const cookiesPath = path.join(this.cookiesDir, "youtube-cookies.txt")

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

      // Store the cookies path for later use
      this.cookiesPath = cookiesPath

      return cookiesPath
    } catch (error) {
      console.error("Error creating cookies file:", error)
      throw error
    }
  }

  public getDownload(taskId: string) {
    return activeDownloads.get(taskId)
  }

  /**
   * Fetch video title using yt-dlp
   */
  async getVideoInfo(
    url: string,
  ): Promise<{ title: string; thumbnail?: string; duration?: number; uploader?: string; view_count?: number }> {
    // Ensure cookies file is initialized
    if (!this.cookiesPath) {
      await this.initializeCookiesFile()
    }

    return new Promise((resolve, reject) => {
      // Build arguments with cookies and user agent
      const args = [
        "--dump-json",
        "--no-playlist",
        "--no-warnings",
        "--cookies",
        this.cookiesPath!,
        "--user-agent",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
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
        "3",
        url,
      ]

      console.log(`Getting video info with args: ${args.join(" ")}`)

      const cp = spawn(this.ytDlpPath, args)
      let out = ""
      let err = ""

      cp.stdout.on("data", (d) => (out += d.toString()))
      cp.stderr.on("data", (d) => {
        err += d.toString()
        console.log(`yt-dlp stderr: ${d.toString()}`)
      })

      cp.on("close", (code) => {
        if (code === 0 && out.trim()) {
          try {
            const info = JSON.parse(out.trim())
            resolve({
              title: info.title,
              thumbnail: info.thumbnail,
              duration: info.duration,
              uploader: info.uploader,
              view_count: info.view_count || 0,
            })
          } catch (error) {
            console.error("Error parsing yt-dlp output:", error)

            // If we can't parse the JSON but have a title, return that
            const titleMatch = out.match(/"title":\s*"([^"]+)"/)
            if (titleMatch && titleMatch[1]) {
              resolve({ title: titleMatch[1] })
              return
            }

            reject(new Error("Failed to parse video information"))
          }
        } else {
          console.error(`yt-dlp exited ${code}: ${err}`)

          // If we get a bot detection error, try to extract minimal info from the URL
          if (err.includes("Sign in to confirm you're not a bot")) {
            const videoId = this.extractVideoId(url)
            if (videoId) {
              resolve({
                title: `YouTube Video (${videoId})`,
                thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
                uploader: "Unknown",
                duration: 0,
                view_count: 0,
              })
              return
            }
          }

          reject(new Error(`yt-dlp exited ${code}: ${err}`))
        }
      })

      cp.on("error", (error) => {
        console.error(`yt-dlp process error:`, error)
        reject(error)
      })
    })
  }

  /**
   * Start the download and conversion process
   */
  async startDownload(url: string, format: string, title: string, taskId?: string): Promise<string> {
    // Use the provided taskId or generate a new one
    const downloadTaskId = taskId || uuidv4().slice(0, 8)
    const isMP3 = format.includes("mp3")

    console.log(`Starting download for task ${downloadTaskId}: ${url} (${format})`)

    // Create a record for this download
    activeDownloads.set(downloadTaskId, {
      url,
      format,
      title,
      process: null,
      status: "processing",
      progress: 0,
      eta: null,
      fileSize: null,
      lastUpdated: Date.now(),
    })

    // Emit initial progress
    this.emit("progress", {
      taskId: downloadTaskId,
      percentage: 0,
      estimated: 60, // Initial estimate of 60 seconds
      fileSize: null,
      format,
      status: "processing",
    })

    try {
      // Ensure cookies file is initialized
      if (!this.cookiesPath) {
        await this.initializeCookiesFile()
      }

      // Create a unique filename for this download
      const tempBase = path.join(this.tempDir, `${downloadTaskId}`)

      // Build yt-dlp arguments based on format
      const ytdlpArgs = [
        "--newline", // Important: Print progress on new lines
        "--progress", // Show progress
        "--no-playlist", // Don't download playlists
        "--no-warnings", // Suppress warnings
        "--verbose", // Add verbose output for debugging
        "--cookies",
        this.cookiesPath!, // Use cookies file
        "--user-agent",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
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
        "3",
        "--socket-timeout",
        "30",
      ]

      if (isMP3) {
        // For MP3, get the best audio
        ytdlpArgs.push(
          "--format",
          "bestaudio[ext=m4a]/bestaudio",
          "--extract-audio",
          "--audio-format",
          "m4a",
          "--output",
          `${tempBase}.%(ext)s`,
        )
      } else {
        // For MP4, download as a single file directly
        ytdlpArgs.push(
          "--format",
          "best[ext=mp4]/best", // Get the best quality available as a single file
          "--merge-output-format",
          "mp4",
          "--output",
          `${tempBase}.%(ext)s`,
        )
      }

      // Add the URL as the last argument
      ytdlpArgs.push(url)

      console.log(`Starting yt-dlp with args:`, ytdlpArgs)

      // Spawn yt-dlp process
      const ytdlpProcess = spawn(this.ytDlpPath, ytdlpArgs)
      activeDownloads.get(downloadTaskId)!.process = ytdlpProcess

      // Track stdout for progress updates
      let stdoutBuffer = ""
      ytdlpProcess.stdout.on("data", (data) => {
        const text = data.toString()
        stdoutBuffer += text

        if (this.debug) {
          console.log(`yt-dlp stdout: ${text}`)
        }

        // Process each line
        const lines = stdoutBuffer.split("\n")
        stdoutBuffer = lines.pop() || "" // Keep the last incomplete line

        for (const line of lines) {
          // Parse progress information
          this.parseYtDlpProgress(line, downloadTaskId, format)
        }
      })

      // Track stderr for errors
      let stderrBuffer = ""
      ytdlpProcess.stderr.on("data", (data) => {
        stderrBuffer += data.toString()
        console.error(`yt-dlp stderr: ${data}`)

        // Check for cookie errors and try to refresh cookies
        if (data.toString().includes("Sign in to confirm you're not a bot")) {
          console.log("Bot detection triggered, refreshing cookies...")
          this.initializeCookiesFile().catch((err) => {
            console.error("Failed to refresh cookies:", err)
          })
        }
      })

      // Handle process completion
      ytdlpProcess.on("close", (code) => {
        console.log(`yt-dlp process exited with code ${code}`)

        if (code !== 0) {
          console.error(`yt-dlp failed with code ${code}: ${stderrBuffer}`)

          // If we get a bot detection error, try to extract video ID and use fallback
          if (stderrBuffer.includes("Sign in to confirm you're not a bot")) {
            const videoId = this.extractVideoId(url)
            if (videoId) {
              console.log(`Bot detection triggered, using fallback for video ID: ${videoId}`)

              // Try to download using a different approach or just mark as failed
              this.fail(downloadTaskId, `YouTube bot detection triggered. Please try again later.`)
              return
            }
          }

          this.fail(downloadTaskId, `Download failed with code ${code}`)
          return
        }

        // Find the downloaded file(s)
        const files = fs.readdirSync(this.tempDir)
        const downloadedFiles = files.filter((file) => file.startsWith(downloadTaskId))

        if (downloadedFiles.length === 0) {
          this.fail(downloadTaskId, "Download completed but no output files found")
          return
        }

        // For MP4, we should have a single file
        if (!isMP3) {
          // Look for MP4 file
          const mp4File = downloadedFiles.find((file) => file.endsWith(".mp4"))
          if (mp4File) {
            const inputFile = path.join(this.tempDir, mp4File)

            // Store the original file path as fallback
            const download = activeDownloads.get(downloadTaskId)
            if (download) {
              download.originalFile = inputFile
            }

            // Create a safe filename from the title
            const safeTitle = title
              .replace(/[^\w\s-]/g, "")
              .replace(/\s+/g, "-")
              .toLowerCase()

            const outputFile = path.join(this.tempDir, `${safeTitle}_${downloadTaskId}.mp4`)

            // Just rename the file instead of conversion
            this.finalizeDownload(downloadTaskId, inputFile, outputFile, false)
            return
          }

          // If no MP4 file, look for other video files
          const videoFile = downloadedFiles.find(
            (file) => file.endsWith(".webm") || file.endsWith(".mkv") || file.endsWith(".avi") || file.endsWith(".mov"),
          )

          if (videoFile) {
            const inputFile = path.join(this.tempDir, videoFile)
            this.startConversion(downloadTaskId, inputFile, false)
            return
          }
        } else {
          // For MP3, just use the first file (should be audio)
          const audioFile = downloadedFiles.find(
            (file) => file.endsWith(".m4a") || file.endsWith(".webm") || file.endsWith(".opus"),
          )

          if (audioFile) {
            const inputFile = path.join(this.tempDir, audioFile)

            // Store the original file path as fallback
            const download = activeDownloads.get(downloadTaskId)
            if (download) {
              download.originalFile = inputFile
            }

            this.startConversion(downloadTaskId, inputFile, true)
            return
          }
        }

        // If we get here, something went wrong
        this.fail(downloadTaskId, "Could not find appropriate output files")
      })

      ytdlpProcess.on("error", (err) => {
        console.error(`yt-dlp process error: ${err.message}`)
        this.fail(downloadTaskId, `Download process error: ${err.message}`)
      })

      return downloadTaskId
    } catch (error) {
      console.error(`Error starting download for task ${downloadTaskId}:`, error)
      this.fail(downloadTaskId, `Failed to start download: ${error}`)
      return downloadTaskId
    }
  }

  /**
   * Finalize download by renaming or copying the file
   */
  private finalizeDownload(taskId: string, inputFile: string, outputFile: string, isAudioOnly: boolean) {
    const download = activeDownloads.get(taskId)
    if (!download) return

    console.log(`Finalizing download for ${taskId}: ${inputFile} -> ${outputFile}`)

    try {
      // If input and output are different, copy the file
      if (inputFile !== outputFile) {
        fs.copyFileSync(inputFile, outputFile)
        console.log(`File copied: ${inputFile} -> ${outputFile}`)

        // Delete the original file
        try {
          fs.unlinkSync(inputFile)
          console.log(`Original file deleted: ${inputFile}`)
        } catch (err) {
          console.error(`Error deleting original file ${inputFile}:`, err)
        }
      }

      // Update the download record
      download.outputFile = outputFile
      download.status = "completed"
      download.progress = 100
      download.lastUpdated = Date.now()

      // Emit completion event
      this.emit("progress", {
        taskId,
        percentage: 100,
        estimated: 0,
        fileSize: download.fileSize,
        format: download.format,
        status: "completed",
        audioOnly: isAudioOnly,
      })

      console.log(`Download finalized for ${taskId}`)
    } catch (error) {
      console.error(`Error finalizing download for ${taskId}:`, error)

      // If we have the original file, use it as fallback
      if (download.originalFile && fs.existsSync(download.originalFile)) {
        download.outputFile = download.originalFile
        download.status = "completed"
        download.progress = 100
        download.lastUpdated = Date.now()

        this.emit("progress", {
          taskId,
          percentage: 100,
          estimated: 0,
          fileSize: download.fileSize,
          format: download.format,
          status: "completed",
          audioOnly: isAudioOnly,
        })

        console.log(`Using original file as fallback for ${taskId}: ${download.originalFile}`)
      } else {
        this.fail(taskId, `Failed to finalize download: ${error}`)
      }
    }
  }

  /**
   * Parse yt-dlp progress output and update progress
   */
  private parseYtDlpProgress(line: string, taskId: string, format: string) {
    const download = activeDownloads.get(taskId)
    if (!download) return

    // Look for download progress lines
    const progressMatch =
      /\[download\]\s+(\d+\.\d+)%\s+of\s+~?\s*(\d+\.\d+)(K|M|G)iB\s+at\s+(\d+\.\d+)(K|M|G)iB\/s\s+ETA\s+(\d+):(\d+)/.exec(
        line,
      )

    if (progressMatch) {
      const percentage = Number.parseFloat(progressMatch[1])
      const size = Number.parseFloat(progressMatch[2])
      const sizeUnit = progressMatch[3]
      const etaMinutes = Number.parseInt(progressMatch[6], 10)
      const etaSeconds = Number.parseInt(progressMatch[7], 10)

      // Convert size to bytes
      let fileSizeBytes = size
      if (sizeUnit === "K") fileSizeBytes *= 1024
      else if (sizeUnit === "M") fileSizeBytes *= 1024 * 1024
      else if (sizeUnit === "G") fileSizeBytes *= 1024 * 1024 * 1024

      // Calculate total ETA in seconds
      const etaTotalSeconds = etaMinutes * 60 + etaSeconds

      // Update download record - scale to 0-50% for download phase
      const scaledPercentage = percentage / 2
      download.progress = scaledPercentage
      download.eta = etaTotalSeconds
      download.fileSize = fileSizeBytes
      download.lastUpdated = Date.now()

      // Emit progress event
      this.emit("progress", {
        taskId,
        percentage: scaledPercentage,
        estimated: etaTotalSeconds,
        fileSize: fileSizeBytes,
        format,
        status: "processing",
      })

      console.log(
        `Download progress for ${taskId}: ${percentage}%, ETA: ${etaMinutes}m${etaSeconds}s (scaled: ${scaledPercentage}%)`,
      )
    }

    // Also check for other progress indicators
    if (line.includes("[download]") && !progressMatch) {
      console.log(`Download progress line (unmatched): ${line}`)

      // Try to extract percentage with a simpler regex
      const simplePercentMatch = /(\d+(?:\.\d+)?)%/.exec(line)
      if (simplePercentMatch) {
        const percentage = Number.parseFloat(simplePercentMatch[1])
        const scaledPercentage = percentage / 2

        download.progress = scaledPercentage
        download.lastUpdated = Date.now()

        this.emit("progress", {
          taskId,
          percentage: scaledPercentage,
          estimated: download.eta,
          fileSize: download.fileSize,
          format: download.format,
          status: "processing",
        })

        console.log(`Simple progress match: ${percentage}% (scaled: ${scaledPercentage}%)`)
      }
    }

    // Check for download completion
    if (line.includes("[download] 100%")) {
      download.progress = 50 // Set to 50% as we still need to process with FFmpeg
      download.lastUpdated = Date.now()

      this.emit("progress", {
        taskId,
        percentage: 50,
        estimated: 30, // Estimate 30 seconds for conversion
        fileSize: download.fileSize,
        format,
        status: "processing",
      })

      console.log(`Download completed for ${taskId}, starting conversion`)
    }
  }

  /**
   * Run FFmpeg on the downloaded file
   */
  private startConversion(taskId: string, inputFile: string, isAudioOnly: boolean) {
    const download = activeDownloads.get(taskId)
    if (!download) return

    console.log(`Starting conversion for ${taskId} from ${inputFile}`)

    // Verify input file exists
    if (!fs.existsSync(inputFile)) {
      console.error(`Input file does not exist: ${inputFile}`)
      this.fail(taskId, `Conversion failed: Input file not found`)
      return
    }

    // Store the original file path as fallback
    download.originalFile = inputFile

    // Update audio-only status if needed
    if (isAudioOnly && !download.format.includes("mp3")) {
      download.isAudioOnly = true
      download.lastUpdated = Date.now()
      console.log(`Detected audio-only file for MP4 request: ${inputFile}`)

      // Emit an event to inform the client
      this.emit("progress", {
        taskId,
        percentage: download.progress,
        estimated: download.eta,
        fileSize: download.fileSize,
        format: download.format,
        status: "processing",
        audioOnly: true,
      })
    }

    // Create a safe filename from the title
    const safeTitle = download.title
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .toLowerCase()

    // Use temp directory for output
    const outputFile = path.join(
      this.tempDir,
      `${safeTitle}_${taskId}.${download.format.includes("mp3") ? "mp3" : "mp4"}`,
    )

    // Store the output file path in the download record
    download.outputFile = outputFile
    download.lastUpdated = Date.now()

    console.log(`FFmpeg conversion: ${inputFile} -> ${outputFile}`)

    try {
      const ffmpegCommand = ffmpeg(inputFile)

      // Configure based on format
      if (download.format.includes("mp3")) {
        // For MP3, convert to MP3 format with appropriate bitrate
        const bitrate = download.format.includes("320") ? 320 : download.format.includes("256") ? 256 : 128

        // Use faster encoding preset for better performance
        ffmpegCommand
          .audioCodec("libmp3lame")
          .audioBitrate(bitrate)
          .format("mp3")
          .outputOptions(["-y", "-preset", "ultrafast"]) // Overwrite output file if it exists and use ultrafast preset
      } else if (isAudioOnly) {
        // For audio-only files requested as MP4, convert to MP4 container but it will be audio-only
        ffmpegCommand.audioCodec("aac").audioBitrate(192).format("mp4").outputOptions(["-y", "-preset", "ultrafast"]) // Overwrite output file if it exists and use ultrafast preset
      } else {
        // For MP4, just copy the streams to avoid re-encoding
        ffmpegCommand.outputOptions(["-c", "copy", "-y"]) // Copy streams and overwrite output
      }

      ffmpegCommand
        .output(outputFile)
        .on("start", (cmd) => {
          console.log(`FFmpeg started with command: ${cmd}`)

          // Update progress to show we're in the conversion phase
          this.emit("progress", {
            taskId,
            percentage: 60,
            estimated: 20,
            fileSize: download.fileSize,
            format: download.format,
            status: "processing",
          })
        })
        .on("progress", (progress) => {
          // FFmpeg progress is from 0-100
          const percentage = Math.floor(progress.percent || 0)

          // Scale progress from 50-100% (as download was 0-50%)
          const scaledPercentage = 50 + percentage / 2

          download.progress = scaledPercentage
          download.lastUpdated = Date.now()

          this.emit("progress", {
            taskId,
            percentage: scaledPercentage,
            estimated: null,
            fileSize: download.fileSize,
            format: download.format,
            status: "processing",
          })

          console.log(`FFmpeg progress for ${taskId}: ${percentage}% (scaled: ${scaledPercentage}%)`)
        })
        .on("end", () => {
          console.log(`FFmpeg finished for ${taskId}`)

          // Update status to completed
          download.status = "completed"
          download.progress = 100
          download.lastUpdated = Date.now()

          this.emit("progress", {
            taskId,
            percentage: 100,
            estimated: 0,
            fileSize: download.fileSize,
            format: download.format,
            status: "completed",
            audioOnly: download.isAudioOnly,
          })

          // Clean up input file if it's different from output
          if (inputFile !== outputFile) {
            try {
              fs.unlinkSync(inputFile)
              console.log(`Temporary file deleted: ${inputFile}`)
            } catch (err) {
              console.error(`Error deleting temp file ${inputFile}:`, err)
            }
          }
        })
        .on("error", (err) => {
          console.error(`FFmpeg error for ${taskId}:`, err)

          // If conversion fails, use the original file as fallback
          console.log(`Using original file as fallback for ${taskId}: ${download.originalFile}`)

          if (download.originalFile && fs.existsSync(download.originalFile)) {
            download.outputFile = download.originalFile
            download.status = "completed"
            download.progress = 100
            download.lastUpdated = Date.now()

            this.emit("progress", {
              taskId,
              percentage: 100,
              estimated: 0,
              fileSize: download.fileSize,
              format: download.format,
              status: "completed",
              audioOnly: isAudioOnly,
            })
          } else {
            this.fail(taskId, `Conversion error: ${err.message}`)
          }
        })
        .run()
    } catch (error) {
      console.error(`Error starting FFmpeg for ${taskId}:`, error)

      // If FFmpeg fails to start, use the original file as fallback
      if (download.originalFile && fs.existsSync(download.originalFile)) {
        download.outputFile = download.originalFile
        download.status = "completed"
        download.progress = 100
        download.lastUpdated = Date.now()

        this.emit("progress", {
          taskId,
          percentage: 100,
          estimated: 0,
          fileSize: download.fileSize,
          format: download.format,
          status: "completed",
          audioOnly: isAudioOnly,
        })

        console.log(`Using original file as fallback for ${taskId}: ${download.originalFile}`)
      } else {
        this.fail(taskId, `Failed to start conversion: ${error}`)
      }
    }
  }

  /**
   * Cancel an active download
   */
  public cancelDownload(taskId: string): boolean {
    console.log(`Attempting to cancel download ${taskId}`)

    const download = activeDownloads.get(taskId)
    if (!download) {
      console.log(`Download ${taskId} not found for cancellation`)
      return false
    }

    // Kill the process if it exists
    if (download.process && typeof download.process.kill === "function") {
      try {
        download.process.kill("SIGTERM")
        console.log(`Process for ${taskId} terminated`)
      } catch (err) {
        console.error(`Error killing process for ${taskId}:`, err)
      }
    }

    // Update status
    download.status = "cancelled"
    download.lastUpdated = Date.now()

    // Emit progress event with cancelled status
    this.emit("progress", {
      taskId,
      percentage: download.progress,
      estimated: 0,
      fileSize: download.fileSize,
      format: download.format,
      status: "cancelled",
    })

    // Clean up any files
    if (download.outputFile && fs.existsSync(download.outputFile)) {
      try {
        fs.unlinkSync(download.outputFile)
      } catch (err) {
        console.error(`Error deleting output file ${download.outputFile}:`, err)
      }
    }

    if (download.originalFile && fs.existsSync(download.originalFile)) {
      try {
        fs.unlinkSync(download.originalFile)
      } catch (err) {
        console.error(`Error deleting original file ${download.originalFile}:`, err)
      }
    }

    console.log(`Download ${taskId} marked as cancelled`)
    return true
  }

  /**
   * Mark a download as failed
   */
  private fail(taskId: string, message: string) {
    console.error(`Download ${taskId} failed: ${message}`)

    const download = activeDownloads.get(taskId)
    if (!download) return

    download.status = "failed"
    download.lastUpdated = Date.now()

    this.emit("progress", {
      taskId,
      percentage: download.progress,
      estimated: 0,
      fileSize: download.fileSize,
      format: download.format,
      status: "failed",
    })
  }

  /**
   * Clean up completed downloads after a certain time
   */
  public cleanupCompletedDownloads() {
    const maxAge = config.ytdl.maxFileAge || 600000 // Default: 10 minutes
    const now = Date.now()

    console.log(`Running cleanup for completed downloads older than ${maxAge / 60000} minutes`)

    // Clean up files in the temp directory
    try {
      if (fs.existsSync(this.tempDir)) {
        const files = fs.readdirSync(this.tempDir)

        for (const file of files) {
          const filePath = path.join(this.tempDir, file)

          try {
            const stats = fs.statSync(filePath)
            const fileAge = now - stats.mtimeMs

            if (fileAge > maxAge) {
              fs.unlinkSync(filePath)
              console.log(`Cleaned up old file: ${filePath} (age: ${fileAge / 60000} minutes)`)
            }
          } catch (err) {
            console.error(`Error checking/deleting file ${filePath}:`, err)
          }
        }
      }
    } catch (err) {
      console.error(`Error cleaning up temp directory:`, err)
    }

    // Clean up completed downloads from memory
    for (const [taskId, download] of activeDownloads.entries()) {
      const downloadAge = now - download.lastUpdated

      if (
        (download.status === "completed" || download.status === "failed" || download.status === "cancelled") &&
        downloadAge > maxAge
      ) {
        // Remove from active downloads
        activeDownloads.delete(taskId)
        console.log(
          `Removed old download record for ${taskId} (status: ${download.status}, age: ${downloadAge / 60000} minutes)`,
        )
      }
    }
  }

  /**
   * Extract video ID from YouTube URL
   */
  private extractVideoId(url: string): string | null {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return match && match[2].length === 11 ? match[2] : null
  }
}

export const downloadManager = new DownloadManager()

// Set up periodic cleanup
setInterval(() => {
  downloadManager.cleanupCompletedDownloads()
}, config.ytdl.cleanupInterval || 300000) // Default: 5 minutes
