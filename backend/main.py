from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import client
from routes.auth_routes import router as auth_router
from routes.course_routes import router as course_router
from routes.query_routes import router as query_router
from routes.admin_routes import router as admin_router

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(course_router)
app.include_router(query_router)
app.include_router(admin_router)


@app.get("/")
async def root():
    return {"message": "CodeYatra API is running"}