# Pay Check API Documentation

## Base URL
- Development: `http://localhost:3001`
- Production: `https://your-domain.com`

## Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### Authentication

#### POST /api/auth/register
Register a new user.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful. You can now log in with your credentials."
}
```

#### POST /api/auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt-token-here",
  "user": {
    "id": "user_123",
    "email": "john@example.com",
    "name": "John Doe",
    "isVerified": false
  }
}
```

#### GET /api/auth/verify
Verify JWT token.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_123",
    "email": "john@example.com",
    "name": "John Doe",
    "isVerified": false
  }
}
```

#### POST /api/auth/forgot-password
Reset password via email.

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Your new password has been sent to your email address."
}
```

### Canvases (Protected)

#### GET /api/canvases
Get all canvases for the authenticated user.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "canvas_123",
      "title": "My Canvas",
      "data": "{\"panels\": [], \"lastSnapshotAt\": 1234567890}",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### POST /api/canvases
Create a new canvas.

**Request Body:**
```json
{
  "title": "New Canvas",
  "data": "{\"panels\": [], \"lastSnapshotAt\": 1234567890}"
}
```

#### PUT /api/canvases/:id
Update a canvas.

**Request Body:**
```json
{
  "title": "Updated Canvas",
  "data": "{\"panels\": [], \"lastSnapshotAt\": 1234567890}"
}
```

#### DELETE /api/canvases/:id
Delete a canvas.

**Response:**
```json
{
  "success": true,
  "message": "Canvas deleted successfully"
}
```

### Panels (Protected)

#### GET /api/panels/canvas/:canvasId
Get all panels for a specific canvas.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "panel_123",
      "canvas_id": "canvas_123",
      "config": "{\"x\": 100, \"y\": 100, \"title\": \"Panel 1\"}",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### POST /api/panels
Create a new panel.

**Request Body:**
```json
{
  "canvasId": "canvas_123",
  "config": "{\"x\": 100, \"y\": 100, \"title\": \"New Panel\"}"
}
```

#### PUT /api/panels/:id
Update a panel.

**Request Body:**
```json
{
  "config": "{\"x\": 200, \"y\": 200, \"title\": \"Updated Panel\"}"
}
```

#### DELETE /api/panels/:id
Delete a panel.

### Preferences (Protected)

#### GET /api/preferences
Get user preferences.

**Response:**
```json
{
  "success": true,
  "data": {
    "theme": "light",
    "notifications": true
  }
}
```

#### PUT /api/preferences
Update user preferences.

**Request Body:**
```json
{
  "settings": {
    "theme": "dark",
    "notifications": false
  }
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

### Common HTTP Status Codes
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting
- No rate limiting currently implemented
- Consider implementing for production use

## CORS
- Development: `http://localhost:3000`
- Production: Configured via `FRONTEND_URL` environment variable

