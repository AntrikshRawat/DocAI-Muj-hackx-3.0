# Backend API Documentation

## 📋 Overview

This is the backend API for DocAI - a clinical history collection chatbot system. The API handles user chat sessions, message exchanges with an AI model, and generates clinical summaries.

**Base URL**: `http://localhost:5000/api`  
**Content-Type**: `application/json`  
**API Version**: 1.0  
**Last Updated**: October 31, 2025

---

## 🔗 Available Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/chats/new` | Create a new chat session |
| POST | `/chats/message` | Send a message to the AI chatbot |
| POST | `/chats/summary` | Get professional clinical summary |

---

## 📚 API Endpoints

### 1️⃣ Create New Chat Session

Start a new conversation session with the AI chatbot.

#### **Endpoint**

```http
POST /api/chats/new
```

#### **Request Headers**

```
Content-Type: application/json
```

#### **Request Body**

```json
{
  "userId": "507f1f77bcf86cd799439011"
}
```

#### **Request Body Schema**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | string (ObjectId) | ✅ Yes | MongoDB ObjectId of the user creating the chat |

#### **Success Response**

**Status Code**: `201 Created`

```json
{
  "status": "success",
  "message": "New chat window created successfully",
  "data": {
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "welcomeMessage": "Welcome! I'm DocAI, your clinical history assistant.\n\nI'll help collect your complete medical history before your doctor consultation. This will help your doctor provide you with the best possible care.\n\nI'll ask you 7 key questions to build your Electronic Health Record.\n\n**Let's begin: What brings you to the doctor today? (Chief Complaint)**"
  }
}
```

#### **Response Fields**

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | Response status (`"success"` or `"error"`) |
| `message` | string | Human-readable message |
| `data.sessionId` | string (UUID) | Unique session identifier - **save this for subsequent requests** |
| `data.welcomeMessage` | string | AI's welcome message with first question |

#### **Error Responses**

##### Missing userId

**Status Code**: `400 Bad Request`

```json
{
  "status": "error",
  "message": "User ID is required"
}
```

##### AI Service Unavailable

**Status Code**: `500 Internal Server Error`

```json
{
  "status": "error",
  "message": "Failed to initialize AI session. Please try again."
}
```

##### General Server Error

**Status Code**: `500 Internal Server Error`

```json
{
  "status": "error",
  "message": "Failed to create new chat window"
}
```

#### **Example Requests**

**cURL:**
```bash
curl -X POST http://localhost:5000/api/chats/new \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "507f1f77bcf86cd799439011"
  }'
```

**JavaScript (Fetch):**
```javascript
const response = await fetch('http://localhost:5000/api/chats/new', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    userId: '507f1f77bcf86cd799439011'
  })
});

const data = await response.json();
console.log('Session ID:', data.data.sessionId);
console.log('Welcome Message:', data.data.welcomeMessage);
```

**Python:**
```python
import requests

response = requests.post(
    'http://localhost:5000/api/chats/new',
    json={'userId': '507f1f77bcf86cd799439011'}
)

data = response.json()
print(f"Session ID: {data['data']['sessionId']}")
```

---

### 2️⃣ Send Message to AI Chatbot

Send a user message to the AI chatbot and receive a response.

#### **Endpoint**

```http
POST /api/chats/message
```

#### **Request Headers**

```
Content-Type: application/json
```

#### **Request Body**

```json
{
  "message": "I have severe headache and fever for 3 days",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "507f1f77bcf86cd799439011",
  "fileId": "507f1f77bcf86cd799439012"
}
```

#### **Request Body Schema**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `message` | string | ✅ Yes | User's message (1-5000 characters, non-empty) |
| `sessionId` | string (UUID) | ✅ Yes | Session ID from `/chats/new` endpoint |
| `userId` | string (ObjectId) | ✅ Yes | MongoDB ObjectId of the user |
| `fileId` | string (ObjectId) | ❌ No | Optional: Reference to an uploaded report |

#### **Input Validation Rules**

✅ **Valid Inputs**:
- "I have severe headache" → Accepted
- "no" → Accepted (negative response)
- "None" → Accepted (marks section as "None reported")
- Any meaningful text 1-5000 characters

❌ **Invalid Inputs**:
- `""` (empty string) → Error
- `"   "` (whitespace only) → Error
- `"\t\n"` (tabs/newlines only) → Error
- Strings > 5000 characters → Error

#### **Success Response**

**Status Code**: `200 OK`

```json
{
  "status": "success",
  "message": "Message sent and response received",
  "data": {
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "userMessage": {
      "text": "I have severe headache and fever for 3 days",
      "timestamp": "2025-10-31T14:30:00.000Z"
    },
    "aiResponse": {
      "text": "I'm sorry to hear you're experiencing a headache and fever. Can you tell me more about your current illness? When did it start? How has it been progressing? (History of Present Illness)",
      "timestamp": "2025-10-31T14:30:01.500Z"
    },
    "progress": 14,
    "completed": false,
    "messageCount": 2
  }
}
```

#### **Response Fields**

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | Response status (`"success"` or `"error"`) |
| `message` | string | Human-readable message |
| `data.sessionId` | string (UUID) | Session identifier |
| `data.userMessage.text` | string | User's message that was saved |
| `data.userMessage.timestamp` | string (ISO 8601) | When user message was saved |
| `data.aiResponse.text` | string | AI's response to the user |
| `data.aiResponse.timestamp` | string (ISO 8601) | When AI response was saved |
| `data.progress` | integer | Completion percentage (0-100) |
| `data.completed` | boolean | Whether all questions are answered |
| `data.messageCount` | integer | Total messages in conversation |

#### **Progress Tracking**

| Section | Progress % | Question Asked |
|---------|-----------|----------------|
| Chief Complaint | 14% | "What brings you to the doctor today?" |
| Present Illness | 28% | "Can you tell me more about your current illness?..." |
| Past Medical History | 42% | "Do you have any past medical conditions..." |
| Medications | 57% | "Are you currently taking any medications..." |
| Allergies | 71% | "Do you have any allergies?" |
| Family History | 85% | "Does anyone in your family have a history..." |
| Social History | 100% | "Can you tell me about your lifestyle..." |

#### **Error Responses**

##### Missing Required Fields

**Status Code**: `400 Bad Request`

```json
{
  "status": "error",
  "message": "Message, sessionId, and userId are required"
}
```

##### Empty Message

**Status Code**: `400 Bad Request`

```json
{
  "status": "error",
  "message": "Please provide an answer to the question. Your response cannot be empty."
}
```

##### Message Too Long

**Status Code**: `400 Bad Request`

```json
{
  "status": "error",
  "message": "Your message is too long. Please keep your response under 5000 characters."
}
```

##### Invalid User ID Format

**Status Code**: `400 Bad Request`

```json
{
  "status": "error",
  "message": "Invalid userId format"
}
```

##### AI Service Error

**Status Code**: `200 OK` (with error in response)

```json
{
  "status": "success",
  "message": "Message sent and response received",
  "data": {
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "userMessage": {...},
    "aiResponse": {
      "text": "Sorry, I encountered an error connecting to the AI service. Please try again.",
      "timestamp": "2025-10-31T14:30:01.500Z"
    },
    "progress": 0,
    "completed": false,
    "messageCount": 2
  }
}
```

##### General Server Error

**Status Code**: `500 Internal Server Error`

```json
{
  "status": "error",
  "message": "Failed to send message"
}
```

#### **Example Requests**

**cURL:**
```bash
curl -X POST http://localhost:5000/api/chats/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I have severe headache and fever",
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "507f1f77bcf86cd799439011"
  }'
```

**JavaScript (Fetch):**
```javascript
const response = await fetch('http://localhost:5000/api/chats/message', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: 'I have severe headache and fever',
    sessionId: '550e8400-e29b-41d4-a716-446655440000',
    userId: '507f1f77bcf86cd799439011'
  })
});

const data = await response.json();
console.log('AI Response:', data.data.aiResponse.text);
console.log('Progress:', data.data.progress + '%');
console.log('Completed:', data.data.completed);
```

**Python:**
```python
import requests

response = requests.post(
    'http://localhost:5000/api/chats/message',
    json={
        'message': 'I have severe headache and fever',
        'sessionId': '550e8400-e29b-41d4-a716-446655440000',
        'userId': '507f1f77bcf86cd799439011'
    }
)

data = response.json()
print(f"AI Response: {data['data']['aiResponse']['text']}")
print(f"Progress: {data['data']['progress']}%")
```

#### **Complete Conversation Example**

```javascript
// Step 1: Create session
const sessionRes = await fetch('http://localhost:5000/api/chats/new', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId: '507f1f77bcf86cd799439011' })
});
const { sessionId } = (await sessionRes.json()).data;

// Step 2: Answer all 7 questions
const answers = [
  "I have severe chest pain",
  "Started 2 hours ago suddenly, sharp pain",
  "I have diabetes and hypertension",
  "Metformin 500mg twice daily, Lisinopril 10mg daily",
  "Penicillin - causes rash",
  "Father had heart disease",
  "Non-smoker, occasional alcohol"
];

for (const answer of answers) {
  const msgRes = await fetch('http://localhost:5000/api/chats/message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: answer,
      sessionId,
      userId: '507f1f77bcf86cd799439011'
    })
  });
  
  const data = await msgRes.json();
  console.log(`Progress: ${data.data.progress}%`);
  
  if (data.data.completed) break;
}
```

---

### 3️⃣ Get Clinical Summary

Generate a professional, AI-refined clinical summary after completing the conversation.

#### **Endpoint**

```http
POST /api/chats/summary
```

#### **Request Headers**

```
Content-Type: application/json
```

#### **Request Body**

```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### **Request Body Schema**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sessionId` | string (UUID) | ✅ Yes | Session ID from `/chats/new` endpoint |

#### **Prerequisites**

Before calling this endpoint:
- ✅ Conversation must be marked as complete (`completed: true` from `/chats/message`)
- ✅ User must have answered all 7 questions
- ✅ Session must exist in both backend DB and AI service

#### **Success Response**

**Status Code**: `200 OK`

```json
{
  "status": "success",
  "message": "Chat summary generated successfully",
  "data": {
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "summary": "**ELECTRONIC HEALTH RECORD - CLINICAL SUMMARY**\nGenerated: 2025-10-31 14:30\n\n**CHIEF COMPLAINT:**\nSevere headaches for 3 days\n\n**HISTORY OF PRESENT ILLNESS:**\nPatient reports onset of right-sided headaches 3 days ago, temporally associated with prolonged computer use. Pain is exacerbated by screen exposure. Associated symptoms include intermittent nausea. No reported visual changes, photophobia, or neurological deficits.\n\n**PAST MEDICAL HISTORY:**\n- Hypertension\n- Type 2 Diabetes Mellitus (diagnosed 5 years ago)\n\n**CURRENT MEDICATIONS:**\n- Metformin 500mg PO BID\n- Lisinopril 10mg PO daily\n\n**ALLERGIES:**\nPenicillin (reaction: rash)\n\n**FAMILY HISTORY:**\n- Father: Cardiovascular disease\n- Mother: Diabetes mellitus\n\n**SOCIAL HISTORY:**\nOccupation: Software developer. Denies tobacco use. Alcohol consumption: social, approximately 2-3 beers on weekends.\n\n**REVIEW OF SYSTEMS:**\nNegative except as noted in HPI. No other systemic concerns reported.\n\n---\n**Prepared for physician review**",
    "messageCount": 14
  }
}
```

#### **Response Fields**

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | Response status (`"success"` or `"error"`) |
| `message` | string | Human-readable message |
| `data.sessionId` | string (UUID) | Session identifier |
| `data.summary` | string | Professional clinical summary with AI-refined medical terminology |
| `data.messageCount` | integer | Total messages in the conversation |

#### **AI Refinement Process**

The summary is **NOT** just raw user input. It undergoes AI processing:

**Before (Raw User Input)**:
```
"I've been having really bad headaches for like 3 days now"
"I take metformin 500mg twice daily and also lisinopril 10mg once in the morning"
```

**After (AI-Refined Professional Summary)**:
```
**CHIEF COMPLAINT:**
Severe headaches for 3 days

**CURRENT MEDICATIONS:**
- Metformin 500mg PO BID
- Lisinopril 10mg PO daily
```

**Refinement Features**:
- ✅ Removes conversational filler words
- ✅ Converts to professional medical terminology
- ✅ Uses standard abbreviations (PO, BID, daily)
- ✅ Writes in third person ("Patient reports...")
- ✅ Organizes into clear bullet points
- ✅ Maintains clinical accuracy

#### **Summary Structure**

The summary always includes these sections:

| Section | Content | Default if Empty |
|---------|---------|------------------|
| **Header** | Generated timestamp | Always included |
| **Chief Complaint** | Primary reason for visit | "Not specified" |
| **History of Present Illness** | Detailed symptom narrative | "Not specified" |
| **Past Medical History** | Chronic conditions | "None reported" |
| **Current Medications** | Prescriptions with dosages | "None reported" |
| **Allergies** | Drug/food allergies | "No known allergies" |
| **Family History** | Family medical conditions | "None reported" |
| **Social History** | Lifestyle factors | "None reported" |
| **Review of Systems** | Additional symptoms | "Negative except as noted in HPI" |
| **Footer** | "Prepared for physician review" | Always included |

#### **Error Responses**

##### Missing Session ID

**Status Code**: `400 Bad Request`

```json
{
  "status": "error",
  "message": "Session ID is required"
}
```

##### Conversation Not Completed

**Status Code**: `400 Bad Request`

```json
{
  "status": "error",
  "message": "Conversation not yet completed"
}
```

##### Session Not Found

**Status Code**: `400 Bad Request`

```json
{
  "status": "error",
  "message": "No sessions found"
}
```

OR

```json
{
  "status": "error",
  "message": "Invalid session ID"
}
```

##### AI Service Error

**Status Code**: `500 Internal Server Error`

```json
{
  "status": "error",
  "message": "Failed to generate chat summary from AI service"
}
```

##### General Server Error

**Status Code**: `500 Internal Server Error`

```json
{
  "status": "error",
  "message": "Failed to generate chat summary"
}
```

#### **Example Requests**

**cURL:**
```bash
curl -X POST http://localhost:5000/api/chats/summary \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

**JavaScript (Fetch):**
```javascript
const response = await fetch('http://localhost:5000/api/chats/summary', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    sessionId: '550e8400-e29b-41d4-a716-446655440000'
  })
});

const data = await response.json();
console.log('Clinical Summary:');
console.log(data.data.summary);

// Display in HTML
document.getElementById('summary-container').innerText = data.data.summary;
```

**Python:**
```python
import requests

response = requests.post(
    'http://localhost:5000/api/chats/summary',
    json={'sessionId': '550e8400-e29b-41d4-a716-446655440000'}
)

data = response.json()
print("Clinical Summary:")
print(data['data']['summary'])
```

---

## 🔄 Complete Workflow Example

### Full Conversation Flow (JavaScript)

```javascript
const BASE_URL = 'http://localhost:5000/api';
const USER_ID = '507f1f77bcf86cd799439011';

async function completeWorkflow() {
  try {
    // Step 1: Create new chat session
    console.log('Creating new chat session...');
    const sessionRes = await fetch(`${BASE_URL}/chats/new`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: USER_ID })
    });
    
    const sessionData = await sessionRes.json();
    const sessionId = sessionData.data.sessionId;
    console.log('Session ID:', sessionId);
    console.log('Welcome Message:', sessionData.data.welcomeMessage);
    
    // Step 2: Answer all 7 questions
    const answers = [
      "I have severe chest pain radiating to my left arm",
      "Started 2 hours ago suddenly while resting, sharp pain, 8/10 severity",
      "I have diabetes diagnosed 5 years ago and hypertension",
      "Metformin 500mg twice daily and Lisinopril 10mg once daily",
      "Penicillin - causes severe rash and itching",
      "My father had a heart attack at age 55",
      "I work as an accountant, don't smoke, drink 2-3 beers on weekends"
    ];
    
    console.log('\nStarting conversation...');
    for (let i = 0; i < answers.length; i++) {
      const msgRes = await fetch(`${BASE_URL}/chats/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: answers[i],
          sessionId: sessionId,
          userId: USER_ID
        })
      });
      
      const msgData = await msgRes.json();
      console.log(`\nQuestion ${i + 1}:`);
      console.log('User:', answers[i]);
      console.log('AI:', msgData.data.aiResponse.text.substring(0, 100) + '...');
      console.log('Progress:', msgData.data.progress + '%');
      
      // Check if conversation is complete
      if (msgData.data.completed) {
        console.log('\n✅ Conversation completed!');
        break;
      }
    }
    
    // Step 3: Get clinical summary
    console.log('\nGenerating clinical summary...');
    const summaryRes = await fetch(`${BASE_URL}/chats/summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: sessionId })
    });
    
    const summaryData = await summaryRes.json();
    console.log('\n' + '='.repeat(60));
    console.log('CLINICAL SUMMARY');
    console.log('='.repeat(60));
    console.log(summaryData.data.summary);
    console.log('='.repeat(60));
    console.log(`Total Messages: ${summaryData.data.messageCount}`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the workflow
completeWorkflow();
```

---

## ⚠️ Error Handling Reference

### Complete Error Table

| HTTP Status | Error Message | Endpoint | Cause | Solution |
|-------------|---------------|----------|-------|----------|
| 400 | `"User ID is required"` | `/chats/new` | Missing `userId` | Include `userId` in request |
| 400 | `"Message, sessionId, and userId are required"` | `/chats/message` | Missing required fields | Include all required fields |
| 400 | `"Please provide an answer..."` | `/chats/message` | Empty message | Send non-empty message |
| 400 | `"Your message is too long..."` | `/chats/message` | Message > 5000 chars | Shorten message |
| 400 | `"Invalid userId format"` | `/chats/message` | Invalid ObjectId | Use valid MongoDB ObjectId |
| 400 | `"Session ID is required"` | `/chats/summary` | Missing `sessionId` | Include `sessionId` in request |
| 400 | `"Conversation not yet completed"` | `/chats/summary` | Tried to get summary too early | Complete all questions first |
| 400 | `"No sessions found"` | `/chats/summary` | Session doesn't exist | Verify session ID |
| 500 | `"Failed to initialize AI session..."` | `/chats/new` | AI service down | Check AI service is running |
| 500 | `"Failed to send message"` | `/chats/message` | Server error | Retry request |
| 500 | `"Failed to generate chat summary..."` | `/chats/summary` | AI service error | Retry request |

### Error Handling Best Practices

```javascript
async function sendMessageWithErrorHandling(message, sessionId, userId) {
  try {
    const response = await fetch('http://localhost:5000/api/chats/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, sessionId, userId })
    });
    
    const data = await response.json();
    
    // Check for application-level errors
    if (data.status === 'error') {
      console.error('Application Error:', data.message);
      alert(data.message); // Show user-friendly message
      return null;
    }
    
    return data;
    
  } catch (error) {
    // Network or parsing errors
    console.error('Network Error:', error);
    alert('Unable to connect to server. Please try again.');
    return null;
  }
}
```

---

## 🧪 Testing with Postman

### Setup

1. **Create Collection**: "DocAI Backend API"
2. **Add Variable**: `sessionId`
3. **Add Variable**: `userId` = `"507f1f77bcf86cd799439011"`

### Request 1: Create Session

- **Method**: `POST`
- **URL**: `http://localhost:5000/api/chats/new`
- **Body** → raw → JSON:
```json
{
  "userId": "{{userId}}"
}
```
- **Tests**:
```javascript
pm.test("Status is 201", function() {
  pm.response.to.have.status(201);
});

pm.test("Has sessionId", function() {
  const json = pm.response.json();
  pm.expect(json.data).to.have.property('sessionId');
  pm.collectionVariables.set("sessionId", json.data.sessionId);
});
```

### Request 2: Send Message

- **Method**: `POST`
- **URL**: `http://localhost:5000/api/chats/message`
- **Body** → raw → JSON:
```json
{
  "message": "I have a headache",
  "sessionId": "{{sessionId}}",
  "userId": "{{userId}}"
}
```
- **Tests**:
```javascript
pm.test("Status is 200", function() {
  pm.response.to.have.status(200);
});

pm.test("Has progress", function() {
  const json = pm.response.json();
  pm.expect(json.data).to.have.property('progress');
});
```

### Request 3: Get Summary

- **Method**: `POST`
- **URL**: `http://localhost:5000/api/chats/summary`
- **Body** → raw → JSON:
```json
{
  "sessionId": "{{sessionId}}"
}
```
- **Tests**:
```javascript
pm.test("Status is 200", function() {
  pm.response.to.have.status(200);
});

pm.test("Has summary", function() {
  const json = pm.response.json();
  pm.expect(json.data).to.have.property('summary');
});
```

---

## 🚀 Getting Started

### Prerequisites

1. Node.js 18+ installed
2. MongoDB running
3. AI Model service running on `http://localhost:8080`

### Installation

```bash
# Install dependencies
npm install

# Create .env file
echo "PORT=5000
MONGODB_URI=mongodb://localhost:27017/docai-backend
AI_MODEL_BASE_URL=http://localhost:8080
CORS_ORIGIN=http://localhost:5173" > .env

# Start server
npm run dev
```

### Verify API is Running

```bash
curl http://localhost:5000/api/
```

Expected response:
```json
{
  "status": "success",
  "message": "Welcome to CB Backend API",
  "version": "1.0.0"
}
```

---

## 📊 Response Time Reference

| Endpoint | Typical Response Time | Notes |
|----------|----------------------|-------|
| `POST /chats/new` | 2-5 seconds | Calls AI service to create session |
| `POST /chats/message` | <200ms | Fast message save + AI response |
| `POST /chats/summary` | 2-5 seconds | AI refinement process |

---

## 🔐 Security Notes

⚠️ **Current Implementation** (Development):
- No authentication required
- No rate limiting
- CORS enabled for all origins

✅ **Production Recommendations**:
- Add JWT authentication middleware
- Implement rate limiting (express-rate-limit)
- Restrict CORS to specific origins
- Add request validation middleware
- Implement session expiration
- Add API key for AI service communication
- Use HTTPS/TLS
- Add request logging and monitoring

---

## 📞 Support

For issues or questions:
- Check error responses for detailed messages
- Verify AI Model service is running on port 8080
- Ensure MongoDB is accessible
- Check server logs for detailed error information

---

**API Version**: 1.0  
**Last Updated**: October 31, 2025  
**Framework**: Express.js + TypeScript  
**Database**: MongoDB + Mongoose  
**AI Integration**: DocAI Model API (http://localhost:8080)
