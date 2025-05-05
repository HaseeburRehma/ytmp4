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
YT_DLP_PATH=$BIN_DIR/yt-dlp
FFMPEG_PATH=ffmpeg
FFPROBE_PATH=ffprobe
EOL

echo "Environment variables set in .env.production"
echo "Build script completed successfully"
