import { createClient } from '@libsql/client'
import { IDatabaseAdapter } from './IDatabaseAdapter.js'

export class TursoAdapter extends IDatabaseAdapter {
  constructor() {
    super()
    this.client = createClient({
      url: 'libsql://pay-check-baneen.aws-us-east-2.turso.io',
      authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NTY2NjY2MDksImlkIjoiOTZkMTg4NGEtZDg2MC00N2NlLTg5NGUtZWQ5MzY5NzA3ZTM5IiwicmlkIjoiMTMxZGM1OTAtNDI5Ny00M2Y2LTllMTItMWUzOGQyMzk0NDQ3In0.y2ygoRXyOj7sguLKz46TqkbfqwVs27nORCVJzX6E3S3oD10ukpXBZNFZY_IUjD94TmanEhiK3x7BGlQ9TaLmAg'
    })
  }

  // Canvas operations
  async createCanvas(title, data) {
    const result = await this.client.execute({
      sql: 'INSERT INTO canvases (title, data) VALUES (?, ?) RETURNING *',
      args: [title, JSON.stringify(data)]
    })
    return result.rows[0]
  }

  async getAllCanvases() {
    const result = await this.client.execute({
      sql: 'SELECT * FROM canvases ORDER BY created_at DESC'
    })
    return result.rows
  }

  async getCanvasById(id) {
    const result = await this.client.execute({
      sql: 'SELECT * FROM canvases WHERE id = ?',
      args: [id]
    })
    return result.rows[0]
  }

  async updateCanvas(id, updates) {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ')
    const values = Object.values(updates)
    const result = await this.client.execute({
      sql: `UPDATE canvases SET ${fields} WHERE id = ? RETURNING *`,
      args: [...values, id]
    })
    return result.rows[0]
  }

  async deleteCanvas(id) {
    await this.client.execute({
      sql: 'DELETE FROM canvases WHERE id = ?',
      args: [id]
    })
  }

  // Panel operations
  async createPanel(canvasId, config) {
    const result = await this.client.execute({
      sql: 'INSERT INTO panels (canvas_id, config) VALUES (?, ?) RETURNING *',
      args: [canvasId, JSON.stringify(config)]
    })
    return result.rows[0]
  }

  async getPanelsByCanvasId(canvasId) {
    const result = await this.client.execute({
      sql: 'SELECT * FROM panels WHERE canvas_id = ? ORDER BY created_at ASC',
      args: [canvasId]
    })
    return result.rows
  }

  async updatePanel(id, updates) {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ')
    const values = Object.values(updates)
    const result = await this.client.execute({
      sql: `UPDATE panels SET ${fields} WHERE id = ? RETURNING *`,
      args: [...values, id]
    })
    return result.rows[0]
  }

  async deletePanel(id) {
    await this.client.execute({
      sql: 'DELETE FROM panels WHERE id = ?',
      args: [id]
    })
  }

  async deletePanelsByCanvasId(canvasId) {
    await this.client.execute({
      sql: 'DELETE FROM panels WHERE canvas_id = ?',
      args: [canvasId]
    })
  }

  // Counter operations
  async createCounter(canvasId, value = 0) {
    const result = await this.client.execute({
      sql: 'INSERT INTO paycheck_counters (canvas_id, value) VALUES (?, ?) RETURNING *',
      args: [canvasId, value]
    })
    return result.rows[0]
  }

  async getCounterByCanvasId(canvasId) {
    const result = await this.client.execute({
      sql: 'SELECT * FROM paycheck_counters WHERE canvas_id = ?',
      args: [canvasId]
    })
    return result.rows[0]
  }

  async updateCounter(canvasId, value) {
    const result = await this.client.execute({
      sql: 'INSERT OR REPLACE INTO paycheck_counters (canvas_id, value) VALUES (?, ?) RETURNING *',
      args: [canvasId, value]
    })
    return result.rows[0]
  }

  // Preferences operations
  async getPreferences() {
    const result = await this.client.execute({
      sql: 'SELECT * FROM preferences LIMIT 1'
    })
    return result.rows[0]
  }

  async updatePreferences(settings) {
    const result = await this.client.execute({
      sql: 'INSERT OR REPLACE INTO preferences (id, settings) VALUES (1, ?) RETURNING *',
      args: [JSON.stringify(settings)]
    })
    return result.rows[0]
  }

  // User operations
  async createUser(user) {
    const result = await this.client.execute({
      sql: 'INSERT INTO users (id, email, name, password_hash, google_id, is_verified) VALUES (?, ?, ?, ?, ?, ?) RETURNING *',
      args: [user.id, user.email, user.name, user.password_hash, user.google_id || null, user.is_verified]
    })
    return result.rows[0]
  }

  async getUserById(id) {
    const result = await this.client.execute({
      sql: 'SELECT * FROM users WHERE id = ?',
      args: [id]
    })
    return result.rows[0]
  }

  async getUserByEmail(email) {
    const result = await this.client.execute({
      sql: 'SELECT * FROM users WHERE email = ?',
      args: [email]
    })
    return result.rows[0]
  }

  async getUserByGoogleId(googleId) {
    const result = await this.client.execute({
      sql: 'SELECT * FROM users WHERE google_id = ?',
      args: [googleId]
    })
    return result.rows[0]
  }

  async updateUser(id, updates) {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ')
    const values = Object.values(updates)
    const result = await this.client.execute({
      sql: `UPDATE users SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ? RETURNING *`,
      args: [...values, id]
    })
    return result.rows[0]
  }

  // User-Canvas relationship operations
  async createUserCanvas(userId, canvasId) {
    const result = await this.client.execute({
      sql: 'INSERT INTO user_canvases (user_id, canvas_id) VALUES (?, ?) RETURNING *',
      args: [userId, canvasId]
    })
    return result.rows[0]
  }

  async getUserCanvases(userId) {
    const result = await this.client.execute({
      sql: 'SELECT c.* FROM canvases c JOIN user_canvases uc ON c.id = uc.canvas_id WHERE uc.user_id = ? ORDER BY c.created_at DESC',
      args: [userId]
    })
    return result.rows
  }
}
