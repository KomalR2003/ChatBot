import os
import time
from pathlib import Path
from dotenv import load_dotenv
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.document_loaders import PyMuPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from modules.database import get_collection
from logger import logger

UPLOAD_DIR = "./uploaded_pdfs"
os.makedirs(UPLOAD_DIR, exist_ok=True)

load_dotenv()

def load_vectorstore(uploaded_files):
    """Load documents into MongoDB vectorstore"""
    file_paths = []

    # Save uploaded files
    for file in uploaded_files:
        save_path = Path(UPLOAD_DIR) / file.filename
        with open(save_path, "wb") as f:
            f.write(file.file.read())
        file_paths.append(str(save_path))
        logger.info(f"Saved file: {save_path}")

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
            "embeddings": embedding,
            "created_at": time.time()
        }
        documents_to_insert.append(doc_dict)

    # Insert into MongoDB
    if documents_to_insert:
        result = collection.insert_many(documents_to_insert)
        logger.info(f"Inserted {len(result.inserted_ids)} documents into MongoDB")

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
            {"$project": {"content": 1, "source": 1, "page": 1, "similarity": 1}}
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
