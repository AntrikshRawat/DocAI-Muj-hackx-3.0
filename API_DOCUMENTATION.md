# Mediquery API - Complete Documentation

## 📋 Overview

The Mediquery API is a RESTful API for Pre-Consultation Clinical History Collection. It enables interactive chatbot conversations to gather patient medical history and generate structured EHR summaries for doctors.

**Base URL**: `http://localhost:8080`

---

## 🔗 Available Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/session/new` | Create a new session without file upload |
| POST | `/session/new/with-file` | Create a new session with JSON/PDF file upload |
| POST | `/chat/{session_id}` | Send patient message to chatbot |
| GET | `/summary/{session_id}` | Get final clinical summary |

---

## 1️⃣ Create New Session (No File)

Start a fresh conversation session without any pre-existing medical data.

### Request

```http
GET /session/new
```

**Headers**: None required

**Body**: None

### Response

**Status Code**: `200 OK`

```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "welcome_message": "Welcome! I'm MediqueryAI, your clinical history assistant.\n\nI'll help collect your complete medical history before your doctor consultation. This will help your doctor provide you with the best possible care.\n\n**Let's begin: What brings you to the doctor today?**"
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `session_id` | string (UUID) | Unique identifier for this conversation session |
| `welcome_message` | string | Initial greeting message from the chatbot |

### Example (cURL)

```bash
curl -X GET http://localhost:8080/session/new
```

### Example (JavaScript)

```javascript
fetch('http://localhost:8080/session/new')
  .then(response => response.json())
  .then(data => {
    console.log('Session ID:', data.session_id);
    console.log('Welcome:', data.welcome_message);
  });
```

---

## 2️⃣ Create New Session with File Upload

Start a session with pre-filled medical data from uploaded JSON or PDF file.

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

Retrieve the final structured EHR summary after conversation completion.

### Request

```http
GET /summary/{session_id}
```

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `session_id` | string | Yes | Session ID from session creation endpoint |

**Headers**: None required

**Body**: None

### Requirements

- The conversation must be completed (`completed: true`)
- At least 8 messages must have been sent (or fewer with file upload)

### Response

**Status Code**: `200 OK`

```json
{
  "summary": "**ELECTRONIC HEALTH RECORD - CLINICAL SUMMARY**\nGenerated: 2025-10-31 10:30\n\n**CHIEF COMPLAINT:**\nI have severe headache and fever\n\n**HISTORY OF PRESENT ILLNESS:**\nStarted two days ago suddenly\n\n**PAST MEDICAL HISTORY:**\nType 2 Diabetes Mellitus, Hypertension\n\n**MEDICATIONS:**\nMetformin 500mg twice daily, Lisinopril 10mg once daily\n\n**ALLERGIES:**\nPenicillin (causes rash)\n\n**FAMILY HISTORY:**\nFather had coronary artery disease\n\n**SOCIAL HISTORY:**\nNon-smoker, occasional alcohol\n\n**REVIEW OF SYSTEMS:**\nNo other concerns\n\n---\n**Note:** Sections marked as \"None reported\" or \"No known allergies\" indicate the patient stated they had no relevant information for that category."
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `summary` | string | Structured clinical summary in EHR format with all 8 sections |

### Summary Structure

The summary includes:
1. **Chief Complaint**: Primary reason for visit
2. **History of Present Illness**: Details about current condition
3. **Past Medical History**: Chronic conditions, previous diagnoses
4. **Medications**: Current medications with dosages
5. **Allergies**: Known allergies (defaults to "No known allergies")
6. **Family History**: Family medical conditions
7. **Social History**: Lifestyle factors (smoking, alcohol, occupation)
8. **Review of Systems**: Other symptoms or concerns

Sections with no information show default values like "None reported" or "No known allergies".

### Error Responses

**Invalid Session ID**:

```json
{
  "error": "Invalid session ID"
}
```

**Conversation Not Completed**:

```json
{
  "error": "Conversation not yet completed"
}
```

### Example (cURL)

```bash
curl -X GET http://localhost:8080/summary/550e8400-e29b-41d4-a716-446655440000
```

### Example (JavaScript)

```javascript
fetch('http://localhost:8080/summary/550e8400-e29b-41d4-a716-446655440000')
  .then(response => response.json())
  .then(data => {
    console.log('EHR Summary:', data.summary);
    // Display formatted summary to doctor
  });
```

---

## 🔄 Complete Workflow Examples

### Workflow A: Without File Upload (Full Interview)

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

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Invalid session ID` | Session doesn't exist | Create new session first |
| `Conversation not yet completed` | Tried to get summary too early | Send more messages until `completed: true` |
| `Invalid file type` | Uploaded unsupported file format | Use only .json or .pdf files |
| `JSON must contain an object/dictionary` | JSON file contains array or string | Wrap in object: `{"field": "value"}` |
| Connection refused | Server not running | Start server: `python app.py` |

---

## 🔐 CORS Configuration

The API allows requests from any origin (`*`). For production, update CORS settings in `app.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com"],  # Restrict to your domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 📊 Response Status Codes

| Status Code | Meaning |
|-------------|---------|
| 200 | Success (but check for `error` field in response) |
| 400 | Bad request (invalid file type) |
| 422 | Validation error (missing required fields) |
| 500 | Internal server error |

---

## 🚀 Quick Start

1. **Install dependencies**:
```bash
pip install -r requirements.txt
```

2. **Set up environment**:
Create `.env` file:
```
GOOGLE_API_KEY=your_api_key_here
```

3. **Start server**:
```bash
python app.py
```

4. **Test first endpoint**:
```bash
curl http://localhost:8080/session/new
```

---

## 📝 Notes

- Messages should be at least 3 words to advance sections
- Sessions are stored in memory and cleared on server restart
- The chatbot uses Google's Gemini 2.5 Pro model
- File uploads are limited to JSON and PDF only
- PDF processing uses AI to extract unstructured medical data

---

## 📞 Support

For issues or questions, please refer to:
- `README.md` - General project information
- `FILE_UPLOAD_GUIDE.md` - Detailed file upload testing guide
- GitHub repository issues

---

**Version**: 1.0  
**Last Updated**: October 31, 2025
