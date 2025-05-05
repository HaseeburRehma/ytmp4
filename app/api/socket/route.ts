import type { NextRequest } from "next/server"
import { Server as SocketIOServer } from "socket.io"
import type { Server as NetServer } from "http"

export function GET(req: NextRequest) {
  if (!req.nextUrl.pathname.startsWith("/api/socket")) {
    return new Response("Not found", { status: 404 })
  }

  try {
    // Get the socket.io server instance
    const io = getSocketIO()

    // Handle socket.io events
    io.on("connection", (socket) => {
      console.log("Client connected:", socket.id)

      // Join a room with the client's socket ID
      socket.join(socket.id)

      // Send confirmation to the client
      socket.emit("connected", {
        status: "connected",
        socket_id: socket.id,
        timestamp: new Date().toISOString(),
      })

      // Handle client joining a room for a specific job
      socket.on("join", (data) => {
        if (data.job_id) {
          console.log(`Client ${socket.id} joining room for job ${data.job_id}`)
          socket.join(data.job_id)
          socket.emit("joined", {
            job_id: data.job_id,
            timestamp: new Date().toISOString(),
          })
        }
      })

      // Handle cancellation events from the client
      socket.on("cancel_conversion", (data) => {
        if (data.job_id) {
          console.log(`Cancellation request received for job ${data.job_id}`)
          // Emit to all clients in the job room
          io.to(data.job_id).emit("cancel_ack", {
            job_id: data.job_id,
            timestamp: new Date().toISOString(),
          })
        }
      })

      // Handle disconnection
      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id)
      })

      // Handle errors
      socket.on("error", (error) => {
        console.error("Socket error:", error)
      })
    })

    return new Response("Socket.io server running", {
      status: 200,
    })
  } catch (error) {
    console.error("Socket server error:", error)
    return new Response("Socket server error", {
      status: 500,
    })
  }
}

// Singleton pattern to ensure only one socket.io server instance
let io: SocketIOServer

function getSocketIO() {
  if (!io) {
    try {
      // @ts-ignore - we know that process.env.server exists
      const httpServer: NetServer = process.env.server

      if (!httpServer) {
        throw new Error("HTTP server not available")
      }

      io = new SocketIOServer(httpServer, {
        path: "/api/socket",
        addTrailingSlash: false,
        cors: {
          origin: "*",
          methods: ["GET", "POST"],
        },
        transports: ["websocket", "polling"],
        pingTimeout: 30000,
        pingInterval: 25000,
      })

      console.log("Socket.IO server initialized")
    } catch (error) {
      console.error("Error initializing Socket.IO:", error)
      // Create a dummy socket server that won't crash the app
      io = {
        on: () => {},
        to: () => ({ emit: () => {} }),
        emit: () => {},
      } as any
    }
  }
  return io
}
