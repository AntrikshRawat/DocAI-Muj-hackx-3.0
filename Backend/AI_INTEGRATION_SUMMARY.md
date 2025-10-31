# Backend AI Integration Summary

## Overview
The backend has been fully integrated with the AI Model API (http://localhost:8080). All controllers now communicate with the AI service for medical chat functionality.

## Environment Configuration

Add to your `.env` file:
```env
AI_MODEL_BASE_URL=http://localhost:8080
```

## Updated Files

### 1. Configuration (`src/config/config.ts`)
- Added `aiModelBaseUrl` configuration option
- Default: `http://localhost:8080`

### 2. Chat Controllers

#### `createNewChat.ts`
**Route**: `POST /api/chats/new`
**Request Body**:
```json
{
  "userId": "507f1f77bcf86cd799439011"
}
```
**Response**:
```json
{
  "status": "success",
  "message": "New chat window created successfully",
  "data": {
    "conversationId": "...",
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "welcomeMessage": "Welcome! I'm DocAI...",
    "conversation": {...}
  }
}
```
**AI Integration**: Calls `GET /session/new` to create AI session

---

#### `createChatWithFile.ts` (NEW)
**Route**: `POST /api/chats/new/with-file`
**Request**: multipart/form-data
- `userId`: string (required)
- `file`: File (JSON or PDF, required)

**Response**:
```json
{
  "status": "success",
  "message": "New chat window created successfully with file data",
  "data": {
    "conversationId": "...",
    "sessionId": "...",
    "welcomeMessage": "...",
    "preFilledSections": ["Past Medical History", "Medications"],
    "extractedData": {...},
    "conversation": {...}
  }
}
```
**AI Integration**: Calls `POST /session/new/with-file` with file upload

---

#### `sendMessage.ts`
**Route**: `POST /api/chats/message`
**Request Body**:
```json
{
  "message": "I have severe headache",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "507f1f77bcf86cd799439011",
  "fileId": "507f1f77bcf86cd799439012" // optional
}
```

**Validation**:
- Message cannot be empty or whitespace only
- Message max length: 5000 characters
- userId must be valid ObjectId

**Response**:
```json
{
  "status": "success",
  "message": "Message sent and response received",
  "data": {
    "conversationId": "...",
    "sessionId": "...",
    "userMessage": {
      "text": "I have severe headache",
      "timestamp": "2025-10-31T12:00:00.000Z"
    },
    "aiResponse": {
      "text": "I'm sorry to hear...",
      "timestamp": "2025-10-31T12:00:01.000Z"
    },
    "progress": 14,
    "completed": false,
    "messageCount": 2
  }
}
```
**AI Integration**: Calls `POST /chat/{session_id}` with user message

---

#### `getChatSummary.ts`
**Route**: `POST /api/chats/summary`
**Request Body** (either one required):
```json
{
  "conversationId": "507f1f77bcf86cd799439011"
}
```
OR
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response**:
```json
{
  "status": "success",
  "message": "Chat summary generated successfully",
  "data": {
    "sessionId": "...",
    "conversationId": "...",
    "summary": "**ELECTRONIC HEALTH RECORD - CLINICAL SUMMARY**\n...",
    "messageCount": 14
  }
}
```
**AI Integration**: Calls `GET /summary/{session_id}` for professional summary

---

#### `deleteConversation.ts`
**Route**: `DELETE /api/chats/:id`
**No changes** - Deletes conversation from DB only (AI session remains)

---

### 3. Report Controller

#### `uploadReport.ts`
**Route**: `POST /api/reports/upload`
**Request**: multipart/form-data
- `file`: File (required)
- `uploadedBy`: ObjectId string (required)
- `sessionId`: string (required) ⬅️ **NEW REQUIRED FIELD**

**Response**:
```json
{
  "status": "success",
  "message": "File stored securely",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "filename": "report.pdf",
    "sessionId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

---

## Complete API Endpoints

| Method | Endpoint | Description | AI Integration |
|--------|----------|-------------|----------------|
| POST | `/api/chats/new` | Create new chat session | ✅ GET /session/new |
| POST | `/api/chats/new/with-file` | Create chat with medical file | ✅ POST /session/new/with-file |
| POST | `/api/chats/message` | Send message to AI | ✅ POST /chat/{session_id} |
| POST | `/api/chats/summary` | Get clinical summary | ✅ GET /summary/{session_id} |
| DELETE | `/api/chats/:id` | Delete conversation | ❌ Local only |
| POST | `/api/reports/upload` | Upload encrypted report | ❌ Local only |
| GET | `/api/reports/:id` | Download encrypted report | ❌ Local only |

---

## Data Flow

### New Chat Creation
```
Frontend → POST /api/chats/new
          → Backend creates DB conversation
          → Backend calls AI: GET /session/new
          → AI returns session_id + welcome_message
          → Backend stores sessionId in DB
          → Frontend receives sessionId + welcomeMessage
```

### Sending Messages
```
Frontend → POST /api/chats/message
          → Backend saves user message to DB
          → Backend calls AI: POST /chat/{session_id}
          → AI returns response + progress
          → Backend saves AI response to DB
          → Frontend receives both messages + progress
```

### Getting Summary
```
Frontend → POST /api/chats/summary
          → Backend finds sessionId from conversationId
          → Backend calls AI: GET /summary/{session_id}
          → AI returns professional EHR summary
          → Frontend displays summary
```

---

## Error Handling

All controllers handle these error scenarios:
1. **Missing required fields** → 400 Bad Request
2. **Invalid session ID** → AI returns error, forwarded to frontend
3. **AI service unavailable** → 500 Internal Server Error with fallback message
4. **Conversation not found** → 404 Not Found
5. **Empty/whitespace messages** → 400 Bad Request
6. **Message too long (>5000 chars)** → 400 Bad Request

---

## Testing

### 1. Start AI Model Service
```bash
cd AI-Model
python app.py
```
(Runs on http://localhost:8080)

### 2. Start Backend Service
```bash
cd Backend
npm run dev
```
(Runs on http://localhost:5000)

### 3. Test Flow
```bash
# Create new chat
curl -X POST http://localhost:5000/api/chats/new \
  -H "Content-Type: application/json" \
  -d '{"userId": "507f1f77bcf86cd799439011"}'

# Send message (use sessionId from above)
curl -X POST http://localhost:5000/api/chats/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I have severe headache",
    "sessionId": "YOUR_SESSION_ID",
    "userId": "507f1f77bcf86cd799439011"
  }'

# Get summary (after completing all 7 questions)
curl -X POST http://localhost:5000/api/chats/summary \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "YOUR_SESSION_ID"}'
```

---

## Database Schema Updates

### Conversation Model
```typescript
{
  userId: ObjectId,
  sessionId: string,  // ⬅️ AI session ID
  messages: [
    {
      sender: 'user' | 'llm',
      text: string,
      fileId?: ObjectId,
      timestamp: Date
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

### Report Model
```typescript
{
  filename: string,
  mimetype: string,
  encryptedData: Buffer,
  iv: string,
  authTag: string,
  uploadedBy: ObjectId,
  sessionId: string,  // ⬅️ NEW FIELD
  createdAt: Date,
  updatedAt: Date
}
```

---

## Next Steps

1. ✅ Add `AI_MODEL_BASE_URL=http://localhost:8080` to `.env`
2. ✅ Install dependencies if needed: `npm install`
3. ✅ Start AI Model service first
4. ✅ Start Backend service
5. ✅ Test endpoints with Postman or cURL
6. ⬜ Add authentication middleware (future)
7. ⬜ Add rate limiting (future)
8. ⬜ Add logging for AI requests (future)

---

## Dependencies

Make sure these are in `package.json`:
```json
{
  "dependencies": {
    "express": "^4.x",
    "mongoose": "^8.x",
    "multer": "^1.x",
    "dotenv": "^16.x"
  },
  "devDependencies": {
    "@types/multer": "^1.x"
  }
}
```

Run: `npm install` if any are missing.
