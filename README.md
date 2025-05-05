# YouTube Downloader

A modern YouTube downloader application built with Next.js, Redis, and PostgreSQL.

## Features

- Download YouTube videos in MP3 and MP4 formats
- Real-time progress tracking with WebSockets
- Queue management with Redis
- Download history tracking with PostgreSQL
- Responsive UI with dark mode support
- Dashboard with download statistics

## Prerequisites

- Node.js 18+ and npm
- Docker Desktop (for Redis)
- PostgreSQL database (Neon or other provider)

## Setup

1. Clone the repository:

\`\`\`bash
git clone https://github.com/yourusername/youtube-downloader.git
cd youtube-downloader
\`\`\`

2. Install dependencies:

\`\`\`bash
npm install
\`\`\`

3. Start Redis using Docker:

\`\`\`bash
docker-compose up -d
\`\`\`

4. Create a `.env.local` file with the following variables:

\`\`\`
# Database
DATABASE_URL=postgresql://neondb_owner:password@your-neon-db-url/neondb?sslmode=require

# Redis (Docker)
REDIS_URL=redis://localhost:6379

# App settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
\`\`\`

5. Run the development server:

\`\`\`bash
npm run dev
\`\`\`

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Docker Setup

To run the entire application in Docker:

1. Build the Docker image:

\`\`\`bash
docker build -t youtube-downloader .
\`\`\`

2. Run the container:

\`\`\`bash
docker run -p 3000:3000 --env-file .env.local youtube-downloader
\`\`\`

## License

MIT
