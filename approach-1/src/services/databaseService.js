import { handleApiError, logError, ErrorCodes } from '../utils/errorHandler.js'

// API-based database service
const API_BASE = '/api'

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem('authToken')
}

// Helper function to make authenticated API calls with retry logic
const apiCall = async (endpoint, options = {}, retryCount = 0) => {
  const token = getAuthToken()
  
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Request failed' }))
      const error = new Error(errorData.message || 'Request failed')
      error.status = response.status
      throw handleApiError(error)
    }

    return await response.json()
  } catch (error) {
    logError(error, `API Call to ${endpoint}`)
    
    // Retry logic for retryable errors
    if (retryCount < 2 && (error.code === ErrorCodes.NETWORK_ERROR || error.statusCode >= 500)) {
      console.log(`Retrying API call to ${endpoint}, attempt ${retryCount + 1}`)
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)))
      return apiCall(endpoint, options, retryCount + 1)
    }
    
    throw error
  }
}

// Canvas operations
export const canvasService = {
  async create(title, data) {
    const result = await apiCall('/canvases', {
      method: 'POST',
      body: JSON.stringify({ title, data })
    })
    return result.data
  },

  async getAll() {
    const result = await apiCall('/canvases')
    return result.data || []
  },

  async getById(id) {
    const canvases = await this.getAll()
    return canvases.find(canvas => canvas.id === id) || null
  },

  async update(id, updates) {
    const result = await apiCall(`/canvases/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    })
    return result.data
  },

  async delete(id) {
    await apiCall(`/canvases/${id}`, {
      method: 'DELETE'
    })
    return true
  }
}

// Panel operations
export const panelService = {
  async create(canvasId, config) {
    const result = await apiCall('/panels', {
      method: 'POST',
      body: JSON.stringify({ canvasId, config })
    })
    return result.data
  },

  async getByCanvasId(canvasId) {
    const result = await apiCall(`/panels/canvas/${canvasId}`)
    return result.data || []
  },

  async update(id, updates) {
    const result = await apiCall(`/panels/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    })
    return result.data
  },

  async delete(id) {
    await apiCall(`/panels/${id}`, {
      method: 'DELETE'
    })
    return true
  },

  async deleteByCanvasId(canvasId) {
    await apiCall(`/panels/canvas/${canvasId}`, {
      method: 'DELETE'
    })
    return true
  }
}

// Paycheck counter operations
export const counterService = {
  async create(canvasId, value = 0) {
    const result = await apiCall('/counters', {
      method: 'POST',
      body: JSON.stringify({ canvasId, value })
    })
    return result.data
  },

  async getByCanvasId(canvasId) {
    const result = await apiCall(`/counters/canvas/${canvasId}`)
    return result.data || null
  },

  async update(canvasId, value) {
    const result = await apiCall(`/counters/canvas/${canvasId}`, {
      method: 'PUT',
      body: JSON.stringify({ value })
    })
    return result.data
  }
}

// Preferences operations
export const preferencesService = {
  async get() {
    const result = await apiCall('/preferences')
    return result.data || {}
  },

  async update(settings) {
    const result = await apiCall('/preferences', {
      method: 'PUT',
      body: JSON.stringify({ settings })
    })
    return result.data
  }
}




