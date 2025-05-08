#!/usr/bin/env bash
set -e  # exit on any error

# Create bin directory in project root
mkdir -p bin 
cd bin

echo "Downloading yt-dlp static binary..."
# Download latest yt-dlp standalone binary for Linux (x86_64)
curl -L "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux" -o yt-dlp

echo "Downloading FFmpeg static build (with FFprobe)..."
# Download latest FFmpeg static release (includes ffprobe)
curl -L "https://johnvansickle.com/ffmpeg/builds/ffmpeg-release-amd64-static.tar.xz" -o ffmpeg.tar.xz

echo "Extracting FFmpeg and FFprobe..."
tar -xJf ffmpeg.tar.xz --strip-components=1 -C . "ffmpeg-*-amd64-static/ffmpeg" "ffmpeg-*-amd64-static/ffprobe"

# Clean up the downloaded archive and temporary folder
rm -f ffmpeg.tar.xz
rm -rf ffmpeg-*-amd64-static

# Set execute permissions on all binaries
chmod +x yt-dlp ffmpeg ffprobe

cd ..
echo "yt-dlp, ffmpeg, and ffprobe have been downloaded to $(pwd)/bin and made executable."
