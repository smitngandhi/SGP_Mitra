from pinecone import Pinecone
import os
from dotenv import load_dotenv
from .logger_utils import get_logger

# Load .env file
load_dotenv()

# Pinecone initialization (delayed to avoid circular imports)
dense_index = None

def initialize_pinecone():
    """Initialize Pinecone connection - called when needed"""
    global dense_index
    if dense_index is not None:
        return dense_index
        
    logger = get_logger(__name__)
    logger.debug("[DEBUG] Logger initialized for utils/init.py")
    logger.info("[INFO] Initializing Pinecone connection")

    try:
        pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
        logger.debug(f"[DEBUG] Pinecone client initialized successfully")
        
        index_name = os.getenv("PINCONE_INDEX_NAME")
        logger.info(f"[INFO] Checking for index: {index_name}")
        
        if not pc.has_index(index_name):
            logger.warning(f"Index {index_name} not found, creating new index")
            pc.create_index_for_model(
                name=index_name,
                cloud="aws",
                region="us-east-1",
                embed={
                    "model": "llama-text-embed-v2",
                    "field_map": {"text": "chunk_text"}
                }
            )
            logger.info(f"[INFO] Successfully created index: {index_name}")
        else:
            logger.info(f"[INFO] Index {index_name} already exists")
        
        dense_index = pc.Index(index_name)  
        logger.info("[INFO] Pinecone dense index initialized successfully")
        return dense_index
        
    except Exception as e:
        logger.critical(f"[CRITICAL] Failed to initialize Pinecone: {str(e)}")
        raise