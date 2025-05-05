"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download, RefreshCw } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface DownloadRecord {
  id: number
  video_title: string
  format: string
  status: string
  progress: number
  started_at: string
  completed_at: string | null
  download_path: string | null
  file_size: number | null
}

export function DownloadHistory() {
  const [downloads, setDownloads] = useState<DownloadRecord[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDownloads = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/downloads/history")
      if (response.ok) {
        const data = await response.json()
        setDownloads(data)
      }
    } catch (error) {
      console.error("Error fetching download history:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDownloads()
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="success">Completed</Badge>
      case "processing":
        return <Badge variant="secondary">Processing</Badge>
      case "pending":
        return <Badge variant="outline">Pending</Badge>
      case "failed":
        return <Badge variant="destructive">Failed</Badge>
      case "cancelled":
        return <Badge variant="default">Cancelled</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "N/A"
    const units = ["B", "KB", "MB", "GB"]
    let size = bytes
    let unitIndex = 0
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    return `${size.toFixed(2)} ${units[unitIndex]}`
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Downloads</CardTitle>
        <Button variant="outline" size="sm" onClick={fetchDownloads} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-4">Loading...</div>
        ) : downloads.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">No download history found</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Video Title</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Started</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {downloads.map((download) => (
                <TableRow key={download.id}>
                  <TableCell className="font-medium">{download.video_title}</TableCell>
                  <TableCell>{download.format}</TableCell>
                  <TableCell>{getStatusBadge(download.status)}</TableCell>
                  <TableCell>{formatFileSize(download.file_size)}</TableCell>
                  <TableCell>
                    {download.started_at
                      ? formatDistanceToNow(new Date(download.started_at), { addSuffix: true })
                      : "N/A"}
                  </TableCell>
                  <TableCell className="text-right">
                    {download.status === "completed" && download.download_path && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={download.download_path} download>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </a>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
