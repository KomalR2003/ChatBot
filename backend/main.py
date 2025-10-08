from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List, Optional
import uuid
from datetime import datetime
import json
from pydantic import BaseModel

from modules.database import get_collection, create_indexes
from modules.load_vectorstore import load_vectorstore, load_json_data
from modules.llm import get_llm_chain
from modules.query_handlers import query_chain
from modules.admin_handlers import AdminHandler
from logger import logger

app = FastAPI(title="Universal AI API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Initialize admin handler
admin_handler = AdminHandler()

# Initialize LLM chain on startup
llm_chain = None

@app.on_event("startup")
async def startup_event():
    global llm_chain
    try:
        create_indexes()
        collection = get_collection()
        llm_chain = get_llm_chain(collection)
        logger.info("Application startup completed successfully")
    except Exception as e:
        logger.error(f"Startup error: {e}")

# Pydantic models for chat history
class ChatMessage(BaseModel):
    role: str
    content: str
    sources: Optional[List[str]] = []
    response_type: Optional[str] = "general"
    timestamp: datetime

class ChatSession(BaseModel):
    session_id: str
    title: str
    messages: List[ChatMessage]
    created_at: datetime
    updated_at: datetime

class NewChatRequest(BaseModel):
    title: Optional[str] = "New Chat"

@app.get("/")
async def root():
    return {"message": "Universal AI API is running"}

@app.get("/test")
async def test():
    return {"status": "API is working"}

@app.post("/ask/")
async def ask_question(question: str = Form(...), session_id: Optional[str] = Form(None)):
    try:
        # Add input validation
        if not question or question.strip() == "":
            raise HTTPException(status_code=400, detail="Question cannot be empty")
        
        if not llm_chain:
            logger.error("LLM chain not initialized")
            raise HTTPException(status_code=500, detail="LLM chain not initialized")

        logger.info(f"Processing question: {question[:100]}...")
        
        # Call the query chain
        response = query_chain(llm_chain, question)
        
        # Validate response structure
        if not isinstance(response, dict):
            logger.error(f"Invalid response format from query_chain: {type(response)}")
            raise HTTPException(status_code=500, detail="Invalid response format")
        
        # Ensure response has required fields
        if "response" not in response:
            response["response"] = "I couldn't generate a proper response."
        
        logger.info(f"Successfully processed question, response length: {len(str(response))}")
        
        # If session_id is provided, save the conversation to that session
        if session_id:
            try:
                await save_message_to_session(session_id, question, response)
                logger.info(f"Saved conversation to session: {session_id}")
            except Exception as session_error:
                logger.warning(f"Failed to save to session {session_id}: {session_error}")
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing question: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# Chat History Endpoints
@app.post("/chat/new")
async def create_new_chat(request: NewChatRequest):
    try:
        session_id = str(uuid.uuid4())
        chat_session = {
            "session_id": session_id,
            "title": request.title,
            "messages": [],
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        
        # Store in MongoDB
        collection = get_collection("chat_sessions")
        collection.insert_one(chat_session)
        
        logger.info(f"Created new chat session: {session_id}")
        return {"session_id": session_id, "title": request.title}
    except Exception as e:
        logger.error(f"Error creating new chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/chat/sessions")
async def get_chat_sessions():
    try:
        collection = get_collection("chat_sessions")
        sessions = list(collection.find(
            {},
            {"session_id": 1, "title": 1, "created_at": 1, "updated_at": 1, "_id": 0}
        ).sort("updated_at", -1))
        
        # Convert datetime to string for JSON serialization
        for session in sessions:
            session["created_at"] = session["created_at"].isoformat()
            session["updated_at"] = session["updated_at"].isoformat()
        
        return sessions
    except Exception as e:
        logger.error(f"Error getting chat sessions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/chat/{session_id}")
async def get_chat_session(session_id: str):
    try:
        collection = get_collection("chat_sessions")
        session = collection.find_one({"session_id": session_id}, {"_id": 0})
        
        if not session:
            raise HTTPException(status_code=404, detail="Chat session not found")
        
        # Convert datetime to string for JSON serialization
        session["created_at"] = session["created_at"].isoformat()
        session["updated_at"] = session["updated_at"].isoformat()
        
        for message in session["messages"]:
            if "timestamp" in message:
                message["timestamp"] = message["timestamp"].isoformat()
        
        return session
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting chat session {session_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/chat/{session_id}")
async def delete_chat_session(session_id: str):
    try:
        collection = get_collection("chat_sessions")
        result = collection.delete_one({"session_id": session_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Chat session not found")
        
        logger.info(f"Deleted chat session: {session_id}")
        return {"message": "Chat session deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting chat session: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def save_message_to_session(session_id: str, question: str, response: dict):
    """Save a conversation to a chat session"""
    try:
        collection = get_collection("chat_sessions")
        
        user_message = {
            "role": "user",
            "content": question,
            "timestamp": datetime.now()
        }
        
        assistant_message = {
            "role": "assistant",
            "content": response["response"],
            "sources": response.get("sources", []),
            "response_type": response.get("response_type", "general"),
            "timestamp": datetime.now()
        }
        
        # Check if this is the first message in the session
        session = collection.find_one({"session_id": session_id})
        is_first_message = not session or len(session.get("messages", [])) == 0
        
        collection.update_one(
            {"session_id": session_id},
            {
                "$push": {
                    "messages": {
                        "$each": [user_message, assistant_message]
                    }
                },
                "$set": {"updated_at": datetime.now()}
            }
        )
        
        # Only update title if it's still "New Chat"
        if is_first_message and session and session.get("title") == "New Chat":
            title = question.strip()
            
            if title and not title[0].isupper():
                title = title[0].upper() + title[1:]
            
            if len(title) > 50:
                title = title[:50]
                last_space = title.rfind(' ')
                if last_space > 30:
                    title = title[:last_space] + "..."
                else:
                    title = title + "..."
            
            collection.update_one(
                {"session_id": session_id},
                {"$set": {"title": title}}
            )
        
    except Exception as e:
        logger.error(f"Error saving message to session {session_id}: {e}")

# Admin endpoints
@app.post("/admin/upload_pdfs/")
async def admin_upload_pdfs(
    admin_key: str = Form(...),
    files: List[UploadFile] = File(...)
):
    if not admin_handler.verify_admin_key(admin_key):
        raise HTTPException(status_code=403, detail="Invalid admin key")
    
    try:
        if not files or len(files) == 0:
            raise HTTPException(status_code=400, detail="No files uploaded")

        total_docs = load_vectorstore(files)
        logger.info(f"Admin uploaded {len(files)} PDF files, created {total_docs} documents")
        
        return {
            "message": f"Successfully uploaded {len(files)} PDF files",
            "files_count": len(files),
            "documents_created": total_docs
        }
    except Exception as e:
        logger.error(f"Error in admin PDF upload: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/admin/stats/")
async def get_admin_stats(admin_key: str):
    if not admin_handler.verify_admin_key(admin_key):
        raise HTTPException(status_code=403, detail="Invalid admin key")
    
    try:
        collection = get_collection()
        
        total_docs = collection.count_documents({})
        pdf_docs = collection.count_documents({"document_type": "pdf"})
        
        return {
            "total_documents": total_docs,
            "pdf_documents": pdf_docs,           
        }
    except Exception as e:
        logger.error(f"Error getting admin stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/admin/pdfs/")
async def get_admin_pdfs(admin_key: str):
    if not admin_handler.verify_admin_key(admin_key):
        raise HTTPException(status_code=403, detail="Invalid admin key")
    
    try:
        collection = get_collection()
        
        # Get unique PDF files from the collection
        pipeline = [
            {"$match": {"document_type": "pdf"}},
            {"$group": {
                "_id": "$source",
                "filename": {"$first": "$source"},
                "document_count": {"$sum": 1},
                "first_seen": {"$min": "$_id"}
            }},
            {"$project": {
                "_id": 0,
                "filename": {"$arrayElemAt": [{"$split": ["$filename", "/"]}, -1]},
                "full_path": "$filename",
                "document_count": 1,
                "upload_date": {"$toDate": "$first_seen"}
            }},
            {"$sort": {"upload_date": -1}}
        ]
        
        pdfs = list(collection.aggregate(pipeline))
        
        # Process the results
        processed_pdfs = []
        for pdf in pdfs:
            filename_parts = pdf["filename"].replace('\\', '/').split('/')
            clean_filename = filename_parts[-1]
            
            processed_pdfs.append({
                "filename": clean_filename,
                "full_path": pdf["full_path"],
                "document_count": pdf["document_count"],
                "upload_date": pdf["upload_date"].isoformat(),
                "size": pdf["document_count"] * 1024
            })
        
        logger.info(f"Admin fetched {len(processed_pdfs)} PDF files")
        return {"pdfs": processed_pdfs}
        
    except Exception as e:
        logger.error(f"Error getting admin PDFs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/admin/delete_file/")
async def admin_delete_file(filename: str, admin_key: str):
    if not admin_handler.verify_admin_key(admin_key):
        raise HTTPException(status_code=403, detail="Invalid admin key")
    
    try:
        collection = get_collection()
        
        # Try exact match first
        result = collection.delete_many({"source": filename})
        
        # If no exact match, try matching documents that end with the filename
        if result.deleted_count == 0:
            import re
            escaped_filename = re.escape(filename)
            result = collection.delete_many({
                "source": {"$regex": f".*{escaped_filename}$", "$options": "i"}
            })
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail=f"No documents found for '{filename}'")
        
        logger.info(f"Admin deleted {result.deleted_count} documents for '{filename}'")
        
        return {
            "message": f"Successfully deleted '{filename}'",
            "deleted_count": result.deleted_count
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting file: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)