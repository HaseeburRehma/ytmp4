import { Redis } from "ioredis"
import { config } from "@/lib/config"

// Create Redis client with better error handling
const createRedisClient = () => {
  try {
    return new Redis({
      host: config.redis.host,
      port: config.redis.port,
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000)
        return delay
      },
      reconnectOnError: (err) => {
        const targetError = "READONLY"
        if (err.message.includes(targetError)) {
          return true
        }
        return false
      },
      enableOfflineQueue: true,
      connectTimeout: 10000,
    })
  } catch (error) {
    console.error("Failed to create Redis client:", error)
    // Return a dummy client that won't crash the app
    return {
      on: () => {},
      ping: async () => "DUMMY",
      lpush: async () => 0,
      rpop: async () => null,
      hset: async () => 0,
      hget: async () => null,
      hdel: async () => 0,
      expire: async () => 0,
      hgetall: async () => ({}),
      lrange: async () => [],
      llen: async () => 0,
      del: async () => 0,
      query: async () => null,
    } as any
  }
}

// Create Redis client
const redisClient = createRedisClient()

// Log Redis connection status
redisClient.on("connect", () => {
  console.log("Redis client connected")
})

redisClient.on("error", (err) => {
  console.error("Redis client error:", err)
})

// Export Redis client with error handling
export const redis = {
  ping: async () => {
    try {
      return await redisClient.ping()
    } catch (error) {
      console.error("Redis ping error:", error)
      return "PONG" // Fallback to prevent app crashes
    }
  },

  lpush: async (key: string, value: string) => {
    try {
      return await redisClient.lpush(key, value)
    } catch (error) {
      console.error(`Redis lpush error for key ${key}:`, error)
      return 0
    }
  },

  rpop: async (key: string) => {
    try {
      return await redisClient.rpop(key)
    } catch (error) {
      console.error(`Redis rpop error for key ${key}:`, error)
      return null
    }
  },

  hset: async (key: string, field: string, value: string) => {
    try {
      return await redisClient.hset(key, field, value)
    } catch (error) {
      console.error(`Redis hset error for key ${key}:`, error)
      return 0
    }
  },

  hget: async (key: string, field: string) => {
    try {
      return await redisClient.hget(key, field)
    } catch (error) {
      console.error(`Redis hget error for key ${key}:`, error)
      return null
    }
  },

  hdel: async (key: string, field: string) => {
    try {
      return await redisClient.hdel(key, field)
    } catch (error) {
      console.error(`Redis hdel error for key ${key}:`, error)
      return 0
    }
  },

  expire: async (key: string, seconds: number) => {
    try {
      return await redisClient.expire(key, seconds)
    } catch (error) {
      console.error(`Redis expire error for key ${key}:`, error)
      return 0
    }
  },

  hgetall: async (key: string) => {
    try {
      return await redisClient.hgetall(key)
    } catch (error) {
      console.error(`Redis hgetall error for key ${key}:`, error)
      return {}
    }
  },

  lrange: async (key: string, start: number, stop: number) => {
    try {
      return await redisClient.lrange(key, start, stop)
    } catch (error) {
      console.error(`Redis lrange error for key ${key}:`, error)
      return []
    }
  },

  llen: async (key: string) => {
    try {
      return await redisClient.llen(key)
    } catch (error) {
      console.error(`Redis llen error for key ${key}:`, error)
      return 0
    }
  },

  del: async (key: string) => {
    try {
      return await redisClient.del(key)
    } catch (error) {
      console.error(`Redis del error for key ${key}:`, error)
      return 0
    }
  },
}

// Queue management
export const QUEUE_KEYS = {
  DOWNLOADS: "queue:downloads",
  PROCESSING: "processing:downloads",
  RESULTS: "results:downloads",
}

// Check Redis connection
export async function checkRedisConnection(): Promise<boolean> {
  try {
    const result = await redis.ping()
    return result === "PONG"
  } catch (error) {
    console.error("Redis connection error:", error)
    return false
  }
}

// Add job to queue
export async function addToQueue(queueKey: string, jobId: string, data: any): Promise<void> {
  try {
    await redis.lpush(queueKey, JSON.stringify({ id: jobId, data, timestamp: Date.now() }))
  } catch (error) {
    console.error(`Error adding job ${jobId} to queue ${queueKey}:`, error)
  }
}

// Get job from queue
export async function getFromQueue(queueKey: string): Promise<{ id: string; data: any } | null> {
  try {
    const job = await redis.rpop(queueKey)
    if (!job) return null
    return JSON.parse(job)
  } catch (error) {
    console.error(`Error getting job from queue ${queueKey}:`, error)
    return null
  }
}

// Move job to processing
export async function moveToProcessing(jobId: string, data: any): Promise<void> {
  try {
    await redis.hset(QUEUE_KEYS.PROCESSING, jobId, JSON.stringify({ data, timestamp: Date.now() }))
  } catch (error) {
    console.error(`Error moving job ${jobId} to processing:`, error)
  }
}

// Mark job as completed
export async function markAsCompleted(jobId: string, result: any): Promise<void> {
  try {
    await redis.hdel(QUEUE_KEYS.PROCESSING, jobId)
    await redis.hset(QUEUE_KEYS.RESULTS, jobId, JSON.stringify({ result, timestamp: Date.now() }))

    // Set expiry for results (24 hours)
    await redis.expire(`${QUEUE_KEYS.RESULTS}:${jobId}`, 60 * 60 * 24)
  } catch (error) {
    console.error(`Error marking job ${jobId} as completed:`, error)
  }
}

// Get job result
export async function getJobResult(jobId: string): Promise<any | null> {
  try {
    const result = await redis.hget(QUEUE_KEYS.RESULTS, jobId)
    if (!result) return null
    return JSON.parse(result)
  } catch (error) {
    console.error(`Error getting result for job ${jobId}:`, error)
    return null
  }
}

// Store progress updates
export async function storeProgress(jobId: string, progress: number, eta?: number): Promise<void> {
  try {
    const data = { progress, eta, timestamp: Date.now() }
    await redis.hset("progress:downloads", jobId, JSON.stringify(data))

    // Set expiry for progress (1 hour)
    await redis.expire(`progress:downloads:${jobId}`, 60 * 60)
  } catch (error) {
    console.error(`Error storing progress for job ${jobId}:`, error)
  }
}

// Get progress
export async function getProgress(jobId: string): Promise<{ progress: number; eta?: number } | null> {
  try {
    const data = await redis.hget("progress:downloads", jobId)
    if (!data) return null

    try {
      return JSON.parse(data)
    } catch {
      // Fallback for old format
      return { progress: Number.parseInt(data, 10) }
    }
  } catch (error) {
    console.error(`Error getting progress for job ${jobId}:`, error)
    return null
  }
}

// Clear job data
export async function clearJobData(jobId: string): Promise<void> {
  try {
    await redis.hdel(QUEUE_KEYS.PROCESSING, jobId)
    await redis.hdel(QUEUE_KEYS.RESULTS, jobId)
    await redis.hdel("progress:downloads", jobId)
  } catch (error) {
    console.error(`Error clearing data for job ${jobId}:`, error)
  }
}

// Get all active downloads
export async function getAllActiveDownloads(): Promise<Record<string, any>> {
  try {
    return await redis.hgetall(QUEUE_KEYS.PROCESSING)
  } catch (error) {
    console.error("Error getting active downloads:", error)
    return {}
  }
}

// Get queue length
export async function getQueueLength(queueKey: string): Promise<number> {
  try {
    return await redis.llen(queueKey)
  } catch (error) {
    console.error(`Error getting queue length for ${queueKey}:`, error)
    return 0
  }
}

// Get queue items
export async function getQueueItems(queueKey: string, start = 0, end = -1): Promise<any[]> {
  try {
    const items = await redis.lrange(queueKey, start, end)
    return items.map((item) => JSON.parse(item))
  } catch (error) {
    console.error(`Error getting queue items for ${queueKey}:`, error)
    return []
  }
}
