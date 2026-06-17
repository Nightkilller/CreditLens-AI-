"""
CreditLens AI — Auth Service
"""

from app.database import database
from app.utils.security import hash_password, verify_password, create_access_token
from app.config import settings


async def seed_demo_user():
    """Create demo admin user if it doesn't exist."""
    existing = await database.users.find_one({"email": settings.demo_email})
    if not existing:
        await database.users.insert_one({
            "email": settings.demo_email,
            "hashed_password": hash_password(settings.demo_password),
            "name": "Admin User",
            "role": "bank_employee",
        })
        print(f"  ✅ Demo user created: {settings.demo_email}")
    else:
        print(f"  ℹ️  Demo user already exists: {settings.demo_email}")


async def authenticate_user(email: str, password: str) -> dict | None:
    """Authenticate a user by email and password."""
    user = await database.users.find_one({"email": email})
    if not user:
        return None
    if not verify_password(password, user["hashed_password"]):
        return None
    return user


def create_token_for_user(user: dict) -> str:
    """Create a JWT token for an authenticated user."""
    return create_access_token({
        "sub": user["email"],
        "name": user.get("name", ""),
        "role": user.get("role", "bank_employee"),
    })
