// api/database/init.js
import 'dotenv/config'
import { createClient } from '@libsql/client'
import fs from 'fs'
import path from 'path'

// Create Turso client using env vars
export const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

export async function initDatabase() {
  try {
    if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
      throw new Error('Environment variables TURSO_DATABASE_URL or TURSO_AUTH_TOKEN are missing!')
    }

    // Test connection
    const testResult = await client.execute('SELECT 1;')
    console.log('Database connection test passed:', testResult)

    // Read schema
    const schemaPath = path.join(process.cwd(), 'TURSO_SCHEMA.sql')
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf8')
      if (schema.trim()) {
        // Split statements by ';' and execute individually
        const statements = schema
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0)

          for (const stmt of statements) {
            try {
              await client.execute(stmt)
            } catch (err) {
              if (err.message.includes('duplicate column name')) {
                console.log('Skipping duplicate column:', err.message)
                continue
              }
              throw err
            }
          }
          
        console.log('Database schema executed successfully')
      } else {
        console.log('Schema file is empty, skipping execution')
      }
    } else {
      console.log('Schema file not found, skipping execution')
    }
  } catch (error) {
    console.error('Database initialization failed:', error)
    process.exit(1)
  }
}
