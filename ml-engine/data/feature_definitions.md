# Feature Definitions — CreditLens AI Data Dictionary

> This document describes every feature in the synthetic MSME dataset, its valid range,
> data source, and relevance to creditworthiness assessment.

---

## Identity / Meta Fields

| Field | Type | Range | Description | Credit Relevance |
|-------|------|-------|-------------|-----------------|
| `msme_id` | UUID | — | Unique identifier for each MSME profile | Primary key |
| `business_name` | String | — | Plausible Indian business name (e.g., "Sharma Textiles") | Display only |
| `sector` | Categorical | Manufacturing, Retail, Services, Trading, Agriculture-allied, Textiles | Industry classification based on Udyam registration categories | Different sectors have different default rates and cash flow patterns |
| `years_in_operation` | Float | 0.5 – 25 years | Duration since business started operations | Longer track record indicates stability; NTC businesses (<2 years) are inherently riskier |
| `employee_count` | Integer | 1 – 200 | Total workforce (formal + informal) | Proxy for business scale; micro-enterprises (<10 employees) have higher mortality rates |
| `state` | Categorical | 20 Indian states | Registered state of operation, weighted toward MSME-dense states (MH, GJ, UP, TN, MP) | Regional economic conditions affect MSME viability; some states have better MSME ecosystems |

---

## GST Features

*Source: GST Network (GSTN) — available via GST returns filed by the MSME*

| Field | Type | Range | Description | Credit Relevance |
|-------|------|-------|-------------|-----------------|
| `gst_filing_regularity_pct` | Float | 0 – 100% | Percentage of months (out of last 12) where GST returns were filed on time | **Strong signal.** Regular GST filing indicates discipline, operational consistency, and compliance awareness. Low regularity is a red flag for operational distress. |
| `monthly_gst_turnover_avg` | Float | ₹10,000 – ₹5,00,00,000 | Average monthly turnover reported in GSTR-3B filings over last 12 months | Indicates business scale and revenue capacity. Higher turnover (relative to obligations) indicates ability to service debt. |
| `gst_turnover_growth_yoy_pct` | Float | -40% to +80% | Year-over-year growth in reported GST turnover | **Growth signal.** Positive growth suggests expanding business; negative growth may indicate declining viability. |
| `input_tax_credit_claimed_pct` | Float | 0 – 100% | Percentage of eligible Input Tax Credit actually claimed | Proxy for **compliance sophistication**. Businesses that optimize ITC claims tend to be better managed, with proper accounting systems. |

---

## UPI / Digital Transaction Features

*Source: UPI transaction data via Account Aggregator framework or bank statement analysis*

| Field | Type | Range | Description | Credit Relevance |
|-------|------|-------|-------------|-----------------|
| `monthly_upi_inflow_avg` | Float | ₹5,000 – ₹4,00,00,000 | Average monthly UPI credits (incoming payments) | Indicates actual cash inflow velocity. More reliable than reported turnover as it's transaction-level data. |
| `monthly_upi_outflow_avg` | Float | Correlated with inflow | Average monthly UPI debits (outgoing payments) | Outflow pattern reveals spending discipline. Outflow consistently exceeding inflow is a red flag. |
| `upi_transaction_count_monthly` | Integer | 10 – 5,000 | Number of UPI transactions per month | High transaction count with low per-transaction value may indicate retail business health. Very low counts for stated turnover raise questions. |
| `unique_customer_count_monthly` | Integer | 1 – varies | Number of distinct UPI counterparties (customers) per month | **Customer concentration risk.** Few unique customers = revenue depends on a handful of clients. If one leaves, the MSME may default. |
| `inflow_volatility_score` | Float | 0 – 1 | Standard deviation of monthly inflow divided by mean inflow | **Stability signal.** Low volatility (stable monthly income) is positive for debt servicing. High volatility means unpredictable cash flows. |

---

## Account Aggregator (Bank Cash Flow) Features

*Source: Bank account data shared via Account Aggregator (AA) framework — RBI-regulated consent-based data sharing*

| Field | Type | Range | Description | Credit Relevance |
|-------|------|-------|-------------|-----------------|
| `avg_monthly_bank_balance` | Float | ₹5,000 – ₹2,00,00,000 | Average end-of-month balance across primary business bank account(s) | **Liquidity signal.** Higher average balance indicates cash buffer for emergencies. Very low balance relative to turnover suggests the business operates on thin margins. |
| `emi_bounce_count_12m` | Integer | 0 – 12 | Number of EMI/ECS/NACH payment bounces in last 12 months | **Strongest default predictor.** Even 1-2 bounces in a year indicate cash flow stress. >3 bounces is a strong negative signal. |
| `existing_emi_obligations_monthly` | Float | ₹0 – ₹5,00,000 | Total monthly EMI obligations across all existing loans | Used to calculate debt burden. High EMI relative to income reduces repayment capacity for new credit. |
| `cash_flow_to_emi_ratio` | Float | 0 – 50 (derived) | `avg_monthly_bank_balance / existing_emi_obligations_monthly` | **Debt service coverage proxy.** Ratio < 1.5 indicates the MSME may struggle to service existing debt, let alone new credit. |

---

## EPFO Features

*Source: Employees' Provident Fund Organisation (EPFO) data — available via DigiLocker or employer filings*

| Field | Type | Range | Description | Credit Relevance |
|-------|------|-------|-------------|-----------------|
| `epfo_employee_count` | Integer | 0 – varies | Number of employees registered with EPFO (formal employment) | **Workforce formality proxy.** Ratio of EPFO-registered to total employees indicates compliance maturity. Higher formality = more stable business. |
| `epfo_contribution_regularity_pct` | Float | 0 – 100% | Percentage of months with on-time EPFO contributions (last 12 months) | **Compliance and cash discipline signal.** Regular EPFO payments indicate the business manages recurring obligations well — a positive indicator for loan repayment. |
| `employee_count_trend_12m` | Float | -30% to +50% | Year-over-year change in registered employee count | **Growth/contraction signal.** Growing workforce suggests expanding business. Shrinking workforce may indicate downsizing or distress. |

---

## Label

| Field | Type | Range | Description |
|-------|------|-------|-------------|
| `defaulted_label` | Binary | 0 or 1 | Whether the MSME defaulted on a credit facility within 12 months. **0 = No default (good), 1 = Defaulted (bad).** |

### Label Generation Logic

The default label is NOT randomly assigned. It is generated using a **weighted logistic function** of the input features, creating learnable signal for the ML model:

**Risk factors that INCREASE default probability:**
- Low GST filing regularity
- High EMI bounce count (strongest individual predictor)
- High inflow volatility
- Declining employee trend
- Low cash flow-to-EMI ratio
- Low EPFO contribution regularity
- Low ITC claimed percentage
- Negative turnover growth
- Fewer years in operation

**Target class distribution:** ~8-12% positive class (defaulted), matching real Indian MSME NPA rates reported by RBI and SIDBI.

**Why this matters:** Because the label has genuine signal from the features, the XGBoost model can learn real patterns, and SHAP explanations will show meaningful feature importance — not random noise. This is critical for a convincing demo.

---

## Data Generation Methodology

### Latent Business Quality Variable
A hidden `business_quality` score (Beta(2.5, 2.5) distribution, range 0-1) is generated for each MSME first. This latent variable creates **realistic correlations** between features:
- A high-quality business tends to have good GST compliance AND low EMI bounces AND regular EPFO contributions simultaneously
- A struggling business tends to have problems across multiple dimensions

This mirrors real-world MSME behavior where underlying business health manifests across all data sources.

### Correlation Structure
- **UPI inflow** correlates with **GST turnover** (both reflect actual business volume)
- **UPI outflow** is 60-90% of inflow (realistic business operating expenses)
- **EPFO employee count** loosely correlates with **total employee count** (some informal workers)
- **Bank balance** correlates with turnover and quality (well-managed firms maintain higher buffers)
- **EMI bounce count** inversely correlates with business quality
