"use client"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Music, Video } from "lucide-react"

interface DownloadOptionsProps {
  type: "audio" | "video"
  onDownload: (format: string) => void
}

export function DownloadOptions({ type, onDownload }: DownloadOptionsProps) {
  const audioFormats = [
    { id: "mp3_320", name: "MP3 320kbps", quality: "High Quality", icon: Music, description: "Best audio quality" },
    {
      id: "mp3_256",
      name: "MP3 256kbps",
      quality: "Medium Quality",
      icon: Music,
      description: "Good balance of quality and size",
    },
    { id: "mp3_128", name: "MP3 128kbps", quality: "Standard Quality", icon: Music, description: "Smaller file size" },
  ]

  const videoFormats = [
    {
      id: "mp4_best",
      name: "MP4 Best Quality",
      quality: "Best Available",
      icon: Video,
      description: "Highest resolution available",
    },
    { id: "mp4_1024", name: "MP4 1080p", quality: "Full HD", icon: Video, description: "1920×1080 resolution" },
    { id: "mp4_720", name: "MP4 720p", quality: "HD", icon: Video, description: "1280×720 resolution" },
  ]

  const formats = type === "audio" ? audioFormats : videoFormats

  return (
    <Table className="border-gray-700">
      <TableHeader>
        <TableRow className="border-gray-700">
          <TableHead className="text-gray-300">Format</TableHead>
          <TableHead className="text-gray-300">Quality</TableHead>
          <TableHead className="hidden md:table-cell text-gray-300">Description</TableHead>
          <TableHead className="text-right text-gray-300">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {formats.map((format) => (
          <TableRow key={format.id} className="border-gray-700">
            <TableCell className="font-medium text-white">
              <div className="flex items-center gap-2">
                <format.icon className="h-4 w-4 text-gray-400" />
                <span>{format.name}</span>
              </div>
            </TableCell>
            <TableCell className="text-white">{format.quality}</TableCell>
            <TableCell className="hidden md:table-cell text-gray-400">{format.description}</TableCell>
            <TableCell className="text-right">
              <Button
                size="sm"
                onClick={() => onDownload(format.id)}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
