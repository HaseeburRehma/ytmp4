// Configuration for the application
import os from "os"
import path from "path"


export const config = {
  // YouTube downloader configuration
  ytdl: {
    // Path to yt-dlp executable
    ytDlpPath: process.env.YT_DLP_PATH || "yt-dlp",
    // Path to ffmpeg executable
    ffmpegPath: process.env.FFMPEG_PATH,
    // Path to ffprobe executable
    ffprobePath: process.env.FFPROBE_PATH,
    // Maximum concurrent downloads
    maxConcurrentDownloads: 5,
    // Use system temp directory for temporary files
    tempDir: path.join(os.tmpdir(), "youtube-downloader", "temp"),
    // Cleanup interval in milliseconds (5 minutes)
    cleanupInterval: 300000,
    // Maximum file age in milliseconds (10 minutes)
    maxFileAge: 600000,
  },
  // Redis configuration
  redis: {
    // Redis host
    host: process.env.REDIS_HOST || "localhost",
    // Redis port
    port: Number.parseInt(process.env.REDIS_PORT || "6379", 10),
  },
}
