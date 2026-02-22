from pydantic import BaseModel, EmailStr
from typing import Literal, Optional
from datetime import datetime

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: Literal["admin", "student", "teacher"]

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class QueryCreate(BaseModel):
    course_id: int
    student_id: str
    question_text: str

class QueryResponse(BaseModel):
    id: int
    question_text: str
    answer_text: Optional[str] = None
    status: str
    created_at: datetime