import fs from "fs"
import path from "path"
import os from "os"

export function ensureDirectories() {
  // Define directories
  const tempDir = process.env.TEMP_DIR || path.join(os.tmpdir(), "youtube-downloader", "temp")
  const outputDir = path.join(process.cwd(), "public/downloads")

  // Create directories if they don't exist
  try {
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }
  } catch (error) {
    console.error("Error creating directories:", error)
  }

  return { tempDir, outputDir }
}
