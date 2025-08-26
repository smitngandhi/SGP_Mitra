from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from app.utils.logger_utils import get_logger

logger = get_logger(__name__)
logger.debug("[DEBUG] Initializing HuggingFace embeddings and FAISS vectorstores")

# Load embeddings
try:
    local_path = "app/all-MiniLM-L6-v2_local"  # snapshot folder from Kaggle
    hf_embeddings = HuggingFaceEmbeddings(
        model_name=local_path,
        model_kwargs={'device': 'cpu'},
        encode_kwargs={'normalize_embeddings': False}
    )
    logger.info("[INFO] HuggingFace embeddings loaded successfully from local path")
except Exception as e:
    logger.error(f"[ERROR] Failed to load HuggingFace embeddings: {str(e)}", exc_info=True)
    raise

# Load FAISS vectorstores
try:
    api_docs_vectorstore = FAISS.load_local(
        "app/data/Embeddings/API_DOCUMENTATION_hfembeddings",
        hf_embeddings,
        allow_dangerous_deserialization=True
    )
    architecture_vectorstore = FAISS.load_local(
        "app/data/Embeddings/ARCHITECTURE_hfembeddings",
        hf_embeddings,
        allow_dangerous_deserialization=True
    )
    deployment_vectorstore = FAISS.load_local(
        "app/data/Embeddings/DEPLOYMENT_hfembeddings",
        hf_embeddings,
        allow_dangerous_deserialization=True
    )
    developer_guide_vectorstore = FAISS.load_local(
        "app/data/Embeddings/DEVELOPER_GUIDE_hfembeddings",
        hf_embeddings,
        allow_dangerous_deserialization=True
    )
    mitra_overview_vectorstore = FAISS.load_local(
        "app/data/Embeddings/mitra_hfembeddings",
        hf_embeddings,
        allow_dangerous_deserialization=True
    )
    readme_vectorstore = FAISS.load_local(
        "app/data/Embeddings/README_hfembeddings",
        hf_embeddings,
        allow_dangerous_deserialization=True
    )
    user_guide_vectorstore = FAISS.load_local(
        "app/data/Embeddings/USER_GUIDE_hfembeddings",
        hf_embeddings,
        allow_dangerous_deserialization=True
    )

    logger.info("[INFO] All FAISS vectorstores loaded successfully")

except Exception as e:
    logger.error(f"[ERROR] Failed to load one or more FAISS vectorstores: {str(e)}", exc_info=True)
    raise
