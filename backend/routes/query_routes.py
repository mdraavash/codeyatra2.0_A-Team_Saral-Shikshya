from fastapi import APIRouter, HTTPException, status, Depends
from bson import ObjectId
from datetime import datetime, timezone
from database import get_database
from auth import get_current_user
from models import QueryCreate, QueryAnswer, QueryResponse, NotificationResponse

router = APIRouter(prefix="/queries", tags=["Queries"])


def _query_doc(q) -> QueryResponse:
    return QueryResponse(
        id=str(q["_id"]),
        course_id=q["course_id"],
        course_name=q.get("course_name", ""),
        student_id=q["student_id"],
        student_name=q.get("student_name", ""),
        student_roll=q.get("student_roll", ""),
        question=q["question"],
        answer=q.get("answer"),
        answered=q.get("answered", False),
        created_at=q["created_at"].isoformat() if isinstance(q["created_at"], datetime) else q["created_at"],
        answered_at=q["answered_at"].isoformat() if q.get("answered_at") and isinstance(q["answered_at"], datetime) else q.get("answered_at"),
    )


def _notif_doc(n) -> NotificationResponse:
    return NotificationResponse(
        id=str(n["_id"]),
        user_id=n["user_id"],
        message=n["message"],
        query_id=n["query_id"],
        course_id=n["course_id"],
        read=n.get("read", False),
        created_at=n["created_at"].isoformat() if isinstance(n["created_at"], datetime) else n["created_at"],
    )



@router.post("/", response_model=QueryResponse, status_code=201)
async def create_query(body: QueryCreate, current_user=Depends(get_current_user)):
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Only students can ask queries")
    db = get_database()
    course = await db["courses"].find_one({"_id": ObjectId(body.course_id)})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    doc = {
        "course_id": body.course_id,
        "course_name": course["name"],
        "student_id": str(current_user["_id"]),
        "student_name": current_user["name"],
        "student_roll": current_user.get("roll", ""),
        "question": body.question,
        "answer": None,
        "answered": False,
        "created_at": datetime.now(timezone.utc),
        "answered_at": None,
        "teacher_id": course["teacher_id"],
    }
    result = await db["queries"].insert_one(doc)
    doc["_id"] = result.inserted_id

    # Notify the teacher that a new question was asked
    await db["notifications"].insert_one({
        "user_id": course["teacher_id"],
        "message": f"{current_user.get('roll', '')} Raised a Question on {course['name']}",
        "query_id": str(result.inserted_id),
        "course_id": body.course_id,
        "read": False,
        "created_at": datetime.now(timezone.utc),
    })

    return _query_doc(doc)


# ── Teacher: answer a query ──────────────────────────
@router.patch("/{query_id}/answer", response_model=QueryResponse)
async def answer_query(query_id: str, body: QueryAnswer, current_user=Depends(get_current_user)):
    if current_user["role"] != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can answer queries")
    db = get_database()
    q = await db["queries"].find_one({"_id": ObjectId(query_id)})
    if not q:
        raise HTTPException(status_code=404, detail="Query not found")
    if q["teacher_id"] != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="This query is not assigned to you")

    now = datetime.now(timezone.utc)
    await db["queries"].update_one(
        {"_id": ObjectId(query_id)},
        {"$set": {"answer": body.answer, "answered": True, "answered_at": now}},
    )

    # Create notification for the student
    await db["notifications"].insert_one({
        "user_id": q["student_id"],
        "message": f"Your {q['course_name']} Query has been answered!!",
        "query_id": query_id,
        "course_id": q["course_id"],
        "read": False,
        "created_at": now,
    })

    updated = await db["queries"].find_one({"_id": ObjectId(query_id)})
    return _query_doc(updated)


# ── Student: my queries for a course ─────────────────
@router.get("/course/{course_id}", response_model=list[QueryResponse])
async def queries_for_course(course_id: str, current_user=Depends(get_current_user)):
    db = get_database()
    student_id = str(current_user["_id"])
    queries = await db["queries"].find(
        {"course_id": course_id, "student_id": student_id}
    ).sort("created_at", -1).to_list(100)
    return [_query_doc(q) for q in queries]


# ── Student: my answered queries for a course ────────
@router.get("/course/{course_id}/answered", response_model=list[QueryResponse])
async def answered_queries_for_course(course_id: str, current_user=Depends(get_current_user)):
    db = get_database()
    student_id = str(current_user["_id"])
    queries = await db["queries"].find(
        {"course_id": course_id, "student_id": student_id, "answered": True}
    ).sort("answered_at", -1).to_list(100)
    return [_query_doc(q) for q in queries]


# ── FAQ: answered queries visible to all enrolled ────
@router.get("/course/{course_id}/faq", response_model=list[QueryResponse])
async def faq_for_course(course_id: str, current_user=Depends(get_current_user)):
    db = get_database()
    queries = await db["queries"].find(
        {"course_id": course_id, "answered": True}
    ).sort("answered_at", -1).to_list(50)
    return [_query_doc(q) for q in queries]


# ── FAQ: all answered queries across all subjects ────
@router.get("/faq/all", response_model=list[QueryResponse])
async def all_faq(current_user=Depends(get_current_user)):
    db = get_database()
    queries = await db["queries"].find(
        {"answered": True}
    ).sort("answered_at", -1).to_list(200)
    return [_query_doc(q) for q in queries]


# ── Teacher: queries assigned to me ──────────────────
@router.get("/teacher", response_model=list[QueryResponse])
async def teacher_queries(current_user=Depends(get_current_user)):
    if current_user["role"] != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers")
    db = get_database()
    teacher_id = str(current_user["_id"])
    queries = await db["queries"].find(
        {"teacher_id": teacher_id}
    ).sort("created_at", -1).to_list(100)
    return [_query_doc(q) for q in queries]


# ── Teacher: unanswered queries ──────────────────────
@router.get("/teacher/pending", response_model=list[QueryResponse])
async def teacher_pending_queries(current_user=Depends(get_current_user)):
    if current_user["role"] != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers")
    db = get_database()
    teacher_id = str(current_user["_id"])
    queries = await db["queries"].find(
        {"teacher_id": teacher_id, "answered": False}
    ).sort("created_at", -1).to_list(100)
    return [_query_doc(q) for q in queries]


# ── Notifications ─────────────────────────────────────
@router.get("/notifications", response_model=list[NotificationResponse])
async def get_notifications(current_user=Depends(get_current_user)):
    db = get_database()
    user_id = str(current_user["_id"])
    notifs = await db["notifications"].find(
        {"user_id": user_id}
    ).sort("created_at", -1).to_list(50)
    return [_notif_doc(n) for n in notifs]


# ── Mark notification as read ─────────────────────────
@router.patch("/notifications/{notif_id}/read")
async def mark_notification_read(notif_id: str, current_user=Depends(get_current_user)):
    db = get_database()
    await db["notifications"].update_one(
        {"_id": ObjectId(notif_id)},
        {"$set": {"read": True}},
    )
    return {"message": "Marked as read"}


# ── Teacher: students who asked in a course ───────────
@router.get("/teacher/course/{course_id}/students")
async def teacher_course_students(course_id: str, current_user=Depends(get_current_user)):
    if current_user["role"] != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers")
    db = get_database()
    teacher_id = str(current_user["_id"])
    queries = await db["queries"].find(
        {"course_id": course_id, "teacher_id": teacher_id}
    ).to_list(500)
    students = {}
    for q in queries:
        sid = q["student_id"]
        if sid not in students:
            students[sid] = {
                "student_id": sid,
                "student_roll": q.get("student_roll", q.get("student_name", "Unknown")),
                "student_name": q.get("student_name", "Unknown"),
                "has_pending": False,
            }
        if not q.get("answered", False):
            students[sid]["has_pending"] = True
    return list(students.values())


# ── Teacher: queries from specific student in a course ─
@router.get("/teacher/course/{course_id}/student/{student_id}", response_model=list[QueryResponse])
async def teacher_student_queries(course_id: str, student_id: str, current_user=Depends(get_current_user)):
    if current_user["role"] != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers")
    db = get_database()
    queries = await db["queries"].find(
        {"course_id": course_id, "student_id": student_id, "teacher_id": str(current_user["_id"])}
    ).sort("created_at", -1).to_list(100)
    return [_query_doc(q) for q in queries]
