# CreditLens AI — REST API Reference

Exposes HTTP endpoints for bank employee login, MSME portfolio management, and credit score card execution.

All API routes (except `/api/auth/login` and `/api/health`) require the authorization header:
```http
Authorization: Bearer <jwt_access_token>
```

---

## 1. Authentication

### User Login
Authenticates bank officer credentials.

* **Endpoint**: `POST /api/auth/login`
* **Content-Type**: `application/json`
* **Request Body**:
  ```json
  {
    "email": "admin@idbi.co.in",
    "password": "CreditLens2026"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "user": {
      "email": "admin@idbi.co.in",
      "name": "Bank Employee",
      "role": "bank_employee"
    }
  }
  ```

---

## 2. MSME Management

### List MSMEs
Retrieves a paginated list of MSME profiles.

* **Endpoint**: `GET /api/msmes`
* **Query Parameters**:
  * `skip` (integer, default `0`): Records to skip
  * `limit` (integer, default `20`): Page size
  * `sector` (string, optional): Filter by sector
  * `state` (string, optional): Filter by state code
* **Response (200 OK)**:
  ```json
  {
    "msmes": [
      {
        "msme_id": "52608342-05ad-48f6-b8f1-c007445b0fbe",
        "business_name": "Ghosh Stores",
        "sector": "Retail",
        "state": "WB",
        "employee_count": 12,
        "monthly_gst_turnover_avg": 540000.0,
        "latest_score": 68.0,
        "risk_tier": "Moderate Risk"
      }
    ],
    "total": 1,
    "skip": 0,
    "limit": 20
  }
  ```

### Search MSMEs
Search profiles by business name, ID, sector, or state.

* **Endpoint**: `GET /api/msmes/search`
* **Query Parameters**:
  * `q` (string, required): Search substring
* **Response (200 OK)**:
  ```json
  {
    "msmes": [
      {
        "msme_id": "52608342-05ad-48f6-b8f1-c007445b0fbe",
        "business_name": "Ghosh Stores",
        "sector": "Retail",
        "state": "WB",
        "employee_count": 12,
        "monthly_gst_turnover_avg": 540000.0,
        "latest_score": 68.0,
        "risk_tier": "Moderate Risk"
      }
    ],
    "total": 1
  }
  ```

### Get MSME Profile
Fetches the full, raw alternate data profile of a single MSME.

* **Endpoint**: `GET /api/msmes/{msme_id}`
* **Response (200 OK)**:
  ```json
  {
    "msme_id": "52608342-05ad-48f6-b8f1-c007445b0fbe",
    "business_name": "Ghosh Stores",
    "sector": "Retail",
    "state": "WB",
    "years_in_operation": 5.0,
    "employee_count": 12,
    "gst_filing_regularity_pct": 92.0,
    "monthly_gst_turnover_avg": 540000.0,
    "gst_turnover_growth_yoy_pct": 12.5,
    "input_tax_credit_claimed_pct": 85.0,
    "monthly_upi_inflow_avg": 420000.0,
    "monthly_upi_outflow_avg": 380000.0,
    "upi_transaction_count_monthly": 150,
    "unique_customer_count_monthly": 88,
    "inflow_volatility_score": 0.15,
    "avg_monthly_bank_balance": 45000.0,
    "emi_bounce_count_12m": 0,
    "existing_emi_obligations_monthly": 15000.0,
    "cash_flow_to_emi_ratio": 2.6,
    "epfo_employee_count": 8,
    "epfo_contribution_regularity_pct": 100.0,
    "employee_count_trend_12m": 0.05
  }
  ```

---

## 3. Credit Scoring

### Execute Scoring
Submits raw MSME profile data to the machine learning engine to calculate health card scores.

* **Endpoint**: `POST /api/score/{msme_id}`
* **Response (200 OK)**:
  ```json
  {
    "msme_id": "52608342-05ad-48f6-b8f1-c007445b0fbe",
    "business_name": "Ghosh Stores",
    "overall_score": 68.0,
    "risk_tier": {
      "label": "Moderate Risk",
      "color": "#E5A93B"
    },
    "sub_scores": {
      "liquidity": {
        "score": 62.4,
        "label": "Liquidity",
        "tier_label": "Moderate Risk",
        "tier_color": "#E5A93B",
        "weight": 0.3
      },
      "stability": {
        "score": 70.8,
        "label": "Stability",
        "tier_label": "Moderate Risk",
        "tier_color": "#E5A93B",
        "weight": 0.25
      },
      "growth": {
        "score": 67.2,
        "label": "Growth",
        "tier_label": "Moderate Risk",
        "tier_color": "#E5A93B",
        "weight": 0.25
      },
      "compliance": {
        "score": 75.1,
        "label": "Compliance",
        "tier_label": "Healthy",
        "tier_color": "#1F9D55",
        "weight": 0.2
      }
    },
    "top_factors": [
      {
        "feature": "GST Compliance Score",
        "impact": 0.085,
        "direction": "positive",
        "group": "compliance"
      }
    ],
    "default_probability": 0.32,
    "scored_at": "2026-06-18T01:10:00.000Z"
  }
  ```

### Get Latest Score
Retrieves the most recent scoring snapshot.

* **Endpoint**: `GET /api/score/{msme_id}`
* **Response (200 OK)**: *(Same format as Execute Scoring response)*

### Get Score History
Gets historical credit score snapshots (sorted newest first).

* **Endpoint**: `GET /api/score/{msme_id}/history`
* **Response (200 OK)**:
  ```json
  {
    "msme_id": "52608342-05ad-48f6-b8f1-c007445b0fbe",
    "business_name": "Ghosh Stores",
    "history": [
      {
        "overall_score": 68.0,
        "risk_tier": {
          "label": "Moderate Risk",
          "color": "#E5A93B"
        },
        "scored_at": "2026-06-18T01:10:00.000Z"
      }
    ]
  }
  ```
