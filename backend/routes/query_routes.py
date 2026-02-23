from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.responses import JSONResponse
from bson import ObjectId
from datetime import datetime, timezone
from database import get_database
from auth import get_current_user
from models import QueryCreate, QueryAnswer, QueryResponse, NotificationResponse, RatingCreate, RatingResponse, TeacherRatingResponse, EmbeddedQuestionResponse
from aimodels import moderate_text, get_embedding, find_best_match, detect_subject_relevance, search_answered_questions_vector, search_faq_vector
from config import EMBEDDING_SIMILARITY_THRESHOLD, EMBEDDING_SEARCH_CANDIDATES, SUBJECT_VALIDATION_ENABLED, SUBJECT_VALIDATION_CONFIDENCE_THRESHOLD

router = APIRouter(prefix="/queries", tags=["Queries"])


def _query_doc(q, anonymous: bool = False) -> QueryResponse:
    return QueryResponse(
        id=str(q["_id"]),
        course_id=q["course_id"],
        course_name=q.get("course_name", ""),
        student_id=q["student_id"],
        student_name="Anonymous" if anonymous else q.get("student_name", ""),
        student_roll="Anonymous" if anonymous else q.get("student_roll", ""),
        question=q["question"],
        answer=q.get("answer"),
        answered=q.get("answered", False),
        created_at=q["created_at"].isoformat() if isinstance(q["created_at"], datetime) else q["created_at"],
        answered_at=q["answered_at"].isoformat() if q.get("answered_at") and isinstance(q["answered_at"], datetime) else q.get("answered_at"),
        teacher_id=q.get("teacher_id", ""),
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
    student_id = str(current_user["_id"])

    course = await db["courses"].find_one({"_id": ObjectId(body.course_id)})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # --- Moderation (Awaited) ---
    moderation = await moderate_text(body.question)
    if moderation.get("blocked") and moderation.get("confidence", 0) > 0.8:
        return JSONResponse(
            status_code=400,
            content={
                "detail": f"Your query was flagged as {moderation['label'].lower()} content. Please rephrase your question.",
                "moderation": True,
                "label": moderation["label"],
            },
        )

    # --- Subject Validation (Awaited) ---
    if SUBJECT_VALIDATION_ENABLED:
        subject_check = await detect_subject_relevance(body.question, course["name"])
        if not subject_check.get("is_relevant"):
            return JSONResponse(
                status_code=400,
                content={
                    "detail": f"Your question doesn't seem to be about {course['name']}. Please ask subject-related questions.",
                    "subject_invalid": True,
                    "reason": subject_check.get("reason", ""),
                },
            )

    # --- Generate embedding (Awaited) ---
    try:
        query_emb = await get_embedding(body.question)
    except Exception:
        query_emb = None

    embedded_question_id = None

    # --- Step 1: Check Answered Queries (Awaited) ---
    if query_emb is not None:
        answered = await search_answered_questions_vector(
            db, query_emb, body.course_id, limit=1
        )
        if answered:
            best = answered[0]
            score = best.get("similarityScore", 0)

            if score >= EMBEDDING_SIMILARITY_THRESHOLD:
                return JSONResponse(
                    status_code=200,
                    content={
                        "matched": True,
                        "similarity": score,
                        "faq": {
                            "id": str(best["_id"]),
                            "question": best["question"],
                            "answer": best["answer"],
                        },
                    },
                )

    # --- Step 2: Check Existing FAQ (Awaited) ---
    if query_emb is not None:
        faqs = await search_faq_vector(db, query_emb, body.course_id, limit=1)

        if faqs:
            best = faqs[0]
            score = best.get("similarityScore", 0)

            if score >= EMBEDDING_SIMILARITY_THRESHOLD:
                await db["embedded_questions"].update_one(
                    {"_id": best["_id"]},
                    {"$inc": {"frequency": 1}}
                )

                return JSONResponse(
                    status_code=200,
                    content={
                        "matched": True,
                        "similarity": score,
                        "faq": {
                            "id": str(best["_id"]),
                            "question": best["question"],
                            "answer": best["answer"],
                            "frequency": best.get("frequency", 0) + 1,
                        },
                    },
                )

    # --- Step 3: Create New Embedded Question ---
    if query_emb is not None:
        embedded_doc = await db["embedded_questions"].insert_one({
            "course_id": body.course_id,
            "question": body.question,
            "embedding": query_emb,
            "frequency": 1,
            "answer": None,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        })
        embedded_question_id = embedded_doc.inserted_id

    # --- Step 4: Create Query ---
    doc = {
        "course_id": body.course_id,
        "course_name": course["name"],
        "student_id": student_id,
        "student_name": current_user["name"],
        "student_roll": current_user.get("roll", ""),
        "question": body.question,
        "embedding": query_emb,
        "embedded_question_id": embedded_question_id,
        "answer": None,
        "answered": False,
        "created_at": datetime.now(timezone.utc),
        "answered_at": None,
        "teacher_id": course["teacher_id"],
    }

    result = await db["queries"].insert_one(doc)
    doc["_id"] = result.inserted_id

    # --- Notify Teacher ---
    await db["notifications"].insert_one({
        "user_id": course["teacher_id"],
        "message": f"A student raised a question on {course['name']}",
        "query_id": str(result.inserted_id),
        "course_id": body.course_id,
        "read": False,
        "created_at": datetime.now(timezone.utc),
    })

    return _query_doc(doc)
# teacher answer
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

    # --- Update Query ---
    await db["queries"].update_one(
        {"_id": ObjectId(query_id)},
        {"$set": {
            "answer": body.answer,
            "answered": True,
            "answered_at": now
        }},
    )

    # --- Notify Student ---
    await db["notifications"].insert_one({
        "user_id": q["student_id"],
        "message": f"Your {q['course_name']} Query has been answered!",
        "query_id": query_id,
        "course_id": q["course_id"],
        "read": False,
        "created_at": now,
    })

    # --- Remove Teacher Notification ---
    await db["notifications"].delete_many({
        "user_id": str(current_user["_id"]),
        "query_id": query_id,
    })

    # --- Guaranteed FAQ Update ---
    embedded_id = q.get("embedded_question_id")
    if embedded_id:
        await db["embedded_questions"].update_one(
            {"_id": embedded_id},
            {"$set": {
                "answer": body.answer,
                "updated_at": now
            }}
        )

    updated = await db["queries"].find_one({"_id": ObjectId(query_id)})
    return _query_doc(updated, anonymous=True)

# queries for a course
@router.get("/course/{course_id}", response_model=list[QueryResponse])
async def queries_for_course(course_id: str, current_user=Depends(get_current_user)):
    db = get_database()
    student_id = str(current_user["_id"])
    queries = await db["queries"].find(
        {"course_id": course_id, "student_id": student_id}
    ).sort("created_at", -1).to_list(100)
    return [_query_doc(q) for q in queries]


# answered queries for a course
@router.get("/course/{course_id}/answered", response_model=list[QueryResponse])
async def answered_queries_for_course(course_id: str, current_user=Depends(get_current_user)):
    db = get_database()
    student_id = str(current_user["_id"])
    queries = await db["queries"].find(
        {"course_id": course_id, "student_id": student_id, "answered": True}
    ).sort("answered_at", -1).to_list(100)
    return [_query_doc(q) for q in queries]


# FAQ visibke to all students
@router.get("/course/{course_id}/faq", response_model=list[EmbeddedQuestionResponse])
async def faq_for_course(course_id: str, current_user=Depends(get_current_user)):
    db = get_database()
    faqs = await db["embedded_questions"].find(
        {"course_id": course_id, "answer": {"$ne": None}}
    ).sort("frequency", -1).to_list(50)
    return [
        EmbeddedQuestionResponse(
            id=str(f["_id"]),
            course_id=f.get("course_id"),
            question=f.get("question"),
            frequency=f.get("frequency", 0),
            answer=f.get("answer"),
            created_at=f.get("created_at").isoformat() if isinstance(f.get("created_at"), datetime) else f.get("created_at"),
        ) for f in faqs
    ]


# FaQ of all subjects
@router.get("/faq/all", response_model=list[EmbeddedQuestionResponse])
async def all_faq(current_user=Depends(get_current_user)):
    db = get_database()
    faqs = await db["embedded_questions"].find(
        {"answer": {"$ne": None}}
    ).sort("frequency", -1).to_list(200)
    return [
        EmbeddedQuestionResponse(
            id=str(f["_id"]),
            course_id=f.get("course_id"),
            question=f.get("question"),
            frequency=f.get("frequency", 0),
            answer=f.get("answer"),
            created_at=f.get("created_at").isoformat() if isinstance(f.get("created_at"), datetime) else f.get("created_at"),
        ) for f in faqs
    ]


# all queries asked by the current student
@router.get("/mine", response_model=list[QueryResponse])
async def my_queries(current_user=Depends(get_current_user)):
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Only students can view their queries")
    db = get_database()
    student_id = str(current_user["_id"])
    queries = await db["queries"].find(
        {"student_id": student_id}
    ).sort("created_at", -1).to_list(200)
    return [_query_doc(q) for q in queries]


# queries assiged to teachers
@router.get("/teacher", response_model=list[QueryResponse])
async def teacher_queries(current_user=Depends(get_current_user)):
    if current_user["role"] != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers")
    db = get_database()
    teacher_id = str(current_user["_id"])
    queries = await db["queries"].find(
        {"teacher_id": teacher_id}
    ).sort("created_at", -1).to_list(100)
    return [_query_doc(q, anonymous=True) for q in queries]


# unanswered queries
@router.get("/teacher/pending", response_model=list[QueryResponse])
async def teacher_pending_queries(current_user=Depends(get_current_user)):
    if current_user["role"] != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers")
    db = get_database()
    teacher_id = str(current_user["_id"])
    queries = await db["queries"].find(
        {"teacher_id": teacher_id, "answered": False}
    ).sort("created_at", -1).to_list(100)
    return [_query_doc(q, anonymous=True) for q in queries]


# notifications
@router.get("/notifications", response_model=list[NotificationResponse])
async def get_notifications(current_user=Depends(get_current_user)):
    db = get_database()
    user_id = str(current_user["_id"])
    notifs = await db["notifications"].find(
        {"user_id": user_id}
    ).sort("created_at", -1).to_list(50)
    return [_notif_doc(n) for n in notifs]


# mark as read
@router.patch("/notifications/{notif_id}/read")
async def mark_notification_read(notif_id: str, current_user=Depends(get_current_user)):
    db = get_database()
    await db["notifications"].update_one(
        {"_id": ObjectId(notif_id)},
        {"$set": {"read": True}},
    )
    return {"message": "Marked as read"}


# students who asked query
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
    counter = 1
    for q in queries:
        sid = q["student_id"]
        if sid not in students:
            students[sid] = {
                "student_id": sid,
                "student_roll": f"Anonymous Student {counter}",
                "student_name": "Anonymous",
                "has_pending": False,
            }
            counter += 1
        if not q.get("answered", False):
            students[sid]["has_pending"] = True
    return list(students.values())


# all queries from specific student
@router.get("/teacher/course/{course_id}/student/{student_id}", response_model=list[QueryResponse])
async def teacher_student_queries(course_id: str, student_id: str, current_user=Depends(get_current_user)):
    if current_user["role"] != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers")
    db = get_database()
    queries = await db["queries"].find(
        {"course_id": course_id, "student_id": student_id, "teacher_id": str(current_user["_id"])}
    ).sort("created_at", -1).to_list(100)
    return [_query_doc(q, anonymous=True) for q in queries]



@router.post("/rate", response_model=RatingResponse, status_code=201)
async def rate_teacher(body: RatingCreate, current_user=Depends(get_current_user)):
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Only students can rate")
    if not 1 <= body.rating <= 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")

    db = get_database()
    student_id = str(current_user["_id"])

    q = await db["queries"].find_one({"_id": ObjectId(body.query_id)})
    if not q:
        raise HTTPException(status_code=404, detail="Query not found")
    if not q.get("answered"):
        raise HTTPException(status_code=400, detail="Cannot rate an unanswered query")

    # check if already rated
    existing = await db["ratings"].find_one({"query_id": body.query_id, "student_id": student_id})
    if existing:
        # update existing rating
        await db["ratings"].update_one(
            {"_id": existing["_id"]},
            {"$set": {"rating": body.rating}},
        )
        existing["rating"] = body.rating
        return RatingResponse(
            id=str(existing["_id"]),
            query_id=existing["query_id"],
            student_id=existing["student_id"],
            teacher_id=existing["teacher_id"],
            rating=body.rating,
            created_at=existing["created_at"].isoformat() if isinstance(existing["created_at"], datetime) else existing["created_at"],
        )

    doc = {
        "query_id": body.query_id,
        "student_id": student_id,
        "teacher_id": body.teacher_id,
        "rating": body.rating,
        "created_at": datetime.now(timezone.utc),
    }
    result = await db["ratings"].insert_one(doc)
    doc["_id"] = result.inserted_id

    # update teacher's average rating
    pipeline = [
        {"$match": {"teacher_id": body.teacher_id}},
        {"$group": {"_id": "$teacher_id", "avg": {"$avg": "$rating"}, "count": {"$sum": 1}}},
    ]
    agg = await db["ratings"].aggregate(pipeline).to_list(1)
    if agg:
        avg_rating = round(agg[0]["avg"], 2)
        total = agg[0]["count"]
        await db["users"].update_one(
            {"_id": ObjectId(body.teacher_id)},
            {"$set": {"average_rating": avg_rating, "total_ratings": total}},
        )

    return RatingResponse(
        id=str(doc["_id"]),
        query_id=doc["query_id"],
        student_id=doc["student_id"],
        teacher_id=doc["teacher_id"],
        rating=doc["rating"],
        created_at=doc["created_at"].isoformat(),
    )


# get current student's rating for a specific query
@router.get("/{query_id}/rating")
async def get_query_rating(query_id: str, current_user=Depends(get_current_user)):
    db = get_database()
    student_id = str(current_user["_id"])
    existing = await db["ratings"].find_one({"query_id": query_id, "student_id": student_id})
    if existing:
        return {"rating": existing["rating"]}
    return {"rating": None}


# get teacher's average rating
@router.get("/teacher/{teacher_id}/rating", response_model=TeacherRatingResponse)
async def get_teacher_rating(teacher_id: str, current_user=Depends(get_current_user)):
    db = get_database()
    teacher = await db["users"].find_one({"_id": ObjectId(teacher_id), "role": "teacher"})
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    return TeacherRatingResponse(
        teacher_id=teacher_id,
        average_rating=teacher.get("average_rating", 0.0),
        total_ratings=teacher.get("total_ratings", 0),
    )