from fastapi import APIRouter, HTTPException, Header, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from app.models.schemas import UserRegister, UserLogin
from app.services.auth_service import register_user, login_user, get_current_user

router = APIRouter()
security = HTTPBearer()

@router.post("/register")
def register(user: UserRegister):
    """Register a new student account"""
    result = register_user(
        name=user.name,
        student_id=user.student_id,
        email=user.email,
        password=user.password
    )
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return {
        "message": "Account created successfully!",
        "name": result["user"]["name"],
        "student_id": result["user"]["student_id"]
    }

@router.post("/login")
def login(user: UserLogin):
    """Login and get JWT token"""
    result = login_user(
        email=user.email,
        password=user.password
    )
    if "error" in result:
        raise HTTPException(status_code=401, detail=result["error"])
    
    return result

@router.get("/me")
def get_me(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current logged in user details"""
    token = credentials.credentials
    user = get_current_user(token)
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    return {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "student_id": user["student_id"],
        "role": user["role"]
    }
