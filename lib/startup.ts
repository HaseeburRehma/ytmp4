import { worker } from "@/lib/worker"
import { config } from "@/lib/config"
import { checkRedisConnection } from "@/lib/redis"

// Initialize the application
export async function initializeApp() {
  console.log("Initializing application...")

  // Check Redis connection
  try {
    const redisConnected = await checkRedisConnection()
    if (redisConnected) {
      console.log("Redis connection successful")
    } else {
      console.error("Redis connection failed")
    }
  } catch (error) {
    console.error("Error checking Redis connection:", error)
  }

  // Start worker if enabled
  if (config.worker.enabled) {
    console.log("Starting worker...")
    worker.start()
  } else {
    console.log("Worker disabled")
  }

  console.log("Application initialized")
}

// Call this function in your app's entry point
// For Next.js, you can call it in a middleware or in a server component
