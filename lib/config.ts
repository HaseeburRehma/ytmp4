import path from "path"
import os from "os"
import { existsSync } from "fs"

const isWindows = process.platform === "win32"
const isProd = process.env.NODE_ENV === "production"

const resolveBinary = (name: string) => {
  const localPath = path.resolve(__dirname, "../bin", isWindows ? `${name}.exe` : name)
  const fallback = name // fallback to system path if not found locally
  return existsSync(localPath) ? localPath : fallback
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
