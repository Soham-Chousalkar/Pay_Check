import { client } from './init.js'

export class TursoAdapter {
  // User operations
  async createUser(userData) {
    const { id, email, name, password_hash, is_verified = false } = userData
    const result = await client.execute({
      sql: 'INSERT INTO users (id, email, name, password_hash, is_verified) VALUES (?, ?, ?, ?, ?)',
      args: [id, email, name, password_hash, is_verified]
    })
    return result
  }

  async getUserByEmail(email) {
    const result = await client.execute({
      sql: 'SELECT * FROM users WHERE email = ?',
      args: [email]
    })
    return result.rows[0] || null
  }

  async getUserById(id) {
    const result = await client.execute({
      sql: 'SELECT * FROM users WHERE id = ?',
      args: [id]
    })
    return result.rows[0] || null
  }

  async updateUserVerification(id, is_verified) {
    const result = await client.execute({
      sql: 'UPDATE users SET is_verified = ? WHERE id = ?',
      args: [is_verified, id]
    })
    return result
  }

  async updateUser(id, updates) {
    const fields = Object.keys(updates)
    const values = Object.values(updates)
    const setClause = fields.map(field => `${field} = ?`).join(', ')
    
    const result = await client.execute({
      sql: `UPDATE users SET ${setClause} WHERE id = ?`,
      args: [...values, id]
    })
    return result
  }

  // Panel operations
  async createPanel(panelData) {
    const { id, user_id, name, x, y, width, height, color, created_at } = panelData
    const result = await client.execute({
      sql: 'INSERT INTO panels (id, user_id, name, x, y, width, height, color, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      args: [id, user_id, name, x, y, width, height, color, created_at]
    })
    return result
  }

  async getPanelsByUserId(user_id) {
    const result = await client.execute({
      sql: 'SELECT * FROM panels WHERE user_id = ? ORDER BY created_at DESC',
      args: [user_id]
    })
    return result.rows
  }

  async updatePanel(id, updates) {
    const fields = Object.keys(updates)
    const values = Object.values(updates)
    const setClause = fields.map(field => `${field} = ?`).join(', ')
    
    const result = await client.execute({
      sql: `UPDATE panels SET ${setClause} WHERE id = ?`,
      args: [...values, id]
    })
    return result
  }

  async deletePanel(id) {
    const result = await client.execute({
      sql: 'DELETE FROM panels WHERE id = ?',
      args: [id]
    })
    return result
  }
}
