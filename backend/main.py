from fastapi import FastAPI
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os

load_dotenv()
app = FastAPI()
mongo_client = AsyncIOMotorClient(os.getenv("MONGO_DB"))

