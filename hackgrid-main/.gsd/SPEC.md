# SPEC.md — Project Specification: FinSight Financial Firebreak

> **Status**: `FINALIZED`
>
> ⚠️ **Planning Lock**: Requirements finalized from PRD v1.1 (Team White-Monster, September 2026). Implementation proceeds according to GSD roadmap phases.

---

## Vision
FinSight Financial Firebreak is an AI-powered early-warning decision-support system designed to identify compounding combinations of financial stress signals inside large organizations before they escalate. Rather than treating indicators in isolation, FinSight computes derived financial evidence across six core dimensions (receivables health, payment behavior, supplier concentration, inventory efficiency, expense anomalies, and cash-flow efficiency), projects 30/60/90-day trajectories via server-side Python, and employs a strictly constrained single-prompt AI reasoning call to synthesize an explainable risk-chain narrative and prioritize 3–5 actionable preventive interventions in an executive dashboard.

---

## Goals
1. **Compounding Stress Detection**: Ingest standard financial CSV exports (up to 10MB) and compute derived server-side metrics across six key financial stress dimensions without persisting raw records.
2. **Deterministic Metric & Outlook Layer**: Compute simplified DSO proxy, receivables aging, supplier HHI concentration, DIO/turnover, expense anomalies, and Cash Conversion Cycle (CCC = DSO + DIO - DPO), alongside a 30/60/90-day time-series projection (or labeled heuristic outlook).
3. **Single-Prompt AI Synthesis**: Execute exactly one structured Gemini API call (`gemini-2.5-flash` / `gemini-1.5-pro` with structured JSON output, or fallback mock) returning schema-valid JSON containing a 0–100 Financial Stress Index, interacting signal combinations, a risk-chain narrative (referencing >= 2 dimensions without unsupported causality claims), and 3–5 preventive actions.
4. **Executive Analyst Dashboard**: Deliver a web interface featuring a Firebreak Meter, 6-dimension Signal Heatmap, Risk-Chain Narrative Panel, 30/60/90-day Outlook Chart, Action Cards with urgency/directional impact labels, synthetic demo dataset loader, and ubiquitous regulatory AI disclaimers.
5. **Strict Architectural & Data Privacy Guardrails**: Guarantee that raw transactional CSV data never reaches the frontend or the external AI model; preserve cold-start resilience, <= 30s analysis response time, persist derived metrics & run metadata to Supabase (with resilient local fallback), and pass test cases T-01 through T-28.

---

## Non-Goals (Out of Scope)
- **Autonomous Financial Execution**: FinSight does not make financial decisions, trigger disbursements, or execute trades.
- **Audit & ERP Replacement**: FinSight does not replace core ERP systems (SAP, Oracle, NetSuite), treasury management platforms, or formal financial audits.
- **Legal / Investment Advice**: FinSight does not provide lending, investment, or statutory compliance advice.
- **Calibrated Default Probability / Solvency Engine**: FinSight computes an analytical Financial Stress Index (0-100), not a formal statistical rating, probability of default (PD), or bankruptcy predictor.
- **Causal Inference Proofs**: Explanations are framed as contributing risk-chain narratives and potential interactions under current conditions, not statistical causality proofs.
- **Real-Time Transactional Stream Monitoring**: FinSight processes periodic snapshot CSV exports and synthetic benchmark runs, not live high-frequency streaming events.
- **Proprietary Model Fine-Tuning**: Uses deterministic Python computation and pre-trained LLM inference.

---

## Target Personas
- **Primary**: CFO / VP Finance (early warning before reactive crisis), Treasury Manager (liquidity stress and working capital outlook).
- **Secondary**: Risk Officer (cross-silo signal interactions), Financial Analyst (automated first-pass synthesis).
- **Evaluator**: CTO / IT / Security (privacy boundaries, single-prompt constraint, auditability).

---

## Technical Constraints & Guardrails
- **AC-01 (Single Prompt)**: Exactly one LLM call per analysis run using Google Gemini API (`gemini-2.5-flash` / `gemini-1.5-pro` with structured output); no prompt chaining or autonomous tool loops.
- **AC-02 (Server Computation)**: All financial formulas and forecasting occur server-side in Python before LLM payload construction.
- **AC-03 (Cost Envelope)**: Must function within free-tier / hackathon credit budget with offline synthetic mode.
- **AC-04 (Structured JSON)**: Gemini must return schema-valid JSON on every run; graceful degradation if API is unreachable.
- **AC-05 (Performance)**: Full-pipeline response time < 30 seconds from upload to render.
- **DC-01 (File Size)**: Max 10MB CSV upload with clear size validation.
- **DC-02 / DC-05 (Privacy Boundary)**: Raw CSV data is parsed in-memory/temp and never persisted to database or sent to external AI API; only derived aggregates are shared.
- **DC-03 (Resilience)**: Missing columns handled gracefully with explicit indicators; no silent crashes.
- **DC-04 / 10.2 (Synthetic Labeling)**: Pre-loaded demo datasets clearly labeled as synthetic; no fabricated real-company figures.
- **OC-01 / OC-05 (Score Labeling)**: Financial Stress Index is 0–100, thresholds labeled as prototype heuristic design thresholds.
- **OC-02 (Disclaimer)**: Every view and analysis displays the non-advice disclaimer.
- **OC-03 / OC-04 (Narrative & Actions)**: Risk narrative references >= 2 signals; action playbook contains 3–5 items.

---

## Success Criteria (Pass P0 & P1 Tests T-01 to T-28)
- [ ] Ingestion of complete, partial, zero-value, and negative-flow CSVs handles gracefully with correct error messages.
- [ ] Accurate calculation of DSO proxy `(AR / Revenue) * 365`, supplier HHI concentration, CCC `(DSO + DIO - DPO)`, aging buckets, and expense anomalies.
- [ ] 30/60/90-day trajectory generated deterministically and labeled appropriately (forecast vs heuristic).
- [ ] Single Gemini call generates schema-valid JSON with Financial Stress Index (0-100), risk-chain narrative, and 3-5 actions.
- [ ] UI displays Firebreak Meter, Signal Heatmap, Narrative Panel, Outlook Chart, Action Cards, and AI Disclaimer with zero layout overflow.
- [ ] One-click Demo Data Mode runs end-to-end on synthetic crisis and healthy scenarios with visible synthetic badges.
- [ ] End-to-end analysis completes within 30 seconds.

---
*Last updated: 2026-09-16 | FinSight PRD v1.1 Alignment*
