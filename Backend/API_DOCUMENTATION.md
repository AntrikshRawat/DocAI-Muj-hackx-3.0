# API Documentation

## Base URL
```
http://localhost:5000/api
```

---

## Table of Contents
1. [Authentication APIs](#authentication-apis)
2. [Report APIs](#report-apis)
3. [Chat APIs](#chat-apis)
---

## Authentication APIs

### 1. Google Sign-In

**Endpoint:** `POST /api/auth/google`

**Description:** Authenticate user with Google OAuth token

**Request Body:**
```json
{
  "token": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjI3..."
}
```

**Success Response (200 OK - Existing User):**
```json
{
  "status": "success",
  "message": "User logged in successfully",
  "data": {
    "user": {
      "_id": "672279abc123def456789012",
      "googleId": "1234567890",
      "email": "user@example.com",
      "name": "John Doe",
      "picture": "https://lh3.googleusercontent.com/a/...",
      "createdAt": "2025-10-31T10:00:00.000Z",
      "updatedAt": "2025-10-31T10:00:00.000Z"
    }
  }
}
```

**Success Response (201 Created - New User):**
```json
{
  "status": "success",
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "672279abc123def456789012",
      "googleId": "1234567890",
      "email": "newuser@example.com",
      "name": "Jane Doe",
      "picture": "https://lh3.googleusercontent.com/a/...",
      "createdAt": "2025-10-31T10:00:00.000Z",
      "updatedAt": "2025-10-31T10:00:00.000Z"
    }
  }
}
```

**Error Responses:**

| Status Code | Error Message | Description |
|------------|---------------|-------------|
| 400 | Token is required | No token provided in request |
| 400 | Google ID not provided | Token doesn't contain Google ID |
| 400 | Email not provided by Google | Token doesn't contain email |
| 401 | Invalid token | Token verification failed |
| 401 | Invalid token or authentication failed | Token expired or invalid |

---

## Report APIs

### 1. Upload Report

**Endpoint:** `POST /api/reports/upload`

**Description:** Upload and encrypt a report file

**Request Type:** `multipart/form-data`

**Request Body:**
- `file` - File to upload (PDF, image, etc.)
- `uploadedBy` - User's MongoDB ObjectId

**Example using cURL:**
```bash
curl -X POST http://localhost:5000/api/reports/upload \
  -F "file=@/path/to/report.pdf" \
  -F "uploadedBy=672279abc123def456789012"
```

**Success Response (200 OK):**
```json
{
  "id": "672279def456789abc123456",
  "message": "File stored securely"
}
```

**Error Responses:**

| Status Code | Error Message | Description |
|------------|---------------|-------------|
| 400 | No file uploaded | File not provided in request |
| 400 | Missing uploadedBy | User ID not provided |
| 500 | Upload failed | Encryption or database error |

---

### 2. Download Report

**Endpoint:** `GET /api/reports/:id`

**Description:** Download and decrypt a report file

**URL Parameters:**
- `id` - Report's MongoDB ObjectId

**Success Response (200 OK):**
- **Headers:**
  - `Content-Disposition: attachment; filename="report.pdf"`
  - `Content-Type: application/pdf` (or appropriate MIME type)
- **Body:** Decrypted file binary data

**Error Responses:**

| Status Code | Error Message | Description |
|------------|---------------|-------------|
| 404 | File not found | Report with given ID doesn't exist |
| 500 | Download failed | Decryption or database error |

---

## Chat APIs

### 1. Create New Chat Window

**Endpoint:** `POST /api/chats/new`

**Description:** Create a new conversation/chat window for a user

**Request Body:**
```json
{
  "userId": "672279abc123def456789012"
}
```

**Success Response (201 Created):**
```json
{
  "status": "success",
  "message": "New chat window created successfully",
  "data": {
    "conversationId": "672280abc123def456789014",
    "conversation": {
      "_id": "672280abc123def456789014",
      "userId": "672279abc123def456789012",
      "messages": [],
      "createdAt": "2025-10-31T10:00:00.000Z",
      "updatedAt": "2025-10-31T10:00:00.000Z"
    }
  }
}
```

**Error Responses:**

| Status Code | Error Message | Description |
|------------|---------------|-------------|
| 400 | User ID is required | userId not provided |
| 500 | Failed to create new chat window | Database error |

---

### 2. Get Chat Summary

**Endpoint:** `POST /api/chats/summary`

**Description:** Generate AI summary of a conversation

**Request Body:**
```json
{
  "conversationId": "672280abc123def456789014"
}
```

**Success Response (200 OK):**
```json
{
  "status": "success",
  "message": "Chat summary generated successfully",
  "data": {
    "summary": "This conversation discussed medical reports and treatment options. The user uploaded 2 documents and received recommendations...",
    "messageCount": 15
  }
}
```

**Error Responses:**

| Status Code | Error Message | Description |
|------------|---------------|-------------|
| 400 | Conversation ID is required | conversationId not provided |
| 404 | Conversation not found | Invalid conversation ID |
| 400 | No messages to summarize | Conversation has no messages |
| 500 | Failed to generate chat summary | AI model or database error |

**Note:** AI integration is pending. Currently returns a placeholder summary.

---

### 3. Delete Conversation

**Endpoint:** `DELETE /api/chats/:id`

**Description:** Delete a conversation (files remain intact)

**URL Parameters:**
- `id` - Conversation's MongoDB ObjectId

**Success Response (200 OK):**
```json
{
  "status": "success",
  "message": "Conversation deleted successfully",
  "data": {
    "deletedConversationId": "672280abc123def456789014"
  }
}
```

**Error Responses:**

| Status Code | Error Message | Description |
|------------|---------------|-------------|
| 400 | Conversation ID is required | ID not provided |
| 404 | Conversation not found | Invalid conversation ID |
| 500 | Failed to delete conversation | Database error |

**Note:** Related Report files are NOT deleted when conversation is removed.

---

## General API Information

### Health Check

**Endpoint:** `GET /health`

**Description:** Check if server is running

**Success Response (200 OK):**
```json
{
  "status": "success",
  "message": "Server is healthy",
  "timestamp": "2025-10-31T10:00:00.000Z"
}
```

---

### Common Error Responses

**404 - Route Not Found:**
```json
{
  "status": "error",
  "message": "Route not found"
}
```

**500 - Internal Server Error:**
```json
{
  "status": "error",
  "statusCode": 500,
  "message": "Internal Server Error",
  "stack": "Error stack trace (development only)"
}
```

---

## Authentication & Authorization

**Note:** Currently, most endpoints are public. For production:
- Add JWT token authentication
- Protect routes with auth middleware
- Validate user ownership of resources

---

## Rate Limiting

**Not implemented yet.** Consider adding rate limiting for production.

---

## CORS Configuration

**Allowed Origins:** Configured in `.env` file (default: `http://localhost:3000`)

**Credentials:** Enabled

---

## File Upload Specifications

### Upload Report Endpoint

**Max File Size:** Not configured (default is ~1MB for Express)

**Supported File Types:** All types (filtered by mimetype storage)

**Recommended Configuration:**
```javascript
// Add to multer configuration
{
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
}
```

---

## Encryption Details

**Algorithm:** AES-256-GCM

**Key Management:**
- Currently generates new key on server restart
- **Production:** Store AES_KEY in environment variables
- **Security:** Use key management service (AWS KMS, Azure Key Vault, etc.)

**Encryption Fields:**
- `encryptedData` - Encrypted file buffer
- `iv` - Initialization vector (base64)
- `authTag` - Authentication tag (base64)

---

## Testing with Postman

### Import Collection Steps:

1. Create new collection "CB Backend APIs"
2. Add requests for each endpoint
3. Set environment variables:
   - `baseURL`: `http://localhost:5000/api`
   - `token`: Google OAuth token
   - `userId`: Test user ID
   - `conversationId`: Test conversation ID

### Example Postman Pre-request Script:
```javascript
pm.environment.set("timestamp", new Date().toISOString());
```

---

## Testing with cURL

### Google Sign-In:
```bash
curl -X POST http://localhost:5000/api/auth/google \
  -H "Content-Type: application/json" \
  -d '{"token": "your-google-token"}'
```

### Create Chat:
```bash
curl -X POST http://localhost:5000/api/chats/new \
  -H "Content-Type: application/json" \
  -d '{"userId": "672279abc123def456789012"}'
```

### Upload Report:
```bash
curl -X POST http://localhost:5000/api/reports/upload \
  -F "file=@report.pdf" \
  -F "uploadedBy=672279abc123def456789012"
```

### Download Report:
```bash
curl -X GET http://localhost:5000/api/reports/672279def456789abc123456 \
  --output downloaded-report.pdf
```

---

## Future Enhancements

- [ ] Add JWT authentication
- [ ] Implement pagination for list endpoints
- [ ] Add search and filter capabilities
- [ ] Implement WebSocket for real-time chat
- [ ] Add message sending endpoints
- [ ] Integrate actual AI model for summaries
- [ ] Add user profile endpoints
- [ ] Implement file sharing between users
- [ ] Add conversation archiving
- [ ] Implement conversation search

---

**Last Updated:** October 31, 2025

**Version:** 1.0.0
