"""
CreditLens AI — Backend Configuration
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from root directory
root_dir = Path(__file__).parent.parent.parent
env_path = root_dir / ".env"
load_dotenv(dotenv_path=env_path)


class Settings:
    # MongoDB
    mongodb_uri: str = os.getenv("MONGODB_URI", "")  # Empty = use in-memory fallback
    db_name: str = os.getenv("DB_NAME", "creditlens")

    # JWT
    jwt_secret_key: str = os.getenv("JWT_SECRET_KEY", "creditlens-dev-secret-change-in-production")
    jwt_algorithm: str = os.getenv("JWT_ALGORITHM", "HS256")
    jwt_expiration_minutes: int = int(os.getenv("JWT_EXPIRATION_MINUTES", "480"))  # 8 hours

    # Server
    backend_host: str = os.getenv("BACKEND_HOST", "0.0.0.0")
    backend_port: int = int(os.getenv("BACKEND_PORT", "8000"))

    # CORS
    frontend_url: str = os.getenv("FRONTEND_URL", "http://localhost:5173")

    # Demo credentials
    demo_email: str = os.getenv("DEMO_EMAIL", "admin@idbi.co.in")
    demo_password: str = os.getenv("DEMO_PASSWORD", "CreditLens2026")

    # ML Engine paths (relative to project root)
    ml_model_path: str = str(
        Path(__file__).parent.parent.parent / "ml-engine" / "training" / "model_artifacts"
    )


settings = Settings()
