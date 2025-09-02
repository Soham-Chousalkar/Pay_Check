import { TursoAdapter } from '../adapters/TursoAdapter.js'

// Initialize database adapter
const db = new TursoAdapter()

// Canvas operations
export const canvasService = {
  async create(title, data) {
    try {
      return await db.createCanvas(title, data)
    } catch (error) {
      throw new Error(error.message)
    }
  },

  async getAll() {
    try {
      return await db.getAllCanvases()
    } catch (error) {
      throw new Error(error.message)
    }
  },

  async getById(id) {
    try {
      return await db.getCanvasById(id)
    } catch (error) {
      throw new Error(error.message)
    }
  },

  async update(id, updates) {
    try {
      return await db.updateCanvas(id, updates)
    } catch (error) {
      throw new Error(error.message)
    }
  },

  async delete(id) {
    try {
      await db.deleteCanvas(id)
    } catch (error) {
      throw new Error(error.message)
    }
  }
}

// Panel operations
export const panelService = {
  async create(canvasId, config) {
    try {
      return await db.createPanel(canvasId, config)
    } catch (error) {
      throw new Error(error.message)
    }
  },

  async getByCanvasId(canvasId) {
    try {
      return await db.getPanelsByCanvasId(canvasId)
    } catch (error) {
      throw new Error(error.message)
    }
  },

  async update(id, updates) {
    try {
      return await db.updatePanel(id, updates)
    } catch (error) {
      throw new Error(error.message)
    }
  },

  async delete(id) {
    try {
      await db.deletePanel(id)
    } catch (error) {
      throw new Error(error.message)
    }
  },

  async deleteByCanvasId(canvasId) {
    try {
      await db.deletePanelsByCanvasId(canvasId)
    } catch (error) {
      throw new Error(error.message)
    }
  }
}

// Paycheck counter operations
export const counterService = {
  async create(canvasId, value = 0) {
    try {
      return await db.createCounter(canvasId, value)
    } catch (error) {
      throw new Error(error.message)
    }
  },

  async getByCanvasId(canvasId) {
    try {
      return await db.getCounterByCanvasId(canvasId)
    } catch (error) {
      throw new Error(error.message)
    }
  },

  async update(canvasId, value) {
    try {
      return await db.updateCounter(canvasId, value)
    } catch (error) {
      throw new Error(error.message)
    }
  }
}

// Preferences operations
export const preferencesService = {
  async get() {
    try {
      return await db.getPreferences()
    } catch (error) {
      throw new Error(error.message)
    }
  },

  async update(settings) {
    try {
      return await db.updatePreferences(settings)
    } catch (error) {
      throw new Error(error.message)
    }
  }
}




