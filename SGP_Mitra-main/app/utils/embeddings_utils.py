from langchain_community.embeddings import HuggingFaceInferenceAPIEmbeddings
from langchain_community.vectorstores import FAISS
from app.utils.logger_utils import get_logger
from dotenv import load_dotenv
import os

load_dotenv()

logger = get_logger(__name__)
logger.debug("[DEBUG] Initializing HuggingFace embeddings and FAISS vectorstores")

# Load embeddings using LangChain's official API embeddings
try:
    hf_embeddings = HuggingFaceInferenceAPIEmbeddings(
        api_key=os.getenv("HUGGINGFACEHUB_API_TOKEN"),
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )
    logger.info("[INFO] HuggingFace API embeddings initialized successfully")
except Exception as e:
    logger.error(f"[ERROR] Failed to initialize HuggingFace API embeddings: {str(e)}")
    raise

# Load FAISS vectorstores
vectorstore_paths = {
    "api_docs": "app/data/Embeddings/API_DOCUMENTATION_hfembeddings",
    "architecture": "app/data/Embeddings/ARCHITECTURE_hfembeddings", 
    "deployment": "app/data/Embeddings/DEPLOYMENT_hfembeddings",
    "developer_guide": "app/data/Embeddings/DEVELOPER_GUIDE_hfembeddings",
    "mitra_overview": "app/data/Embeddings/mitra_hfembeddings",
    "readme": "app/data/Embeddings/README_hfembeddings",
    "user_guide": "app/data/Embeddings/USER_GUIDE_hfembeddings"
}

vectorstores = {}

try:
    for name, path in vectorstore_paths.items():
        vectorstores[name] = FAISS.load_local(
            path,
            hf_embeddings,
            allow_dangerous_deserialization=True
        )
        logger.info(f"[INFO] Loaded {name} vectorstore successfully")
    
    # If you prefer individual variables:
    api_docs_vectorstore = vectorstores["api_docs"]
    architecture_vectorstore = vectorstores["architecture"]
    deployment_vectorstore = vectorstores["deployment"]
    developer_guide_vectorstore = vectorstores["developer_guide"]
    mitra_overview_vectorstore = vectorstores["mitra_overview"]
    readme_vectorstore = vectorstores["readme"]
    user_guide_vectorstore = vectorstores["user_guide"]

    logger.info("[INFO] All FAISS vectorstores loaded successfully")

except Exception as e:
    logger.error(f"[ERROR] Failed to load one or more FAISS vectorstores: {str(e)}", exc_info=True)
    raise