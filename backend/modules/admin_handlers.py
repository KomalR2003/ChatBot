import os
import hashlib
from dotenv import load_dotenv
from logger import logger

load_dotenv()

class AdminHandler:
    def __init__(self):
        # Get admin key from environment variable
        self.admin_key = os.environ.get("ADMIN_KEY", "your_secret_admin_key_2024")
        
    def verify_admin_key(self, provided_key: str) -> bool:
        """Verify if the provided admin key is correct"""
        try:
            # Simple comparison - in production, use hashed keys
            return provided_key == self.admin_key
        except Exception as e:
            logger.error(f"Error verifying admin key: {e}")
            return False
    
    def hash_key(self, key: str) -> str:
        """Hash a key for secure storage"""
        return hashlib.sha256(key.encode()).hexdigest()