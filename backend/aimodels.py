import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI

load_dotenv()

# LangChain handles the API key and model configuration under the hood
llm = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash", # You can use the 2.0 or 3.0 models here
    google_api_key=os.getenv("GOOGLE_API_KEY"),
    temperature=0.3
)

response = llm.invoke("Explain integration simply.")
print(response.content)