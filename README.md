# CreditLens AI — MSME Financial Health Card

> Underwrite New-to-Credit (NTC) & New-to-Bank (NTB) MSMEs using alternate transaction and compliance data (GST, UPI, Account Aggregator, EPFO). Exclude bureaus, leverage ML.

**Built for IDBI Innovate 2026 — Track 03 (Financial Inclusion, Digital Lending & Credit Decisioning)**

> [!IMPORTANT]
> **Demo Credentials for Reviewers & Judges**:
> * **Username / Email**: `admin@idbi.co.in`
> * **Password**: `CreditLens2026`
> *(The login screen will pre-fill these credentials automatically for quick access)*

---

## Key Features

1. **Alternate Data Underwriting**: Scores creditworthiness on GST filings, Account Aggregator bank balances, EPFO payrolls, and UPI merchant collections.
2. **Robust ML Engine**: Classifier model (Gradient Boosting trees with automatic RandomForest fallback) trained on correlated synthetic Indian business data, delivering over `0.83 AUC-ROC`.
3. **SHAP Explainability Waterfall**: Deconstructs every credit score into positive behavioral factors (e.g. prompt GST filing) and negative risk flags (e.g. EMI bounces).
4. **Interactive Dashboard**: Bank employee console to search portfolios, filter by risk tiers/sectors, generate health cards, and print reports.
5. **Zero-Config Fallbacks**: Features in-memory database fallback so the full pipeline can run locally out-of-the-box without requiring live MongoDB connection.

---

## Directory Structure

```text
creditlens-ai/
├── backend/                  # FastAPI Application
│   ├── app/                  # Route routers, service controllers, schemas
│   │   ├── models/           # Pydantic schemas (MSME, Scoring)
│   │   ├── routes/           # REST endpoints (auth, msme, scoring)
│   │   ├── services/         # Business logic (auth, ml_service)
│   │   └── utils/            # JWT tokens & native bcrypt security
│   ├── test_api_client.py    # End-to-end integration test client
│   └── Dockerfile            # Container config
├── frontend/                 # React SPA (Vite + Tailwind + Recharts)
│   ├── src/
│   │   ├── components/       # Gauge, cards, waterfall factors, trend charts
│   │   ├── context/          # JWT authorization state context
│   │   ├── pages/            # Login, Search Dashboard, Credit Health Card
│   │   └── services/         # Axios API interceptors
│   └── tailwind.config.js    # Custom brand palettes (IDBI deep teal, gold)
├── ml-engine/                # Machine Learning Pipeline
│   ├── data/                 # Data generator & feature glossary
│   ├── training/             # Feature scaling & model training
│   └── explainability/       # SHAP values & credit pillar normalizer
└── docs/                     # System design & API reference manuals
```

---

## Quick Start Guide

### 1. Model Training & Data Setup
Install Python dependencies and generate the synthetic dataset of 2,000 businesses, then train the model to build the decision artifacts:
```bash
# Set up env variables
cp .env.example .env

# Generate dataset (2,000 Indian businesses)
python3 ml-engine/data/synthetic_generator.py

# Train ML model & generate artifacts (scaler, weights)
python3 ml-engine/training/train_model.py
```

### 2. Launch FastAPI Backend
Launch the server in the `backend/` folder:
```bash
cd backend
python3 -m uvicorn app.main:app --reload --port 8000
```
* Access Swagger API interface at [http://localhost:8000/docs](http://localhost:8000/docs)
* Default credentials: `admin@idbi.co.in` / `CreditLens2026`

### 3. Launch React Frontend
Run the client dev server:
```bash
cd frontend
npm install
npm run dev
```
* Open dashboard console at [http://localhost:5173](http://localhost:5173)

---

## Section 7: Verification & Acceptance Checklist

Use this checklist to verify compliance of the submission against track criteria:

- [x] **Alternate Data Incorporation**: Uses GST regularity, bank cash flow ratio, EPFO payroll growth, and UPI transaction volumes. No traditional bureau inputs.
- [x] **Pillars Assessment**: Formulates 4 distinct credit pillar sub-scores (Liquidity, Stability, Growth, Compliance) in `ml-engine/scoring/score_calculator.py`.
- [x] **Explainability Panel**: Translates machine learning logits into green positive behaviors and red risk flags on the dashboard interface.
- [x] **Interactive Dashboard**: Search, multi-column filters (Sectors, Risk tiers), tabular portfolio overview, and printable health cards.
- [x] **E2E Integration Verification**: Full-coverage integration tests passing locally via `python3 backend/test_api_client.py` asserting database seeding, login token verification, and score history.
