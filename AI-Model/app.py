import os
import dotenv 
import uvicorn
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from chatbot_main import ClinicalChatbot
dotenv.load_dotenv()

# Loading API Key
API_KEY = os.getenv("GOOGLE_API_KEY")
if not API_KEY:
    raise ValueError("GOOGLE_API_KEY environment variable not set")

# Initialize Chatbot
bot = ClinicalChatbot(api_key = API_KEY)

# Initialize FastAPI app
app = FastAPI(
    title = "Mediquery API",
    description="API for the Pre-Consultation Clinical History Collection Chatbot"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers = ["*"],
)

# Define Request/Response Models

class ChatRequest(BaseModel):
    user_message: str
    
class ChatResponse(BaseModel):
    message: str
    progress: int
    completed: bool
    
class SessionResponse(BaseModel):
    session_id: str
    welcome_message: str

class SessionWithDataResponse(BaseModel):
    session_id: str
    welcome_message: str
    pre_filled_sections: list
    extracted_data: dict
    
class SummaryResponse(BaseModel):
    summary: str
    
class ErrorResponse(BaseModel):
    error: str
    
# API Endpoints

@app.get('/session/new', response_model = SessionResponse)
def create_new_session():
    """Starts a new chat session and gets the welcome message. The frontend should call this first."""
    
    session_id = bot.create_session()
    welcome_message = bot.get_welcome_message()
    return SessionResponse(session_id = session_id, welcome_message = welcome_message)

@app.post('/session/new/with-file', response_model = SessionWithDataResponse | ErrorResponse)
async def create_session_with_file(file: UploadFile = File(...)):
    """
    Starts a new session with pre-filled data from uploaded JSON or PDF file.
    
    - Accepts: JSON (.json) or PDF (.pdf) files only
    - Extracts medical history from the file
    - Pre-fills session data
    - Returns session ready to continue with missing information
    """
    
    # Validate file type
    allowed_extensions = ['.json', '.pdf']
    file_ext = os.path.splitext(file.filename)[1].lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid file type. Only JSON and PDF files are allowed. Got: {file_ext}"
        )
    
    try:
        # Read file content
        content = await file.read()
        
        # Determine file type and process
        if file_ext == '.json':
            content_str = content.decode('utf-8')
            result = bot.create_session_with_file_data(content_str, "json")
        elif file_ext == '.pdf':
            result = bot.create_session_with_file_data(content, "pdf")
        
        # Check for errors
        if "error" in result:
            return ErrorResponse(error=result["error"])
        
        return SessionWithDataResponse(
            session_id=result["session_id"],
            welcome_message=result["welcome_message"],
            pre_filled_sections=result["pre_filled_sections"],
            extracted_data=result["extracted_data"]
        )
        
    except Exception as e:
        return ErrorResponse(error=f"Failed to process file: {str(e)}")

@app.post('/chat/{session_id}', response_model = ChatResponse | ErrorResponse)
def post_chat_message(session_id: str, request: ChatRequest):
    """Sends a patient's message to the chatbot and gets a response."""
    if session_id not in bot.sessions:
        return ErrorResponse(error = "Invalid session ID")
    
    response_data = bot.get_response(session_id, request.user_message)
    
    if "error" in response_data:
        return ErrorResponse(error = response_data["error"])
    
    return ChatResponse(
        message = response_data["message"],
        progress = response_data["progress"],
        completed = response_data["completed"]
    )
    
@app.get("/summary/{session_id}", response_model = SummaryResponse | ErrorResponse)
def get_summary(session_id: str):
    """Generates the final clinical summary for the doctor."""
    if session_id not in bot.sessions:
        return ErrorResponse(error = "Invalid session ID")
    
    if not bot.sessions[session_id]["completed"]:
        return ErrorResponse(error = "Conversation not yet completed")
    
    summary = bot.generate_summary(session_id)
    return SummaryResponse(summary = summary)

# Run server

if __name__ == "__main__":
    uvicorn.run(app, host = "0.0.0.0", port = 8080)
    