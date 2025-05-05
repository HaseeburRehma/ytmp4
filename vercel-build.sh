#!/bin/bash
# Install yt-dlp
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /tmp/yt-dlp
chmod a+rx /tmp/yt-dlp

# Install FFmpeg
apt-get update && apt-get install -y ffmpeg