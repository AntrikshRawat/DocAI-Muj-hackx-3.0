# DocAI API - Complete Documentation

## 📋 Overview

The DocAI API is a RESTful API for Pre-Consultation Clinical History Collection powered by Google's Gemini AI. It enables interactive chatbot conversations to systematically gather patient medical history through 7 structured questions and generates professional EHR (Electronic Health Record) summaries for physicians.

**Base URL**: `http://localhost:8080`  
**API Version**: 1.0  
**AI Model**: Google Gemini 2.5 Pro  
**Last Updated**: October 31, 2025

---

## 🎯 Key Features

- ✅ Interactive 7-question clinical interview
- ✅ File upload support (JSON/PDF) for pre-filling data
- ✅ AI-powered summary refinement with medical terminology
- ✅ Real-time progress tracking
- ✅ Input validation and security checks
- ✅ Professional EHR-formatted output
- ✅ CORS enabled for web applications

---

## 🔗 Available Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/session/new` | Create a new conversation session | No |
| POST | `/session/new/with-file` | Create session with medical file upload | No |
| POST | `/chat/{session_id}` | Send patient message and get AI response | No |
| GET | `/summary/{session_id}` | Generate professional clinical summary | No |

---

---

## 📚 Table of Contents

1. [Endpoint 1: Create New Session](#1️⃣-create-new-session)
2. [Endpoint 2: Create Session with File Upload](#2️⃣-create-session-with-file-upload)
3. [Endpoint 3: Send Chat Message](#3️⃣-send-chat-message)
4. [Endpoint 4: Get Clinical Summary](#4️⃣-get-clinical-summary)
5. [Complete Workflow Examples](#🔄-complete-workflow-examples)
6. [Error Handling Reference](#⚠️-error-handling-reference)
7. [Testing Guide](#🧪-testing-guide)

---

## 🏥 Clinical History Sections

The chatbot collects information through **7 structured questions**:

1. **Chief Complaint** - Primary reason for visit
2. **History of Present Illness** - Current symptoms, timeline, progression
3. **Past Medical History** - Chronic conditions, previous diagnoses
4. **Current Medications** - Prescriptions, dosages, frequency
5. **Allergies** - Drug allergies, food allergies, reactions
6. **Family History** - Family members' medical conditions
7. **Social History** - Smoking, alcohol, occupation, lifestyle

**Progress Calculation**: Each section = ~14% progress (7 sections × 14% ≈ 100%)

---

## 1️⃣ Create New Session

Start a new conversation session without pre-existing medical data.

### **Endpoint**

```http
GET /session/new
```

### **Request**

**Headers**: None required  
**Body**: None  
**Query Parameters**: None

### **Success Response**

**Status Code**: `200 OK`

```json
{
  "session_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "welcome_message": "Welcome! I'm DocAI, your clinical history assistant.\n\nI'll help collect your complete medical history before your doctor consultation. This will help your doctor provide you with the best possible care.\n\nI'll ask you 7 key questions to build your Electronic Health Record.\n\n**Let's begin: What brings you to the doctor today? (Chief Complaint)**"
}
```

### **Response Fields**

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `session_id` | string (UUID) | Unique session identifier - save this! | `"550e8400-e29b-41d4-a716-446655440000"` |
| `welcome_message` | string | Initial greeting and first question | See above |

### **Possible Errors**

| Status Code | Error Response | Cause | Solution |
|-------------|----------------|-------|----------|
| 500 | `{"detail": "Internal server error"}` | Server/AI service failure | Check server logs, retry |

### **Example Requests**

**cURL:**
```bash
curl -X GET http://localhost:8080/session/new
```

**JavaScript (Fetch):**
```javascript
const response = await fetch('http://localhost:8080/session/new');
const data = await response.json();
console.log('Session ID:', data.session_id);
console.log('First Question:', data.welcome_message);
```

**Python:**
```python
import requests

response = requests.get('http://localhost:8080/session/new')
data = response.json()
print(f"Session ID: {data['session_id']}")
```

**Postman:**
- Method: `GET`
- URL: `http://localhost:8080/session/new`
- Save `session_id` from response for subsequent requests

### **Important Notes**

- ✅ Session IDs are required for all subsequent requests
- ✅ Sessions are stored in server memory (lost on restart)
- ✅ No expiration time - sessions persist until server restart
- ✅ Each session maintains its own conversation history

---

---

## 2️⃣ Create Session with File Upload

Start a session with pre-filled medical data extracted from JSON or PDF files.

### **Endpoint**

```http
POST /session/new/with-file
```

### **Request**

**Headers**: 
```
Content-Type: multipart/form-data
```

**Body**: Form-data with file attachment

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | ✅ Yes | Medical document (JSON or PDF) |

**Accepted File Types**:
- `.json` - Structured medical data
- `.pdf` - Medical reports, prescriptions, discharge summaries

**Maximum File Size**: No explicit limit (reasonable medical documents)

### **JSON File Format**

The API recognizes these field names (case-insensitive, multiple variations accepted):

```json
{
  "chief_complaint": "Severe headache for 3 days",
  "present_illness": "Started after prolonged computer use...",
  "past_medical_history": "Type 2 Diabetes, Hypertension",
  "medications": ["Metformin 500mg BID", "Lisinopril 10mg daily"],
  "allergies": "Penicillin - causes rash",
  "family_history": "Father: heart disease, Mother: diabetes",
  "social_history": "Non-smoker, occasional alcohol"
}
```

**Accepted Key Variations**:

| Section | Recognized Keys |
|---------|-----------------|
| Chief Complaint | `chief_complaint`, `complaint`, `reason`, `reason_for_visit` |
| Present Illness | `present_illness`, `current_illness`, `hpi`, `history_present_illness` |
| Past Medical History | `past_medical_history`, `medical_history`, `pmh`, `conditions`, `past_conditions` |
| Medications | `medications`, `current_medications`, `meds`, `drugs` |
| Allergies | `allergies`, `drug_allergies`, `allergic_to` |
| Family History | `family_history`, `family_medical_history`, `fh` |
| Social History | `social_history`, `social`, `sh`, `lifestyle` |
| Review of Systems | `review_of_systems`, `ros`, `systems_review` |

**Value Types Supported**:
- **String**: `"Diabetes"` → Stored as-is
- **Array**: `["Med1", "Med2"]` → Converted to `"Med1, Med2"`
- **Object**: `{"condition": "diabetes"}` → Converted to JSON string

### **PDF File Format**

Any medical document in PDF format. The AI will:
1. Extract all text from the PDF
2. Use Gemini AI to identify medical information
3. Structure it into the 7 clinical sections
4. Return parsed data or raw text if parsing fails

### **Success Response**

**Status Code**: `200 OK`

```json
{
  "session_id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "welcome_message": "Welcome! I've reviewed your uploaded medical records.\n\nI found information about: Past Medical History, Medications, Allergies, Family History, Social History.\n\nLet me ask you a few more questions to complete your clinical history.\n\n**What brings you to the doctor today?**",
  "pre_filled_sections": [
    "Past Medical History",
    "Medications",
    "Allergies",
    "Family History",
    "Social History"
  ],
  "extracted_data": {
    "past_medical_history": "Type 2 Diabetes Mellitus (diagnosed 2018), Hypertension",
    "medications": "Metformin 500mg twice daily, Lisinopril 10mg once daily",
    "allergies": "Penicillin (reaction: rash)",
    "family_history": "Father: Cardiovascular disease, Mother: Diabetes mellitus",
    "social_history": "Non-smoker, occasional alcohol consumption"
  }
}
```

### **Response Fields**

| Field | Type | Description |
|-------|------|-------------|
| `session_id` | string (UUID) | Unique session identifier |
| `welcome_message` | string | Personalized greeting mentioning found information |
| `pre_filled_sections` | array[string] | List of sections auto-filled from file |
| `extracted_data` | object | Structured medical data extracted from file |

### **Possible Errors**

| Status Code | Error Response | Cause | Solution |
|-------------|----------------|-------|----------|
| 400 | `{"detail": "Invalid file type. Only JSON and PDF files are allowed. Got: .txt"}` | Unsupported file extension | Upload only .json or .pdf files |
| 200* | `{"error": "Extracted data is not a dictionary: <type>"}` | JSON file contains array/string at root | Wrap in object: `{"field": "value"}` |
| 200* | `{"error": "No medical data could be extracted from the file"}` | File is empty or has no recognizable data | Check file content, use valid medical data |
| 200* | `{"error": "Invalid JSON format: ..."}` | Malformed JSON syntax | Validate JSON syntax |
| 200* | `{"error": "Failed to parse PDF: ..."}` | Corrupted PDF or extraction failed | Check PDF integrity, try different file |
| 200* | `{"error": "Failed to process file: ..."}` | Generic processing error | Check file format, retry |
| 500 | `{"detail": "Internal server error"}` | Server/AI service failure | Check server logs, retry |

*Note: Some errors return 200 status with error field in JSON (for easier client handling)

### **Example Requests**

**cURL:**
```bash
# JSON file upload
curl -X POST http://localhost:8080/session/new/with-file \
  -F "file=@medical_history.json"

# PDF file upload
curl -X POST http://localhost:8080/session/new/with-file \
  -F "file=@lab_report.pdf"
```

**JavaScript (Fetch):**
```javascript
const fileInput = document.getElementById('fileInput');
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('http://localhost:8080/session/new/with-file', {
  method: 'POST',
  body: formData
});

const data = await response.json();

if (data.error) {
  console.error('Error:', data.error);
} else {
  console.log('Session ID:', data.session_id);
  console.log('Pre-filled:', data.pre_filled_sections);
  console.log('Extracted:', data.extracted_data);
}
```

**Python:**
```python
import requests

with open('medical_history.json', 'rb') as f:
    files = {'file': f}
    response = requests.post(
        'http://localhost:8080/session/new/with-file',
        files=files
    )

data = response.json()
if 'error' in data:
    print(f"Error: {data['error']}")
else:
    print(f"Session ID: {data['session_id']}")
    print(f"Pre-filled: {data['pre_filled_sections']}")
```

**Postman:**
1. Method: `POST`
2. URL: `http://localhost:8080/session/new/with-file`
3. Body tab → `form-data`
4. Key: `file` (change type to "File" from dropdown)
5. Value: Click "Select Files" and choose your JSON/PDF
6. Send request

### **Important Notes**

- ✅ Pre-filled sections skip their questions in the conversation
- ✅ You only need to answer questions for missing sections
- ✅ PDF processing uses AI and may take 2-5 seconds
- ✅ JSON parsing is instant
- ✅ If extraction fails, you can still complete the full interview
- ⚠️ Large PDFs (>10 pages) may have truncated text (first 3000 chars used)

---

---

## 3️⃣ Send Chat Message

Send a patient's message to the chatbot and receive an AI-generated response with the next question.

### **Endpoint**

```http
POST /chat/{session_id}
```

### **Request**

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `session_id` | string (UUID) | ✅ Yes | Session ID from session creation endpoint |

**Headers**: 
```
Content-Type: application/json
```

**Body**:

```json
{
  "user_message": "I have severe headache and fever for 3 days"
}
```

### **Request Body Schema**

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `user_message` | string | ✅ Yes | 1-5000 characters, cannot be empty/whitespace | Patient's answer to current question |

### **Input Validation Rules**

✅ **Valid Inputs**:
- "I have a headache" → Accepted
- "no" → Accepted (negative response)
- "None" → Accepted (marks section as "None reported")
- Any meaningful text 1-5000 characters

❌ **Invalid Inputs**:
- `""` (empty string) → Error
- `"   "` (whitespace only) → Error
- `"\t\n"` (tabs/newlines only) → Error
- Strings > 5000 characters → Error

### **Success Response**

**Status Code**: `200 OK`

**Response Schema**:

```json
{
  "message": "Thank you for sharing that. I understand your concern.\n\n**Can you tell me more about your current illness? When did it start? How has it been progressing? (History of Present Illness)**",
  "progress": 14,
  "completed": false
}
```

### **Response Fields**

| Field | Type | Description | Possible Values |
|-------|------|-------------|-----------------|
| `message` | string | Chatbot's acknowledgment + next question OR final message | AI-generated response |
| `progress` | integer | Completion percentage | 0, 14, 28, 42, 57, 71, 85, 100 |
| `completed` | boolean | Whether all questions are answered | `false` during conversation, `true` at end |

### **Special Response: File Upload Prompt**

After completing all 7 questions, the chatbot asks about file upload:

```json
{
  "message": "Thank you for sharing that information.\n\n**🎉 Thank you so much for providing all this information!**\n\nI've collected all 7 key details for your Electronic Health Record:\n✓ Chief Complaint\n✓ History of Present Illness\n✓ Past Medical History\n✓ Current Medications\n✓ Allergies\n✓ Family History\n✓ Social History\n\nThis comprehensive information will help your doctor provide you with the best possible care during your consultation.\n\n**Would you like to upload any additional medical records (PDF or JSON format) to supplement this information?**",
  "progress": 100,
  "completed": false
}
```

**User should respond**: "yes" or "no"

### **Response to File Upload Question**

**If user says "yes"**:
```json
{
  "message": "Great! Please upload your medical file (PDF or JSON format) using the file upload feature in the interface.",
  "progress": 100,
  "completed": true,
  "awaiting_file": true
}
```

**If user says "no"**:
```json
{
  "message": "No problem! Your clinical history collection is complete. This information will be available for your doctor to review.",
  "progress": 100,
  "completed": true
}
```

### **Progress Tracking**

| Section | Progress % | Question Asked |
|---------|-----------|----------------|
| Chief Complaint | 14% | "What brings you to the doctor today?" |
| Present Illness | 28% | "Can you tell me more about your current illness?..." |
| Past Medical History | 42% | "Do you have any past medical conditions..." |
| Medications | 57% | "Are you currently taking any medications..." |
| Allergies | 71% | "Do you have any allergies? If so, which are they?" |
| Family History | 85% | "Does anyone in your family have a history..." |
| Social History | 100% | "Can you tell me about your lifestyle..." |
| File Upload Prompt | 100% | "Would you like to upload any additional medical records?" |

### **Possible Errors**

| Status Code | Error Response | Cause | Solution |
|-------------|----------------|-------|----------|
| 200 | `{"error": "Invalid session"}` | Session ID doesn't exist | Create new session first |
| 200 | `{"error": "Please provide an answer to the question. Your response cannot be empty."}` | Empty `user_message` field | Provide a non-empty message |
| 200 | `{"error": "Your message is too long. Please keep your response under 5000 characters."}` | Message exceeds 5000 chars | Shorten your message |
| 422 | `{"detail": [{"loc": ["body", "user_message"], "msg": "field required"}]}` | Missing `user_message` field | Include `user_message` in request body |
| 500 | `{"detail": "Internal server error"}` | Server/AI service failure | Retry request, check server logs |

### **Example Requests**

**cURL - First Message:**
```bash
curl -X POST http://localhost:8080/chat/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{"user_message": "I have severe headache and fever"}'
```

**cURL - Negative Response:**
```bash
curl -X POST http://localhost:8080/chat/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{"user_message": "no"}'
```

**JavaScript (Fetch) - Full Conversation:**
```javascript
const sessionId = 'your-session-id-here';

// Function to send message
async function sendMessage(message) {
  const response = await fetch(`http://localhost:8080/chat/${sessionId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ user_message: message })
  });
  
  const data = await response.json();
  
  if (data.error) {
    console.error('Error:', data.error);
    return null;
  }
  
  console.log('Bot:', data.message);
  console.log('Progress:', data.progress + '%');
  console.log('Completed:', data.completed);
  
  return data;
}

// Example conversation
await sendMessage("I have severe headache and fever");
await sendMessage("Started 3 days ago, getting worse");
await sendMessage("I have diabetes and high blood pressure");
await sendMessage("Metformin 500mg twice daily and Lisinopril 10mg");
await sendMessage("Penicillin - I get a rash");
await sendMessage("My father had heart disease");
await sendMessage("I don't smoke, occasional alcohol");
await sendMessage("yes"); // To file upload question
```

**Python:**
```python
import requests

session_id = 'your-session-id-here'
base_url = 'http://localhost:8080'

def send_message(message):
    response = requests.post(
        f'{base_url}/chat/{session_id}',
        json={'user_message': message}
    )
    data = response.json()
    
    if 'error' in data:
        print(f"Error: {data['error']}")
        return None
    
    print(f"Bot: {data['message']}")
    print(f"Progress: {data['progress']}%")
    print(f"Completed: {data['completed']}")
    return data

# Example usage
send_message("I have severe headache and fever")
send_message("Started 3 days ago")
```

**Postman:**
1. Method: `POST`
2. URL: `http://localhost:8080/chat/{{session_id}}`
3. Headers: `Content-Type: application/json`
4. Body → raw → JSON:
```json
{
  "user_message": "I have a headache"
}
```

### **Important Notes**

- ✅ You can answer "no" or "none" for any section - it will be recorded as "None reported"
- ✅ The chatbot automatically advances to the next question after each response
- ✅ No need to wait for `completed: true` - you can send messages continuously
- ✅ Each section's answer is stored immediately in `session_data`
- ✅ Conversation history is maintained throughout the session
- ⚠️ Empty/whitespace-only messages are rejected with error
- ⚠️ Messages over 5000 characters are rejected
- 💡 The chatbot provides empathetic acknowledgments based on your responses

---

### Request

```http
POST /session/new/with-file
```

**Headers**: `Content-Type: multipart/form-data`

**Body**: Form-data with file upload

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | Yes | JSON (.json) or PDF (.pdf) file containing medical records |

### Supported File Types

**1. JSON Files (.json)**

The API recognizes these field names (case-insensitive):

```json
{
  "past_medical_history": "Type 2 Diabetes, Hypertension",
  "medications": ["Metformin 500mg", "Lisinopril 10mg"],
  "allergies": ["Penicillin"],
  "family_history": "Father had heart disease",
  "social_history": "Non-smoker, occasional drinker"
}
```

Accepted JSON keys per section:
- **Chief Complaint**: `chief_complaint`, `complaint`, `reason`, `reason_for_visit`
- **Present Illness**: `present_illness`, `current_illness`, `hpi`
- **Past Medical History**: `past_medical_history`, `medical_history`, `pmh`, `conditions`
- **Medications**: `medications`, `current_medications`, `meds`, `drugs`
- **Allergies**: `allergies`, `drug_allergies`, `allergic_to`
- **Family History**: `family_history`, `family_medical_history`, `fh`
- **Social History**: `social_history`, `social`, `lifestyle`
- **Review of Systems**: `review_of_systems`, `ros`

**2. PDF Files (.pdf)**

Any medical document (lab reports, prescriptions, discharge summaries, etc.). The AI will extract and structure the information automatically.

### Response

**Status Code**: `200 OK`

```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "welcome_message": "Welcome! I've reviewed your uploaded medical records.\n\nI found information about: Past Medical History, Medications, Allergies, Family History, Social History.\n\nLet me ask you a few more questions to complete your clinical history.\n\n**What brings you to the doctor today?**",
  "pre_filled_sections": [
    "Past Medical History",
    "Medications",
    "Allergies",
    "Family History",
    "Social History"
  ],
  "extracted_data": {
    "past_medical_history": "Type 2 Diabetes Mellitus (diagnosed 2018), Hypertension",
    "medications": "Metformin 500mg twice daily, Lisinopril 10mg once daily",
    "allergies": "Penicillin (causes rash)",
    "family_history": "Father had coronary artery disease",
    "social_history": "Non-smoker, occasional alcohol"
  }
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `session_id` | string (UUID) | Unique identifier for this conversation session |
| `welcome_message` | string | Personalized greeting mentioning pre-filled sections |
| `pre_filled_sections` | array[string] | List of sections that were auto-filled from the file |
| `extracted_data` | object | Structured medical data extracted from the file |

### Error Response

**Status Code**: `400 Bad Request` (Invalid file type)

```json
{
  "detail": "Invalid file type. Only JSON and PDF files are allowed. Got: .txt"
}
```

**Status Code**: `200 OK` (Processing error)

```json
{
  "error": "Failed to process file: Invalid JSON format: ..."
}
```

### Example (cURL)

```bash
curl -X POST http://localhost:8080/session/new/with-file \
  -F "file=@test.json"
```

### Example (JavaScript)

```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

fetch('http://localhost:8080/session/new/with-file', {
  method: 'POST',
  body: formData
})
  .then(response => response.json())
  .then(data => {
    console.log('Session ID:', data.session_id);
    console.log('Pre-filled sections:', data.pre_filled_sections);
  });
```

---

## 3️⃣ Send Chat Message

Send a patient message to the chatbot and receive a response.

### Request

```http
POST /chat/{session_id}
```

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `session_id` | string | Yes | Session ID from session creation endpoint |

**Headers**: `Content-Type: application/json`

**Body**:

```json
{
  "user_message": "I have severe headache and fever"
}
```

### Request Body Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `user_message` | string | Yes | Patient's message (minimum 3 words recommended) |

### Response

**Status Code**: `200 OK`

```json
{
  "message": "I'm sorry to hear you're experiencing a headache and fever. Can you tell me when these symptoms started?\n\nThank you for sharing that information. Let's move to the next topic...",
  "progress": 12,
  "completed": false
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `message` | string | Chatbot's response to the patient |
| `progress` | integer | Completion percentage (0-100) |
| `completed` | boolean | Whether the conversation is complete |

### Progress Tracking

The conversation has 8 sections:
1. Chief Complaint (12%)
2. Present Illness (25%)
3. Past Medical History (37%)
4. Medications (50%)
5. Allergies (62%)
6. Family History (75%)
7. Social History (87%)
8. Review of Systems (100%)

After 8 messages (or fewer if file was uploaded), `completed` becomes `true`.

### Error Response

**Invalid Session ID**:

```json
{
  "error": "Invalid session ID"
}
```

### Example (cURL)

```bash
curl -X POST http://localhost:8080/chat/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{"user_message": "I have severe headache and fever"}'
```

### Example (JavaScript)

```javascript
fetch('http://localhost:8080/chat/550e8400-e29b-41d4-a716-446655440000', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    user_message: 'I have severe headache and fever'
  })
})
  .then(response => response.json())
  .then(data => {
    console.log('Bot:', data.message);
    console.log('Progress:', data.progress + '%');
    console.log('Completed:', data.completed);
  });
```

---

## 4️⃣ Get Clinical Summary

Generate a professional, AI-refined clinical summary after completing the conversation.

### **Endpoint**

```http
GET /summary/{session_id}
```

### **Request**

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `session_id` | string (UUID) | ✅ Yes | Session ID from session creation endpoint |

**Headers**: None required  
**Body**: None  
**Query Parameters**: None

### **Prerequisites**

Before calling this endpoint:
- ✅ Conversation must be marked as complete (`completed: true` from `/chat`)
- ✅ User must have answered all 7 questions (or answered file upload question)
- ✅ Session must exist in server memory

### **Success Response**

**Status Code**: `200 OK`

```json
{
  "summary": "**ELECTRONIC HEALTH RECORD - CLINICAL SUMMARY**\nGenerated: 2025-10-31 14:30\n\n**CHIEF COMPLAINT:**\nSevere headaches for 3 days\n\n**HISTORY OF PRESENT ILLNESS:**\nPatient reports onset of right-sided headaches 3 days ago, temporally associated with prolonged computer use. Pain is exacerbated by screen exposure. Associated symptoms include intermittent nausea. No reported visual changes, photophobia, or neurological deficits.\n\n**PAST MEDICAL HISTORY:**\n- Hypertension\n- Type 2 Diabetes Mellitus (diagnosed 5 years ago)\n\n**CURRENT MEDICATIONS:**\n- Metformin 500mg PO BID\n- Lisinopril 10mg PO daily\n\n**ALLERGIES:**\nPenicillin (reaction: rash)\n\n**FAMILY HISTORY:**\n- Father: Cardiovascular disease\n- Mother: Diabetes mellitus\n\n**SOCIAL HISTORY:**\nOccupation: Software developer. Denies tobacco use. Alcohol consumption: social, approximately 2-3 beers on weekends.\n\n**REVIEW OF SYSTEMS:**\nNegative except as noted in HPI. No other systemic concerns reported.\n\n---\n**Prepared for physician review**"
}
```

### **Response Fields**

| Field | Type | Description |
|-------|------|-------------|
| `summary` | string | Professional clinical summary with AI-refined medical terminology |

### **AI Refinement Process**

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
- ✅ Removes conversational filler words ("like", "really", "just")
- ✅ Converts to professional medical terminology
- ✅ Uses standard abbreviations (PO = by mouth, BID = twice daily)
- ✅ Writes in third person ("Patient reports...")
- ✅ Organizes information into clear bullet points
- ✅ Maintains clinical accuracy and completeness

### **Summary Structure**

The summary always includes these 8 sections:

| Section | Content | Default if Empty |
|---------|---------|------------------|
| **Header** | Generated timestamp | Always included |
| **Chief Complaint** | Primary reason for visit | "Not specified" |
| **History of Present Illness** | Detailed symptom narrative | "Not specified" |
| **Past Medical History** | Chronic conditions | "None reported" |
| **Current Medications** | Prescriptions with dosages | "None reported" |
| **Allergies** | Drug/food allergies with reactions | "No known allergies" |
| **Family History** | Family members' conditions | "None reported" |
| **Social History** | Lifestyle factors | "None reported" |
| **Review of Systems** | Additional symptoms | "No concerns reported" or "Negative except as noted in HPI" |
| **Footer** | "Prepared for physician review" | Always included |

### **Possible Errors**

| Status Code | Error Response | Cause | Solution |
|-------------|----------------|-------|----------|
| 200 | `{"error": "No sessions found"}` | Session ID doesn't exist | Verify session ID, create new session |
| 200 | `{"error": "Invalid session ID"}` | Session ID doesn't exist (alternate message) | Verify session ID |
| 200 | `{"error": "Conversation not yet completed"}` | User hasn't finished all questions | Complete all 7 questions first |
| 500 | `{"detail": "Internal server error"}` | AI service failed during refinement | Retry request (falls back to basic summary) |

**Note**: Fallback mechanism ensures you always get a summary even if AI refinement fails.

### **Processing Time**

- **Without AI Refinement**: <100ms
- **With AI Refinement**: 2-5 seconds (using Gemini AI)

### **Example Requests**

**cURL:**
```bash
curl -X GET http://localhost:8080/summary/550e8400-e29b-41d4-a716-446655440000
```

**JavaScript (Fetch):**
```javascript
async function getSummary(sessionId) {
  const response = await fetch(`http://localhost:8080/summary/${sessionId}`);
  const data = await response.json();
  
  if (data.error) {
    console.error('Error:', data.error);
    return null;
  }
  
  console.log('Clinical Summary:');
  console.log(data.summary);
  
  // Display formatted summary
  document.getElementById('summary-container').innerText = data.summary;
  
  return data.summary;
}

// Usage
const summary = await getSummary('your-session-id');
```

**Python:**
```python
import requests

def get_summary(session_id):
    response = requests.get(
        f'http://localhost:8080/summary/{session_id}'
    )
    data = response.json()
    
    if 'error' in data:
        print(f"Error: {data['error']}")
        return None
    
    print("Clinical Summary:")
    print(data['summary'])
    return data['summary']

# Usage
summary = get_summary('your-session-id-here')
```

**Postman:**
1. Method: `GET`
2. URL: `http://localhost:8080/summary/{{session_id}}`
3. Send request
4. View formatted summary in response body

### **Important Notes**

- ✅ Can only be called ONCE per session after `completed: true`
- ✅ Summary is generated dynamically each time (not cached)
- ✅ Uses Gemini 2.5 Pro for intelligent refinement
- ✅ Falls back to basic formatting if AI fails
- ✅ Safe to call multiple times (regenerates each time)
- ⚠️ Do not call before conversation is complete (will error)
- 💡 The summary is suitable for direct physician review
- 💡 Can be saved to PDF, printed, or integrated into EMR systems

---

## 🔄 Complete Workflow Examples

### **Workflow A: Full Interview (No File Upload)**

Complete conversation flow from start to finish:

```javascript
// Step 1: Create new session
const sessionRes = await fetch('http://localhost:8080/session/new');
const { session_id, welcome_message } = await sessionRes.json();
console.log(welcome_message); // Display first question

// Step 2: Answer all 7 questions
const answers = [
  "I have severe chest pain radiating to my left arm",
  "Started 2 hours ago suddenly while resting, sharp pain, 8/10 severity",
  "I have diabetes diagnosed 5 years ago and hypertension",
  "Metformin 500mg twice daily and Lisinopril 10mg once daily in the morning",
  "Penicillin - causes severe rash and itching",
  "My father had a heart attack at age 55 and my mother has diabetes",
  "I work as an accountant, don't smoke, drink 2-3 beers on weekends"
];

for (const answer of answers) {
  const chatRes = await fetch(`http://localhost:8080/chat/${session_id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_message: answer })
  });
  
  const data = await chatRes.json();
  console.log(`Progress: ${data.progress}%`);
  console.log(`Bot: ${data.message}`);
  
  if (data.progress === 100 && !data.completed) {
    // File upload question - answer it
    const fileRes = await fetch(`http://localhost:8080/chat/${session_id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_message: "no" })
    });
    break;
  }
}

// Step 3: Get professional summary
const summaryRes = await fetch(`http://localhost:8080/summary/${session_id}`);
const { summary } = await summaryRes.json();
console.log('Final Summary:', summary);
```

### **Workflow B: With File Upload (Faster)**

Pre-fill data from file, then answer remaining questions:

```javascript
// Step 1: Upload medical file
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const sessionRes = await fetch('http://localhost:8080/session/new/with-file', {
  method: 'POST',
  body: formData
});

const { session_id, pre_filled_sections, extracted_data } = await sessionRes.json();
console.log('Pre-filled:', pre_filled_sections);
console.log('Extracted:', extracted_data);

// Step 2: Answer only missing sections (usually Chief Complaint + Present Illness)
const answers = [
  "I have severe chest pain",
  "Started 2 hours ago, sharp pain, 8/10, radiates to left arm"
];

for (const answer of answers) {
  const chatRes = await fetch(`http://localhost:8080/chat/${session_id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_message: answer })
  });
  
  const data = await chatRes.json();
  if (data.completed) break;
}

// Step 3: Get summary
const summaryRes = await fetch(`http://localhost:8080/summary/${session_id}`);
const { summary } = await summaryRes.json();
console.log(summary);
```

### **Workflow C: Python Example**

```python
import requests
import json

BASE_URL = 'http://localhost:8080'

# Step 1: Create session
response = requests.get(f'{BASE_URL}/session/new')
session_data = response.json()
session_id = session_data['session_id']
print(session_data['welcome_message'])

# Step 2: Send messages
answers = [
    "Severe headache and fever",
    "Started 3 days ago, getting progressively worse",
    "Type 2 Diabetes and Hypertension",
    "Metformin 500mg BID, Lisinopril 10mg daily",
    "Penicillin - causes rash",
    "Father had heart disease",
    "Non-smoker, social drinker"
]

for answer in answers:
    response = requests.post(
        f'{BASE_URL}/chat/{session_id}',
        json={'user_message': answer}
    )
    data = response.json()
    print(f"Progress: {data['progress']}%")
    print(f"Bot: {data['message']}\n")
    
    # Handle file upload question
    if data['progress'] == 100 and not data['completed']:
        requests.post(
            f'{BASE_URL}/chat/{session_id}',
            json={'user_message': 'no'}
        )
        break

# Step 3: Get summary
response = requests.get(f'{BASE_URL}/summary/{session_id}')
summary_data = response.json()
print("\n=== CLINICAL SUMMARY ===")
print(summary_data['summary'])
```

---

## ⚠️ Error Handling Reference

### **Complete Error Table**

| HTTP Status | Error Message | Endpoint | Cause | Solution |
|-------------|---------------|----------|-------|----------|
| 200 | `{"error": "Invalid session"}` | `/chat` | Session doesn't exist | Create new session |
| 200 | `{"error": "Invalid session ID"}` | `/summary` | Session doesn't exist | Verify session ID |
| 200 | `{"error": "No sessions found"}` | `/summary` | Session doesn't exist | Create new session |
| 200 | `{"error": "Conversation not yet completed"}` | `/summary` | Tried to get summary too early | Complete all questions first |
| 200 | `{"error": "Please provide an answer..."}` | `/chat` | Empty `user_message` | Send non-empty message |
| 200 | `{"error": "Your message is too long..."}` | `/chat` | Message > 5000 chars | Shorten message |
| 200 | `{"error": "Extracted data is not a dictionary..."}` | `/session/new/with-file` | JSON has array/string at root | Use object format |
| 200 | `{"error": "No medical data could be extracted..."}` | `/session/new/with-file` | Empty or unrecognizable file | Check file content |
| 200 | `{"error": "Invalid JSON format: ..."}` | `/session/new/with-file` | Malformed JSON | Validate JSON syntax |
| 200 | `{"error": "Failed to parse PDF: ..."}` | `/session/new/with-file` | PDF parsing error | Check PDF integrity |
| 200 | `{"error": "Failed to process file: ..."}` | `/session/new/with-file` | Generic file error | Retry with different file |
| 400 | `{"detail": "Invalid file type. Only JSON and PDF..."}` | `/session/new/with-file` | Wrong file extension | Use .json or .pdf only |
| 422 | `{"detail": [{"loc": [...], "msg": "field required"}]}` | `/chat` | Missing `user_message` field | Include required field |
| 500 | `{"detail": "Internal server error"}` | Any | Server/AI service failure | Check logs, retry |

### **Error Handling Best Practices**

**JavaScript:**
```javascript
async function sendMessage(sessionId, message) {
  try {
    const response = await fetch(`http://localhost:8080/chat/${sessionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_message: message })
    });
    
    const data = await response.json();
    
    // Check for application-level errors (200 status with error field)
    if (data.error) {
      console.error('Application Error:', data.error);
      alert(data.error); // Show user-friendly message
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

**Python:**
```python
def send_message(session_id, message):
    try:
        response = requests.post(
            f'http://localhost:8080/chat/{session_id}',
            json={'user_message': message},
            timeout=10
        )
        
        # Check HTTP status
        if response.status_code >= 400:
            print(f"HTTP Error {response.status_code}: {response.text}")
            return None
        
        data = response.json()
        
        # Check application error
        if 'error' in data:
            print(f"Application Error: {data['error']}")
            return None
        
        return data
        
    except requests.exceptions.Timeout:
        print("Request timed out")
        return None
    except requests.exceptions.ConnectionError:
        print("Cannot connect to server")
        return None
    except Exception as e:
        print(f"Unexpected error: {e}")
        return None
```

### **Input Validation Checklist**

Before sending to `/chat` endpoint:

✅ **Check message is not empty**:
```javascript
if (!userMessage || !userMessage.trim()) {
  alert('Please enter a message');
  return;
}
```

✅ **Check message length**:
```javascript
if (userMessage.length > 5000) {
  alert('Message too long. Please keep under 5000 characters.');
  return;
}
```

✅ **Trim whitespace**:
```javascript
const message = userMessage.trim();
```

---

## 🧪 Testing Guide

### **Manual Testing with cURL**

**Complete flow:**
```bash
# 1. Create session
SESSION_ID=$(curl -s http://localhost:8080/session/new | jq -r '.session_id')
echo "Session ID: $SESSION_ID"

# 2. Send first message
curl -X POST http://localhost:8080/chat/$SESSION_ID \
  -H "Content-Type: application/json" \
  -d '{"user_message": "I have a headache"}'

# 3. Send remaining messages (repeat 6 more times)
curl -X POST http://localhost:8080/chat/$SESSION_ID \
  -H "Content-Type: application/json" \
  -d '{"user_message": "Started yesterday"}'

# ... continue for all 7 questions ...

# 4. Answer file upload question
curl -X POST http://localhost:8080/chat/$SESSION_ID \
  -H "Content-Type: application/json" \
  -d '{"user_message": "no"}'

# 5. Get summary
curl http://localhost:8080/summary/$SESSION_ID
```

### **Testing with Postman**

**Setup Collection:**

1. **Create Collection**: "DocAI API Tests"
2. **Add Variable**: `session_id`
3. **Create 4 Requests**:

**Request 1: Create Session**
- Method: `GET`
- URL: `http://localhost:8080/session/new`
- Tests tab:
```javascript
pm.test("Status is 200", function() {
  pm.response.to.have.status(200);
});

pm.test("Has session_id", function() {
  const json = pm.response.json();
  pm.expect(json).to.have.property('session_id');
  pm.collectionVariables.set("session_id", json.session_id);
});
```

**Request 2: Upload File**
- Method: `POST`
- URL: `http://localhost:8080/session/new/with-file`
- Body: form-data, Key: `file` (type: File)
- Tests tab:
```javascript
pm.test("Status is 200", function() {
  pm.response.to.have.status(200);
});

pm.test("Has extracted_data", function() {
  const json = pm.response.json();
  if (!json.error) {
    pm.expect(json).to.have.property('extracted_data');
    pm.collectionVariables.set("session_id", json.session_id);
  }
});
```

**Request 3: Send Message**
- Method: `POST`
- URL: `http://localhost:8080/chat/{{session_id}}`
- Body: raw JSON
```json
{
  "user_message": "I have a headache"
}
```
- Tests tab:
```javascript
pm.test("Status is 200", function() {
  pm.response.to.have.status(200);
});

pm.test("Has progress", function() {
  const json = pm.response.json();
  if (!json.error) {
    pm.expect(json).to.have.property('progress');
  }
});
```

**Request 4: Get Summary**
- Method: `GET`
- URL: `http://localhost:8080/summary/{{session_id}}`
- Tests tab:
```javascript
pm.test("Status is 200", function() {
  pm.response.to.have.status(200);
});

pm.test("Has summary", function() {
  const json = pm.response.json();
  if (!json.error) {
    pm.expect(json).to.have.property('summary');
  }
});
```

### **Automated Testing Script**

Save as `test_api.py`:
```python
import requests
import time

BASE_URL = 'http://localhost:8080'

def test_full_flow():
    print("Testing DocAI API...")
    
    # Test 1: Create session
    print("\n1. Creating session...")
    response = requests.get(f'{BASE_URL}/session/new')
    assert response.status_code == 200
    data = response.json()
    session_id = data['session_id']
    print(f"   ✓ Session created: {session_id}")
    
    # Test 2: Send empty message (should fail)
    print("\n2. Testing empty message validation...")
    response = requests.post(
        f'{BASE_URL}/chat/{session_id}',
        json={'user_message': ''}
    )
    data = response.json()
    assert 'error' in data
    print(f"   ✓ Empty message rejected: {data['error']}")
    
    # Test 3: Send valid messages
    print("\n3. Sending valid messages...")
    answers = [
        "Headache",
        "Started yesterday",
        "No past history",
        "No medications",
        "No allergies",
        "No family history",
        "Non-smoker"
    ]
    
    for i, answer in enumerate(answers, 1):
        response = requests.post(
            f'{BASE_URL}/chat/{session_id}',
            json={'user_message': answer}
        )
        data = response.json()
        assert 'message' in data
        print(f"   ✓ Message {i}/7 sent, Progress: {data['progress']}%")
        time.sleep(0.5)
    
    # Test 4: Answer file upload question
    print("\n4. Answering file upload question...")
    response = requests.post(
        f'{BASE_URL}/chat/{session_id}',
        json={'user_message': 'no'}
    )
    data = response.json()
    assert data['completed'] == True
    print("   ✓ Conversation completed")
    
    # Test 5: Get summary
    print("\n5. Generating summary...")
    response = requests.get(f'{BASE_URL}/summary/{session_id}')
    data = response.json()
    assert 'summary' in data
    print("   ✓ Summary generated successfully")
    print(f"\n{data['summary'][:200]}...")
    
    print("\n✅ All tests passed!")

if __name__ == '__main__':
    test_full_flow()
```

Run: `python test_api.py`

---

## 🚀 Quick Start Guide

### **Prerequisites**

1. Python 3.8+ installed
2. Google API Key for Gemini

### **Installation**

```bash
# 1. Clone or download the project
cd AI-Model

# 2. Install dependencies
pip install -r requirements.txt

# 3. Create .env file
echo "GOOGLE_API_KEY=your_api_key_here" > .env

# 4. Start server
python app.py
```

Server will start at `http://localhost:8080`

### **First API Call**

```bash
curl http://localhost:8080/session/new
```

You should see:
```json
{
  "session_id": "...",
  "welcome_message": "Welcome! I'm DocAI..."
}
```

---

## 📊 API Response Times

| Endpoint | Typical Response Time | Notes |
|----------|----------------------|-------|
| `GET /session/new` | <50ms | Instant session creation |
| `POST /session/new/with-file` (JSON) | <200ms | Fast JSON parsing |
| `POST /session/new/with-file` (PDF) | 2-5 seconds | AI processing required |
| `POST /chat/{session_id}` | <100ms | No AI needed (fixed questions) |
| `GET /summary/{session_id}` | 2-5 seconds | AI refinement process |

---

## 🔐 Security Features

✅ **Input Validation**: Empty/whitespace messages rejected  
✅ **Length Limits**: Max 5000 characters per message  
✅ **File Type Validation**: Only .json and .pdf allowed  
✅ **Session Validation**: All endpoints verify session exists  
✅ **CORS Enabled**: Configurable origins  
✅ **No Authentication**: Suitable for internal/demo use  

⚠️ **Production Recommendations**:
- Add authentication (JWT, OAuth)
- Implement rate limiting
- Add HTTPS/TLS
- Restrict CORS origins
- Add request logging
- Implement session expiration

---

## 📞 Support & Additional Resources

- **Source Code**: `chatbot_main.py`, `app.py`
- **Input Validation Details**: `INPUT_VALIDATION.md`
- **Summary Improvements**: `SUMMARY_IMPROVEMENTS.md`
- **Test Scripts**: `test_summary.py`, `test_input_validation.py`

---

**API Version**: 1.0  
**Last Updated**: October 31, 2025  
**Powered by**: Google Gemini 2.5 Pro  
**Framework**: FastAPI + LangChain

```javascript
// Step 1: Create session
const sessionResponse = await fetch('http://localhost:8080/session/new');
const { session_id } = await sessionResponse.json();

// Step 2: Send 8 messages
const messages = [
  "I have severe chest pain",
  "Started 2 hours ago suddenly",
  "I have diabetes and hypertension",
  "I take metformin and lisinopril",
  "I'm allergic to penicillin",
  "My father had heart disease",
  "I don't smoke or drink",
  "No other symptoms"
];

for (const message of messages) {
  await fetch(`http://localhost:8080/chat/${session_id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_message: message })
  });
}

// Step 3: Get summary
const summaryResponse = await fetch(`http://localhost:8080/summary/${session_id}`);
const { summary } = await summaryResponse.json();
console.log(summary);
```

### Workflow B: With File Upload (Faster)

```javascript
// Step 1: Upload file and create session
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const sessionResponse = await fetch('http://localhost:8080/session/new/with-file', {
  method: 'POST',
  body: formData
});
const { session_id, pre_filled_sections } = await sessionResponse.json();

// Step 2: Only need to send 2-3 messages for missing sections
const messages = [
  "I have severe chest pain",  // Chief complaint
  "Started 2 hours ago",       // Present illness
  "No other concerns"          // Review of systems
];

for (const message of messages) {
  await fetch(`http://localhost:8080/chat/${session_id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_message: message })
  });
}

// Step 3: Get summary
const summaryResponse = await fetch(`http://localhost:8080/summary/${session_id}`);
const { summary } = await summaryResponse.json();
```

---

## 🛠️ Testing with Postman

### Collection Setup

1. Create new collection: "Mediquery API"
2. Add collection variable: `session_id`
3. Add these 4 requests to the collection

### Request 1: Create Session

- **Name**: Create New Session
- **Method**: GET
- **URL**: `http://localhost:8080/session/new`
- **Tests** (to auto-save session_id):

```javascript
var jsonData = pm.response.json();
pm.collectionVariables.set("session_id", jsonData.session_id);
```

### Request 2: Upload File

- **Name**: Create Session with File
- **Method**: POST
- **URL**: `http://localhost:8080/session/new/with-file`
- **Body**: form-data
  - Key: `file` (set type to "File")
  - Value: Select your JSON/PDF file
- **Tests**:

```javascript
var jsonData = pm.response.json();
pm.collectionVariables.set("session_id", jsonData.session_id);
```

### Request 3: Send Message

- **Name**: Send Chat Message
- **Method**: POST
- **URL**: `http://localhost:8080/chat/{{session_id}}`
- **Body**: raw JSON

```json
{
  "user_message": "I have a headache and fever"
}
```

### Request 4: Get Summary

- **Name**: Get Summary
- **Method**: GET
- **URL**: `http://localhost:8080/summary/{{session_id}}`

---

## ⚠️ Error Handling

**API Version**: 1.0  
**Last Updated**: October 31, 2025  
**Powered by**: Google Gemini 2.5 Pro  
**Framework**: FastAPI + LangChain
