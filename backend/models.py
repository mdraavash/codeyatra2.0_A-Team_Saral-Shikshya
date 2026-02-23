from pydantic import BaseModel, EmailStr
from typing import Literal, Optional, List
from datetime import datetime



class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    roll: str
    role: Literal["admin", "student", "teacher"]

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    roll: str
    role: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class CourseCreate(BaseModel):
    name: str
    teacher_id: str          
    teacher_name: str

class CourseResponse(BaseModel):
    id: str
    name: str
    teacher_id: str
    teacher_name: str



class QueryCreate(BaseModel):
    course_id: str
    question: str

class QueryAnswer(BaseModel):
    answer: str

class QueryResponse(BaseModel):
    id: str
    course_id: str
    course_name: str
    student_id: str
    student_name: str
    student_roll: str = ""
    question: str
    answer: Optional[str] = None
    answered: bool = False
    created_at: str
    answered_at: Optional[str] = None
    teacher_id: str = ""



class NotificationResponse(BaseModel):
    id: str
    user_id: str
    message: str
    query_id: str
    course_id: str
    read: bool = False
    created_at: str


# ── Rating ──
class RatingCreate(BaseModel):
    query_id: str
    teacher_id: str
    rating: int          # 1-5

class RatingResponse(BaseModel):
    id: str
    query_id: str
    student_id: str
    teacher_id: str
    rating: int
    created_at: str

class TeacherRatingResponse(BaseModel):
    teacher_id: str
    average_rating: float
    total_ratings: int


# ---- Embedded questions (FAQ) ----
class EmbeddedQuestionCreate(BaseModel):
    course_id: Optional[str]
    question: str
    embedding: List[float]
    frequency: int = 1
    answer: Optional[str] = None
    created_at: Optional[str] = None


class EmbeddedQuestionResponse(BaseModel):
    id: str
    course_id: Optional[str]
    question: str
    frequency: int
    answer: Optional[str] = None
    created_at: Optional[str] = None
