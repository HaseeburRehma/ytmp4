import { type NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { downloadManager } from "@/lib/download-manager"
import { config } from "@/lib/config"
import { getProgress } from "@/lib/global-store"
import os from "os"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    const taskId = request.nextUrl.searchParams.get("taskId")

    if (!taskId) {
      console.error("Download request missing taskId parameter")
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 })
    }

    console.log(`Download request received for task ${taskId}`)

    // Get download info - first check the download manager
    const download = downloadManager.getDownload(taskId)

    // If found in download manager, use that
    if (download && download.status === "completed") {
      let fileToServe = download.outputFile

      // Check if the output file exists
      if (!fileToServe || !fs.existsSync(fileToServe)) {
        console.log(`Output file not found: ${fileToServe}, checking for original file`)

        // Try to use the original file as fallback
        if (download.originalFile && fs.existsSync(download.originalFile)) {
          fileToServe = download.originalFile
          console.log(`Using original file as fallback: ${fileToServe}`)
        } else {
          console.error(`No valid file found for download ${taskId}`)
          return NextResponse.json({ error: "File not found" }, { status: 404 })
        }
      }

      console.log(`Serving file: ${fileToServe}`)

      // Read the file as a buffer
      const fileBuffer = fs.readFileSync(fileToServe)

      // Set appropriate headers for browser download
      const headers = new Headers()
      headers.set("Content-Type", download.format.includes("mp3") ? "audio/mpeg" : "video/mp4")

      // Create a safe filename from the title
      const safeTitle = download.title
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .toLowerCase()

      const fileExt = download.format.includes("mp3") ? "mp3" : "mp4"
      const filename = `${safeTitle}.${fileExt}`

      headers.set("Content-Disposition", `attachment; filename="${filename}"`)
      headers.set("Content-Length", fileBuffer.length.toString())

      // Add cache control headers to prevent caching issues
      headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
      headers.set("Pragma", "no-cache")
      headers.set("Expires", "0")

      // Log the headers we're sending
      console.log("Sending file with headers:", {
        contentType: headers.get("Content-Type"),
        contentDisposition: headers.get("Content-Disposition"),
        contentLength: headers.get("Content-Length"),
        fileSize: fileBuffer.length,
      })

      // Schedule file deletion after a delay
      setTimeout(() => {
        try {
          if (fs.existsSync(fileToServe)) {
            fs.unlinkSync(fileToServe)
            console.log(`Temporary file deleted: ${fileToServe}`)
          }
        } catch (err) {
          console.error(`Error deleting temporary file: ${fileToServe}`, err)
        }
      }, 300000) // 5 minute delay

      return new NextResponse(fileBuffer, { headers })
    }

    // If not found in download manager, check the global progress store
    const progressData = getProgress(taskId)
    if (!progressData || progressData.status !== "completed") {
      console.error(`Download not found or not completed for taskId ${taskId}`)
      return NextResponse.json(
        {
          error: "Download not found or not completed",
          status: progressData?.status || "unknown",
        },
        { status: 404 },
      )
    }

    // Determine the temp directory
    const tempDir = config.ytdl.tempDir || path.join(os.tmpdir(), "youtube-downloader", "temp")

    // Ensure the directory exists
    try {
      fs.mkdirSync(tempDir, { recursive: true })
      console.log(`Ensured temp directory exists: ${tempDir}`)
    } catch (err) {
      console.error(`Error creating temp directory ${tempDir}:`, err)
      return NextResponse.json({ error: "Failed to access temporary directory" }, { status: 500 })
    }

    // Check if directory exists and is readable
    if (!fs.existsSync(tempDir)) {
      console.error(`Temp directory does not exist after creation attempt: ${tempDir}`)
      return NextResponse.json({ error: "Temporary directory not accessible" }, { status: 500 })
    }

    console.log(`Searching for files in ${tempDir} with taskId ${taskId}`)

    // List files in the directory
    let files
    try {
      files = fs.readdirSync(tempDir)
      console.log(`Found ${files.length} files in temp directory:`, files)
    } catch (err) {
      console.error(`Error reading temp directory ${tempDir}:`, err)
      return NextResponse.json({ error: "Failed to read temporary directory" }, { status: 500 })
    }

    // Determine if we want MP3 or MP4
    const isMP3 = progressData.format?.includes("mp3") || false

    // Find the appropriate file based on format
    let downloadedFile

    if (isMP3) {
      // For MP3, look for MP3 files first, then M4A files
      downloadedFile =
        files.find((file) => file.includes(taskId) && file.endsWith(".mp3")) ||
        files.find((file) => file.includes(taskId) && file.endsWith(".m4a"))
    } else {
      // For MP4, look for MP4 files
      downloadedFile = files.find((file) => file.includes(taskId) && file.endsWith(".mp4"))

      // If no MP4 file found, look for any video file
      if (!downloadedFile) {
        downloadedFile = files.find(
          (file) =>
            file.includes(taskId) &&
            (file.endsWith(".webm") || file.endsWith(".mkv") || file.endsWith(".avi") || file.endsWith(".mov")),
        )
      }
    }

    if (!downloadedFile) {
      console.error(`No matching file found for taskId ${taskId} in directory ${tempDir}`)
      return NextResponse.json({ error: "Download file not found" }, { status: 404 })
    }

    const outputFile = path.join(tempDir, downloadedFile)
    console.log(`Found matching file: ${outputFile}`)

    // Check if file exists and is readable
    if (!fs.existsSync(outputFile)) {
      console.error(`File not found: ${outputFile}`)
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // Read the file as a buffer
    let fileBuffer
    try {
      fileBuffer = fs.readFileSync(outputFile)
      console.log(`Successfully read file: ${outputFile}, size: ${fileBuffer.length} bytes`)
    } catch (err) {
      console.error(`Error reading file ${outputFile}:`, err)
      return NextResponse.json({ error: "Failed to read file" }, { status: 500 })
    }

    // Set appropriate headers for browser download
    const headers = new Headers()
    headers.set("Content-Type", isMP3 ? "audio/mpeg" : "video/mp4")

    // Extract the original filename from the path
    const originalFilename = path.basename(outputFile)

    // If the filename contains the original title, use it
    // Otherwise, create a generic filename
    let filename = originalFilename
    if (filename.startsWith(taskId)) {
      // This is a temporary filename, create a better one
      const ext = isMP3 ? "mp3" : "mp4"
      filename = `youtube-download-${taskId}.${ext}`
    }

    headers.set("Content-Disposition", `attachment; filename="${filename}"`)
    headers.set("Content-Length", fileBuffer.length.toString())

    // Add cache control headers to prevent caching issues
    headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
    headers.set("Pragma", "no-cache")
    headers.set("Expires", "0")

    // Log the headers we're sending
    console.log("Sending file with headers:", {
      contentType: headers.get("Content-Type"),
      contentDisposition: headers.get("Content-Disposition"),
      contentLength: headers.get("Content-Length"),
      fileSize: fileBuffer.length,
    })

    // Schedule file deletion after a delay
    setTimeout(() => {
      try {
        if (fs.existsSync(outputFile)) {
          fs.unlinkSync(outputFile)
          console.log(`Temporary file deleted: ${outputFile}`)
        }
      } catch (err) {
        console.error(`Error deleting temporary file: ${outputFile}`, err)
      }
    }, 300000) // 5 minute delay

    return new NextResponse(fileBuffer, { headers })
  } catch (error) {
    console.error("Error serving download:", error)
    return NextResponse.json(
      {
        error: "Failed to serve download",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
