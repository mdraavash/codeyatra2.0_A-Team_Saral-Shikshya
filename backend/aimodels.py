import os
import json
import re
import csv
import numpy as np
import os
import asyncio
from dotenv import load_dotenv
from ai_clients import hf_client, llm

load_dotenv()

#Moderation & Spam
CUSTOM_BAD_WORDS = []
with open("bad_words.csv", "r", encoding="utf-8") as file:
    reader = csv.DictReader(file)  # because we used header "word"
    for row in reader:
        CUSTOM_BAD_WORDS.append(row["word"].strip().lower())

def contains_custom_profanity(text):
    text_lower = text.lower()
    return any(word in text_lower for word in CUSTOM_BAD_WORDS)

def rule_based_spam_score(text):
    score = 0.0
    if len(re.findall(r"http[s]?://", text)) > 1: score += 0.4
    if re.search(r"(.)\1{4,}", text): score += 0.3 
    if text.isupper() and len(text) > 5: score += 0.2
    return min(score, 1.0)

async def moderate_text(text):
    spam_score = rule_based_spam_score(text)
    if spam_score > 0.6:
        return {"label":"SPAM", "confidence":spam_score, "blocked":True, "source":"rule_based"}
    
    if contains_custom_profanity(text):
        return {"label":"HARASSMENT", "confidence":0.95, "blocked":True, "source":"custom_list"}

    prompt = f"""
    Classify into: SAFE, HATE_SPEECH, HARASSMENT, SPAM, SEXUAL, VIOLENCE.
    Message: "{text}"
    Return ONLY valid JSON: {{"label": "SAFE", "confidence": 0.95}}
    """
    try:
        response = await llm.ainvoke(prompt)
        parsed = json.loads(response.content)
        blocked = parsed.get("label") != "SAFE" and parsed.get("confidence", 0) > 0.6
        return {**parsed, "blocked": blocked, "source": "llm"}
    except Exception:
        return {"label":"ERROR", "confidence":0, "blocked": False}

#Embedding & Vector Search

async def get_embedding(text):
    try:
        vector = await asyncio.to_thread(
            hf_client.encode, text, convert_to_numpy=True
        )
        return vector.tolist() if hasattr(vector, "tolist") else vector
    except Exception as hf_e:
        print(f"Local Embedding ERROR: {hf_e}")
        return None
    
async def search_atlas_vector(db, collection_name, query_embedding, filter_dict=None, limit=5):
    pipeline = [
        {
            "$vectorSearch": {
                "index": "questions_vector_index",
                "path": "embedding",
                "queryVector": query_embedding,
                "numCandidates": 100,
                "limit": limit,
                **({"filter": filter_dict} if filter_dict else {})
            }
        },
        {
            "$project": {
                "similarityScore": {"$meta": "vectorSearchScore"},
                "_id": 1,
                "question": 1,
                "answer": 1,
                "course_id": 1,
                "frequency": 1
            }
        }
    ]

    cursor = db[collection_name].aggregate(pipeline)
    return await cursor.to_list(length=limit)    

#Logic Required by Query Routes

async def detect_subject_relevance(question: str, course_name: str):
    """Checks if the question pertains to the specific course subject."""
    prompt = f"""
    Determine if the question is relevant to the course: "{course_name}".
    Question: "{question}"
    Return ONLY valid JSON: {{"is_relevant": true, "reason": "explanation"}}
    """
    try:
        response = await llm.ainvoke(prompt)
        return json.loads(response.content)
    except Exception:
        return {"is_relevant": True, "reason": "Error during validation"}

def find_best_match(query_embedding, candidates):
    """Helper to pick the highest scoring candidate from a list."""
    if not candidates:
        return None
    return max(candidates, key=lambda x: x.get("similarityScore", 0))

async def search_answered_questions_vector(db, query_embedding, course_id, limit=5):
    filters = {"course_id": {"$eq": course_id}, "answered": {"$eq": True}}
    return await search_atlas_vector(db, "queries", query_embedding, filters, limit)

async def search_faq_vector(db, query_embedding, course_id, limit=5):
    filters = {"course_id": {"$eq": course_id}, "answer": {"$exists": True}}
    results = await search_atlas_vector(db, "embedded_questions", query_embedding, filters, limit)
    return sorted(results, key=lambda x: x.get("frequency", 0), reverse=True)