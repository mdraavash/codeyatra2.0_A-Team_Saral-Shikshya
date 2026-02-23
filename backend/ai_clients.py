import os
from dotenv import load_dotenv
import torch
from sentence_transformers import SentenceTransformer
from langchain_google_genai import ChatGoogleGenerativeAI

load_dotenv()

# Device selection for sentence-transformers
device = "cuda" if torch.cuda.is_available() else "cpu"

# Embedding model (SentenceTransformer)
hf_client = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2", device=device)

# LLM client (Google generative API wrapper)
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key=os.getenv("GOOGLE_API_KEY"),
    temperature=0.1,
    response_mime_type="application/json",
)
