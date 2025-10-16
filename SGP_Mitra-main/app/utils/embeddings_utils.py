import os
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

# Load all FAISS vectorstores from the embeddings directory
embeddings_dir = "app/data/Embeddings"
vectorstores = {}

try:
    # Get all embedding directories
    if os.path.exists(embeddings_dir):
        embedding_folders = [f for f in os.listdir(embeddings_dir) if f.endswith('_hfembeddings')]
        
        for folder in embedding_folders:
            folder_path = os.path.join(embeddings_dir, folder)
            if os.path.isdir(folder_path):
                # Extract the base name (remove _hfembeddings suffix)
                base_name = folder.replace('_hfembeddings', '')
                
                try:
                    vectorstore = FAISS.load_local(
                        folder_path,
                        hf_embeddings,
                        allow_dangerous_deserialization=True
                    )
                    vectorstores[base_name] = vectorstore
                    logger.debug(f"[DEBUG] Loaded vectorstore: {base_name}")
                except Exception as e:
                    logger.warning(f"[WARNING] Failed to load vectorstore {base_name}: {str(e)}")
                    continue
        
        logger.info(f"[INFO] Successfully loaded {len(vectorstores)} FAISS vectorstores")
        logger.info(f"[INFO] Available vectorstores: {list(vectorstores.keys())}")
    else:
        logger.error(f"[ERROR] Embeddings directory not found: {embeddings_dir}")
        raise FileNotFoundError(f"Embeddings directory not found: {embeddings_dir}")

except Exception as e:
    logger.error(f"[ERROR] Failed to load FAISS vectorstores: {str(e)}", exc_info=True)
    raise

# Create individual variables for backward compatibility and easy access
api_docs_vectorstore = vectorstores.get('API_DOCUMENTATION')
architecture_vectorstore = vectorstores.get('ARCHITECTURE')
deployment_vectorstore = vectorstores.get('DEPLOYMENT')
developer_guide_vectorstore = vectorstores.get('DEVELOPER_GUIDE')
mitra_overview_vectorstore = vectorstores.get('mitra')
readme_vectorstore = vectorstores.get('README')
user_guide_vectorstore = vectorstores.get('USER_GUIDE')

# Mental health related vectorstores
anxiety_disorder_vectorstore = vectorstores.get('Anxiety Disorder')
adhd_vectorstore = vectorstores.get('Attention Deficit Hyperactivity Disorder')
autism_vectorstore = vectorstores.get('Autism Spectrum Disorder')
bipolar_disorder_vectorstore = vectorstores.get('Bipolar Disorder')
borderline_personality_vectorstore = vectorstores.get('Borderline Personality Disorder')
brain_anatomy_vectorstore = vectorstores.get('Brain Anatomy and Physiology')
children_adolescents_vectorstore = vectorstores.get('Children and Adolescents')
clinical_research_vectorstore = vectorstores.get('Clinical Research and Trials')
depression_vectorstore = vectorstores.get('Depression')
dmdd_vectorstore = vectorstores.get('Disruptive Mood Dysregulation Disorder')
general_articles_vectorstore = vectorstores.get('General Articles')
genetics_vectorstore = vectorstores.get('Genetics')
mens_mental_health_vectorstore = vectorstores.get("Men's Mental Health")
ocd_vectorstore = vectorstores.get('Obsessive-Compulsive Disorder (OCD)')
panic_disorder_vectorstore = vectorstores.get('Panic Disorder')
ptsd_vectorstore = vectorstores.get('Post-Traumatic Stress Disorder (PTSD)')
prevention_vectorstore = vectorstores.get('Prevention')
psychosis_vectorstore = vectorstores.get('Psychosis')
schizophrenia_vectorstore = vectorstores.get('Schizophrenia')
sad_vectorstore = vectorstores.get('Seasonal Affective Disorder (SAD)')
social_anxiety_vectorstore = vectorstores.get('Social Anxiety Disorder')
stress_vectorstore = vectorstores.get('Stress')
suicide_vectorstore = vectorstores.get('Suicide')
traumatic_events_vectorstore = vectorstores.get('Traumatic Events')
treatments_vectorstore = vectorstores.get('Treatments')
womens_mental_health_vectorstore = vectorstores.get("Women's Mental Health")

# PDF-specific vectorstores
understanding_psychosis_vectorstore = vectorstores.get('23-MH-8110-Understanding-Psychosis')
stress_guide_vectorstore = vectorstores.get('Im-So-Stressed-Out')
mental_health_guidebook_vectorstore = vectorstores.get('MHGuidebook-EBookDownload')
suicide_faq_vectorstore = vectorstores.get('frequently-asked-questions-about-suicide')
ocd_508_vectorstore = vectorstores.get('obsessive-compulsive-disorder-508')
perinatal_depression_vectorstore = vectorstores.get('perinatal-depression')
ptsd_guide_vectorstore = vectorstores.get('post-traumatic-stress-disorder')
schizophrenia_guide_vectorstore = vectorstores.get('schizophrenia_1')
sad_508_vectorstore = vectorstores.get('seasonal-affective-disorder-508')