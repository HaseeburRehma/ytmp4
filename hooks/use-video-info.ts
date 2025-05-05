"use client"

import { useState } from "react"
import type { VideoInfoType } from "@/types"
import { useToast } from "@/components/ui/use-toast"

export function useVideoInfo() {
  const [videoInfo, setVideoInfo] = useState<VideoInfoType | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchVideoInfo = async (url: string) => {
    setIsLoading(true)
    setError(null)

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
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred"
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return {
    videoInfo,
    isLoading,
    error,
    fetchVideoInfo,
  }
}
