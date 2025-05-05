import { NextResponse } from "next/server"
import { initializeSchema } from "@/lib/schema"
import { startWorker } from "@/lib/worker"

// Flag to track if the worker has been started
let workerStarted = false
let schemaInitialized = false

export async function GET() {
  try {
    // Initialize schema if not already done
    if (!schemaInitialized) {
      try {
        await initializeSchema()
        schemaInitialized = true
        console.log("Schema initialized successfully")
      } catch (error) {
        console.error("Error initializing schema:", error)
      }
    }

    // Start the worker if not already started
    if (!workerStarted) {
      try {
        startWorker()
        workerStarted = true
        console.log("Worker started successfully")
      } catch (error) {
        console.error("Error starting worker:", error)
      }
    }

    return NextResponse.json({
      status: "success",
      message: "Server initialized successfully",
      schemaInitialized,
      workerStarted,
    })
  } catch (error) {
    console.error("Error initializing server:", error)

    return NextResponse.json(
      {
        status: "error",
        message: "Error initializing server",
      },
      {
        status: 500,
      },
    )
  }
}
