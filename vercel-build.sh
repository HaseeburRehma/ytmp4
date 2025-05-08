#!/bin/bash
set -e

echo "🔧 Starting Vercel build script..."

# Create bin folder
mkdir -p bin

# Download yt-dlp (no extension, Linux binary)
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o bin/yt-dlp

# Download and extract static FFmpeg (Linux 64-bit)
curl -L https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz -o ffmpeg.tar.xz
tar -xf ffmpeg.tar.xz

# Move binaries to ./bin
mv ffmpeg-*-static/ffmpeg bin/ffmpeg
mv ffmpeg-*-static/ffprobe bin/ffprobe

# Make all binaries executable
chmod +x bin/yt-dlp bin/ffmpeg bin/ffprobe

# Cleanup
rm -rf ffmpeg-*-static ffmpeg.tar.xz

echo "✅ yt-dlp, ffmpeg, ffprobe set up in ./bin"

# Create .env.production
cat > .env.production << EOL
DATABASE_URL=${DATABASE_URL}

REDIS_KEY_PREFIX=ytdl:
ENABLE_WORKER=false
USE_QUEUE=false

BASE_URL=https://youtube-downloader-ashy-ten.vercel.app
ENABLE_CORS=false
NEXT_PUBLIC_APP_URL=https://youtube-downloader-ashy-ten.vercel.app

# Create public/bin directory
mkdir -p public/bin

# Move the binaries there
mv ffmpeg-*-static/ffmpeg public/bin/ffmpeg
mv ffmpeg-*-static/ffprobe public/bin/ffprobe
mv bin/yt-dlp public/bin/yt-dlp

# Make them executable
chmod +x public/bin/ffmpeg public/bin/ffprobe public/bin/yt-dlp


NEXT_PUBLIC_SOCKET_URL=https://youtube-downloader-ashy-ten.vercel.app
EOL
export YT_DLP_PATH=bin/yt-dlp

echo "📦 .env.production created successfully."
