import { createClient } from '@libsql/client'
import fs from 'fs'
import path from 'path'

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
})

export async function initDatabase() {
  try {
    // Read and execute schema
    const schemaPath = path.join(process.cwd(), '..', 'TURSO_SCHEMA.sql')
    const schema = fs.readFileSync(schemaPath, 'utf8')
    
    // Execute schema
    await client.execute(schema)
    console.log('Database initialized successfully')
  } catch (error) {
    console.error('Database initialization failed:', error)
    throw error
  }
}

export { client }
