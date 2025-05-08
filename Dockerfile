# Use Alpine + Node
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install PNPM globally (match your local version)
RUN npm install -g pnpm@10.10.0

# Copy only dependency files first (for caching)
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
# Use --no-frozen-lockfile to avoid mismatch errors
RUN pnpm install --no-frozen-lockfile --ignore-scripts

# Rebuild required postinstall packages
RUN pnpm rebuild ffmpeg-static yt-dlp-exec

# Copy the rest of the app code
COPY . .

# Ensure binaries are executable
RUN chmod +x bin/yt-dlp bin/ffmpeg bin/ffprobe || true

# Build app
RUN pnpm build

# Start app
CMD ["pnpm", "start"]
