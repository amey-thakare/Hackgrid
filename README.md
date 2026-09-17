# FinSight Financial Firebreak

> **AI-Powered Early-Warning Decision-Support System for Interacting Enterprise Financial Stress Signals**  
> Built for the Hackathon Build &bull; Team White-Monster &bull; Track: Finance / Predictive AI / Single Prompt / Organizations

[![Python 3.11](https://img.shields.io/badge/Python-3.11-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg)](https://fastapi.tiangolo.com)
[![React 18](https://img.shields.io/badge/React-18-61dafb.svg)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8.3+-646cff.svg)](https://vitejs.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178c6.svg)](https://typescriptlang.org)
[![Gemini API](https://img.shields.io/badge/Google%20Gemini-2.5%20Flash-4285F4.svg)](https://ai.google.dev)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E.svg)](https://supabase.com)
[![Tests](https://img.shields.io/badge/Pytest-16%2F16%20Passing-success.svg)](backend/tests/)

---

## Overview

Large organizations rarely encounter liquidity stress from a single isolated metric. In reality, financial distress emerges from the **interaction of manageable-looking signals**: delayed collections, elongation in customer payment behaviors, high supplier concentration, inventory buildup, and divergence between reported accounting profits and operating cash flow.

Traditional dashboards present metrics in isolated silos, forcing financial analysts to manually connect the dots. **FinSight Financial Firebreak** addresses this interpretation gap through an auditable, privacy-preserving workflow:

$$\text{Hidden Signal Detection} \longrightarrow \text{Deterministic Computation} \longrightarrow \text{30/60/90 Outlook} \longrightarrow \text{Single-Prompt AI Reasoning} \longrightarrow \text{Executive Action Playbook}$$

---

## Technology Stack

### Backend & Analytical Engine
- **Language**: Python 3.11
- **REST API Framework**: FastAPI + Uvicorn
- **Deterministic Analytics**: Pandas & NumPy (server-side computation of all financial formulas)
- **Forecasting / Outlook**: **XGBoost Regressor** (30/60/90 days) with strict data sufficiency thresholds (`T-19`)
- **Generative AI Layer**: **Google Gemini API** (`gemini-2.5-flash` via `google-genai`) with strict native JSON schema enforcement (`AC-01`, `AC-04`)
- **Persistence**: **Supabase** (PostgreSQL cloud database) with automatic local **SQLite** fallback (`backend/db.py`)
- **Testing & Verification**: Pytest + HTTPX test client (16/16 PRD test cases verified)

### Frontend & Analyst Dashboard
- **Framework**: React 18 + Vite
- **Language**: TypeScript (with strict type safety)
- **Visualizations**: Recharts (responsive 30/60/90-day trajectory area charts) + SVG radial gauge (Firebreak Meter)
- **Icons**: Lucide React
- **Design System**: Vanilla CSS with tailored HSL obsidian dark palette, glassmorphism blur panels, glowing severity accents, and modern typography (*Outfit*, *Plus Jakarta Sans*, *JetBrains Mono*)

---

## Core Features

1. **Firebreak Meter (0–100 Gauge)**:
   - Computes a normalized compound stress index across 6 operational dimensions.
   - Categorized into prototype heuristic severity zones: **Low (0–34)**, **Moderate (35–59)**, **Elevated (60–79)**, and **Critical (80–100)**.
2. **Multi-Signal Stress Heatmap**:
   - Interactive cards for all 6 core dimensions:
     - **Receivables Health**: Simplified DSO proxy `(AR / Revenue) * 365`, 90-day delta, aging buckets (0–30, 31–60, 61–90, 90+ days).
     - **Payment Behavior**: Customer payment timing deterioration index.
     - **Supplier Concentration**: HHI index on payables; flags exposure when a single vendor represents dominant share.
     - **Inventory Efficiency**: Days Inventory Outstanding (DIO = `(Inventory / COGS) * 365`) and turnover ratio.
     - **Expense Anomalies**: Statistical Z-score versus trailing 12-month baseline.
     - **Cash-Flow Efficiency**: Cash Conversion Cycle (`CCC = DSO + DIO - DPO`), and OCF vs Net Income divergence score.
3. **Single-Prompt AI Risk-Chain Narrative**:
   - Synthesizes an executive narrative in plain English referencing multiple interacting dimensions.
   - Strict product guardrail (`OC-03`): Distinguishes observed operational evidence from inferred risk-chain mechanisms without making unsupported causal claims.
4. **30/60/90-Day Trajectory Outlook Chart**:
   - Interactive Recharts area chart projecting DSO and CCC over 30, 60, and 90 days.
   - Automatically displays confidence labeling: **Defensible Forecast** (when historical data exists) or **Heuristic Outlook** (`T-19`).
5. **Preventive Action Playbook**:
   - 3 to 5 bounded, actionable interventions prioritized by **Urgency** (Immediate, Near-Term, Medium-Term), **Effort** (Low, Medium, High), and **Directional Impact** (High, Medium, Low).
6. **What-If Operational Sensitivity Simulator**:
   - Real-time sliders to simulate operational adjustments:
     - Shift in DSO collection timing (-30d to +30d)
     - Shift in inventory velocity DIO (-30d to +30d)
     - Target dominant supplier concentration (15% to 85%)
   - Recalculates the stress index live and calculates estimated working capital cash freed up or locked up.
7. **Analysis Run History Drawer**:
   - Browse previous runs persisted in Supabase / SQLite with timestamps and stress scores.
   - 1-click historical reload onto the live dashboard.
8. **Executive Briefing Report Exporter**:
   - 1-click Markdown copy and Print-to-PDF export formatted for CFO and Risk Committee review via ReportLab.
9. **Industry Benchmarking**:
   - Select your sector (Manufacturing, SaaS, Retail, Healthcare, etc.) to overlay industry medians on all financial signals and dynamically inform the AI narrative.
10. **In-Memory CSV Ingestion & Sample Downloader**:
   - Drag-and-drop CSV upload with 10MB size limit check (`DC-01`, `T-04`).
   - 1-click "Download Standard Template CSV" directly inside the modal.
   - **Data Privacy Boundary (`DC-02`, `DC-05`)**: Raw CSV transaction lines are parsed in memory and never stored in any database.

---

## Getting Started

### Prerequisites
- **Python 3.11+** installed
- **Node.js 18+** & **npm** installed
- Git

### 1. Clone Repository
```powershell
git clone https://github.com/KaranNahta/hackgrid.git
cd hackgrid
```

### 2. Backend Setup
```powershell
# Install Python analytics & API dependencies
py -m pip install -r backend/requirements.txt

# Start the FastAPI backend server (port 8000)
py -m uvicorn backend.main:app --port 8000 --host 127.0.0.1 --reload
```
*The API is now running at `http://127.0.0.1:8000` (Interactive API docs at `http://127.0.0.1:8000/docs`).*

### 3. Frontend Setup
In a new terminal window:
```powershell
cd frontend

# Install frontend dependencies
npm install --legacy-peer-deps

# Start Vite dev server (port 5173)
npm run dev
```
*Open your browser at `http://127.0.0.1:5173` to explore the dashboard.*

---

## Environment Variables (Optional)

FinSight is designed to work **100% out-of-the-box offline** using deterministic simulation and local SQLite persistence. To connect live Google Gemini inference and Supabase cloud persistence, configure a `.env` file in the root directory:

```env
# Google Gemini API Configuration
GEMINI_API_KEY=your_google_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash

# Supabase Cloud Database Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your_supabase_anon_or_service_key
```

To set up your Supabase database table, simply run the included SQL migration script:
[backend/supabase_schema.sql](backend/supabase_schema.sql).

---

## Verification & Automated Testing

FinSight was verified against the full test suite defined in **PRD v1.1 (Test Cases T-01 to T-28)**:

### Run Pytest Test Suite (16 Automated Tests)
```powershell
py -m pytest backend/tests/test_all_prd_cases.py -v
```
Verifies:
- `T-01` to `T-06`: Ingestion of complete, partial, non-CSV, oversized (>10MB), all-zero, and negative-flow CSVs.
- `T-07`: Simplified DSO formula `(AR / Revenue) * 365`.
- `T-08`: 80% Supplier concentration exposure flag.
- `T-09` & `T-10`: Healthy benchmark vs Compounding Crisis scenario evaluation.
- `T-11`: CCC formula `DSO + DIO - DPO`.
- `T-12` to `T-15`: AI output schema, 0–100 bounded score, 3–5 actions, non-causal multi-signal narrative.
- `T-16`: Directional scoring separation (Healthy 15.0 < Crisis 77.0).
- `T-18`: Repeatability tolerance across multiple runs.
- `T-19`: Labeled heuristic outlook on datasets with limited history.

### Run Performance & Reliability Benchmark (T-26 & T-28)
```powershell
py -m backend.tests.benchmark_performance
```
Executes 5 consecutive full-pipeline runs (Ingest $\to$ Metric Engine $\to$ 30/60/90 Outlook $\to$ Single-Prompt AI $\to$ Persistence):
- **Mean Latency**: `0.0233s` (Target: `< 30.0s`)
- **Degradation**: `0.00%` (Zero memory leak or latency degradation across consecutive executions)

### Build Frontend Production Bundle
```powershell
cd frontend
npm run build
```
Compiles TypeScript into minified static assets in under 2 seconds with zero errors.

---

## Cloud Deployment (Render & Vercel)

FinSight is ready to be deployed to the cloud.

1. **Backend (Render)**: Connect your repository to Render.com and create a Blueprint. Render will automatically detect the `render.yaml` configuration and deploy the FastAPI backend.
2. **Frontend (Vercel)**: Import your repository into Vercel, set the root directory to `frontend`, and configure the `VITE_API_BASE_URL` environment variable to point to your new Render backend URL. A `vercel.json` file is included for proper React SPA routing.

---

## Regulatory & Positioning Guardrails

- **Decision-Support Only**: FinSight Financial Firebreak is an early-warning analytical prototype for decision support. Outputs do not constitute formal audit opinions, solvency certifications, bankruptcy predictions, or investment advice (`OC-02`).
- **Non-Causal Narrative**: Explanations are framed as contributing risk-chain narratives and potential signal interactions under current conditions, not statistical proofs of causality (`OC-03`).
- **Prototype Heuristics**: All score thresholds and severity zones are explicitly labeled as prototype design heuristics (`OC-05`).
- **Data Privacy Boundary**: Raw customer identities and transaction lines are never transmitted to external LLMs or persisted in the database (`DC-02`, `DC-05`).

---

## Project Documentation & Links

- Detailed Handover & Roadmap: [HANDOFF.md](HANDOFF.md)
- Formal Project Specification: [.gsd/SPEC.md](.gsd/SPEC.md)
- Requirements Traceability Matrix: [.gsd/REQUIREMENTS.md](.gsd/REQUIREMENTS.md)
- Architectural Decision Records: [.gsd/DECISIONS.md](.gsd/DECISIONS.md)
- Execution Roadmap & Progress: [.gsd/ROADMAP.md](.gsd/ROADMAP.md)
- Live Session State: [.gsd/STATE.md](.gsd/STATE.md)
