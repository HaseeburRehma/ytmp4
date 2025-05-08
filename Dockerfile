# Use Node 18 on Alpine
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install bash, curl, and PNPM
RUN apk add --no-cache bash curl && npm install -g pnpm@10.10.0

# Copy only dependency files for caching
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --no-frozen-lockfile --ignore-scripts

# Rebuild packages that need postinstall (ffmpeg, yt-dlp)
RUN pnpm rebuild ffmpeg-static yt-dlp-exec

# Copy the rest of the app
COPY . .

# Manually download yt-dlp + ffmpeg + ffprobe (in case they aren't in node_modules)
RUN mkdir -p bin && \
    curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o bin/yt-dlp && \
    curl -L https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz -o ffmpeg.tar.xz && \
    tar -xf ffmpeg.tar.xz && \
    cp ffmpeg-*-static/ffmpeg bin/ffmpeg && \
    cp ffmpeg-*-static/ffprobe bin/ffprobe && \
    chmod +x bin/* && \
    rm -rf ffmpeg.tar.xz ffmpeg-*-static

# Run custom build script (uses bash)
RUN bash ./vercel-build.sh && pnpm build

# Set the default command
CMD ["pnpm", "start"]
