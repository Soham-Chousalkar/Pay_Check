// Input validation middleware
export const validateInput = (req, res, next) => {
  // Basic XSS protection
  const sanitizeInput = (obj) => {
    if (typeof obj === 'string') {
      return obj.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    }
    if (typeof obj === 'object' && obj !== null) {
      const sanitized = {}
      for (const key in obj) {
        sanitized[key] = sanitizeInput(obj[key])
      }
      return sanitized
    }
    return obj
  }
  
  req.body = sanitizeInput(req.body)
  req.query = sanitizeInput(req.query)
  next()
}

// Email validation
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Password validation
export const validatePassword = (password) => {
  return password && password.length >= 6
}

