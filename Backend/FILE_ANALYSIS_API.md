# File Analysis Endpoint - API Documentation

## Overview

New endpoint for analyzing medical files (PDF/JSON) and getting AI-generated summaries **without creating a chat session**. This is useful for quick file analysis.

---

## Endpoint

```http
POST /api/reports/analyze
```

---

## Request

**Headers:**
```
Content-Type: multipart/form-data
```

**Body (form-data):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | ✅ Yes | Medical document (JSON or PDF) |
| `userId` | string | ❌ No | MongoDB ObjectId for tracking (optional) |

**Accepted File Types:**
- `.json` - Structured medical data
- `.pdf` - Medical reports, lab results, prescriptions

**Maximum File Size:** Depends on server configuration (typically 10MB)

---

## Success Response

**Status Code:** `200 OK`

```json
{
  "status": "success",
  "message": "File analyzed successfully",
  "data": {
    "filename": "medical_report.pdf",
    "fileSize": 245678,
    "mimeType": "application/pdf",
    "extractedData": {
      "chief_complaint": "Severe headache",
      "present_illness": "Patient reports onset of headaches 3 days ago...",
      "past_medical_history": "Type 2 Diabetes Mellitus, Hypertension",
      "medications": "Metformin 500mg PO BID, Lisinopril 10mg PO daily",
      "allergies": "Penicillin (reaction: rash)",
      "family_history": "Father: Cardiovascular disease",
      "social_history": "Non-smoker, social alcohol consumption"
    },
    "preFilledSections": [
      "Past Medical History",
      "Medications",
      "Allergies",
      "Family History",
      "Social History"
    ],
    "summary": "**ELECTRONIC HEALTH RECORD - CLINICAL SUMMARY**\nGenerated: 2025-10-31 14:30\n\n**CHIEF COMPLAINT:**\nSevere headache\n\n**PAST MEDICAL HISTORY:**\n- Type 2 Diabetes Mellitus\n- Hypertension\n\n**CURRENT MEDICATIONS:**\n- Metformin 500mg PO BID\n- Lisinopril 10mg PO daily\n\n**ALLERGIES:**\nPenicillin (reaction: rash)\n\n**FAMILY HISTORY:**\n- Father: Cardiovascular disease\n\n**SOCIAL HISTORY:**\nNon-smoker, social alcohol consumption\n\n---\n**Prepared for physician review**",
    "analyzedAt": "2025-10-31T14:30:00.000Z",
    "userId": "507f1f77bcf86cd799439011"
  }
}
```

---

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | Response status (`"success"` or `"error"`) |
| `message` | string | Human-readable message |
| `data.filename` | string | Original filename |
| `data.fileSize` | integer | File size in bytes |
| `data.mimeType` | string | MIME type of the file |
| `data.extractedData` | object | Structured medical information extracted from file |
| `data.preFilledSections` | array[string] | List of sections that contained data |
| `data.summary` | string | AI-generated professional clinical summary |
| `data.analyzedAt` | string (ISO 8601) | Timestamp when file was analyzed |
| `data.userId` | string (optional) | User ID if provided in request |

---

## Error Responses

### Missing File

**Status Code:** `400 Bad Request`

```json
{
  "status": "error",
  "message": "File is required"
}
```

### Invalid File Type

**Status Code:** `400 Bad Request`

```json
{
  "status": "error",
  "message": "Invalid file type. Only JSON and PDF files are allowed. Got: .txt"
}
```

### AI Service Error

**Status Code:** `400 Bad Request`

```json
{
  "status": "error",
  "message": "No medical data could be extracted from the file"
}
```

OR

**Status Code:** `500 Internal Server Error`

```json
{
  "status": "error",
  "message": "Failed to analyze file. Please try again."
}
```

### General Server Error

**Status Code:** `500 Internal Server Error`

```json
{
  "status": "error",
  "message": "Failed to analyze file"
}
```

---

## Example Requests

### cURL

```bash
# Analyze JSON file
curl -X POST http://localhost:5000/api/reports/analyze \
  -F "file=@medical_history.json" \
  -F "userId=507f1f77bcf86cd799439011"

# Analyze PDF file
curl -X POST http://localhost:5000/api/reports/analyze \
  -F "file=@lab_report.pdf"
```

### JavaScript (Fetch)

```javascript
const fileInput = document.getElementById('fileInput');
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('userId', '507f1f77bcf86cd799439011'); // optional

const response = await fetch('http://localhost:5000/api/reports/analyze', {
  method: 'POST',
  body: formData
});

const data = await response.json();

if (data.status === 'success') {
  console.log('Extracted Data:', data.data.extractedData);
  console.log('Summary:', data.data.summary);
  console.log('Pre-filled Sections:', data.data.preFilledSections);
} else {
  console.error('Error:', data.message);
}
```

### Python

```python
import requests

# Analyze file
with open('medical_report.pdf', 'rb') as f:
    files = {'file': f}
    data = {'userId': '507f1f77bcf86cd799439011'}  # optional
    
    response = requests.post(
        'http://localhost:5000/api/reports/analyze',
        files=files,
        data=data
    )

result = response.json()

if result['status'] == 'success':
    print(f"Filename: {result['data']['filename']}")
    print(f"Extracted Data: {result['data']['extractedData']}")
    print(f"Summary:\n{result['data']['summary']}")
else:
    print(f"Error: {result['message']}")
```

### React Example

```jsx
import React, { useState } from 'react';

function FileAnalyzer() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError(null);
  };

  const analyzeFile = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', 'YOUR_USER_ID'); // optional

    try {
      const response = await fetch('http://localhost:5000/api/reports/analyze', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.status === 'success') {
        setResult(data.data);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to analyze file. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Analyze Medical File</h2>
      
      <input 
        type="file" 
        accept=".json,.pdf"
        onChange={handleFileChange}
      />
      
      <button onClick={analyzeFile} disabled={loading}>
        {loading ? 'Analyzing...' : 'Analyze File'}
      </button>

      {error && <div style={{color: 'red'}}>{error}</div>}

      {result && (
        <div>
          <h3>Analysis Results</h3>
          <p><strong>Filename:</strong> {result.filename}</p>
          <p><strong>File Size:</strong> {result.fileSize} bytes</p>
          
          <h4>Pre-filled Sections:</h4>
          <ul>
            {result.preFilledSections.map((section, idx) => (
              <li key={idx}>{section}</li>
            ))}
          </ul>

          <h4>Extracted Data:</h4>
          <pre>{JSON.stringify(result.extractedData, null, 2)}</pre>

          <h4>Clinical Summary:</h4>
          <pre style={{whiteSpace: 'pre-wrap'}}>{result.summary}</pre>
        </div>
      )}
    </div>
  );
}

export default FileAnalyzer;
```

---

## Postman Testing

### Setup

1. **Method:** `POST`
2. **URL:** `http://localhost:5000/api/reports/analyze`
3. **Body:** form-data
   - Key: `file` (type: File) → Select your PDF/JSON file
   - Key: `userId` (type: Text) → `507f1f77bcf86cd799439011` (optional)
4. **Send**

### Tests Script

Add this to the "Tests" tab in Postman:

```javascript
pm.test("Status is 200", function() {
  pm.response.to.have.status(200);
});

pm.test("Response has success status", function() {
  const json = pm.response.json();
  pm.expect(json.status).to.eql('success');
});

pm.test("Has extracted data", function() {
  const json = pm.response.json();
  pm.expect(json.data).to.have.property('extractedData');
  pm.expect(json.data).to.have.property('summary');
  pm.expect(json.data).to.have.property('preFilledSections');
});
```

---

## Comparison: Analyze vs. Create Session with File

| Feature | `/reports/analyze` | `/chats/new/with-file` |
|---------|-------------------|------------------------|
| **Purpose** | Quick file analysis only | Start conversation with pre-filled data |
| **Creates Session** | ❌ No | ✅ Yes |
| **Saves to DB** | ❌ No | ✅ Yes (Conversation model) |
| **Returns Summary** | ✅ Yes (immediate) | ❌ No (need to complete conversation first) |
| **Requires Follow-up** | ❌ No | ✅ Yes (answer remaining questions) |
| **Use Case** | One-time file analysis | Interactive medical history collection |

---

## How It Works Internally

```
Frontend uploads file
         ↓
Backend receives file via multer
         ↓
Validates file type (PDF/JSON only)
         ↓
Creates FormData with file buffer
         ↓
Sends to AI Model: POST /session/new/with-file
         ↓
AI extracts medical data from file
         ↓
Backend receives extracted data + session ID
         ↓
Backend calls AI: GET /summary/{session_id}
         ↓
AI returns professional summary
         ↓
Backend combines all data
         ↓
Returns to frontend (no DB save)
```

---

## Processing Time

- **JSON Files:** ~1-2 seconds
- **PDF Files:** ~3-6 seconds (depends on file size and AI processing)

---

## Important Notes

- ✅ This endpoint does **NOT** create a conversation in your database
- ✅ Ideal for quick file analysis without starting a full chat session
- ✅ Returns immediate summary (unlike chat flow which requires completing 7 questions)
- ✅ The AI session is temporary and only used for extraction
- ⚠️ If summary generation fails, you'll still get the extracted data
- 💡 Use `/chats/new/with-file` if you want to start a conversation after file upload

---

## Error Handling Example

```javascript
async function analyzeFileWithErrorHandling(file) {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('http://localhost:5000/api/reports/analyze', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();

    if (data.status === 'error') {
      // Handle application-level errors
      switch(data.message) {
        case 'File is required':
          alert('Please select a file to upload');
          break;
        case 'Invalid file type. Only JSON and PDF files are allowed. Got: .txt':
          alert('Only PDF and JSON files are supported');
          break;
        default:
          alert(`Error: ${data.message}`);
      }
      return null;
    }

    return data.data;

  } catch (error) {
    // Handle network errors
    console.error('Network error:', error);
    alert('Unable to connect to server. Please check your connection.');
    return null;
  }
}
```

---

## Next Steps

After analyzing a file, you can:

1. **Display results to user** - Show extracted data and summary
2. **Start a conversation** - Use `/chats/new` to begin interactive history collection
3. **Upload another file** - Analyze multiple files in sequence
4. **Export summary** - Save or print the clinical summary

---

**Created:** October 31, 2025  
**Endpoint:** `POST /api/reports/analyze`  
**Related Endpoints:** 
- `POST /chats/new/with-file` (creates session + conversation)
- `POST /chats/summary` (gets summary for existing session)
