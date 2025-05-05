import { sql_client } from "@/lib/db"

export async function initializeSchema() {
  try {
    // Create settings table
    await sql_client`
      CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR(255) PRIMARY KEY,
        value TEXT
      )
    `

    // Create downloads table
    await sql_client`
      CREATE TABLE IF NOT EXISTS downloads (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        video_id VARCHAR(255),
        video_title TEXT,
        video_url TEXT NOT NULL,
        format VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL,
        progress INTEGER DEFAULT 0,
        download_path TEXT,
        file_size INTEGER,
        ip_address VARCHAR(50),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
      )
    `

    // Create jobs table
    await sql_client`
      CREATE TABLE IF NOT EXISTS jobs (
        id SERIAL PRIMARY KEY,
        job_id VARCHAR(255) NOT NULL UNIQUE,
        type VARCHAR(50) NOT NULL,
        data JSONB,
        status VARCHAR(50) NOT NULL,
        progress INTEGER DEFAULT 0,
        result JSONB,
        error TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
      )
    `

    console.log("Schema initialized successfully")
  } catch (error) {
    console.error("Error initializing schema:", error)
    throw error
  }
}
