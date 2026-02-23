from fastapi import APIRouter, HTTPException, status, Depends
from bson import ObjectId
from database import get_database
from auth import get_current_user
from models import UserRegister, UserResponse, CourseCreate, CourseResponse

router = APIRouter(prefix="/admin", tags=["Admin"])


def _require_admin(current_user):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")


#teacher
@router.get("/teachers", response_model=list[dict])
async def list_teachers(current_user=Depends(get_current_user)):
    _require_admin(current_user)
    db = get_database()
    teachers = await db["users"].find({"role": "teacher"}).to_list(200)
    return [
        {
            "id": str(t["_id"]),
            "name": t["name"],
            "email": t["email"],
            "roll": t.get("roll", ""),
            "role": t["role"],
            "average_rating": t.get("average_rating", 0.0),
            "total_ratings": t.get("total_ratings", 0),
        }
        for t in teachers
    ]


# create teacher account
@router.post("/teachers", response_model=UserResponse, status_code=201)
async def create_teacher(body: UserRegister, current_user=Depends(get_current_user)):
    _require_admin(current_user)
    db = get_database()

    existing = await db["users"].find_one({"email": body.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    doc = body.model_dump()
    doc["role"] = "teacher"  # force teacher role
    result = await db["users"].insert_one(doc)

    return UserResponse(
        id=str(result.inserted_id),
        name=doc["name"],
        email=doc["email"],
        roll=doc.get("roll", ""),
        role="teacher",
    )


# subject create and assign teacher
@router.post("/subjects", response_model=CourseResponse, status_code=201)
async def create_subject(body: CourseCreate, current_user=Depends(get_current_user)):
    _require_admin(current_user)
    db = get_database()

    # teacher verify
    teacher = await db["users"].find_one({"_id": ObjectId(body.teacher_id), "role": "teacher"})
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    doc = {
        "name": body.name,
        "teacher_id": body.teacher_id,
        "teacher_name": teacher["name"],
    }
    result = await db["courses"].insert_one(doc)
    doc["_id"] = result.inserted_id
    return CourseResponse(
        id=str(doc["_id"]),
        name=doc["name"],
        teacher_id=doc["teacher_id"],
        teacher_name=doc["teacher_name"],
    )


# subject list
@router.get("/subjects", response_model=list[CourseResponse])
async def list_subjects(current_user=Depends(get_current_user)):
    _require_admin(current_user)
    db = get_database()
    courses = await db["courses"].find().to_list(200)
    return [
        CourseResponse(
            id=str(c["_id"]),
            name=c["name"],
            teacher_id=c["teacher_id"],
            teacher_name=c["teacher_name"],
        )
        for c in courses
    ]


# delete subject
@router.delete("/subjects/{subject_id}")
async def delete_subject(subject_id: str, current_user=Depends(get_current_user)):
    _require_admin(current_user)
    db = get_database()
    result = await db["courses"].delete_one({"_id": ObjectId(subject_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Subject not found")
    return {"message": "Subject deleted"}


# delete teacher
@router.delete("/teachers/{teacher_id}")
async def delete_teacher(teacher_id: str, current_user=Depends(get_current_user)):
    _require_admin(current_user)
    db = get_database()
    result = await db["users"].delete_one({"_id": ObjectId(teacher_id), "role": "teacher"})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Teacher not found")
    # Also remove subjects assigned to this teacher
    await db["courses"].delete_many({"teacher_id": teacher_id})
    return {"message": "Teacher and assigned subjects deleted"}
