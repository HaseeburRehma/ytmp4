import path from "path"
import os from "os"

const isProd = process.env.NODE_ENV === "production"
const BIN_DIR = isProd ? "/app/bin" : path.resolve(__dirname, "../bin")

export const config = {
  ytdl: {
    ytDlpPath: path.join(BIN_DIR, process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp"),
    ffmpegPath: path.join(BIN_DIR, process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg"),
    ffprobePath: path.join(BIN_DIR, process.platform === "win32" ? "ffprobe.exe" : "ffprobe"),
    maxConcurrentDownloads: 5,
    tempDir: path.join(os.tmpdir(), "youtube-downloader", "temp"),
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
