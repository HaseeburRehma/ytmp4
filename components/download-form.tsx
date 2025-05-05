"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { ProgressModal } from "@/components/progress-modal"
import { useDownloadManager } from "@/hooks/use-download-manager"

export function DownloadForm() {
  const [url, setUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [videoInfo, setVideoInfo] = useState<any>(null)
  const { toast } = useToast()
  const {
    startDownload,
    cancelDownload,
    downloadProgress,
    estimatedTime,
    fileSize,
    format,
    downloadUrl,
    activeDownload,
    videoTitle,
    downloadStatus,
    handleDownloadNow,
  } = useDownloadManager()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/video/info", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch video info")
      }

      const data = await response.json()
      setVideoInfo(data)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch video info",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = async (format: string) => {
    try {
      await startDownload(url, format, videoInfo.title)
    } catch (error) {
      console.error("Download error:", error)
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className="flex gap-2 mb-8">
        <Input
          type="text"
          placeholder="https://www.youtube.com/watch?v=..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Loading..." : "Get Video Info"}
        </Button>
      </form>

      {videoInfo && (
        <div className="space-y-4">
          <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden relative">
            {videoInfo.thumbnail && (
              <img
                src={videoInfo.thumbnail || "/placeholder.svg"}
                alt={videoInfo.title}
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-center p-4">
                <h2 className="text-xl font-bold text-white mb-2">{videoInfo.title}</h2>
                <p className="text-gray-200">{videoInfo.duration}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button onClick={() => handleDownload("mp4")} className="bg-red-600 hover:bg-red-700 text-white">
              Download Video (MP4)
            </Button>
            <Button onClick={() => handleDownload("mp3")} className="bg-blue-600 hover:bg-blue-700 text-white">
              Download Audio (MP3)
            </Button>
          </div>
        </div>
      )}

      <ProgressModal
        isOpen={!!activeDownload}
        title={videoTitle}
        progress={downloadProgress}
        eta={estimatedTime}
        fileSize={fileSize}
        format={format}
        taskId={activeDownload}
        status={downloadStatus}
        onCancel={cancelDownload}
        onDownload={handleDownloadNow}
      />
    </div>
  )
}
