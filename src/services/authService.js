const API_BASE_URL = '/api'

export const authService = {
  // Register new user
  async register(name, email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password })
      })

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.message)
      }

      return result
    } catch (error) {
      throw new Error(error.message)
    }
  },

  // Login user
  async login(email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      })

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.message)
      }

      return result
    } catch (error) {
      throw new Error(error.message)
    }
  },



  // Verify JWT token
  async verifyToken(token) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      })

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.message)
      }

      return result
    } catch (error) {
      throw new Error('Invalid token')
    }
  },

  // Get user by ID (if needed for other operations)
  async getUserById(userId) {
    try {
      // This would typically be handled by the backend
      // For now, return null as this might not be needed in frontend
      return null
    } catch (error) {
      throw new Error(error.message)
    }
  }
}