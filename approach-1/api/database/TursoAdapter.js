import { client } from './init.js'

export class TursoAdapter {
  constructor() {
    this.client = client
  }
  // User operations
  async createUser(userData) {
    const { id, email, name, password_hash, is_verified = false } = userData
    const result = await this.client.execute({
      sql: 'INSERT INTO users (id, email, name, password_hash, is_verified) VALUES (?, ?, ?, ?, ?)',
      args: [id, email, name, password_hash, is_verified]
    })
    return result
  }

  async getUserByEmail(email) {
    const result = await this.client.execute({
      sql: 'SELECT * FROM users WHERE email = ?',
      args: [email]
    })
    return result.rows[0] || null
  }

  async getUserById(id) {
    const result = await this.client.execute({
      sql: 'SELECT * FROM users WHERE id = ?',
      args: [id]
    })
    return result.rows[0] || null
  }

  async updateUserVerification(id, is_verified) {
    const result = await this.client.execute({
      sql: 'UPDATE users SET is_verified = ? WHERE id = ?',
      args: [is_verified, id]
    })
    return result
  }

  async updateUser(id, updates) {
    // Validate allowed fields to prevent SQL injection
    const allowedFields = ['name', 'email', 'password_hash', 'is_verified']
    const fields = Object.keys(updates).filter(field => allowedFields.includes(field))
    const values = fields.map(field => updates[field])
    const setClause = fields.map(field => `${field} = ?`).join(', ')
    
    if (fields.length === 0) {
      throw new Error('No valid fields to update')
    }
    
    const result = await this.client.execute({
      sql: `UPDATE users SET ${setClause} WHERE id = ?`,
      args: [...values, id]
    })
    return result
  }

  // Canvas operations
  async createCanvas(canvasData) {
    const { id, user_id, title, data } = canvasData
    const result = await this.client.execute({
      sql: 'INSERT INTO canvases (id, user_id, title, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      args: [id, user_id, title, JSON.stringify(data), new Date().toISOString(), new Date().toISOString()]
    })
    return result
  }

  async getCanvasesByUserId(user_id) {
    const result = await this.client.execute({
      sql: 'SELECT * FROM canvases WHERE user_id = ? ORDER BY created_at DESC',
      args: [user_id]
    })
    return result.rows.map(row => ({
      id: row.id,
      title: row.title,
      data: JSON.parse(row.data || '{}'),
      created_at: row.created_at,
      updated_at: row.updated_at
    }))
  }

  async updateCanvas(id, user_id, updates) {
    // Validate allowed fields to prevent SQL injection
    const allowedFields = ['title', 'data']
    const fields = Object.keys(updates).filter(field => allowedFields.includes(field))
    
    if (fields.length === 0) {
      throw new Error('No valid fields to update')
    }
    
    const values = fields.map(field => field === 'data' ? JSON.stringify(updates[field]) : updates[field])
    const setClause = fields.map(field => `${field} = ?`).join(', ')
    
    const result = await this.client.execute({
      sql: `UPDATE canvases SET ${setClause}, updated_at = ? WHERE id = ? AND user_id = ?`,
      args: [...values, new Date().toISOString(), id, user_id]
    })
    return result
  }

  async deleteCanvas(id, user_id) {
    const result = await this.client.execute({
      sql: 'DELETE FROM canvases WHERE id = ? AND user_id = ?',
      args: [id, user_id]
    })
    return result
  }

  // Panel operations
  async createPanel(panelData) {
    const { id, canvas_id, user_id, config } = panelData
    const result = await this.client.execute({
      sql: 'INSERT INTO panels (id, canvas_id, user_id, config, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      args: [id, canvas_id, user_id, JSON.stringify(config), new Date().toISOString(), new Date().toISOString()]
    })
    return result
  }

  async getPanelsByCanvasId(canvas_id, user_id) {
    const result = await this.client.execute({
      sql: 'SELECT * FROM panels WHERE canvas_id = ? AND user_id = ? ORDER BY created_at ASC',
      args: [canvas_id, user_id]
    })
    return result.rows.map(row => ({
      id: row.id,
      canvas_id: row.canvas_id,
      config: JSON.parse(row.config || '{}'),
      created_at: row.created_at
    }))
  }

  async updatePanel(id, user_id, updates) {
    // Validate allowed fields to prevent SQL injection
    const allowedFields = ['config']
    const fields = Object.keys(updates).filter(field => allowedFields.includes(field))
    
    if (fields.length === 0) {
      throw new Error('No valid fields to update')
    }
    
    const values = fields.map(field => field === 'config' ? JSON.stringify(updates[field]) : updates[field])
    const setClause = fields.map(field => `${field} = ?`).join(', ')
    
    const result = await this.client.execute({
      sql: `UPDATE panels SET ${setClause}, updated_at = ? WHERE id = ? AND user_id = ?`,
      args: [...values, new Date().toISOString(), id, user_id]
    })
    return result
  }

  async deletePanel(id, user_id) {
    const result = await this.client.execute({
      sql: 'DELETE FROM panels WHERE id = ? AND user_id = ?',
      args: [id, user_id]
    })
    return result
  }

  async deletePanelsByCanvasId(canvas_id, user_id) {
    const result = await this.client.execute({
      sql: 'DELETE FROM panels WHERE canvas_id = ? AND user_id = ?',
      args: [canvas_id, user_id]
    })
    return result
  }

  // Counter operations
  async createCounter(canvas_id, user_id, value = 0) {
    const result = await this.client.execute({
      sql: 'INSERT INTO paycheck_counters (canvas_id, user_id, value, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      args: [canvas_id, user_id, value, new Date().toISOString(), new Date().toISOString()]
    })
    return result
  }

  async getCounterByCanvasId(canvas_id, user_id) {
    const result = await this.client.execute({
      sql: 'SELECT * FROM paycheck_counters WHERE canvas_id = ? AND user_id = ?',
      args: [canvas_id, user_id]
    })
    return result.rows[0] || null
  }

  async updateCounter(canvas_id, user_id, value) {
    const result = await this.client.execute({
      sql: 'UPDATE paycheck_counters SET value = ?, updated_at = ? WHERE canvas_id = ? AND user_id = ?',
      args: [value, new Date().toISOString(), canvas_id, user_id]
    })
    return result
  }

  // Preferences operations
  async getPreferences(user_id) {
    const result = await this.client.execute({
      sql: 'SELECT * FROM preferences WHERE user_id = ?',
      args: [user_id]
    })
    return result.rows[0] || null
  }

  async updatePreferences(user_id, settings) {
    const existing = await this.getPreferences(user_id)
    
    if (existing) {
      const result = await this.client.execute({
        sql: 'UPDATE preferences SET settings = ?, updated_at = ? WHERE user_id = ?',
        args: [JSON.stringify(settings), new Date().toISOString(), user_id]
      })
      return result
    } else {
      const result = await this.client.execute({
        sql: 'INSERT INTO preferences (user_id, settings, created_at, updated_at) VALUES (?, ?, ?, ?)',
        args: [user_id, JSON.stringify(settings), new Date().toISOString(), new Date().toISOString()]
      })
      return result
    }
  }
}
