#!/usr/bin/env node

// Helper script to start the server with better error handling
const { spawn } = require('child_process')
const path = require('path')

const PORT = process.env.PORT || 3001
const API_DIR = path.join(__dirname, '..', 'api')

console.log('Starting Pay Check Backend Server...')
console.log(`Port: ${PORT}`)
console.log(`API Directory: ${API_DIR}`)

// Start the server
const server = spawn('node', ['server.js'], {
  cwd: API_DIR,
  stdio: 'inherit',
  env: { ...process.env, PORT }
})

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use!`)
    console.error('Solutions:')
    console.error('1. Stop the other process:')
    console.error('   - Windows: taskkill /f /im node.exe')
    console.error('   - Mac/Linux: pkill -f node')
    console.error('2. Use a different port:')
    console.error('   PORT=3002 npm run dev:api')
    console.error('3. Find what\'s using the port:')
    console.error('   - Windows: netstat -ano | findstr :3001')
    console.error('   - Mac/Linux: lsof -i :3001')
  } else {
    console.error('Server error:', err)
  }
  process.exit(1)
})

server.on('exit', (code) => {
  if (code !== 0) {
    console.error(`Server exited with code ${code}`)
    process.exit(code)
  }
})

// Handle process termination
process.on('SIGINT', () => {
  console.log('\nShutting down server...')
  server.kill('SIGINT')
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\nShutting down server...')
  server.kill('SIGTERM')
  process.exit(0)
})


