from fastapi import FastAPI, Form, Request, Query, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from modules.load_vectorstore import load_vectorstore, load_json_data
from modules.llm import get_llm_chain
from modules.query_handlers import query_chain
from modules.database import get_mongo_client, get_collection
from modules.admin_handlers import AdminHandler
from logger import logger
import os

app = FastAPI(title="Universal Chatbot")

# CORS middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Initialize admin handler
admin = AdminHandler()

@app.middleware("http")
async def catch_exception_middleware(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception as exc:
        logger.exception("UNHANDLED EXCEPTION ...")
        return JSONResponse(status_code=500, content={"error": str(exc)})

# Admin endpoints for document management
@app.post("/admin/upload_pdfs/")
async def admin_upload_pdfs(files: List[UploadFile] = File(...), admin_key: str = Form(...)):
    try:
        if not admin.verify_admin_key(admin_key):
            raise HTTPException(status_code=403, detail="Invalid admin key")
        
        logger.info(f"Admin uploading {len(files)} PDF files")
        result = load_vectorstore(files)
        logger.info("PDF documents added to MongoDB")
        return {"message": "PDF files processed and vectorstore updated", "count": len(files)}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error during admin PDF upload")
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.post("/admin/upload_json/")
async def admin_upload_json(files: List[UploadFile] = File(...), admin_key: str = Form(...)):
    try:
        if not admin.verify_admin_key(admin_key):
            raise HTTPException(status_code=403, detail="Invalid admin key")
        
        logger.info(f"Admin uploading {len(files)} JSON files")
        result = load_json_data(files)
        logger.info("JSON documents added to MongoDB")
        return {"message": "JSON files processed and vectorstore updated", "count": len(files)}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error during admin JSON upload")
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.delete("/admin/delete_file/")
async def admin_delete_file(filename: str = Query(...), admin_key: str = Query(...)):
    try:
        if not admin.verify_admin_key(admin_key):
            raise HTTPException(status_code=403, detail="Invalid admin key")
        
        collection = get_collection()
        result = collection.delete_many({"source": {"$regex": filename, "$options": "i"}})
        
        logger.info(f"Admin deleted {result.deleted_count} documents for filename: {filename}")
        
        return {
            "message": f"Deleted {result.deleted_count} documents",
            "filename": filename,
            "deleted_count": result.deleted_count
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error deleting documents")
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/admin/stats/")
async def admin_get_stats(admin_key: str = Query(...)):
    try:
        if not admin.verify_admin_key(admin_key):
            raise HTTPException(status_code=403, detail="Invalid admin key")
        
        collection = get_collection()
        total_docs = collection.count_documents({})
        pdf_docs = collection.count_documents({"source": {"$regex": r"\.pdf$", "$options": "i"}})
        json_docs = collection.count_documents({"source": {"$regex": r"\.json$", "$options": "i"}})
        
        return {
            "total_documents": total_docs,
            "pdf_documents": pdf_docs,
            "json_documents": json_docs
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error getting admin stats")
        return JSONResponse(status_code=500, content={"error": str(e)})

# Public user endpoint
@app.post("/ask/")
async def ask_questions(question: str = Form(...)):
    try:
        logger.info(f"User query: {question}")
        
        # Get MongoDB collection
        collection = get_collection()
        
        # Create chain with MongoDB collection
        chain = get_llm_chain(collection)
        result = query_chain(chain, question)
        logger.info("Query successful...")
        return result
    except Exception as e:
        logger.exception("Error processing question")
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/chat_history/")
async def get_chat_history():
    try:
        return {"history": []}
    except Exception as e:
        logger.exception("Error getting chat history")
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.post("/save_chat/")
async def save_chat(chat_data: dict):
    try:
        return {"message": "Chat saved successfully"}
    except Exception as e:
        logger.exception("Error saving chat")
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/test")
async def test():
    return {"message": "Universal Chatbot is running successfully..."}