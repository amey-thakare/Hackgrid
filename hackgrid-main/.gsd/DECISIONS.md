# DECISIONS.md — Architecture Decision Records

> **Purpose**: Log significant technical and architectural decisions for FinSight Financial Firebreak.

---

## [DECISION-001] Strict Single-Prompt Architecture for Generative AI

**Date**: 2026-09-16
**Status**: Accepted

### Context
Financial analytics systems often suffer from unpredictable tool loops, high latency, and compounding hallucinations when using multi-step agentic LLM workflows. The competition constraints and PRD v1.1 strictly dictate a single-prompt architecture.

### Decision
A single structured Claude prompt (`claude-sonnet-4-6` or fallback) will be called per analysis run. The prompt takes only pre-computed, normalized evidence aggregates, and returns a schema-valid JSON object containing the Financial Stress Index, interacting signal combinations, risk-chain narrative, 30/60/90 outlook, and 3-5 preventive actions.

### Rationale
- Completely auditable and repeatable.
- Guaranteed latency within the <30s target.
- Preserves external data privacy boundaries.

### Consequences
- All numerical and forecasting operations must be implemented deterministically in Python before invoking the LLM.

---

## [DECISION-002] Server-Side Python Financial Metric & Forecasting Layer

**Date**: 2026-09-16
**Status**: Accepted

### Context
LLMs cannot reliably perform complex mathematical calculations such as HHI concentration indexes, Cash Conversion Cycles (CCC), or time-series ARIMA/Holt-Winters forecasting without hallucinating numerical values.

### Decision
All 6 signal dimensions (DSO proxy, customer payment trends, supplier HHI, DIO/inventory turnover, expense anomaly Z-scores, CCC and cash flow divergence) and 30/60/90-day time-series forecasting will be calculated purely in Python using Pandas, NumPy, and Scikit-learn.

### Rationale
- Mathematical precision and audit-grade reproducibility.
- Clean separation between deterministic computation and qualitative risk-chain reasoning.

---

## [DECISION-003] Ephemeral In-Memory CSV Parsing (No Raw Data Persistence)

**Date**: 2026-09-16
**Status**: Accepted

### Context
Enterprise financial teams demand strict privacy. Storing raw ERP records or customer/vendor identities in a web database poses severe data privacy and compliance risks.

### Decision
Uploaded CSV files (max 10MB) will be parsed directly in memory. Only derived numerical aggregates, computed scores, and session metadata will ever be stored in SQLite. Raw transaction rows are immediately purged from memory.

### Rationale
- Fully satisfies constraints DC-02 and DC-05.
- Eliminates GDPR/HIPAA/SOX compliance friction in prototype evaluation.

---

## [DECISION-004] Transition from Claude API to Gemini API with Structured JSON Output

**Date**: 2026-09-16
**Status**: Accepted

### Context
The user requested pivoting from the Claude API to the Google Gemini API (`gemini-2.5-flash` / `gemini-1.5-pro`). The core product requirement remains a strict single-prompt reasoning architecture that generates schema-valid JSON without prompt chaining or autonomous loops.

### Decision
Utilize the Google Gemini API with native structured JSON output (`response_mime_type="application/json"` and Pydantic schema enforcement). The single-prompt contract is strictly preserved: one prompt per analysis run receiving derived metric aggregates and returning the Financial Stress Index, risk-chain narrative, 30/60/90 outlook, and 3-5 preventive actions. Deterministic offline fallback is preserved when the API key is not configured.

### Rationale
- Fast response latency well under the 30-second target (`AC-05`).
- Native JSON schema enforcement guarantees structured outputs without regex scraping.

---

## [DECISION-005] Supabase for Analysis Runs Persistence with Local Fallback

**Date**: 2026-09-16
**Status**: Accepted

### Context
The user requested using Supabase for persistence instead of local SQLite. The PRD specifies in Section 6.4 that Supabase is the cloud database for analysis runs and results.

### Decision
Implement persistence for analysis runs, derived metric summaries, and session metadata using Supabase (`supabase-py` client or direct REST API via `httpx`). A fallback SQLite layer is included so that test harnesses and offline development operate without requiring an active Supabase network connection.

### Rationale
- Aligns with production cloud requirements while maintaining zero-friction local testing.
- Preserves the privacy constraint (`DC-02`): only derived metrics and model outputs are persisted, never raw CSV lines.
