FROM node:18-alpine

WORKDIR /app

# Install PNPM and bash
RUN npm install -g pnpm@10.10.0 && apk add --no-cache bash


ENV DATABASE_URL=postgresql://neondb_owner:npg_j3Fftup2RJIA@ep-broad-dream-a4jw9cwh-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require

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
