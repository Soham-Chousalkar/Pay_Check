// Database Adapter Interface - defines contract for all database operations
export class IDatabaseAdapter {
  // Canvas operations
  async createCanvas(title, data) { throw new Error('Not implemented') }
  async getAllCanvases() { throw new Error('Not implemented') }
  async getCanvasById(id) { throw new Error('Not implemented') }
  async updateCanvas(id, updates) { throw new Error('Not implemented') }
  async deleteCanvas(id) { throw new Error('Not implemented') }

  // Panel operations
  async createPanel(canvasId, config) { throw new Error('Not implemented') }
  async getPanelsByCanvasId(canvasId) { throw new Error('Not implemented') }
  async updatePanel(id, updates) { throw new Error('Not implemented') }
  async deletePanel(id) { throw new Error('Not implemented') }
  async deletePanelsByCanvasId(canvasId) { throw new Error('Not implemented') }

  // Counter operations
  async createCounter(canvasId, value) { throw new Error('Not implemented') }
  async getCounterByCanvasId(canvasId) { throw new Error('Not implemented') }
  async updateCounter(canvasId, value) { throw new Error('Not implemented') }

  // Preferences operations
  async getPreferences() { throw new Error('Not implemented') }
  async updatePreferences(settings) { throw new Error('Not implemented') }
}
