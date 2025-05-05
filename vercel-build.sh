#!/bin/bash
set -e

echo "Starting Vercel build script..."

# Create bin directory in /tmp which is writable
BIN_DIR="/tmp/bin"
mkdir -p $BIN_DIR
echo "Created bin directory at $BIN_DIR"

# Install yt-dlp
echo "Downloading yt-dlp..."
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o $BIN_DIR/yt-dlp
chmod +x $BIN_DIR/yt-dlp
echo "yt-dlp installed at $BIN_DIR/yt-dlp"

# Verify yt-dlp works
$BIN_DIR/yt-dlp --version
echo "yt-dlp installation verified"

# Create .env.production with the correct paths
echo "Creating environment variables file..."
cat > .env.production << EOL
# Database
DATABASE_URL=${DATABASE_URL}

# Redis configuration - disable for Vercel
REDIS_KEY_PREFIX=ytdl:
ENABLE_WORKER=false
USE_QUEUE=false

# Server Configuration
BASE_URL=https://youtube-downloader-l3s9vvt4q.vercel.app
ENABLE_CORS=false
NEXT_PUBLIC_APP_URL=https://youtube-downloader-l3s9vvt4q.vercel.app

# Tool paths
YT_DLP_PATH=$BIN_DIR/yt-dlp
FFMPEG_PATH=ffmpeg
FFPROBE_PATH=ffprobe

# Socket.IO
NEXT_PUBLIC_SOCKET_URL=https://youtube-downloader-l3s9vvt4q.vercel.app
EOL

echo "Environment variables set in .env.production"
echo "Build script completed successfully"
