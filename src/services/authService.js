import { safeJson } from '../utils/safeJson.js'

const API_BASE = '/api'

export const authService = {
  async register(name, email) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email })
    })
    if (!res.ok) {
      const msg = await res.text().catch(() => '')
      throw new Error(`API error ${res.status}: ${msg}`)
    }
    return await safeJson(res)
  },

  async login(email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    if (!res.ok) {
      const msg = await res.text().catch(() => '')
      throw new Error(`API error ${res.status}: ${msg}`)
    }
    return await safeJson(res)
  },

  async googleAuth(googleUser) {
    const res = await fetch(`${API_BASE}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(googleUser)
    })
    if (!res.ok) {
      const msg = await res.text().catch(() => '')
      throw new Error(`API error ${res.status}: ${msg}`)
    }
    return await safeJson(res)
  },

  async verifyToken(token) {
    const res = await fetch(`${API_BASE}/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    })
    if (!res.ok) {
      const msg = await res.text().catch(() => '')
      throw new Error(`API error ${res.status}: ${msg}`)
    }
    return await safeJson(res)
  }
}
