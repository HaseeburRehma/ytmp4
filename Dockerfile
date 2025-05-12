# Use Node.js Alpine base
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install required tools
RUN apk add --no-cache curl xz python3 ca-certificates

# Create binary directory
RUN mkdir -p /app/bin

ENV NODE_ENV=production

ENV DATABASE_URL=postgresql://neondb_owner:npg_j3Fftup2RJIA@ep-broad-dream-a4jw9cwh-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require

# Download yt-dlp
RUN curl -L "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp" -o /usr/local/bin/yt-dlp \
    && chmod +x /usr/local/bin/yt-dlp \
    && ln -s /usr/local/bin/yt-dlp /app/bin/yt-dlp

# Create a symlink for ytdlp (to handle both naming conventions)
RUN ln -s /usr/local/bin/yt-dlp /usr/local/bin/ytdlp

# Download and extract FFmpeg static build
RUN curl -L "https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz" -o /tmp/ffmpeg.tar.xz \
    && mkdir -p /tmp/ffmpeg \
    && tar -xJf /tmp/ffmpeg.tar.xz -C /tmp/ffmpeg \
    && cp /tmp/ffmpeg/ffmpeg-*/ffmpeg /usr/local/bin/ \
    && cp /tmp/ffmpeg/ffmpeg-*/ffprobe /usr/local/bin/ \
    && chmod +x /usr/local/bin/ffmpeg /usr/local/bin/ffprobe \
    && ln -s /usr/local/bin/ffmpeg /app/bin/ffmpeg \
    && ln -s /usr/local/bin/ffprobe /app/bin/ffprobe \
    && rm -rf /tmp/ffmpeg /tmp/ffmpeg.tar.xz

# Make sure binaries are in PATH
ENV PATH="/usr/local/bin:/app/bin:$PATH"

# Create temp directory
RUN mkdir -p /tmp/youtube-downloader/temp && chmod 777 /tmp/youtube-downloader/temp

# Install PNPM globally
RUN npm install -g pnpm@10.10.0

# Copy dependency files first
COPY package.json pnpm-lock.yaml* ./

# Install deps (ignore scripts to skip postinstall)
RUN pnpm install --no-frozen-lockfile --ignore-scripts

# Copy the rest of the app
COPY . .

# Verify binaries are accessible
RUN which yt-dlp && which ffmpeg && which ffprobe

# Build app
RUN pnpm build

# Start app
CMD ["pnpm", "start"]
