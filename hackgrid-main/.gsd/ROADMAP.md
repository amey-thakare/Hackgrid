---
milestone: FinSight Financial Firebreak v1.1
version: 1.1.0
updated: 2026-09-16T21:30:00Z
---

# Roadmap: FinSight Financial Firebreak

> **Current Phase:** Phase 1: Foundation & Financial Computation Engine
> **Status:** Planning

## Must-Haves (from SPEC & PRD)
- [ ] 6-Dimension deterministic metric computation (DSO proxy, HHI, CCC, aging buckets, expense anomaly, cash flow divergence)
- [ ] 30/60/90-Day lightweight trend projection & heuristic fallback outlook
- [ ] Single-prompt Claude intelligence layer with schema validation & mock fallback
- [ ] Executive Firebreak Dashboard (Meter, Heatmap, Narrative Panel, Outlook Chart, Action Playbook)
- [ ] 1-Click Synthetic Demo datasets (Crisis scenario, Healthy scenario, Edge cases) with visible synthetic labeling
- [ ] Verification suite passing all test cases T-01 through T-28

---

## Phases

### Phase 1: Foundation & Financial Computation Engine
**Status:** ✅ Complete
**Objective:** Set up backend workspace, Supabase client (with local SQLite fallback), CSV ingestion pipeline with 10MB limits, and deterministic Python metric computation for all 6 signal dimensions + 30/60/90-day trend forecasting layer.
**Requirements:** REQ-01, REQ-02, REQ-03, REQ-04, REQ-05, REQ-06, REQ-07, REQ-08
**Plans:**
- [x] Plan 1.1: Backend environment setup, FastAPI structure, and Supabase / SQLite session store.
- [x] Plan 1.2: CSV parsing engine with size & schema validation, zero/negative value tolerance, and privacy protection.
- [x] Plan 1.3: Core financial metric calculator (DSO proxy, aging, HHI supplier concentration, CCC, expense anomaly, cash flow divergence).
- [x] Plan 1.4: 30/60/90-day time-series forecasting engine and heuristic fallback generator.

---

### Phase 2: Single-Prompt AI Intelligence Layer & Evidence Serializer
**Status:** ✅ Complete
**Objective:** Construct normalized Financial Stress Signal Matrix, single-prompt Gemini API integration with schema-valid JSON output, guardrail enforcement (risk-chain framing, no causal claims), and offline mock engine.
**Requirements:** REQ-09, REQ-10, REQ-11, REQ-12, REQ-13, REQ-14
**Plans:**
- [x] Plan 2.1: Evidence matrix serializer (packaging metrics, outlook, and heuristic threshold flags).
- [x] Plan 2.2: Gemini prompt engineering and JSON response validator (Financial Stress Index, risk-chain narrative, 3-5 actions).
- [x] Plan 2.3: Deterministic mock inference fallback and API failure resilience.

---

### Phase 3: Synthetic Data Generator & Benchmark Datasets
**Status:** ✅ Complete
**Objective:** Create verifiable synthetic benchmark datasets for demo and test suites (Pre-loaded Crisis Scenario, Healthy Scenario, Edge Case Datasets for T-01 to T-11).
**Requirements:** REQ-13, REQ-16
**Plans:**
- [x] Plan 3.1: Synthetic dataset generation script and bundled scenario files (Crisis, Healthy, 80% Supplier Concentration, Missing Columns, All-Zero, Negative Values).
- [x] Plan 3.2: Automated test harness verifying ingestion and metric computation tests T-01 to T-11.

---

### Phase 4: Executive Analyst Dashboard (React 18 + Vite + Tailwind + Recharts)
**Status:** ✅ Complete
**Objective:** Build high-fidelity, responsive frontend with Firebreak Meter, Signal Heatmap, Risk-Chain Narrative Panel, Outlook Chart, Action Cards, 1-Click Demo loader, and visible AI disclaimers.
**Requirements:** REQ-15, REQ-16, REQ-17, REQ-18
**Plans:**
- [x] Plan 4.1: React + Vite + TypeScript project setup with custom design tokens and glassmorphism styling.
- [x] Plan 4.2: Data ingestion & demo controls (CSV drag-and-drop, 10MB client check, 1-click synthetic demo triggers).
- [x] Plan 4.3: Core visualizations: Firebreak Meter (0-100 gauge with heuristic zones), Signal Heatmap (6 dimensions), 30/60/90 Outlook trajectory chart.
- [x] Plan 4.4: Intelligence panels: Risk-Chain Narrative card, Action Playbook cards (urgency/effort/directional impact), and persistent AI disclaimer.

---

### Phase 5: Verification, Benchmarking & Production Readiness
**Status:** ✅ Complete
**Objective:** Run complete verification matrix (T-01 through T-28), measure end-to-end performance (<30s target), verify privacy boundary, and package for deployment.
**Requirements:** REQ-01 through REQ-18 (Complete test cases T-01 to T-28)
**Plans:**
- [x] Plan 5.1: End-to-end integration test runner for all P0 and P1 test cases (16 automated tests passed in pytest).
- [x] Plan 5.2: UI and responsive layout verification (1280px screen, loading spinner, error states).
- [x] Plan 5.3: Empirical benchmark: 5/5 consecutive successful runs with 0.023s mean execution time.

---

### Phase 6: Executive Analytics Suite & Cloud Readiness
**Status:** ✅ Complete
**Objective:** Deliver high-leverage executive features: interactive What-If sensitivity simulator, historical runs browser drawer, sample CSV generator, executive report export, and Supabase SQL migration schema.
**Plans:**
- [x] Plan 6.1: Supabase SQL schema migration (`supabase_schema.sql`) and sample CSV download endpoint.
- [x] Plan 6.2: Backend What-If sensitivity calculator (`backend/sensitivity.py`) with working capital delta modeling.
- [x] Plan 6.3: What-If Sensitivity Simulator UI component with interactive sliders and real-time stress index recalculation.
- [x] Plan 6.4: Historical Runs Drawer UI component connecting to Supabase/SQLite run history with 1-click reload.
- [x] Plan 6.5: Executive Report Exporter (formatted print-ready summary for CFO/Audit committee).

---

## Progress Summary

| Phase | Status | Plans | Complete |
|---|---|---|---|
| Phase 1: Foundation & Computation | ✅ Complete | 4/4 | 100% |
| Phase 2: AI Intelligence Layer | ✅ Complete | 3/3 | 100% |
| Phase 3: Synthetic Data & Benchmarks | ✅ Complete | 2/2 | 100% |
| Phase 4: Executive Dashboard | ✅ Complete | 4/4 | 100% |
| Phase 5: Verification & Readiness | ✅ Complete | 3/3 | 100% |
| Phase 6: Executive Analytics Suite | ✅ Complete | 5/5 | 100% |
