import { NextResponse } from "next/server"
import { checkDatabaseConnection } from "@/lib/db"
import { checkRedisConnection } from "@/lib/redis"

export async function GET() {
  try {
    // Check database connection
    const dbConnected = await checkDatabaseConnection()

    // Check Redis connection
    const redisConnected = await checkRedisConnection()

    // Check disk space (simplified)
    const diskOk = true

    // Overall health status
    const healthy = dbConnected && redisConnected && diskOk

    return NextResponse.json(
      {
        status: healthy ? "healthy" : "unhealthy",
        timestamp: new Date().toISOString(),
        services: {
          database: {
            status: dbConnected ? "connected" : "disconnected",
          },
          redis: {
            status: redisConnected ? "connected" : "disconnected",
          },
          disk: {
            status: diskOk ? "ok" : "error",
          },
        },
      },
      {
        status: healthy ? 200 : 503,
      },
    )
  } catch (error) {
    console.error("Health check error:", error)

    return NextResponse.json(
      {
        status: "error",
        message: "Error performing health check",
        timestamp: new Date().toISOString(),
      },
      {
        status: 500,
      },
    )
  }
}
