from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import client
from routes.auth_routes import router as auth_router

app = FastAPI()

# Allow requests from Expo dev client
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(auth_router)


@app.get("/")
async def root():
    return {"message": "CodeYatra API is running"}