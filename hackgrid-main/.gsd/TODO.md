# TODO.md — Active Task List

## Immediate (Phase 1: Foundation & Financial Computation Engine)
- [ ] Set up `backend/` directory with `requirements.txt` (FastAPI, uvicorn, pandas, numpy, scikit-learn, anthropic, pydantic)
- [ ] Implement `backend/ingestion.py` for CSV parsing, 10MB file size checks, and partial schema handling
- [ ] Implement `backend/metrics.py` for 6 financial dimensions:
  - Receivables Health: simplified DSO proxy `(AR / Revenue) * 365`, aging buckets, 90-day delta
  - Payment Behavior: deterioration among customer groups
  - Supplier Concentration: HHI calculation on payables
  - Inventory Efficiency: DIO `(Inventory / COGS) * 365`, inventory turnover
  - Expense Anomalies: non-core expense anomaly Z-scores vs baseline
  - Cash-Flow Efficiency: CCC `(DSO + DIO - DPO)`, operating cash flow vs net income divergence
- [ ] Implement `backend/forecasting.py` for 30/60/90-day trend outlook + heuristic fallback
- [ ] Create automated unit tests for `metrics.py` and `forecasting.py` (matching T-01 to T-11)

## Upcoming (Phase 2: AI Intelligence Layer)
- [ ] Implement `backend/claude_client.py` for single-prompt JSON analysis
- [ ] Implement schema validation and fallback deterministic generator
- [ ] Implement API failure error handling (T-17)

## Upcoming (Phase 3: Synthetic Data & Benchmarks)
- [ ] Generate synthetic demo datasets (Crisis scenario, Healthy scenario, Edge cases)

## Upcoming (Phase 4: Executive Analyst Dashboard)
- [ ] Initialize React + Vite + TypeScript frontend in `frontend/`
- [ ] Build Firebreak Meter, Signal Heatmap, Narrative Panel, Outlook Chart, Action Cards
- [ ] 1-Click Demo Data loader with synthetic badge and AI disclaimer

## Upcoming (Phase 5: Verification & Delivery)
- [ ] Run full test suite T-01 to T-28
- [ ] End-to-end timing validation (<30s)
