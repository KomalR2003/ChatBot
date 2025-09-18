import os
import time
import json
from pathlib import Path
from dotenv import load_dotenv
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.document_loaders import PyMuPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
from modules.database import get_collection
from logger import logger

UPLOAD_DIR = "./uploaded_documents"
os.makedirs(UPLOAD_DIR, exist_ok=True)

load_dotenv()

def load_vectorstore(uploaded_files):
    """Load PDF documents into MongoDB vectorstore"""
    file_paths = []

    # Save uploaded files
    for file in uploaded_files:
        save_path = Path(UPLOAD_DIR) / file.filename
        with open(save_path, "wb") as f:
            f.write(file.file.read())
        file_paths.append(str(save_path))
        logger.info(f"Saved PDF file: {save_path}")

    # Load documents
    docs = []
    for path in file_paths:
        loader = PyMuPDFLoader(path)
        loaded_docs = loader.load()
        docs.extend(loaded_docs)
        logger.info(f"Loaded {len(loaded_docs)} pages from {path}")

    # Split documents
    splitter = RecursiveCharacterTextSplitter(chunk_size=3000, chunk_overlap=200)
    texts = splitter.split_documents(docs)
    logger.info(f"Split into {len(texts)} chunks")

    # Create embeddings and store
    return _store_documents_in_mongodb(texts, "pdf")

def load_json_data(uploaded_files):
    """Load JSON documents into MongoDB vectorstore"""
    file_paths = []

    # Save uploaded files
    for file in uploaded_files:
        save_path = Path(UPLOAD_DIR) / file.filename
        with open(save_path, "wb") as f:
            f.write(file.file.read())
        file_paths.append(str(save_path))
        logger.info(f"Saved JSON file: {save_path}")

    # Load and process JSON documents
    docs = []
    for path in file_paths:
        try:
            with open(path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Process JSON data based on structure
            if isinstance(data, list):
                for i, item in enumerate(data):
                    content = json.dumps(item, indent=2) if isinstance(item, dict) else str(item)
                    doc = Document(
                        page_content=content,
                        metadata={
                            "source": str(path),
                            "item_index": i,
                            "type": "json_array_item"
                        }
                    )
                    docs.append(doc)
            elif isinstance(data, dict):
                # If it's a dict, create documents for each key-value pair or the whole object
                if len(str(data)) > 5000:  # Split large objects
                    for key, value in data.items():
                        content = f"Key: {key}\nValue: {json.dumps(value, indent=2) if isinstance(value, (dict, list)) else str(value)}"
                        doc = Document(
                            page_content=content,
                            metadata={
                                "source": str(path),
                                "key": key,
                                "type": "json_object_part"
                            }
                        )
                        docs.append(doc)
                else:
                    # Small object, keep as one document
                    content = json.dumps(data, indent=2)
                    doc = Document(
                        page_content=content,
                        metadata={
                            "source": str(path),
                            "type": "json_object"
                        }
                    )
                    docs.append(doc)
            else:
                # Simple value
                doc = Document(
                    page_content=str(data),
                    metadata={
                        "source": str(path),
                        "type": "json_value"
                    }
                )
                docs.append(doc)
                
            logger.info(f"Processed JSON file {path} into {len(docs)} documents")
            
        except json.JSONDecodeError as e:
            logger.error(f"Error parsing JSON file {path}: {e}")
            continue
        except Exception as e:
            logger.error(f"Error processing JSON file {path}: {e}")
            continue

    # Split large documents if needed
    splitter = RecursiveCharacterTextSplitter(chunk_size=3000, chunk_overlap=200)
    texts = splitter.split_documents(docs)
    logger.info(f"Split JSON data into {len(texts)} chunks")

    # Create embeddings and store
    return _store_documents_in_mongodb(texts, "json")

def _store_documents_in_mongodb(texts, doc_type):
    """Store documents in MongoDB with embeddings"""
    # Create embeddings
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L12-v2")

    # Get MongoDB collection
    collection = get_collection()

    # Process and store documents
    documents_to_insert = []
    for i, doc in enumerate(texts):
        embedding = embeddings.embed_query(doc.page_content)

        doc_dict = {
            "content": doc.page_content,
            "source": doc.metadata.get("source", ""),
            "page": doc.metadata.get("page", 0),
            "document_type": doc_type,
            "embeddings": embedding,
            "created_at": time.time(),
            "metadata": doc.metadata
        }
        documents_to_insert.append(doc_dict)

    # Insert into MongoDB
    if documents_to_insert:
        result = collection.insert_many(documents_to_insert)
        logger.info(f"Inserted {len(result.inserted_ids)} {doc_type} documents into MongoDB")

    return len(documents_to_insert)

def similarity_search(query, collection, embeddings_model, k=3):
    """Perform similarity search in MongoDB"""
    try:
        logger.debug("Generating query embedding...")
        query_embedding = embeddings_model.embed_query(query)
        logger.debug("Query embedding created")

        # MongoDB aggregation pipeline for vector similarity search
        logger.debug("Running similarity search in MongoDB...")
        pipeline = [
            {
                "$addFields": {
                    "similarity": {
                        "$let": {
                            "vars": {
                                "dot_product": {
                                    "$reduce": {
                                        "input": {"$range": [0, {"$size": "$embeddings"}]},
                                        "initialValue": 0,
                                        "in": {
                                            "$add": [
                                                "$$value",
                                                {
                                                    "$multiply": [
                                                        {"$arrayElemAt": ["$embeddings", "$$this"]},
                                                        {"$arrayElemAt": [query_embedding, "$$this"]}
                                                    ]
                                                }
                                            ]
                                        }
                                    }
                                }
                            },
                            "in": "$$dot_product"
                        }
                    }
                }
            },
            {"$sort": {"similarity": -1}},
            {"$limit": k},
            {"$project": {"content": 1, "source": 1, "page": 1, "document_type": 1, "similarity": 1, "metadata": 1}}
        ]

        results = list(collection.aggregate(pipeline))
        logger.debug(f"Similarity search returned {len(results)} docs")
        return results

    except Exception as e:
        logger.error(f"Error in similarity search: {e}")
        # fallback: text search
        results = list(collection.find(
            {"$text": {"$search": query}},
            {"score": {"$meta": "textScore"}}
        ).sort([("score", {"$meta": "textScore"})]).limit(k))
        logger.debug(f"Fallback text search returned {len(results)} docs")
        return results