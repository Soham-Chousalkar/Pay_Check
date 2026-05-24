export const authService = {
  async register(name, email, password) {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    })
    if (!response.ok) {
      const message = await response.text().catch(() => '')
      throw new Error(message || 'Registration failed')
    }
    return await response.json()
  },

  async login(email, password) {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    if (!response.ok) {
      const message = await response.text().catch(() => '')
      throw new Error(message || 'Login failed')
    }
    return await response.json()
  },

  async verifyToken(token) {
    const response = await fetch('/api/auth/verify', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Token expired')
      }
      throw new Error('Invalid token')
    }
    return await response.json()
  }
}
