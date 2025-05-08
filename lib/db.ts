import { neon } from "@neondatabase/serverless"
import type { NeonQueryFunction } from "@neondatabase/serverless"

let sql_client: NeonQueryFunction<any, any> // Provide both generic types

if (process.env.DATABASE_URL) {
  sql_client = neon(process.env.DATABASE_URL)
} else if (process.env.NODE_ENV === "development") {
  console.warn("⚠️ DATABASE_URL not found. Using mock DB client in dev mode.")
  sql_client = (() => {
    throw new Error("Mock DB client - DATABASE_URL is not defined.")
  })() as any
} else {
  throw new Error("❌ DATABASE_URL must be set in production environment")
}

export { sql_client }
