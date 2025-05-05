import { createClient } from "redis"
import { config } from "./config"

// Create a dummy client for when Redis is disabled
const dummyClient = {
  connect: async () => console.log("Using dummy Redis client"),
  disconnect: async () => {},
  set: async () => "OK",
  get: async () => null,
  del: async () => 0,
  exists: async () => 0,
  expire: async () => true,
  publish: async () => 0,
  subscribe: async () => {},
  on: () => {},
  isReady: false,
}

// Create the real Redis client or use dummy client if disabled
export const createRedisClient = () => {
  // If Redis is disabled, return dummy client
  if (!config.redis.enabled) {
    console.log("Redis is disabled, using dummy client")
    return dummyClient
  }

  // Use Redis URL if available (Upstash), otherwise use host/port
  const url = config.redis.url
  const options = url
    ? { url }
    : {
        socket: {
          host: config.redis.host,
          port: config.redis.port,
        },
      }

  try {
    console.log(`Creating Redis client with ${url ? "URL" : "host/port"} configuration`)
    const client = createClient(options)

    // Add error handler
    client.on("error", (err) => {
      console.error("Redis client error:", err)
    })

    return client
  } catch (error) {
    console.error("Failed to create Redis client:", error)
    return dummyClient
  }
}

// Export a singleton instance
let redisClient: ReturnType<typeof createRedisClient> | null = null

export const getRedisClient = async () => {
  if (!redisClient) {
    redisClient = createRedisClient()

    // Only try to connect if it's a real client
    if (config.redis.enabled) {
      try {
        await redisClient.connect()
      } catch (error) {
        console.error("Failed to connect to Redis:", error)
        redisClient = dummyClient
      }
    }
  }

  return redisClient
}
