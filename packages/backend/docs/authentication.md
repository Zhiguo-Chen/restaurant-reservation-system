# Authentication API Documentation

This document describes the REST authentication endpoints for the restaurant reservation system.

## Base URL

All authentication endpoints are prefixed with `/auth`.

## Endpoints

### POST /auth/login

Authenticate a user with username and password.

**Request:**

```http
POST /auth/login
Content-Type: application/json

{
  "username": "employee1",
  "password": "SecurePassword123!"
}
```

**Success Response (200):**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-123",
    "username": "employee1",
    "role": "EMPLOYEE"
  },
  "expiresIn": 86400
}
```

**Error Responses:**

- **400 Bad Request** - Invalid request data

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid login request",
    "details": [
      {
        "field": "username",
        "message": "Username is required",
        "code": "REQUIRED"
      }
    ],
    "timestamp": "2024-01-01T12:00:00.000Z",
    "requestId": "req_123"
  }
}
```

- **401 Unauthorized** - Invalid credentials

```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid username or password",
    "timestamp": "2024-01-01T12:00:00.000Z",
    "requestId": "req_123"
  }
}
```

### POST /auth/logout

Invalidate the current authentication token.

**Request:**

```http
POST /auth/logout
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200):**

```json
{
  "message": "Logged out successfully",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**Error Responses:**

- **400 Bad Request** - Missing or invalid token

```json
{
  "error": {
    "code": "MISSING_TOKEN",
    "message": "Authorization token required for logout",
    "timestamp": "2024-01-01T12:00:00.000Z",
    "requestId": "req_123"
  }
}
```

### GET /auth/validate

Validate the current authentication token and return user information.

**Request:**

```http
GET /auth/validate
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200):**

```json
{
  "valid": true,
  "user": {
    "id": "user-123",
    "username": "employee1",
    "role": "EMPLOYEE"
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**Error Responses:**

- **401 Unauthorized** - Invalid or expired token

```json
{
  "error": {
    "code": "INVALID_TOKEN",
    "message": "Invalid or expired token",
    "timestamp": "2024-01-01T12:00:00.000Z",
    "requestId": "req_123"
  }
}
```

### GET /auth/me

Get current authenticated user information.

**Request:**

```http
GET /auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200):**

```json
{
  "user": {
    "id": "user-123",
    "username": "employee1",
    "role": "EMPLOYEE"
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**Error Responses:**

- **401 Unauthorized** - Missing or invalid token

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication token required",
    "timestamp": "2024-01-01T12:00:00.000Z",
    "requestId": "req_123"
  }
}
```

## Authentication Flow

1. **Login**: Send username and password to `/auth/login`
2. **Store Token**: Save the returned JWT token securely
3. **Use Token**: Include token in `Authorization: Bearer <token>` header for protected endpoints
4. **Validate Token**: Use `/auth/validate` to check if token is still valid
5. **Logout**: Send token to `/auth/logout` to invalidate it

## Token Format

The API uses JWT (JSON Web Tokens) with the following structure:

- **Header**: Algorithm and token type
- **Payload**: User information (id, username, role) and standard claims (iat, exp, iss, aud)
- **Signature**: HMAC SHA256 signature

## Security Features

- **Password Hashing**: Passwords are hashed using bcrypt with 12 salt rounds
- **Token Expiration**: Tokens expire after 24 hours by default (configurable)
- **Request Validation**: All requests are validated for proper format and required fields
- **Error Handling**: Structured error responses with request tracking
- **Role-Based Access**: Support for EMPLOYEE and ADMIN roles

## Error Codes

| Code                  | Description                                       |
| --------------------- | ------------------------------------------------- |
| `VALIDATION_ERROR`    | Request data validation failed                    |
| `INVALID_CREDENTIALS` | Username or password is incorrect                 |
| `MISSING_TOKEN`       | Authorization token is required but not provided  |
| `INVALID_TOKEN`       | Token is invalid, expired, or malformed           |
| `UNAUTHORIZED`        | Authentication is required                        |
| `FORBIDDEN`           | Insufficient permissions for the requested action |
| `INTERNAL_ERROR`      | Server error occurred                             |

## Rate Limiting

Authentication endpoints are subject to rate limiting to prevent brute force attacks:

- **Login**: 5 attempts per minute per IP
- **Other endpoints**: 100 requests per minute per IP

## CORS

The API supports CORS for cross-origin requests. Configure the `CORS_ORIGIN` environment variable to specify allowed origins.

## Environment Variables

Required environment variables for authentication:

```bash
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h
```

Optional environment variables:

```bash
CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=info
```
