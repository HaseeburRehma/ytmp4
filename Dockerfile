# Use Node.js Alpine base
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install required tools
RUN apk add --no-cache curl xz

# Create binary directory
RUN mkdir -p /app/bin

# Download yt-dlp
RUN curl -L "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux" -o /app/bin/yt-dlp \
  && chmod +x /app/bin/yt-dlp

# Download and extract FFmpeg static build
RUN curl -L "https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz" -o /tmp/ffmpeg.tar.xz \
  && mkdir -p /tmp/ffmpeg \
  && tar -xJf /tmp/ffmpeg.tar.xz -C /tmp/ffmpeg \
  && cp /tmp/ffmpeg/ffmpeg-*/ffmpeg /app/bin/ \
  && cp /tmp/ffmpeg/ffmpeg-*/ffprobe /app/bin/ \
  && chmod +x /app/bin/ffmpeg /app/bin/ffprobe \
  && rm -rf /tmp/ffmpeg /tmp/ffmpeg.tar.xz

# Make sure binaries are in PATH
ENV PATH="/app/bin:$PATH"

# Set NODE_ENV
ENV NODE_ENV=production

# Set up environment variables (if needed)
# ENV DATABASE_URL=your_db_url
# ENV REDIS_URL=your_redis_url

# Install PNPM globally
RUN npm install -g pnpm@10.10.0

# Copy dependency files first
COPY package.json pnpm-lock.yaml* ./

# Install deps (ignore scripts to skip postinstall)
RUN pnpm install --no-frozen-lockfile --ignore-scripts

# Copy the rest of the app
COPY . .

# Build app
RUN pnpm build

# Start app
CMD ["pnpm", "start"]
