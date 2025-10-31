# Input Validation & Security Checks

## Overview
Added comprehensive input validation to prevent empty or invalid messages from being processed by the chatbot.

## Security Validations Implemented

### 1. **Empty Message Check**
- **Location**: `chatbot_main.py` - `get_response()` method
- **Validates**:
  - Empty strings (`""`)
  - Whitespace-only strings (`"   "`, `"\t"`, `"\n"`)
  - Null/None values
  
**Error Response**:
```json
{
  "error": "Please provide an answer to the question. Your response cannot be empty.",
  "message": "I didn't receive any input. Please answer the question above.",
  "requires_input": true
}
```

### 2. **Minimum Length Validation**
- **Location**: `chatbot_main.py` - `get_response()` method
- **Validates**: Message has at least 1 character after trimming whitespace

**Error Response**:
```json
{
  "error": "Please provide a valid answer.",
  "message": "Your response appears to be empty. Please provide an answer to continue.",
  "requires_input": true
}
```

### 3. **Maximum Length Validation**
- **Location**: `app.py` - `post_chat_message()` endpoint
- **Limit**: 5000 characters
- **Purpose**: Prevent extremely long inputs that could cause performance issues

**Error Response**:
```json
{
  "error": "Your message is too long. Please keep your response under 5000 characters."
}
```

### 4. **Session Validation**
- **Location**: Both `chatbot_main.py` and `app.py`
- **Validates**: Session ID exists and is valid

**Error Response**:
```json
{
  "error": "Invalid session ID"
}
```

## Code Implementation

### chatbot_main.py
```python
def get_response(self, session_id, user_message):
    """Get chatbot response"""
    if session_id not in self.sessions:
        return {"error": "Invalid session"}
    
    # Input validation - check if message is empty or only whitespace
    if not user_message or not user_message.strip():
        return {
            "error": "Please provide an answer to the question. Your response cannot be empty.",
            "message": "I didn't receive any input. Please answer the question above.",
            "requires_input": True
        }
    
    # Additional validation - check minimum length
    user_message = user_message.strip()
    if len(user_message) < 1:
        return {
            "error": "Please provide a valid answer.",
            "message": "Your response appears to be empty. Please provide an answer to continue.",
            "requires_input": True
        }
    
    # Continue with normal processing...
```

### app.py
```python
@app.post('/chat/{session_id}', response_model = ChatResponse | ErrorResponse)
def post_chat_message(session_id: str, request: ChatRequest):
    """Sends a patient's message to the chatbot and gets a response."""
    
    # Validate session exists
    if session_id not in bot.sessions:
        return ErrorResponse(error = "Invalid session ID")
    
    # Validate message is not empty
    if not request.user_message or not request.user_message.strip():
        return ErrorResponse(error = "Please provide an answer to the question. Your response cannot be empty.")
    
    # Additional security: check message length
    if len(request.user_message) > 5000:
        return ErrorResponse(error = "Your message is too long. Please keep your response under 5000 characters.")
    
    # Continue with normal processing...
```

## Test Cases

| Input | Description | Result |
|-------|-------------|--------|
| `""` | Empty string | ❌ Error: Please provide an answer |
| `"   "` | Whitespace only | ❌ Error: Please provide an answer |
| `"\t\n"` | Tabs/newlines | ❌ Error: Please provide an answer |
| `"I have a headache"` | Valid input | ✅ Processed successfully |
| `"no"` | Single word | ✅ Processed successfully |
| `"a" * 6000` | Too long (6000 chars) | ❌ Error: Message too long |

## API Examples

### ❌ Empty Message Request
```bash
POST http://localhost:8080/chat/{session_id}
Content-Type: application/json

{
  "user_message": ""
}
```

**Response** (400):
```json
{
  "error": "Please provide an answer to the question. Your response cannot be empty."
}
```

### ✅ Valid Message Request
```bash
POST http://localhost:8080/chat/{session_id}
Content-Type: application/json

{
  "user_message": "I have been experiencing headaches for 3 days"
}
```

**Response** (200):
```json
{
  "message": "Thank you for sharing that. I understand your concern.\n\n**Can you tell me more about your current illness?...**",
  "progress": 12,
  "completed": false
}
```

## Benefits

✅ **Prevents empty submissions**: Users must provide actual answers  
✅ **Better user experience**: Clear error messages guide users  
✅ **API security**: Protects against malformed requests  
✅ **Performance**: Prevents processing of invalid data  
✅ **Data quality**: Ensures all collected information is meaningful  

## Testing

Run the demonstration:
```bash
python test_input_validation.py
```

This shows all validation scenarios and expected behaviors.

## Frontend Integration

When receiving an error response with `"requires_input": true`, the frontend should:
1. Display the error message to the user
2. Keep focus on the input field
3. Highlight the input field (optional)
4. Not advance to the next question

## Error Handling Flow

```
User submits empty message
    ↓
API validates input (app.py)
    ↓ (if empty)
Return error immediately
    ↓
Frontend displays error
    ↓
User provides valid input
    ↓
API passes to chatbot (chatbot_main.py)
    ↓
Chatbot validates again (defense in depth)
    ↓
Process message and return response
```

---

**Note**: This implements "defense in depth" - validation happens at both the API layer and the chatbot layer for maximum security.
