# Backend Setup Instructions

## Quick Start

1. **Install backend dependencies:**
   ```bash
   cd server
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your actual values:
   - `JWT_SECRET`: A secure random string
   - `TURSO_DATABASE_URL`: Your Turso database URL
   - `TURSO_AUTH_TOKEN`: Your Turso auth token
   - `EMAIL_USER`: Your Gmail address
   - `EMAIL_PASS`: Your Gmail app password

3. **Start the backend server:**
   ```bash
   npm run dev
   ```
   Server will run on `http://localhost:3001`

4. **Start the frontend:**
   ```bash
   cd ..
   npm run dev
   ```
   Frontend will run on `http://localhost:3000`

## What Changed

- **Backend**: Express.js server with JWT authentication
- **Frontend**: Now uses API calls instead of direct JWT operations
- **Security**: JWT secrets are now server-side only
- **Error Fixed**: `jsonwebtoken` browser compatibility issue resolved

## API Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/verify` - Verify JWT token
- `GET /api/health` - Health check

The authentication error should now be resolved!
