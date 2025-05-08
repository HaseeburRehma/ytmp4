FROM node:18-alpine

WORKDIR /app

# Install PNPM and bash
RUN npm install -g pnpm@10.10.0 && apk add --no-cache bash

# Copy dependencies first (for cache)
COPY package.json pnpm-lock.yaml* ./

# Install dependencies (skip frozen to avoid lockfile mismatch errors)
RUN pnpm install --no-frozen-lockfile --ignore-scripts

# Rebuild modules that need postinstall (like ffmpeg-static)
RUN pnpm rebuild ffmpeg-static yt-dlp-exec

# Copy full source
COPY . .

# Ensure binaries are executable
RUN chmod +x bin/* || true

# Build Next.js app directly (remove vercel-build.sh reference)
RUN pnpm build

# Start app
CMD ["pnpm", "start"]
