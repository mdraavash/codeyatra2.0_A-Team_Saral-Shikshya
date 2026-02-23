import os
import json
import re
import time
import numpy as np
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI, EmbeddingsGoogleGenerativeAI

load_dotenv()

# -----------------------------
# Initialize LLM
# -----------------------------
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key=os.getenv("GOOGLE_API_KEY"),
    temperature=0.1,
    max_retries=3
)

# Embedding model
embeddings_model = EmbeddingsGoogleGenerativeAI(
    model="textembedding-gecko-001",
    google_api_key=os.getenv("GOOGLE_API_KEY")
)

# -----------------------------
# Spam and moderation functions
# -----------------------------
CUSTOM_BAD_WORDS = ["muji","randi","machikne","fuck","bitch","idiot","stupid"]

def contains_custom_profanity(text):
    text_lower = text.lower()
    for word in CUSTOM_BAD_WORDS:
        if word in text_lower:
            return True
    return False

def rule_based_spam_score(text):
    score = 0.0
    if len(re.findall(r"http[s]?://", text)) > 1: score += 0.4
    if re.search(r"(.)\1{4,}", text): score += 0.3
    if text.isupper(): score += 0.2
    words = text.lower().split()
    if len(words) != len(set(words)): score += 0.1
    return min(score, 1.0)

def llm_moderation(text):
    prompt = f"""
You are a strict academic content moderation AI.
Classify the message into ONE of these categories:
SAFE, HATE_SPEECH, HARASSMENT, SPAM, SEXUAL, VIOLENCE
Message: "{text}"
Return ONLY valid JSON like:
{{"label": "SAFE", "confidence": 0.95}}
"""
    try:
        response = llm.invoke(prompt)
        content = response.content.strip()
        if content.startswith("```"):
            content = content.replace("```json","").replace("```","").strip()
        parsed = json.loads(content)
        return {"label": parsed.get("label","ERROR"), "confidence": float(parsed.get("confidence",0))}
    except Exception as e:
        return {"label":"ERROR","confidence":0}

def moderate_text(text):
    spam_score = rule_based_spam_score(text)
    if spam_score > 0.6:
        return {"label":"SPAM","confidence":spam_score,"blocked":True,"source":"rule_based"}
    if contains_custom_profanity(text):
        return {"label":"HARASSMENT","confidence":0.95,"blocked":True,"source":"custom_list"}
    llm_result = llm_moderation(text)
    blocked = llm_result["label"] != "SAFE" and llm_result["confidence"] > 0.6
    return {"label":llm_result["label"],"confidence":llm_result["confidence"],"blocked":blocked,"source":"llm"}

# -----------------------------
# Emotion detection
# -----------------------------
def detect_emotion(text):
    prompt = f"""
You are an AI emotion detection system for classroom analytics.
Classify the emotional tone into ONE of: CONFUSED, FRUSTRATED, CURIOUS, ANXIOUS, NEUTRAL
Message: "{text}"
Return ONLY valid JSON: {{"emotion":"CONFUSED","confidence":0.85}}
"""
    try:
        response = llm.invoke(prompt)
        content = response.content.strip()
        if content.startswith("```"):
            content = content.replace("```json","").replace("```","").strip()
        parsed = json.loads(content)
        return {"emotion": parsed.get("emotion","NEUTRAL"), "confidence": float(parsed.get("confidence",0))}
    except:
        return {"emotion":"NEUTRAL","confidence":0}

# -----------------------------
# Embedding utilities
# -----------------------------
def get_embedding(text):
    return embeddings_model.embed(text)

# ---- Vector Search ----
@app.get("/search")
def search(query: str):
    query_embedding = get_embedding(query)

    results = collection.aggregate([
        {
            "$vectorSearch": {
                "index": "default",
                "path": "embedding",
                "queryVector": query_embedding,
                "numCandidates": 100,
                "limit": 5
            }
        },
        {
            "$project": {
                "_id": 0,
                "title": 1,
                "content": 1,
                "score": {"$meta": "vectorSearchScore"}
            }
        }
    ])

    return {"results": list(results)}

# -----------------------------
# Question clustering (optional)
# -----------------------------
def cluster_questions(question_list):
    if not question_list: return []
    prompt = f"""
You are an AI classroom assistant.
Group the following student questions into logical topic clusters.
Return ONLY valid JSON like:
[{{"topic":"Topic Name","questions":["q1","q2"]}}]
Questions: {question_list}
"""
    try:
        response = llm.invoke(prompt)
        content = response.content.strip()
        if content.startswith("```"):
            content = content.replace("```json","").replace("```","").strip()
        return json.loads(content)
    except:
        return []