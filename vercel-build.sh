#!/bin/sh
set -e

echo "🔧 Starting Vercel build script..."

# Create bin directory
mkdir -p bin

# Download yt-dlp (Linux binary, no extension)
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o bin/yt-dlp

# Download and extract FFmpeg static build
curl -L https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz -o ffmpeg.tar.xz
tar -xf ffmpeg.tar.xz

# Move binaries to ./bin
mv ffmpeg-*-static/ffmpeg bin/ffmpeg
mv ffmpeg-*-static/ffprobe bin/ffprobe

# Make binaries executable
chmod +x bin/yt-dlp bin/ffmpeg bin/ffprobe

# Cleanup
rm -rf ffmpeg-*-static ffmpeg.tar.xz

# Create .env.production file
cat > .env.production << EOL
YT_DLP_PATH=bin/yt-dlp
FFMPEG_PATH=bin/ffmpeg
FFPROBE_PATH=bin/ffprobe
REDIS_KEY_PREFIX=ytdl:
ENABLE_WORKER=false
USE_QUEUE=false
DATABASE_URL=${DATABASE_URL}
BASE_URL=https://youtube-downloader-ashy-ten.vercel.app
ENABLE_CORS=false
NEXT_PUBLIC_APP_URL=https://youtube-downloader-ashy-ten.vercel.app
NEXT_PUBLIC_SOCKET_URL=https://youtube-downloader-ashy-ten.vercel.app
EOL

echo "✅ Binaries installed and .env.production created."
