from fastapi import FastAPI, UploadFile, File, Form, Request, Query
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from modules.load_vectorstore import load_vectorstore
from modules.llm import get_llm_chain
from modules.query_handlers import query_chain
from modules.database import get_mongo_client, get_collection
from logger import logger
import os

app = FastAPI(title="RagBot")

# CORS middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.middleware("http")
async def catch_exception_middleware(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception as exc:
        logger.exception("UNHANDLED EXCEPTION ...")
        return JSONResponse(status_code=500, content={"error": str(exc)})

@app.post("/upload_pdfs/")
async def upload_pdfs(files: List[UploadFile] = File(...)):
    try:
        logger.info(f"received {len(files)} files")
        result = load_vectorstore(files)
        logger.info("documents added to MongoDB")
        return {"message": "Files processed and vectorstore updated", "count": len(files)}
    except Exception as e:
        logger.exception("Error during pdf upload")
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.post("/ask/")
async def ask_questions(question: str = Form(...)):
    try:
        logger.info(f"user query: {question}")
        
        # Get MongoDB collection
        collection = get_collection()
        
        # Create chain with MongoDB collection
        chain = get_llm_chain(collection)
        result = query_chain(chain, question)
        logger.info("query successful...")
        return result
    except Exception as e:
        logger.exception("error processing question")
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/chat_history/")
async def get_chat_history():
    try:
        return {"history": []}
    except Exception as e:
        logger.exception("error getting chat history")
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.post("/save_chat/")
async def save_chat(chat_data: dict):
    try:
        return {"message": "Chat saved successfully"}
    except Exception as e:
        logger.exception("error saving chat")
        return JSONResponse(status_code=500, content={"error": str(e)})
    
@app.delete("/delete_file/")
async def delete_file(filename: str = Query(..., description="PDF filename to delete")):
    """Delete all documents from a specific PDF file"""
    try:
        collection = get_collection()
        
        # Delete documents where source contains the filename
        result = collection.delete_many({"source": {"$regex": filename, "$options": "i"}})
        
        logger.info(f"Deleted {result.deleted_count} documents for filename: {filename}")
        
        return {
            "message": f"Deleted {result.deleted_count} documents",
            "filename": filename,
            "deleted_count": result.deleted_count
        }
    except Exception as e:
        logger.exception("Error deleting documents")
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/test")
async def test():
    return {"message": "Testing successful..."}