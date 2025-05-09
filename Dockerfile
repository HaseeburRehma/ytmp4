# --------------------------
# Stage 1: Build & Install
# --------------------------
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
ENV DATABASE_URL=postgresql://neondb_owner:npg_j3Fftup2RJIA@ep-broad-dream-a4jw9cwh-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require

# Install tools
RUN apk add --no-cache curl xz

# Install PNPM
RUN npm install -g pnpm@10.10.0

# Copy dependency files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --no-frozen-lockfile --ignore-scripts

# Copy full app
COPY . .

# Build the app
RUN pnpm build


# --------------------------
# Stage 2: Production Runtime
# --------------------------
FROM node:18-alpine

WORKDIR /app

# Install required tools
RUN apk add --no-cache curl xz

# Download yt-dlp binary
RUN mkdir -p /app/bin && \
  curl -L "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux" -o /app/bin/yt-dlp && \
  chmod +x /app/bin/yt-dlp

# Download and extract FFmpeg static binaries
RUN curl -L "https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz" -o /tmp/ffmpeg.tar.xz && \
  mkdir -p /tmp/ffmpeg && \
  tar -xJf /tmp/ffmpeg.tar.xz -C /tmp/ffmpeg && \
  cp /tmp/ffmpeg/ffmpeg-*/ffmpeg /app/bin/ && \
  cp /tmp/ffmpeg/ffmpeg-*/ffprobe /app/bin/ && \
  chmod +x /app/bin/ffmpeg /app/bin/ffprobe && \
  rm -rf /tmp/ffmpeg /tmp/ffmpeg.tar.xz

  # Install PNPM again in the final image
RUN npm install -g pnpm@10.10.0

# Add binaries to PATH
ENV PATH="/app/bin:$PATH"

# Set environment variables
ENV NODE_ENV=production

# Copy built app from builder
COPY --from=builder /app /app

# Start the app
CMD ["pnpm", "start"]
