import os from "os"
import path from "path"
import fs from "fs"

const isProd = process.env.NODE_ENV === "production"
const BIN_DIR = "/app/bin"

// Validate binary presence with proper type annotation and error suppression
const binaries: string[] = ["yt-dlp", "ffmpeg", "ffprobe"]
for (const binary of binaries) {
  const binPath = path.join(BIN_DIR, binary)
  if (!fs.existsSync(binPath)) {
    console.warn(`⚠️  ${binary} not found at ${binPath} — make sure it's bundled correctly.`)
  }
}

export const config = {
  ytdl: {
    ytDlpPath: isProd ? path.join(BIN_DIR, "yt-dlp") : process.env.YT_DLP_PATH ?? "yt-dlp",
    ffmpegPath: isProd ? path.join(BIN_DIR, "ffmpeg") : process.env.FFMPEG_PATH ?? "ffmpeg",
    ffprobePath: isProd ? path.join(BIN_DIR, "ffprobe") : process.env.FFPROBE_PATH ?? "ffprobe",
    maxConcurrentDownloads: 5,
    tempDir: path.join(os.tmpdir(), "youtube-downloader", "temp"),
    cleanupInterval: 5 * 60 * 1000,
    maxFileAge: 10 * 60 * 1000,
  },
  redis: {
    enabled: Boolean(process.env.REDIS_URL),
    url: process.env.REDIS_URL,
    host: process.env.REDIS_HOST ?? "localhost",
    port: parseInt(process.env.REDIS_PORT ?? "6379", 10),
  },
}
