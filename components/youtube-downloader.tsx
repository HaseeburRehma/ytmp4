"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { VideoInfo } from "@/components/video-info"
import { DownloadOptions } from "@/components/download-options"
import { ProgressModal } from "@/components/progress-modal"
import { useToast } from "@/components/ui/use-toast"
import { Search, Loader2 } from "lucide-react"
import { useVideoInfo } from "@/hooks/use-video-info"
import { useDownloadManager } from "@/hooks/use-download-manager"
import { getYoutubeVideoId } from "@/lib/utils"

export function YoutubeDownloader() {
  const [url, setUrl] = useState("")
  const [isValidUrl, setIsValidUrl] = useState(false)
  const { toast } = useToast()

  const { videoInfo, isLoading: isLoadingInfo, fetchVideoInfo } = useVideoInfo()
  const {
    activeDownload,
    startDownload,
    cancelDownload,
    downloadProgress,
    estimatedTime,
    fileSize,
    downloadUrl,
    format,
    videoTitle,
    handleDownloadNow,
    isAudioOnly,
    downloadStatus,
    modalVisible,
    closeModal,
  } = useDownloadManager()

  // Validate URL as user types
  useEffect(() => {
    setIsValidUrl(!!getYoutubeVideoId(url))
  }, [url])

  const handleFetchInfo = async () => {
    if (!isValidUrl) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid YouTube URL",
        variant: "destructive",
      })
      return
    }

    try {
      await fetchVideoInfo(url)
    } catch (error) {
      console.error("Error fetching video info:", error)
      toast({
        title: "Error",
        description: "Failed to fetch video information. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDownload = async (format: string) => {
    if (!videoInfo) {
      toast({
        title: "Error",
        description: "Please fetch video information first",
        variant: "destructive",
      })
      return
    }

    try {
      console.log("Starting download with format:", format)
      await startDownload(url, format, videoInfo.title || "")
    } catch (error) {
      console.error("Error starting download:", error)
      toast({
        title: "Error",
        description: "Failed to start download. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Input
            placeholder="Enter a YouTube URL to download videos in MP3 or MP4 format"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className={`pr-10 bg-gray-900 border-gray-700 text-white ${isValidUrl ? "border-green-500" : ""}`}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            {isValidUrl && <div className="h-2 w-2 rounded-full bg-green-500" />}
          </div>
        </div>
        <Button
          onClick={handleFetchInfo}
          disabled={isLoadingInfo || !isValidUrl}
          className="w-full md:w-auto bg-red-600 hover:bg-red-700 text-white"
        >
          {isLoadingInfo ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <Search className="h-4 w-4 mr-2" />
              Get Video Info
            </>
          )}
        </Button>
      </div>

      {videoInfo && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <VideoInfo videoInfo={videoInfo} />

          <div className="md:col-span-2">
            <Card className="border border-gray-700 bg-gray-800 text-white shadow-lg">
              <CardContent className="pt-6">
                <Tabs defaultValue="video">
                  <TabsList className="grid w-full grid-cols-2 mb-4 bg-gray-700">
                    <TabsTrigger
                      value="audio"
                      className="data-[state=active]:bg-red-600 data-[state=active]:text-white"
                    >
                      Audio (MP3)
                    </TabsTrigger>
                    <TabsTrigger
                      value="video"
                      className="data-[state=active]:bg-red-600 data-[state=active]:text-white"
                    >
                      Video (MP4)
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="audio" className="mt-4">
                    <DownloadOptions type="audio" onDownload={handleDownload} />
                  </TabsContent>
                  <TabsContent value="video" className="mt-4">
                    <DownloadOptions type="video" onDownload={handleDownload} />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Progress Modal */}
      <ProgressModal
        isOpen={modalVisible}
        title={videoTitle || videoInfo?.title || "Downloading..."}
        progress={downloadProgress}
        eta={estimatedTime}
        fileSize={fileSize}
        format={format}
        taskId={activeDownload !== "initializing" ? activeDownload : null}
        onCancel={cancelDownload}
        onDownload={handleDownloadNow}
        status={downloadStatus}
        isAudioOnly={isAudioOnly}
      />
    </div>
  )
}
