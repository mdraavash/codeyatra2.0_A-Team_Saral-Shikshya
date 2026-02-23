from dotenv import load_dotenv
import os

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
# Embedding search configuration
EMBEDDING_SIMILARITY_THRESHOLD = float(os.getenv("EMBEDDING_SIMILARITY_THRESHOLD", 0.82))
EMBEDDING_SEARCH_CANDIDATES = int(os.getenv("EMBEDDING_SEARCH_CANDIDATES", 50))
# Subject validation configuration
SUBJECT_VALIDATION_ENABLED = os.getenv("SUBJECT_VALIDATION_ENABLED", "true").lower() == "true"
SUBJECT_VALIDATION_CONFIDENCE_THRESHOLD = float(os.getenv("SUBJECT_VALIDATION_CONFIDENCE_THRESHOLD", 0.6))
