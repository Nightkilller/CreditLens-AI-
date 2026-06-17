"""
CreditLens AI — Auth Routes
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.auth_service import authenticate_user, create_token_for_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    token: str
    user: dict


@router.post("/login", response_model=LoginResponse)
async def login(req: LoginRequest):
    """Authenticate bank employee and return JWT token."""
    user = await authenticate_user(req.email, req.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_token_for_user(user)
    return {
        "token": token,
        "user": {
            "email": user["email"],
            "name": user.get("name", ""),
            "role": user.get("role", "bank_employee"),
        }
    }
