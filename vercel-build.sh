#!/bin/bash
set -e

echo "Starting Vercel build script..."

# Create bin directory in the project root
BIN_DIR="bin"
mkdir -p $BIN_DIR
echo "Created bin directory at $BIN_DIR"

# Run both Node scripts to install FFmpeg and yt-dlp
echo "Running FFmpeg and yt-dlp setup scripts..."
node scripts/download-ffmpeg.js
node scripts/install-yt-dlp.js   

# Create .env.production with the correct paths
echo "Creating environment variables file..."

# Database
DATABASE_URL=${DATABASE_URL}

# Redis configuration - disabled for Vercel
REDIS_KEY_PREFIX=ytdl:
ENABLE_WORKER=false
USE_QUEUE=false

# Server Configuration
BASE_URL=https://youtube-downloader-ashy-ten.vercel.app
ENABLE_CORS=false
NEXT_PUBLIC_APP_URL=https://youtube-downloader-ashy-ten.vercel.app

# Tool paths
YT_DLP_PATH=bin/yt-dlp
FFMPEG_PATH=bin/ffmpeg
FFPROBE_PATH=bin/ffprobe

# Socket.IO
NEXT_PUBLIC_SOCKET_URL=https://youtube-downloader-ashy-ten.vercel.app


echo "Environment variables set in .env.production"
echo "Build script completed successfully"
