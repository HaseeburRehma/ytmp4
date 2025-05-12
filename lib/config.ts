import * as os from "os"
import * as path from "path"
import * as fs from "fs"

const isWin = process.platform === "win32"
const isProd = process.env.NODE_ENV === "production"
const BIN_DIR = path.join(process.cwd(), "bin")

// Update the resolveBinary function to handle both development and production environments better
function resolveBinary(name: string): string {
  const bin = isWin ? `${name}.exe` : name
  const localPath = path.join(BIN_DIR, bin)

  // Check if the binary exists at the specified path
  if (fs.existsSync(localPath)) {
    console.log(`Found binary at: ${localPath}`)
    return localPath
  }

  // In production, also check in PATH
  if (isProd) {
    // Try to find in standard locations
    const standardPaths = [`/usr/bin/${bin}`, `/usr/local/bin/${bin}`, `/app/bin/${bin}`, `/bin/${bin}`]

    for (const stdPath of standardPaths) {
      if (fs.existsSync(stdPath)) {
        console.log(`Found binary at standard path: ${stdPath}`)
        return stdPath
      }
    }
  }

  // Log that we're falling back to just the binary name
  console.log(`Binary not found at expected paths, falling back to: ${bin}`)
  return bin
}

// Add a function to ensure temp directory exists
function ensureTempDirExists() {
  const tempDir = path.join(os.tmpdir(), "youtube-downloader", "temp")
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true })
    console.log(`Created temp directory: ${tempDir}`)
  }
  return tempDir
}

export const config = {
  ytdl: {
    ytDlpPath: resolveBinary("yt-dlp"),
    ffmpegPath: resolveBinary("ffmpeg"),
    ffprobePath: resolveBinary("ffprobe"),
    maxConcurrentDownloads: 5,
    tempDir: ensureTempDirExists(),
    cleanupInterval: 300000,
    maxFileAge: 600000,
  },
  redis: {
    enabled: !!process.env.REDIS_URL,
    url: process.env.REDIS_URL,
    host: process.env.REDIS_HOST || "localhost",
    port: Number.parseInt(process.env.REDIS_PORT || "6379", 10),
  },
}
