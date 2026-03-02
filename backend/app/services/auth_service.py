from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.core.config import settings
from app.core.database import supabase

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """Convert plain password to hashed password"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Check if password matches hash"""
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    """Create JWT token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    to_encode.update({"exp": expire})
    return jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )

def register_user(name: str, student_id: str, email: str, password: str):
    """Register a new student"""
    try:
        # Check if email already exists
        existing = supabase.table("users")\
            .select("id")\
            .eq("email", email)\
            .execute()
        
        if existing.data:
            return {"error": "Email already registered"}

        # Check if student_id already exists
        existing_id = supabase.table("users")\
            .select("id")\
            .eq("student_id", student_id)\
            .execute()
        
        if existing_id.data:
            return {"error": "Student ID already registered"}

        # Hash password and save to Supabase
        hashed = hash_password(password)
        result = supabase.table("users").insert({
            "name": name,
            "student_id": student_id,
            "email": email,
            "password": hashed,
            "role": "student"
        }).execute()

        return {"success": True, "user": result.data[0]}

    except Exception as e:
        return {"error": str(e)}

def login_user(email: str, password: str):
    """Login a user and return JWT token"""
    try:
        # Find user by email
        result = supabase.table("users")\
            .select("*")\
            .eq("email", email)\
            .execute()

        if not result.data:
            return {"error": "Email not found"}

        user = result.data[0]

        # Check password
        if not verify_password(password, user["password"]):
            return {"error": "Wrong password"}

        # Create JWT token
        token = create_access_token({
            "sub": user["id"],
            "email": user["email"],
            "role": user["role"]
        })

        return {
            "success": True,
            "access_token": token,
            "token_type": "bearer",
            "role": user["role"],
            "name": user["name"],
            "student_id": user["student_id"]
        }

    except Exception as e:
        return {"error": str(e)}

def get_current_user(token: str):
    """Get user from JWT token"""
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        user_id = payload.get("sub")
        if not user_id:
            return None

        # Use fresh client to avoid disconnection
        from app.core.database import get_fresh_client
        fresh_client = get_fresh_client()
        
        result = fresh_client.table("users")\
            .select("*")\
            .eq("id", user_id)\
            .execute()

        if not result.data:
            return None

        return result.data[0]

    except JWTError:
        return None
    except Exception as e:
        print(f"Auth error: {e}")
        return None
