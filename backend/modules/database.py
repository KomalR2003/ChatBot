import os
from pymongo import MongoClient
from dotenv import load_dotenv
from logger import logger

load_dotenv()

MONGODB_URL = os.environ.get("MONGODB_URL", "mongodb://localhost:27017/")
DATABASE_NAME = os.environ.get("DATABASE_NAME", "ragbot_db")
COLLECTION_NAME = os.environ.get("COLLECTION_NAME", "documents")

def get_mongo_client():
    """Get MongoDB client connection"""
    try:
        client = MongoClient(MONGODB_URL)
        return client
    except Exception as e:
        logger.error(f"Error connecting to MongoDB: {e}")
        raise

def get_database():
    """Get MongoDB database"""
    client = get_mongo_client()
    return client[DATABASE_NAME]

def get_collection(collection_name=COLLECTION_NAME):
    """Get MongoDB collection"""
    db = get_database()
    return db[collection_name]

def create_indexes():
    """Create indexes for better performance"""
    try:
        collection = get_collection()
        
        # Create text index for full-text search
        collection.create_index([("content", "text")])
        
        # Create index on source field
        collection.create_index("source")
        
        # Create index on embeddings if using vector search
        collection.create_index("embeddings")
        
        logger.info("MongoDB indexes created successfully")
    except Exception as e:
        logger.error(f"Error creating indexes: {e}")

def close_connection():
    """Close MongoDB connection"""
    try:
        client = get_mongo_client()
        client.close()
        logger.info("MongoDB connection closed")
    except Exception as e:
        logger.error(f"Error closing MongoDB connection: {e}")