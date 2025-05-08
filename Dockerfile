# ... (earlier stages like build omitted for brevity)

FROM node:18-alpine AS runner
WORKDIR /app

# (Optional) Copy built application from builder stage:
# COPY --from=builder /app/dist ./dist
# COPY --from=builder /app/node_modules ./node_modules
# COPY --from=builder /app/package.json ./package.json

# Install tools for downloading and extracting
RUN apk add --no-cache curl xz

# Download yt-dlp, ffmpeg, and ffprobe static binaries and set them up
RUN mkdir -p /app/bin \
 && echo "Downloading yt-dlp..." \
 && curl -L "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux" -o /app/bin/yt-dlp \
 && echo "Downloading FFmpeg static build..." \
 && curl -L "https://johnvansickle.com/ffmpeg/builds/ffmpeg-release-amd64-static.tar.xz" -o /tmp/ffmpeg.tar.xz \
 && echo "Extracting FFmpeg and FFprobe..." \
 && tar -xJf /tmp/ffmpeg.tar.xz -C /app/bin --strip-components=1 "ffmpeg-*-amd64-static/ffmpeg" "ffmpeg-*-amd64-static/ffprobe" \
 && rm /tmp/ffmpeg.tar.xz \
 && chmod +x /app/bin/ffmpeg /app/bin/ffprobe /app/bin/yt-dlp

# (Important) Add /app/bin to PATH so the binaries are found by the app
ENV PATH="/app/bin:${PATH}"

# (Optional) Set environment variables for fluent-ffmpeg to pick up binary locations
ENV FFMPEG_PATH="/app/bin/ffmpeg" \
    FFPROBE_PATH="/app/bin/ffprobe"

# ... (the rest of your Dockerfile, e.g. copying source if not done, and the CMD to run)
CMD ["node", "dist/index.js"]
