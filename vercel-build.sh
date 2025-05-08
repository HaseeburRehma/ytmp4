#!/bin/bash
set -e

echo "Starting Vercel build script..."

# Set BIN_DIR to a known path within the build output (must be committed if needed at runtime)
BIN_DIR="./bin"
mkdir -p $BIN_DIR
echo "Created bin directory at $BIN_DIR"

# Download yt-dlp
echo "Downloading yt-dlp..."
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o $BIN_DIR/yt-dlp
chmod +x $BIN_DIR/yt-dlp
echo "yt-dlp installed at $BIN_DIR/yt-dlp"

# Download FFmpeg (Linux static build) and extract just the binaries
echo "Downloading FFmpeg..."
curl -L https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-i686-static.tar.xz -o ffmpeg.tar.xz
tar -xf ffmpeg.tar.xz
mv ffmpeg-*-static/ffmpeg $BIN_DIR/ffmpeg
mv ffmpeg-*-static/ffprobe $BIN_DIR/ffprobe
chmod +x $BIN_DIR/ffmpeg $BIN_DIR/ffprobe
rm -rf ffmpeg.tar.xz ffmpeg-*-static
echo "FFmpeg and FFprobe installed at $BIN_DIR"

echo "Build script completed successfully"
