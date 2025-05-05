"use client"

import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import { formatDuration } from "@/lib/utils"
import type { VideoInfoType } from "@/types"
import { Clock, User, Eye } from "lucide-react"

interface VideoInfoProps {
  videoInfo: VideoInfoType
}

export function VideoInfo({ videoInfo }: VideoInfoProps) {
  return (
    <Card className="overflow-hidden border border-gray-700 bg-gray-800 text-white shadow-lg">
      <div className="relative aspect-video w-full">
        {videoInfo.thumbnail ? (
          <Image
            src={videoInfo.thumbnail || "/placeholder.svg"}
            alt={videoInfo.title || "Video thumbnail"}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full bg-gray-700 flex items-center justify-center">No thumbnail</div>
        )}
      </div>
      <CardContent className="p-4 space-y-3">
        <h3 className="font-semibold text-lg line-clamp-2">{videoInfo.title || "Unknown title"}</h3>
        <div className="text-sm text-gray-300 space-y-2">
          {videoInfo.duration && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{formatDuration(videoInfo.duration)}</span>
            </div>
          )}

          {videoInfo.uploader && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{videoInfo.uploader}</span>
            </div>
          )}

          {videoInfo.view_count && (
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span>{videoInfo.view_count.toLocaleString()} views</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
