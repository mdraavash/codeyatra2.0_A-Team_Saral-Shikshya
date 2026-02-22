from fastapi import APIRouter, HTTPException, status, Depends
from bson import ObjectId
from database import get_database
from auth import get_current_user
from models import CourseCreate, CourseResponse

router = APIRouter(prefix="/courses", tags=["Courses / Subjects"])


def _course_doc(c) -> CourseResponse:
    return CourseResponse(
        id=str(c["_id"]),
        name=c["name"],
        teacher_id=c["teacher_id"],
        teacher_name=c["teacher_name"],
    )


# ── List all subjects ────────────────────────────────
@router.get("/", response_model=list[CourseResponse])
async def list_subjects(current_user=Depends(get_current_user)):
    db = get_database()
    courses = await db["courses"].find().to_list(100)
    return [_course_doc(c) for c in courses]


# ── Create a subject (teacher or admin) ──────────────
@router.post("/", response_model=CourseResponse, status_code=201)
async def create_subject(body: CourseCreate, current_user=Depends(get_current_user)):
    if current_user["role"] not in ("admin", "teacher"):
        raise HTTPException(status_code=403, detail="Only admins or teachers can create subjects")
    db = get_database()
    doc = body.model_dump()
    result = await db["courses"].insert_one(doc)
    doc["_id"] = result.inserted_id
    return _course_doc(doc)


# ── Subjects taught by teacher ───────────────────────
@router.get("/teaching", response_model=list[CourseResponse])
async def teaching_subjects(current_user=Depends(get_current_user)):
    if current_user["role"] != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers")
    db = get_database()
    teacher_id = str(current_user["_id"])
    courses = await db["courses"].find({"teacher_id": teacher_id}).to_list(100)
    return [_course_doc(c) for c in courses]
