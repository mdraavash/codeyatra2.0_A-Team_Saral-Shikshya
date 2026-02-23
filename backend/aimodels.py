import os
import json
import re
import time
import numpy as np
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings

load_dotenv()

# Initialize LLM
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key=os.getenv("GOOGLE_API_KEY"),
    temperature=0.1,
    max_retries=3
)

# Embedding model
embeddings_model = GoogleGenerativeAIEmbeddings(
    model="textembedding-gecko-001",
    google_api_key=os.getenv("GOOGLE_API_KEY")
)

# Spam and moderation functions
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

# Emotion detection
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

# Subject Detection
def detect_subject_relevance(question: str, course_name: str):
    """
    Determine if a question is relevant to the course subject.
    Returns: {"is_relevant": bool, "confidence": float, "reason": str}
    """
    prompt = f"""
You are an AI that validates if student questions are relevant to their course subject.

Course Subject: "{course_name}"
Student Question: "{question}"

Determine if the question is asking about topics related to {course_name}.
Consider the question relevant if it:
- Directly asks about concepts in {course_name}
- Asks for clarification on course material
- Seeks help with assignments or problems related to {course_name}
- Discusses course topics

Return ONLY valid JSON like:
{{"is_relevant": true, "confidence": 0.92, "reason": "Question directly asks about..."}}
"""
    try:
        response = llm.invoke(prompt)
        content = response.content.strip()
        if content.startswith("```"):
            content = content.replace("```json","").replace("```","").strip()
        parsed = json.loads(content)
        return {
            "is_relevant": bool(parsed.get("is_relevant", False)),
            "confidence": float(parsed.get("confidence", 0)),
            "reason": parsed.get("reason", "")
        }
    except Exception as e:
        # If there's an error, be lenient and allow the question
        return {"is_relevant": True, "confidence": 0.0, "reason": "Could not validate"}


# Embedding utilities
def get_embedding(text):
    return embeddings_model.embed(text)

def cosine_similarity(a, b):
    a = np.array(a, dtype=float)
    b = np.array(b, dtype=float)
    if a.size == 0 or b.size == 0:
        return 0.0
    denom = (np.linalg.norm(a) * np.linalg.norm(b))
    if denom == 0:
        return 0.0
    return float(np.dot(a, b) / denom)


def find_best_match(query_vec, candidates, top_k=1):
    scored = []
    for c in candidates:
        emb = c.get("embedding")
        if not emb:
            continue
        try:
            score = cosine_similarity(query_vec, emb)
        except Exception:
            score = 0.0
        scored.append((c, score))
    scored.sort(key=lambda x: x[1], reverse=True)
    return scored[:top_k]

# # ---- Vector Search ----
# @app.get("/search")
# def search(query: str):
#     query_embedding = get_embedding(query)

#     results = collection.aggregate([
#         {
#             "$vectorSearch": {
#                 "index": "default",
#                 "path": "embedding",
#                 "queryVector": query_embedding,
#                 "numCandidates": 100,
#                 "limit": 5
#             }
#         },
#         {
#             "$project": {
#                 "_id": 0,
#                 "title": 1,
#                 "content": 1,
#                 "score": {"$meta": "vectorSearchScore"}
#             }
#         }
#     ])

#     return {"results": list(results)}

# Question clustering (optional)
# def cluster_questions(question_list):
#     if not question_list: return []
#     prompt = f"""
# You are an AI classroom assistant.
# Group the following student questions into logical topic clusters.
# Return ONLY valid JSON like:
# [{{"topic":"Topic Name","questions":["q1","q2"]}}]
# Questions: {question_list}
# """
#     try:
#         response = llm.invoke(prompt)
#         content = response.content.strip()
#         if content.startswith("```"):
#             content = content.replace("```json","").replace("```","").strip()
#         return json.loads(content)
#     except:
#         return []

# ---- MongoDB Vector Search (Atlas Only) ----
async def search_answered_questions_vector(db, query_embedding, course_id, limit=5):
    try:
        pipeline = [
            {
                "$search": {
                    "cosmosSearch": True,
                    "vector": query_embedding,
                    "k": limit
                },
                "path": "embedding",
                "filter": {
                    "course_id": course_id,
                    "answered": True
                }
            },
            {
                "$project": {
                    "similarityScore": {"$meta": "searchScore"},
                    "_id": 1,
                    "question": 1,
                    "answer": 1,
                    "course_id": 1
                }
            },
            {
                "$limit": limit
            }
        ]
        
        results = await db["queries"].aggregate(pipeline).to_list(limit)
        return results
    except Exception as e:
        # Fallback to empty if vector search fails
        return []


async def search_faq_vector(db, query_embedding, course_id, limit=5):
    try:
        pipeline = [
            {
                "$search": {
                    "cosmosSearch": True,
                    "vector": query_embedding,
                    "k": limit
                },
                "path": "embedding",
                "filter": {
                    "course_id": course_id,
                    "answer": {"$exists": True, "$ne": None}
                }
            },
            {
                "$project": {
                    "similarityScore": {"$meta": "searchScore"},
                    "_id": 1,
                    "question": 1,
                    "answer": 1,
                    "frequency": 1
                }
            },
            {
                "$sort": {"frequency": -1}
            },
            {
                "$limit": limit
            }
        ]
        
        results = await db["embedded_questions"].aggregate(pipeline).to_list(limit)
        return results
    except Exception as e:
        # Fallback to empty if vector search fails
        return []


async def search_global_answered_questions(db, query_embedding, limit=5):
    try:
        pipeline = [
            {
                "$search": {
                    "cosmosSearch": True,
                    "vector": query_embedding,
                    "k": limit
                },
                "path": "embedding",
                "filter": {
                    "answered": True
                }
            },
            {
                "$project": {
                    "similarityScore": {"$meta": "searchScore"},
                    "_id": 1,
                    "question": 1,
                    "answer": 1,
                    "course_id": 1,
                    "course_name": 1
                }
            },
            {
                "$limit": limit
            }
        ]
        
        results = await db["queries"].aggregate(pipeline).to_list(limit)
        return results
    except Exception as e:
        # Fallback to empty if vector search fails
        return []