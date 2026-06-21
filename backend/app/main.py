"""
CreditLens AI — FastAPI Backend
=================================
Main application entrypoint.

Run with:
    uvicorn app.main:app --reload --port 8000
"""

import csv
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import database
from app.services.auth_service import seed_demo_user
from app.services.ml_service import ml_service
from app.routes import auth, msme, scoring


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    print("\n" + "=" * 60)
    print("  CreditLens AI — Starting Backend")
    print("=" * 60)

    # 1. Connect to database
    print("\n[1/4] Connecting to database...")
    await database.connect()

    # 2. Seed demo user
    print("\n[2/4] Seeding demo user...")
    await seed_demo_user()

    # 3. Load ML model
    print("\n[3/4] Loading ML model...")
    ml_service.load()

    # 4. Seed sample MSMEs from generated dataset (if DB is empty)
    print("\n[4/4] Checking MSME data...")
    await seed_sample_msmes()

    print(f"\n{'=' * 60}")
    print(f"  Backend ready at http://{settings.backend_host}:{settings.backend_port}")
    print(f"  API docs: http://localhost:{settings.backend_port}/docs")
    print(f"{'=' * 60}\n")

    yield

    # Shutdown
    await database.disconnect()


async def seed_sample_msmes():
    """Load sample MSMEs from generated dataset if database is empty."""
    count = await database.msmes.count_documents({})
    if count > 0:
        print(f"  ℹ️  {count} MSMEs already in database")
        return

    # Load from CSV
    csv_path = Path(__file__).parent.parent.parent / "ml-engine" / "data" / "generated_dataset.csv"
    if not csv_path.exists():
        print("  ⚠️  No generated dataset found — run synthetic_generator.py first")
        return

    with open(csv_path, "r") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    # Insert first 100 MSMEs as sample data
    sample_size = min(100, len(rows))
    for row in rows[:sample_size]:
        # Convert numeric strings back to proper types
        doc = {
            "msme_id": row["msme_id"],
            "business_name": row["business_name"],
            "sector": row["sector"],
            "state": row["state"],
            "years_in_operation": float(row["years_in_operation"]),
            "employee_count": int(float(row["employee_count"])),
            "gst_filing_regularity_pct": float(row["gst_filing_regularity_pct"]),
            "monthly_gst_turnover_avg": float(row["monthly_gst_turnover_avg"]),
            "gst_turnover_growth_yoy_pct": float(row["gst_turnover_growth_yoy_pct"]),
            "input_tax_credit_claimed_pct": float(row["input_tax_credit_claimed_pct"]),
            "monthly_upi_inflow_avg": float(row["monthly_upi_inflow_avg"]),
            "monthly_upi_outflow_avg": float(row["monthly_upi_outflow_avg"]),
            "upi_transaction_count_monthly": int(float(row["upi_transaction_count_monthly"])),
            "unique_customer_count_monthly": int(float(row["unique_customer_count_monthly"])),
            "inflow_volatility_score": float(row["inflow_volatility_score"]),
            "avg_monthly_bank_balance": float(row["avg_monthly_bank_balance"]),
            "emi_bounce_count_12m": int(float(row["emi_bounce_count_12m"])),
            "existing_emi_obligations_monthly": float(row["existing_emi_obligations_monthly"]),
            "cash_flow_to_emi_ratio": float(row["cash_flow_to_emi_ratio"]),
            "epfo_employee_count": int(float(row["epfo_employee_count"])),
            "epfo_contribution_regularity_pct": float(row["epfo_contribution_regularity_pct"]),
            "employee_count_trend_12m": float(row["employee_count_trend_12m"]),
        }
        await database.msmes.insert_one(doc)

    print(f"  ✅ Seeded {sample_size} sample MSMEs from generated dataset")


# ─── Create App ───────────────────────────────────────────────
app = FastAPI(
    title="CreditLens AI",
    description="MSME Financial Health Card — Scoring NTC/NTB MSMEs using alternate data",
    version="1.0.0",
    lifespan=lifespan,
)

# ─── CORS ─────────────────────────────────────────────────────
cors_origins = [
    settings.frontend_url,
    "http://localhost:5173",
    "http://localhost:3000",
]

# If wildcard is used, disable credentials to prevent Starlette AssertionErrors
if "*" in cors_origins or not settings.frontend_url:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[o for o in cors_origins if o and o != "*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


# ─── Register Routes ─────────────────────────────────────────
app.include_router(auth.router)
app.include_router(msme.router)
app.include_router(scoring.router)


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "ml_model_loaded": ml_service.is_loaded,
        "database": "memory" if database.is_memory else "mongodb",
    }
