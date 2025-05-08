# Use Alpine + Node
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install PNPM globally
RUN npm install -g pnpm@8.6.0

# Copy only dependency files first (for cache optimization)
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile --ignore-scripts

# Manually allow required postinstall scripts
RUN pnpm rebuild ffmpeg-static yt-dlp-exec

# Copy the rest of the code
COPY . .

# Make binaries executable if they exist (for Linux)
RUN chmod +x bin/yt-dlp bin/ffmpeg bin/ffprobe || true

# Build app if needed
RUN pnpm build

# Run app
# Build app if needed

CMD ["pnpm", "start"]
