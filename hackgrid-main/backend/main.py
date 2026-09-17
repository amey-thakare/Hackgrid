"""
FastAPI Orchestration & REST API Server for FinSight Financial Firebreak.
Complies with PRD v1.1:
- Secure in-memory CSV upload endpoint with 10MB limit enforcement (DC-01, T-04).
- Rejects non-CSV files (T-03).
- Gracefully handles missing columns and partial data (DC-03, T-02).
- Zero raw data persisted to DB (DC-02).
- Single-prompt AI analysis via Gemini / structured fallback (AC-01, AC-04).
- Synthetic demo dataset mode (DC-04, T-22).
- Latency target < 30 seconds (AC-05, T-26).
"""

import io
import os
import time
from typing import Any, Dict, Optional
from fastapi import FastAPI, File, HTTPException, UploadFile, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response

from backend.ingestion import parse_csv_in_memory, IngestionError, MAX_FILE_SIZE_BYTES
from backend.evidence import build_evidence_matrix
from backend.gemini_client import analyze_with_gemini, AI_DISCLAIMER_TEXT, GEMINI_API_KEY, explain_simulation
from backend.db import save_analysis_run, get_recent_runs
from backend.sensitivity import (
    SensitivitySimulationRequest,
    run_sensitivity_simulation,
    ScenarioSimulationRequest,
    run_scenario_simulation
)
from backend.data_generator import generate_crisis_dataset
from backend.pdf_report import generate_report_pdf
from backend.benchmark_engine import load_benchmarks, compute_benchmark_deltas

app = FastAPI(
    title="FinSight Financial Firebreak API",
    description="Early-warning system detecting compounding combinations of financial stress signals.",
    version="1.1.0",
)

# CORS configuration for local development and production deployments
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "FinSight Financial Firebreak API",
        "version": "1.1.0",
        "gemini_api_configured": bool(GEMINI_API_KEY),
        "supabase_configured": bool(os.getenv("SUPABASE_URL") and os.getenv("SUPABASE_KEY")),
        "disclaimer": AI_DISCLAIMER_TEXT,
    }


def _run_full_analysis_pipeline(
    df, filename: str, is_synthetic: bool = False,
    missing_cols: list = None, industry: Optional[str] = None,
    entity_name: Optional[str] = None,
) -> Dict[str, Any]:
    """Execute deterministic financial computation -> single structured AI synthesis -> DB persistence."""
    start_time = time.time()

    # 1. Server-side deterministic Python computation & evidence matrix serialization
    evidence_bundle = build_evidence_matrix(
        df=df,
        dataset_name=filename,
        is_synthetic=is_synthetic,
        missing_cols=missing_cols or [],
    )

    evidence_payload = evidence_bundle["evidence_payload"]
    metrics = evidence_bundle["metrics"]
    outlook = evidence_bundle["outlook"]

    # 1b. Compute industry benchmark deltas if industry is specified (purely additive)
    benchmark_deltas = None
    if industry:
        benchmark_deltas = compute_benchmark_deltas(metrics, industry)
        if benchmark_deltas:
            # Inject benchmark context into the evidence payload sent to the AI
            evidence_payload["benchmark_context"] = benchmark_deltas["benchmark_narrative_context"]
            evidence_payload["benchmark_industry"] = industry

    # 2. Single structured generative AI reasoning step
    ai_result = analyze_with_gemini(evidence_payload)

    duration = round(time.time() - start_time, 3)

    # 3. Formulate unified presentation payload
    output = {
        "dataset_name": filename,
        "entity_name": entity_name or filename,
        "is_synthetic": is_synthetic,
        "processing_time_seconds": duration,
        "financial_stress_index": ai_result.get("financial_stress_index", evidence_bundle["computed_index"]),
        "severity_zone": ai_result.get("severity_zone", evidence_bundle["severity_zone"]),
        "metrics_summary": metrics,
        "outlook": outlook,
        "ai_outlook_trajectory": ai_result.get("outlook_30_60_90", []),
        "risk_chain_narrative": ai_result.get("risk_chain_narrative", ""),
        "signal_combinations": ai_result.get("signal_combinations", []),
        "preventive_actions": ai_result.get("preventive_actions", []),
        "missing_columns": missing_cols or [],
        "ai_disclaimer": ai_result.get("ai_disclaimer", AI_DISCLAIMER_TEXT),
        "engine": ai_result.get("engine", "deterministic_fallback_simulator"),
        "heuristic_thresholds_note": "Thresholds and zones are prototype design heuristics (PRD OC-05).",
    }

    # 3b. Attach benchmark deltas to the frontend output (additive, only if industry was set)
    if benchmark_deltas:
        output["benchmark_deltas"] = benchmark_deltas

    # 4. Save to Supabase (or SQLite fallback) - never saving raw CSV rows
    try:
        saved_record = save_analysis_run(output)
        output["id"] = saved_record.get("id")
        output["persisted_via"] = saved_record.get("persisted_via")
    except Exception as e:
        print(f"Warning: Persistence failed: {e}")

    return output


@app.post("/api/upload")
async def upload_financial_csv(
    file: UploadFile = File(...),
    industry: Optional[str] = Query(None, description="Industry sector for benchmark comparison"),
    entity_name: Optional[str] = Query(None, description="Name of the entity being analyzed"),
):
    """
    Ingests financial CSV in memory, computes evidence, and produces Firebreak analysis.
    Satisfies constraints DC-01, DC-02, DC-03, AC-01, AC-05.
    """
    # Validate extension (T-03)
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")

    file_bytes = await file.read()

    # Validate size limit 10MB (DC-01, T-04)
    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="File exceeds 10MB limit.")

    try:
        ingest_result = parse_csv_in_memory(file_bytes, file.filename)
    except IngestionError as ie:
        raise HTTPException(status_code=ie.status_code, detail=ie.message)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process CSV: {str(e)}")

    df = ingest_result["dataframe"]
    missing_cols = ingest_result["missing_columns"]

    # Run pipeline
    result = _run_full_analysis_pipeline(
        df=df,
        filename=file.filename,
        is_synthetic=False,
        missing_cols=missing_cols,
        industry=industry,
        entity_name=entity_name,
    )

    return JSONResponse(content=result)


@app.post("/api/demo/{scenario}")
def load_demo_scenario(
    scenario: str,
    industry: Optional[str] = Query(None, description="Industry sector for benchmark comparison"),
):
    """
    1-Click Synthetic Demo Loader (PRD Sec 5.5, T-22).
    Pre-loaded synthetic datasets clearly labeled synthetic (DC-04).
    """
    from backend.data_generator import get_synthetic_dataset

    try:
        df, meta = get_synthetic_dataset(scenario)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    result = _run_full_analysis_pipeline(
        df=df,
        filename=meta["filename"],
        is_synthetic=True,
        missing_cols=[],
        industry=industry,
        entity_name=meta["title"],
    )
    result["scenario_title"] = meta["title"]
    result["scenario_description"] = meta["description"]

    return JSONResponse(content=result)


@app.get("/api/benchmarks")
def get_benchmarks():
    """Return the full industry benchmark data for the frontend selector."""
    return load_benchmarks()


@app.get("/api/runs")
def list_analysis_runs(limit: int = Query(10, ge=1, le=50)):
    """Retrieve historical analysis runs from Supabase/SQLite."""
    runs = get_recent_runs(limit=limit)
    return {"runs": runs, "count": len(runs)}


@app.get("/api/runs/latest")
def get_latest_run():
    """Retrieve the single most recent analysis run."""
    runs = get_recent_runs(limit=1)
    if not runs:
        raise HTTPException(status_code=404, detail="No analysis runs found.")
    return runs[0]


@app.post("/api/simulate-sensitivity")
def simulate_sensitivity(req: SensitivitySimulationRequest):
    """
    Simulates operational working capital intervention adjustments (DSO, DIO, Supplier Concentration).
    """
    res = run_sensitivity_simulation(req)
    return JSONResponse(content=res)


@app.post("/api/simulate")
def simulate_scenario(req: ScenarioSimulationRequest):
    """
    Runs deterministic scoring for absolute value what-if scenarios.
    """
    res = run_scenario_simulation(req)
    return JSONResponse(content=res)


@app.post("/api/simulate/explain")
async def simulate_scenario_explain(request: Request):
    """
    Generates AI natural language explanation for simulated scenario.
    """
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body.")
    
    explanation = explain_simulation(payload)
    return JSONResponse(content={"explanation": explanation})


@app.get("/api/sample-csv")
def download_sample_csv():
    """Download standard enterprise sample CSV for testing ingestion."""
    from fastapi.responses import Response
    df = generate_crisis_dataset()
    csv_text = df.to_csv(index=False)
    return Response(
        content=csv_text,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=sample_financial_export.csv"}
    )


@app.post("/api/export/pdf")
async def export_pdf_report(request: Request):
    """Generate a professional multi-page PDF report from analysis results."""
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body.")

    if not payload.get("financial_stress_index") and payload.get("financial_stress_index") != 0:
        raise HTTPException(status_code=400, detail="Missing financial_stress_index in payload.")

    try:
        pdf_bytes = generate_report_pdf(payload)
    except Exception as e:
        print(f"PDF generation error: {e}")
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")

    entity_name = (payload.get("entity_name") or payload.get("dataset_name", "Report")).replace(" ", "_").replace(".csv", "")
    from datetime import datetime
    date_str = datetime.utcnow().strftime("%Y%m%d")
    filename = f"FinSight_Report_{entity_name}_{date_str}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
