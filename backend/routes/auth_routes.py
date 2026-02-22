from fastapi import APIRouter, HTTPException, status, Depends
from models import UserRegister, UserLogin, UserResponse, TokenResponse
from auth import create_access_token, get_current_user
from database import get_database

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse)
async def register(user: UserRegister):
    db = get_database()

    # Check if user already exists
    existing_user = await db["users"].find_one({"email": user.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    user_dict = user.model_dump()
    result = await db["users"].insert_one(user_dict)

    # Create JWT token
    token = create_access_token({"email": user.email, "role": user.role})

    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=str(result.inserted_id),
            name=user.name,
            email=user.email,
            roll=user.roll,
            role=user.role,
        ),
    )


@router.post("/login", response_model=TokenResponse)
async def login(user: UserLogin):
    db = get_database()

    # Find user by email
    db_user = await db["users"].find_one({"email": user.email})
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Verify password (plain text comparison)
    if user.password != db_user["password"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Create JWT token
    token = create_access_token({"email": db_user["email"], "role": db_user["role"]})

    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=str(db_user["_id"]),
            name=db_user["name"],
            email=db_user["email"],
            roll=db_user["roll"],
            role=db_user["role"],
        ),
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user=Depends(get_current_user)):
    return UserResponse(
        id=str(current_user["_id"]),
        name=current_user["name"],
        email=current_user["email"],
        roll=current_user["roll"],
        role=current_user["role"],
    )
