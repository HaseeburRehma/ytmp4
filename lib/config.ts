import path from "path"
import os from "os"
import { existsSync } from "fs"

const isWin = process.platform === "win32"
const isProd = process.env.NODE_ENV === "production"

// Helper to build paths correctly
function resolveBinary(name: string) {
  const binary = isWin ? `${name}.exe` : name
  const localPath = path.resolve(__dirname, "../bin", binary)
  return existsSync(localPath) ? localPath : binary
}

export const config = {
  ytdl: {
    ytDlpPath: isProd ? "/app/bin/yt-dlp" : resolveBinary("yt-dlp"),
    ffmpegPath: isProd ? "/app/bin/ffmpeg" : resolveBinary("ffmpeg"),
    ffprobePath: isProd ? "/app/bin/ffprobe" : resolveBinary("ffprobe"),
    maxConcurrentDownloads: 5,
    tempDir: path.join(os.tmpdir(), "youtube-downloader", "temp"),
    cleanupInterval: 5 * 60 * 1000,
    maxFileAge: 10 * 60 * 1000,
  },
  redis: {
    enabled: !!process.env.REDIS_URL,
    url: process.env.REDIS_URL,
    host: process.env.REDIS_HOST || "localhost",
    port: Number.parseInt(process.env.REDIS_PORT || "6379", 10),
  },
}
