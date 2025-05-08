import { neon } from "@neondatabase/serverless"

// Create a SQL client
export const sql_client = neon(process.env.DATABASE_URL!)

// Health check function
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const result = await sql_client`SELECT 1 as connected`
    return result[0]?.connected === 1
  } catch (error) {
    console.error("Database connection error:", error)
    return false
  }
}

// Get settings from database
export async function getSettings(): Promise<Record<string, string>> {
  try {
    const settings = await sql_client`SELECT key, value FROM settings`
    return settings.reduce(
      (acc, setting) => {
        acc[setting.key] = setting.value
        return acc
      },
      {} as Record<string, string>,
    )
  } catch (error) {
    console.error("Error fetching settings:", error)
    return {}
  }
}

// Create a download record
export async function createDownload(data: {
  user_id?: number
  video_id: string
  video_title: string
  video_url: string
  format: string
  ip_address?: string
  user_agent?: string
}) {
  try {
    const result = await sql_client`
      INSERT INTO downloads (
        user_id, video_id, video_title, video_url, format, 
        status, ip_address, user_agent
      ) VALUES (
        ${data.user_id || null}, ${data.video_id}, ${data.video_title}, 
        ${data.video_url}, ${data.format}, 'pending', 
        ${data.ip_address || null}, ${data.user_agent || null}
      ) RETURNING id
    `
    return result[0]
  } catch (error) {
    console.error("Error creating download record:", error)
    return { id: 0 }
  }
}

// Update download status - Fixed SQL query construction
export async function updateDownloadStatus(
  id: number,
  status: string,
  progress: number,
  file_size?: number,
  download_path?: string,
) {
  try {
    // Build the query using string interpolation with tagged templates
    let query = sql_client`
      UPDATE downloads
      SET status = ${status}, progress = ${progress}, updated_at = CURRENT_TIMESTAMP
    `

    // For completed status, add completed_at
    if (status === "completed") {
      query = sql_client`
        UPDATE downloads
        SET status = ${status}, progress = ${progress}, 
            updated_at = CURRENT_TIMESTAMP, completed_at = CURRENT_TIMESTAMP
      `
    }

    // Add file_size if provided
    if (file_size !== undefined && status === "completed") {
      query = sql_client`
        UPDATE downloads
        SET status = ${status}, progress = ${progress}, 
            updated_at = CURRENT_TIMESTAMP, completed_at = CURRENT_TIMESTAMP,
            file_size = ${file_size}
      `
    }

    // Add download_path if provided
    if (download_path && status === "completed") {
      query = sql_client`
        UPDATE downloads
        SET status = ${status}, progress = ${progress}, 
            updated_at = CURRENT_TIMESTAMP, completed_at = CURRENT_TIMESTAMP,
            file_size = ${file_size || null}, download_path = ${download_path}
      `
    }

    // Add WHERE clause
    query = sql_client`
      ${query} WHERE id = ${id}
    `

    await query
    return true
  } catch (error) {
    console.error("Error updating download status:", error)
    return false
  }
}

// Get recent downloads
export async function getRecentDownloads(limit = 10) {
  try {
    // First check if the table exists
    const tableCheck = await sql_client`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'downloads'
      ) as exists
    `

    if (!tableCheck[0]?.exists) {
      console.warn("Downloads table does not exist yet")
      return []
    }

    return await sql_client`
      SELECT * FROM downloads
      ORDER BY created_at DESC
      LIMIT ${limit}
    `
  } catch (error) {
    console.error("Error fetching recent downloads:", error)
    return []
  }
}

// Create a job record
export async function createJob(data: {
  job_id: string
  type: string
  data: any
}) {
  try {
    const result = await sql_client`
      INSERT INTO jobs (
        job_id, type, data, status
      ) VALUES (
        ${data.job_id}, ${data.type}, ${JSON.stringify(data.data)}, 'pending'
      ) RETURNING id
    `
    return result[0]
  } catch (error) {
    console.error("Error creating job record:", error)
    return { id: 0 }
  }
}

// Update job status - Fixed SQL query construction
export async function updateJobStatus(job_id: string, status: string, progress: number, result?: any, error?: string) {
  try {
    // Start with base query
    let query = sql_client`
      UPDATE jobs
      SET status = ${status}, progress = ${progress}, updated_at = CURRENT_TIMESTAMP
    `

    // For completed status
    if (status === "completed") {
      if (result) {
        query = sql_client`
          UPDATE jobs
          SET status = ${status}, progress = ${progress}, 
              updated_at = CURRENT_TIMESTAMP, completed_at = CURRENT_TIMESTAMP,
              result = ${JSON.stringify(result)}
        `
      } else {
        query = sql_client`
          UPDATE jobs
          SET status = ${status}, progress = ${progress}, 
              updated_at = CURRENT_TIMESTAMP, completed_at = CURRENT_TIMESTAMP
        `
      }
    }
    // For failed status
    else if (status === "failed" && error) {
      query = sql_client`
        UPDATE jobs
        SET status = ${status}, progress = ${progress}, 
            updated_at = CURRENT_TIMESTAMP, error = ${error}
      `
    }

    // Add WHERE clause
    query = sql_client`
      ${query} WHERE job_id = ${job_id}
    `

    await query
    return true
  } catch (error) {
    console.error("Error updating job status:", error)
    return false
  }
}

// Get job by ID
export async function getJob(job_id: string) {
  try {
    const result = await sql_client`
      SELECT * FROM jobs
      WHERE job_id = ${job_id}
    `
    return result[0]
  } catch (error) {
    console.error("Error fetching job:", error)
    return null
  }
}

// Get completed downloads count in the last 24 hours
export async function getCompletedDownloadsCount() {
  try {
    // First check if the table exists
    const tableCheck = await sql_client`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'downloads'
      ) as exists
    `

    if (!tableCheck[0]?.exists) {
      console.warn("Downloads table does not exist yet")
      return 0
    }

    const result = await sql_client`
      SELECT COUNT(*) as count 
      FROM downloads 
      WHERE status = 'completed' 
      AND completed_at > NOW() - INTERVAL '24 hours'
    `
    return Number.parseInt(result[0]?.count || "0", 10)
  } catch (error) {
    console.error("Error fetching completed downloads count:", error)
    return 0
  }
}
