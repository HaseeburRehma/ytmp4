import path from "path"
import os from "os"
import fs from "fs"

const isWin = process.platform === "win32"
const isProd = process.env.NODE_ENV === "production"
const BIN_DIR = isProd ? "/app/bin" : path.resolve(__dirname, "../bin")

function resolveBinary(name: string): string {
  const bin = isWin ? `${name}.exe` : name
  const localPath = path.join(BIN_DIR, bin)
  return fs.existsSync(localPath) ? localPath : bin
}

export const config = {
  ytdl: {
    ytDlpPath: resolveBinary("yt-dlp"),
    ffmpegPath: resolveBinary("ffmpeg"),
    ffprobePath: resolveBinary("ffprobe"),
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
