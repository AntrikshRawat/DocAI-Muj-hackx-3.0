# File Upload 500 Error - Troubleshooting Guide

## Error Details
```
AxiosError: Request failed with status code 500
Endpoint: POST /session/new/with-file
```

## Changes Made to Diagnose

### 1. Enhanced Logging in `app.py`
Added detailed console logging to track:
- File reception
- File size
- File extension validation
- Processing steps
- Error details with stack traces

### 2. Enhanced Logging in `chatbot_main.py`
Added step-by-step logging:
- File type being processed
- Extraction method called
- Data extraction results
- Session pre-filling
- Success/failure with details

## How to Diagnose

### Step 1: Restart the Server
```bash
python app.py
```

### Step 2: Run Test Script
In a new terminal:
```bash
python test_file_upload_endpoint.py
```

### Step 3: Check Server Terminal
Look for log output like:
```
Received file: test_medical_data.json
File extension: .json
Reading file content...
File size: 234 bytes
Processing .json file...
[create_session_with_file_data] Processing json file
[create_session_with_file_data] Extracting JSON data
[create_session_with_file_data] Extracted data type: <class 'dict'>
[create_session_with_file_data] Extracted keys: ['past_medical_history', 'medications', ...]
[create_session_with_file_data] Pre-filled 5 sections
[create_session_with_file_data] Success - Session ID: ...
File processed successfully
```

### Step 4: Identify the Error
If there's an error, you'll see something like:
```
Unexpected error processing file: TypeError: 'NoneType' object is not subscriptable
```

## Common Causes of 500 Error

### 1. Missing GOOGLE_API_KEY
**Symptom**: Error when processing PDF files  
**Solution**: Check `.env` file has `GOOGLE_API_KEY=your_key_here`

### 2. Missing Dependencies
**Symptom**: ImportError or ModuleNotFoundError  
**Solution**: 
```bash
pip install -r requirements.txt
```

### 3. Invalid JSON Format
**Symptom**: JSONDecodeError  
**Solution**: Validate JSON file is properly formatted

### 4. PDF Processing Issues
**Symptom**: Error with PyPDF2  
**Solution**: Check PDF is not corrupted or encrypted

### 5. Response Model Mismatch
**Symptom**: pydantic.ValidationError  
**Solution**: Check `SessionWithDataResponse` model matches returned data

## Expected Successful Response

```json
{
  "session_id": "uuid-here",
  "welcome_message": "Welcome! I've reviewed your uploaded medical records...",
  "pre_filled_sections": ["Past Medical History", "Medications", "Allergies", "Family History", "Social History"],
  "extracted_data": {
    "past_medical_history": "Type 2 Diabetes, Hypertension",
    "medications": "Metformin 500mg BID, Lisinopril 10mg daily",
    "allergies": "Penicillin - causes rash",
    "family_history": "Father had heart disease",
    "social_history": "Non-smoker, occasional alcohol"
  }
}
```

## Frontend Error Handling

Update your axios call to show detailed errors:

```javascript
try {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await axios.post(
    'http://localhost:8080/session/new/with-file',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }
  );
  
  console.log('Success:', response.data);
  
} catch (error) {
  if (error.response) {
    // Server responded with error
    console.error('Server Error:', error.response.status);
    console.error('Error Data:', error.response.data);
    alert(`Upload failed: ${error.response.data.error || error.response.data.detail}`);
  } else if (error.request) {
    // Request made but no response
    console.error('No response from server');
    alert('Cannot connect to server. Is it running?');
  } else {
    // Error setting up request
    console.error('Request error:', error.message);
    alert(`Upload error: ${error.message}`);
  }
}
```

## Quick Fixes to Try

### 1. Check Server is Running
```bash
# Should see: INFO:     Uvicorn running on http://0.0.0.0:8080
ps aux | grep python  # Linux/Mac
tasklist | findstr python  # Windows
```

### 2. Test with cURL
```bash
curl -X POST http://localhost:8080/session/new/with-file \
  -F "file=@test_medical_data.json"
```

### 3. Check File Size Limits
FastAPI default: 1MB. If your file is larger, add to `app.py`:
```python
from fastapi import UploadFile, File
# Increase limit
app.add_middleware(
    ...,
    max_request_size=10 * 1024 * 1024  # 10MB
)
```

### 4. Validate Response Model
Check `app.py` has correct model:
```python
class SessionWithDataResponse(BaseModel):
    session_id: str
    welcome_message: str
    pre_filled_sections: list
    extracted_data: dict
```

## Next Steps

1. **Restart server** with new logging
2. **Run test script** to reproduce error
3. **Check server logs** for the exact error
4. **Share the error message** from server logs for specific help

The detailed logging will now show exactly where the error occurs!
