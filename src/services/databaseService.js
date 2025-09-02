// Database service disabled - using API calls instead
// import { TursoAdapter } from '../adapters/TursoAdapter.js'

// Initialize database adapter
// const db = new TursoAdapter()

// Canvas operations - disabled for now
export const canvasService = {
  async create(title, data) {
    throw new Error('Database service disabled - use API calls')
  },

  async getAll() {
    throw new Error('Database service disabled - use API calls')
  },

  async getById(id) {
    throw new Error('Database service disabled - use API calls')
  },

  async update(id, updates) {
    throw new Error('Database service disabled - use API calls')
  },

  async delete(id) {
    throw new Error('Database service disabled - use API calls')
  }
}

// Panel operations - disabled for now
export const panelService = {
  async create(canvasId, config) {
    throw new Error('Database service disabled - use API calls')
  },

  async getByCanvasId(canvasId) {
    throw new Error('Database service disabled - use API calls')
  },

  async update(id, updates) {
    throw new Error('Database service disabled - use API calls')
  },

  async delete(id) {
    throw new Error('Database service disabled - use API calls')
  },

  async deleteByCanvasId(canvasId) {
    throw new Error('Database service disabled - use API calls')
  }
}

// Paycheck counter operations - disabled for now
export const counterService = {
  async create(canvasId, value = 0) {
    throw new Error('Database service disabled - use API calls')
  },

  async getByCanvasId(canvasId) {
    throw new Error('Database service disabled - use API calls')
  },

  async update(canvasId, value) {
    throw new Error('Database service disabled - use API calls')
  }
}

// Preferences operations - disabled for now
export const preferencesService = {
  async get() {
    throw new Error('Database service disabled - use API calls')
  },

  async update(settings) {
    throw new Error('Database service disabled - use API calls')
  }
}




