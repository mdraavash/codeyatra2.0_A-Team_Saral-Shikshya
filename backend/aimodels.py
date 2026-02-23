import os
import json
import re
import time
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI

# Load environment variables
load_dotenv()

# Debug: check if API key is loaded
if not os.getenv("GOOGLE_API_KEY"):
    raise ValueError("GOOGLE_API_KEY not found in .env file")

# Initialize Gemini model
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key=os.getenv("GOOGLE_API_KEY"),
    temperature=0.1,
    max_retries=3
)

# -----------------------------
# Rule-based spam detection
# -----------------------------
def rule_based_spam_score(text):
    score = 0.0

    # Too many links
    if len(re.findall(r"http[s]?://", text)) > 1:
        score += 0.4

    # Repeated characters (e.g. looooolllll)
    if re.search(r"(.)\1{4,}", text):
        score += 0.3

    # All caps message
    if text.isupper():
        score += 0.2

    # Repeated words
    words = text.lower().split()
    if len(words) != len(set(words)):
        score += 0.1

    return min(score, 1.0)


# -----------------------------
# LLM-based moderation
# -----------------------------
def llm_moderation(text):
    prompt = f"""
You are a strict academic content moderation AI.

Classify the message into ONE of these categories:
SAFE
HATE_SPEECH
HARASSMENT
SPAM
SEXUAL
VIOLENCE

Message:
"{text}"

Return ONLY valid JSON like:
{{
  "label": "SAFE",
  "confidence": 0.95
}}

Do not include markdown formatting.
"""

    try:
        response = llm.invoke(prompt)
        content = response.content.strip()

        # Remove markdown code block if exists
        if content.startswith("```"):
            content = content.replace("```json", "")
            content = content.replace("```", "")
            content = content.strip()

        parsed = json.loads(content)

        return {
            "label": parsed.get("label", "ERROR"),
            "confidence": float(parsed.get("confidence", 0))
        }

    except Exception as e:
        print("----- LLM ERROR -----")
        print("Error:", e)
        if 'response' in locals():
            print("Raw Response:", response.content)
        print("---------------------")
        return {"label": "ERROR", "confidence": 0}


# -----------------------------
# Final moderation pipeline
# -----------------------------
# Custom local profanity list (add more as needed)
CUSTOM_BAD_WORDS = [
    "muji",
    "randi",
    "machikne",
    "fuck",
    "bitch",
    "idiot",
    "stupid"
]


def contains_custom_profanity(text):
    text_lower = text.lower()
    for word in CUSTOM_BAD_WORDS:
        if word in text_lower:
            return True
    return False


def moderate_text(text):
    spam_score = rule_based_spam_score(text)

    # Immediate block if strong spam
    if spam_score > 0.6:
        return {
            "label": "SPAM",
            "confidence": spam_score,
            "blocked": True,
            "source": "rule_based"
        }

    # Immediate block if custom profanity detected
    if contains_custom_profanity(text):
        return {
            "label": "HARASSMENT",
            "confidence": 0.95,
            "blocked": True,
            "source": "custom_profanity_list"
        }

    llm_result = llm_moderation(text)

    # Lower threshold slightly (0.6 instead of 0.7)
    blocked = False
    if llm_result["label"] != "SAFE" and llm_result["confidence"] > 0.6:
        blocked = True

    return {
        "label": llm_result["label"],
        "confidence": llm_result["confidence"],
        "blocked": blocked,
        "source": "llm"
    }

# -----------------------------
# Test run
# -----------------------------
if __name__ == "__main__":
    test_message = "Hello Teacher muji"
    result = moderate_text(test_message)
    print("Final Result:", result)