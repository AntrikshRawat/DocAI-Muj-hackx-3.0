import os
import uuid
import json
from datetime import datetime
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.chat_history import BaseChatMessageHistory, InMemoryChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_core.messages import HumanMessage, AIMessage
from dotenv import load_dotenv
from PyPDF2 import PdfReader

load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

class ClinicalChatbot:
    """Clinical History Collection Chatbot"""
    
    SECTIONS=[
        "chief_complaint",
        "present_illness",
        "past_medical_history",
        "medications",
        "allergies",
        "family_history",
        "social_history",
        "review_of_systems"
    ]
    
    # Specific questions for each section based on question.txt
    SECTION_QUESTIONS = {
        "chief_complaint": "What brings you to the doctor today? (Chief Complaint)",
        "present_illness": "Can you tell me more about your current illness? When did it start? How has it been progressing? (History of Present Illness)",
        "past_medical_history": "Do you have any past medical conditions or chronic illnesses? (Past Medical History)",
        "medications": "Are you currently taking any medications or prescriptions?",
        "allergies": "Do you have any allergies? If so, which are they?",
        "family_history": "Does anyone in your family have a history of this or similar illnesses? (Family History)",
        "social_history": "Can you tell me about your lifestyle - do you smoke, drink alcohol, or have any relevant social history related to your present illness?",
        "review_of_systems": "review_complete"  # Special marker for completion
    }
    
    def __init__(self, api_key):
        self.llm = ChatGoogleGenerativeAI(
            model = "gemini-2.5-pro",
            api_key = GOOGLE_API_KEY,
            temperature = 0.4,
            max_output_tokens = 2048
        )
        self.sessions = {}
        
    def create_session(self):
        """Create new conversation session"""
        session_id = str(uuid.uuid4())
        self.sessions[session_id] = {
            "section_index": 0,
            "history": [],
            "completed": False,
            "awaiting_file_response": False,  # Track if waiting for file upload response
            "section_data": {
                "chief_complaint": None,
                "present_illness": None,
                "past_medical_history": "None reported",
                "medications": "None reported",
                "allergies": "No known allergies",
                "family_history": "None reported",
                "social_history": "None reported",
                "review_of_systems": "No concerns reported"
            }
        }
        return session_id
    
    def create_session_with_file_data(self, file_content, file_type: str):
        """Create session and pre-fill with data from uploaded file"""
        session_id = self.create_session()
        
        try:
            print(f"[create_session_with_file_data] Processing {file_type} file")
            
            if file_type == "json":
                # file_content should be string for JSON
                if isinstance(file_content, bytes):
                    file_content = file_content.decode('utf-8')
                print(f"[create_session_with_file_data] Extracting JSON data")
                extracted_data = self._extract_from_json(file_content)
            elif file_type == "pdf":
                # file_content should be bytes for PDF
                print(f"[create_session_with_file_data] Extracting PDF data")
                extracted_data = self._extract_from_pdf(file_content)
            else:
                print(f"[create_session_with_file_data] Unsupported file type: {file_type}")
                return {"error": "Unsupported file type"}
            
            print(f"[create_session_with_file_data] Extracted data type: {type(extracted_data)}")
            
            # Ensure extracted_data is a dictionary
            if not isinstance(extracted_data, dict):
                error_msg = f"Extracted data is not a dictionary: {type(extracted_data)}"
                print(f"[create_session_with_file_data] Error: {error_msg}")
                return {"error": error_msg}
            
            print(f"[create_session_with_file_data] Extracted keys: {list(extracted_data.keys())}")
            
            # Check if extraction returned empty
            if not extracted_data:
                print(f"[create_session_with_file_data] No data extracted")
                return {"error": "No medical data could be extracted from the file"}
            
            # Pre-fill session data with extracted information
            session = self.sessions[session_id]
            for key, value in extracted_data.items():
                if key in session["section_data"] and value:
                    session["section_data"][key] = value
                    # Advance section index for pre-filled sections
                    if key != "chief_complaint" and key != "present_illness":
                        session["section_index"] += 1
            
            print(f"[create_session_with_file_data] Pre-filled {len(extracted_data)} sections")
            
            # Generate welcome message with pre-filled info
            filled_sections = [k.replace('_', ' ').title() for k, v in extracted_data.items() if v]
            welcome_msg = f"""Welcome! I've reviewed your uploaded medical records.

I found information about: {', '.join(filled_sections) if filled_sections else 'some of your medical history'}.

Let me ask you a few more questions to complete your clinical history.

**What brings you to the doctor today?**"""
            
            print(f"[create_session_with_file_data] Success - Session ID: {session_id}")
            
            return {
                "session_id": session_id,
                "welcome_message": welcome_msg,
                "pre_filled_sections": filled_sections,
                "extracted_data": extracted_data
            }
            
        except Exception as e:
            print(f"[create_session_with_file_data] Exception: {type(e).__name__}: {str(e)}")
            import traceback
            traceback.print_exc()
            return {"error": f"Failed to process file: {str(e)}"}
    
    def _extract_from_json(self, json_content: str) -> dict:
        """Extract medical data from JSON file"""
        try:
            # Ensure json_content is a string
            if not isinstance(json_content, str):
                raise ValueError(f"JSON content must be string, got {type(json_content)}")
            
            data = json.loads(json_content)
            
            # Ensure parsed data is a dictionary
            if not isinstance(data, dict):
                raise ValueError(f"JSON must contain an object/dictionary, got {type(data)}")
            
            # Map common JSON keys to our section structure
            extracted = {}
            
            # Map various possible JSON field names to our sections
            key_mappings = {
                "chief_complaint": ["chief_complaint", "complaint", "reason", "reason_for_visit"],
                "present_illness": ["present_illness", "current_illness", "hpi", "history_present_illness"],
                "past_medical_history": ["past_medical_history", "medical_history", "pmh", "conditions", "past_conditions"],
                "medications": ["medications", "current_medications", "meds", "drugs"],
                "allergies": ["allergies", "drug_allergies", "allergic_to"],
                "family_history": ["family_history", "family_medical_history", "fh"],
                "social_history": ["social_history", "social", "sh", "lifestyle"],
                "review_of_systems": ["review_of_systems", "ros", "systems_review"]
            }
            
            for section, possible_keys in key_mappings.items():
                for key in possible_keys:
                    if key in data:
                        value = data[key]
                        # Handle lists (e.g., medications as array)
                        if isinstance(value, list):
                            extracted[section] = ", ".join(str(v) for v in value)
                        elif isinstance(value, dict):
                            extracted[section] = json.dumps(value, indent=2)
                        else:
                            extracted[section] = str(value)
                        break
            
            return extracted
            
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON format: {str(e)}")
    
    def _extract_from_pdf(self, pdf_content: bytes) -> dict:
        """Extract and parse medical data from PDF file"""
        try:
            # Ensure pdf_content is bytes
            if isinstance(pdf_content, str):
                raise ValueError("PDF content must be bytes, not string")
            
            # Read PDF content
            from io import BytesIO
            pdf_file = BytesIO(pdf_content)
            reader = PdfReader(pdf_file)
            
            # Extract all text from PDF
            text = ""
            for page in reader.pages:
                text += page.extract_text() + "\n"
            
            # Use LLM to parse medical information from text
            parse_prompt = f"""Extract medical information from this document and structure it into these categories. Return ONLY valid JSON with no additional text:

Document text:
{text[:3000]}  

Extract and return as JSON with these exact keys (use null if information not found):
{{
    "chief_complaint": "primary reason for visit",
    "present_illness": "details about current illness",
    "past_medical_history": "chronic conditions or past diagnoses",
    "medications": "current medications with dosages",
    "allergies": "known allergies",
    "family_history": "family medical conditions",
    "social_history": "smoking, alcohol, occupation, lifestyle",
    "review_of_systems": "other symptoms or concerns"
}}"""
            
            response = self.llm.invoke(parse_prompt)
            
            # Parse LLM response as JSON
            try:
                extracted_data = json.loads(response.content)
                # Filter out null values
                return {k: v for k, v in extracted_data.items() if v and v.lower() not in ['null', 'none', 'n/a', 'not found']}
            except json.JSONDecodeError:
                # If LLM didn't return valid JSON, return the raw text
                return {"past_medical_history": text[:500] + "..."}
                
        except Exception as e:
            raise ValueError(f"Failed to parse PDF: {str(e)}")
    
    def get_welcome_message(self):
        """Return welcome message"""
        return """Welcome! I'm DocAI, your clinical history assistant.
    
I'll help collect your complete medical history before your doctor consultation. This will help your doctor provide you with the best possible care.

I'll ask you 7 key questions to build your Electronic Health Record.

**Let's begin: What brings you to the doctor today? (Chief Complaint)**"""
    
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
        
        # Additional validation - check minimum length (at least 1 character after stripping)
        user_message = user_message.strip()
        if len(user_message) < 1:
            return {
                "error": "Please provide a valid answer.",
                "message": "Your response appears to be empty. Please provide an answer to continue.",
                "requires_input": True
            }
        
        session = self.sessions[session_id]
        
        # Handle file upload response
        if session.get("awaiting_file_response", False):
            user_lower = user_message.lower().strip()
            if any(word in user_lower for word in ["yes", "yeah", "sure", "ok", "okay", "yep"]):
                session["awaiting_file_response"] = False
                return {
                    "message": "Great! Please upload your medical file (PDF or JSON format) using the file upload feature in the interface.",
                    "progress": 100,
                    "completed": True,
                    "awaiting_file": True
                }
            elif any(word in user_lower for word in ["no", "nope", "nah", "not"]):
                session["awaiting_file_response"] = False
                session["completed"] = True
                return {
                    "message": "No problem! Your clinical history collection is complete. This information will be available for your doctor to review.",
                    "progress": 100,
                    "completed": True
                }
            else:
                return {
                    "message": "I didn't quite understand. Would you like to upload a medical file (PDF or JSON)? Please answer 'yes' or 'no'.",
                    "progress": 100,
                    "completed": False,
                    "awaiting_file_response": True
                }
        
        # Add to history
        session["history"].append(f"Patient: {user_message}")
        
        # Get current section
        section_index = min(session["section_index"], len(self.SECTIONS)-1)
        current_section = self.SECTIONS[section_index]
        
        # Check if user says "no", "none", "not applicable" etc.
        negative_responses = ["no", "none", "nope", "not", "nothing", "n/a", "na", "negative"]
        user_lower = user_message.lower()
        is_negative = any(neg in user_lower for neg in negative_responses) and len(user_message.split()) < 10
        
        # Store the response data
        if not is_negative:
            # User provided actual information
            session["section_data"][current_section] = user_message
        # else: keep the default "None reported" value
        
        # Generate empathetic acknowledgment
        acknowledgment = self._generate_acknowledgment(current_section, user_message, is_negative)
        
        # Advance to next section
        session["section_index"] += 1
        
        # Check if all sections are complete
        if session["section_index"] >= len(self.SECTIONS):
            # All 7 sections complete - mark as completed and ask about file
            session["completed"] = True  # Mark conversation as complete
            session["awaiting_file_response"] = True  # Optional file upload step
            thank_you_message = f"""{acknowledgment}

**🎉 Thank you so much for providing all this information!**

I've collected all 7 key details for your Electronic Health Record:
✓ Chief Complaint
✓ History of Present Illness
✓ Past Medical History
✓ Current Medications
✓ Allergies
✓ Family History
✓ Social History

This comprehensive information will help your doctor provide you with the best possible care during your consultation.

**Would you like to upload any additional medical records (PDF or JSON format) to supplement this information?**"""
            
            session["history"].append(f"Assistant: {thank_you_message}")
            
            return {
                "message": thank_you_message,
                "progress": 100,
                "completed": True,  # Conversation is complete for summary generation
                "awaiting_file_response": True  # But still waiting for optional file upload response
            }
        
        # Get next question
        next_section = self.SECTIONS[session["section_index"]]
        next_question = self.SECTION_QUESTIONS[next_section]
        
        response = f"{acknowledgment}\n\n**{next_question}**"
        
        session["history"].append(f"Assistant: {response}")
        
        return {
            "message": response,
            "progress": int((session["section_index"] / len(self.SECTIONS)) * 100),
            "completed": False
        }
    
    def _generate_acknowledgment(self, section, user_message, is_negative):
        """Generate empathetic acknowledgment based on the section and response"""
        if is_negative:
            acknowledgments = {
                "chief_complaint": "I understand.",
                "present_illness": "Got it, thank you for clarifying.",
                "past_medical_history": "Understood, no past medical conditions noted.",
                "medications": "Noted - no current medications.",
                "allergies": "Good to know - no known allergies recorded.",
                "family_history": "Understood, no relevant family history.",
                "social_history": "Thank you for sharing that."
            }
        else:
            acknowledgments = {
                "chief_complaint": "Thank you for sharing that. I understand your concern.",
                "present_illness": "I appreciate you providing those details. That's very helpful.",
                "past_medical_history": "Thank you for that information. It's important for your doctor to know.",
                "medications": "Got it, I've recorded your current medications.",
                "allergies": "Important information - I've noted your allergies.",
                "family_history": "Thank you for sharing your family history.",
                "social_history": "I appreciate you sharing this information."
            }
        
        return acknowledgments.get(section, "Thank you for that information.")
        
    def _create_chain(self, session):
        """Create LangChain conversation chain with system prompt"""
        current_section = self.SECTIONS[min(session["section_index"], len(self.SECTIONS)-1)]
        
        sys_prompt = f"""
        You are DocAI, a specialized AI assistant for Pre-Consultation Clinical History Collection. Your persona is that of a professional, empathetic, and highly accurate medical scribe or nurse.

        Your primary and ONLY purpose is to interactively gather a patient's complete clinical history and family clinical history before their consultation with a doctor.
        
        **Core Directives:**
        1. **Be Medically Systematic**: Your questioning must be medically accurate and structured. When a patient mentions a symptom (especially a chief complaint), methodologically ask follow-up questions based on standard clinical protocols (like OPQRST for pain: Onset, Palliating/Provoking factors, Quality, Radiation, Severity, Timing). Your goal is to get a complete picture of the 'History of Present Illness'.
        
        2. **Be Comprehensive**: After addressing the chief complaint, you must proactively ask about other key areas:
            - Past Medical History (e.g., "Do you have any ongoing conditions like diabetes, or high blood pressure?")
            - Past Surgical History (e.g., "Have you had any surgeries in the past?")
            - Current Medications (e.g., "Are you currently taking any prescription medications, over-the-counter drugs, or supplements?")
            - Allergies (e.g., "Do you have any allergies to medications, food or anything else?")
            - Family Clinical History (e.g., "Does anyone in your immediate family have signficant medical conditions like heart disease, cancer, or diabetes?")
            
        3. **Accept "No" Responses**: If a patient says "no", "none", "not applicable", or similar for any section, accept it gracefully and move to the next section. Do NOT push for more information if they clearly state they have nothing to report.
            - Example: If they say "No allergies", respond with "Got it, no known allergies. That's noted." and proceed.
            - Example: If they say "I don't take any medications", respond with "Understood, no current medications. Thank you."
            
        4. **Handle Vague Prompts**: If a patient's input is vague (e.g., "I feel sick", "I'm not well"), you MUST take initiative. Do not say "I don't understand." Instead, guide them with gentle, clarifying questions.
            - Example for "I feel sick": "I'm very sorry to hear that. To help me understand, could you tell me more about what's bothering you most? For example, is it pain, nausea, dizziness, or something else?"
            - Example for "I don't know": "That's perfectly okay. We can take this one step at a time. Let's start with the main reason you're looking to speak with the doctor today. Can you describe it in your own words?"
            
        5. **Be Empathetic**: Use a reassuring and patient tone. Acknowledge the patient's feelings.
            - Example: "I understand that must be very uncomfortable for you."
            - Example: "Thank you for sharing that. That's very helpful information for the doctor."
            
        **CRITICAL SAFETY CONSTRAINT: DO NOT DIAGNOSE OR ADVISE**
        
        You MUST NOT, under any circumstances, provide a medical diagnosis, medical advice, or treatment recommendations.
        You MUST NOT interpret symptoms or suggest possible causes.
        
        If the user asks for advice, a diagnosis, or what their symptoms mean (e.g., "What do you think I have?", "Is this serious?", "What should I do?"), you MUST decline and state your purpose.
        
        **Mandatory Response**: "I am an AI assistant designed only to collect your medical history for the doctor. I cannot provide any diagnosis or medical advice. Please be sure to discuss all your concerns, including this question, with the clinician."
        
        **Current Focus Area**: {current_section.replace('_', ' ').title()}
        
        Your final output from this conversation will be used to create a structured summary for the doctor. Focus on being a clear, precise and empathetic interviewer."""
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", sys_prompt),
            MessagesPlaceholder(variable_name="history"),
            ("human", "{input}")
        ])
        
        # Create message history
        message_history = InMemoryChatMessageHistory()
        
        # Load last few messages into memory
        for msg in session["history"][-6:]:
            if "Patient:" in msg:
                message_history.add_message(HumanMessage(content=msg.replace("Patient: ", "")))
            else:
                message_history.add_message(AIMessage(content=msg.replace("Assistant: ", "")))
        
        # Create a simple chain that formats the prompt with history and invokes the LLM
        class SimpleConversationChain:
            def __init__(self, llm, prompt, message_history):
                self.llm = llm
                self.prompt = prompt
                self.message_history = message_history
            
            def predict(self, input):
                messages = self.prompt.format_messages(
                    history=self.message_history.messages,
                    input=input
                )
                response = self.llm.invoke(messages)
                return response.content
        
        return SimpleConversationChain(self.llm, prompt, message_history)
    
    def generate_summary(self, session_id):
        """Generate polished, professional doctor summary using LLM"""
        if session_id not in self.sessions:
            return "No sessions found"
        
        session = self.sessions[session_id]
        section_data = session["section_data"]
        
        # Create prompt for LLM to refine the summary
        refinement_prompt = f"""You are a medical scribe creating a professional Electronic Health Record (EHR) summary for a physician. 

Based on the patient's responses below, create a polished, concise, and clinically appropriate summary. Follow these guidelines:

1. Use professional medical terminology where appropriate
2. Remove conversational language and filler words
3. Write in complete, clear sentences using third person ("Patient reports...", "Patient denies...")
4. Keep information factual and objective
5. Organize information logically within each section
6. Use abbreviations common in medical records (e.g., "y/o" for years old, "Hx" for history)
7. If patient said "no/none", write standard medical phrases like "Denies...", "None reported", "No known..."

**Raw Patient Responses:**

Chief Complaint: {section_data.get("chief_complaint", "Not specified")}

History of Present Illness: {section_data.get("present_illness", "Not specified")}

Past Medical History: {section_data.get("past_medical_history", "None reported")}

Current Medications: {section_data.get("medications", "None reported")}

Allergies: {section_data.get("allergies", "No known allergies")}

Family History: {section_data.get("family_history", "None reported")}

Social History: {section_data.get("social_history", "None reported")}

Review of Systems: {section_data.get("review_of_systems", "No concerns reported")}

---

Generate a professional clinical summary following this EXACT format:

**ELECTRONIC HEALTH RECORD - CLINICAL SUMMARY**
Generated: {datetime.now().strftime("%Y-%m-%d %H:%M")}

**CHIEF COMPLAINT:**
[Refined, concise statement of primary concern]

**HISTORY OF PRESENT ILLNESS:**
[Professional narrative of current condition with timeline, symptoms, and progression]

**PAST MEDICAL HISTORY:**
[Organized list or statement of chronic conditions, past diagnoses]

**CURRENT MEDICATIONS:**
[Professional format of medications - if available include dosage/frequency]

**ALLERGIES:**
[Standard allergy documentation format]

**FAMILY HISTORY:**
[Relevant family medical conditions]

**SOCIAL HISTORY:**
[Professionally stated social factors]

**REVIEW OF SYSTEMS:**
[Clinical documentation of other symptoms or "All other systems reviewed and negative"]

---
**Prepared for physician review**

IMPORTANT: Return ONLY the formatted clinical summary. Do not add any explanations, comments, or extra text."""

        try:
            # Use LLM to refine the summary
            response = self.llm.invoke(refinement_prompt)
            refined_summary = response.content.strip()
            return refined_summary
            
        except Exception as e:
            # Fallback to basic summary if LLM fails
            return f"""**ELECTRONIC HEALTH RECORD - CLINICAL SUMMARY**
Generated: {datetime.now().strftime("%Y-%m-%d %H:%M")}

**CHIEF COMPLAINT:**
{section_data.get("chief_complaint", "Not specified")}

**HISTORY OF PRESENT ILLNESS:**
{section_data.get("present_illness", "Not specified")}

**PAST MEDICAL HISTORY:**
{section_data.get("past_medical_history", "None reported")}

**CURRENT MEDICATIONS:**
{section_data.get("medications", "None reported")}

**ALLERGIES:**
{section_data.get("allergies", "No known allergies")}

**FAMILY HISTORY:**
{section_data.get("family_history", "None reported")}

**SOCIAL HISTORY:**
{section_data.get("social_history", "None reported")}

**REVIEW OF SYSTEMS:**
{section_data.get("review_of_systems", "No concerns reported")}

---
**Note:** Error generating refined summary: {str(e)}
"""