import { YoutubeDownloader } from "@/components/youtube-downloader"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto p-4 md:p-8 max-w-6xl">
        <div className="space-y-8">
          <div className="text-center py-8">
            <h1 className="text-4xl font-bold tracking-tight mb-2 text-red-500">YouTube Downloader</h1>
            <p className="text-gray-300">Download YouTube videos in MP3 and MP4 formats directly to your device</p>
          </div>

          <Card className="border border-gray-700 bg-gray-800 text-white shadow-xl">
            <CardHeader className="border-b border-gray-700">
              <CardTitle className="text-red-500">YouTube Downloader</CardTitle>
              <CardDescription className="text-gray-300">
                Enter a YouTube URL to download videos in MP3 or MP4 format
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <YoutubeDownloader />
            </CardContent>
          </Card>

          <div className="text-center text-sm text-gray-400 mt-8">
            <p>
              This tool allows you to download YouTube videos directly to your device without storing them on our
              server.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
