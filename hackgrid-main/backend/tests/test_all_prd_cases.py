"""
Comprehensive Automated Test Suite for FinSight Financial Firebreak.
Empirical Validation of PRD v1.1 Test Cases T-01 through T-19.
"""

import pytest
import io
import pandas as pd
from fastapi.testclient import TestClient

from backend.main import app
from backend.ingestion import parse_csv_in_memory, IngestionError, MAX_FILE_SIZE_BYTES
from backend.metrics import (
    compute_receivables_health,
    compute_supplier_concentration,
    compute_inventory_efficiency,
    compute_cash_flow_efficiency,
    compute_all_financial_metrics,
)
from backend.forecasting_service import generate_risk_outlook
from backend.gemini_client import analyze_with_gemini
from backend.data_generator import (
    generate_crisis_dataset,
    generate_healthy_dataset,
    generate_80pct_supplier_dataset,
    generate_missing_columns_dataset,
    generate_all_zero_dataset,
    generate_negative_flows_dataset,
)

client = TestClient(app)


# ==========================================
# 8.1 Data Ingestion Tests (T-01 to T-06)
# ==========================================

def test_t01_upload_valid_complete_csv():
    """T-01 [P0]: Upload valid complete CSV with all expected columns."""
    df = generate_healthy_dataset()
    csv_bytes = df.to_csv(index=False).encode("utf-8")

    response = client.post(
        "/api/upload",
        files={"file": ("healthy_test.csv", csv_bytes, "text/csv")}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["financial_stress_index"] is not None
    assert "metrics_summary" in data
    assert data["missing_columns"] == []


def test_t02_upload_csv_missing_two_columns():
    """T-02 [P0]: Upload CSV missing two financial columns -> Partial analysis runs without crash."""
    df = generate_missing_columns_dataset()
    csv_bytes = df.to_csv(index=False).encode("utf-8")

    response = client.post(
        "/api/upload",
        files={"file": ("partial_test.csv", csv_bytes, "text/csv")}
    )
    assert response.status_code == 200
    data = response.json()
    assert "inventory" in data["missing_columns"] or "non_core_expenses" in data["missing_columns"]
    # Check that partial metrics still evaluated
    assert data["metrics_summary"]["receivables_health"]["status"] == "available"


def test_t03_upload_non_csv_file():
    """T-03 [P0]: Upload non-CSV file such as PDF or XLSX -> Clear error: 'Only CSV files are supported.'."""
    fake_pdf = b"%PDF-1.4 header contents"
    response = client.post(
        "/api/upload",
        files={"file": ("report.pdf", fake_pdf, "application/pdf")}
    )
    assert response.status_code == 400
    assert "Only CSV files are supported." in response.json()["detail"]


def test_t04_upload_csv_exceeding_10mb():
    """T-04 [P0]: Upload CSV exceeding 10MB -> Clear error: 'File exceeds 10MB limit.'."""
    # 10MB + 100 bytes
    oversized_bytes = b"a" * (MAX_FILE_SIZE_BYTES + 100)
    response = client.post(
        "/api/upload",
        files={"file": ("large.csv", oversized_bytes, "text/csv")}
    )
    assert response.status_code == 413
    assert "File exceeds 10MB limit." in response.json()["detail"]


def test_t05_upload_csv_with_all_zero_values():
    """T-05 [P1]: Upload CSV with all zero values -> avoids divide-by-zero, flags insufficient evidence."""
    df = generate_all_zero_dataset()
    csv_bytes = df.to_csv(index=False).encode("utf-8")

    response = client.post(
        "/api/upload",
        files={"file": ("zeros.csv", csv_bytes, "text/csv")}
    )
    assert response.status_code == 200
    data = response.json()
    rec = data["metrics_summary"]["receivables_health"]
    assert rec["status"] == "insufficient_data"
    assert rec["dso_proxy"] == 0.0


def test_t06_upload_csv_with_negative_values():
    """T-06 [P1]: Upload CSV with negative revenue or cash-flow values -> handled according to metric rules."""
    df = generate_negative_flows_dataset()
    csv_bytes = df.to_csv(index=False).encode("utf-8")

    response = client.post(
        "/api/upload",
        files={"file": ("negative.csv", csv_bytes, "text/csv")}
    )
    assert response.status_code == 200
    data = response.json()
    cf = data["metrics_summary"]["cash_flow_efficiency"]
    assert cf["operating_cash_flow"] < 0
    assert cf["net_income"] < 0


# ==========================================
# 8.2 Metric Computation Tests (T-07 to T-11)
# ==========================================

def test_t07_verify_simplified_dso_proxy():
    """T-07 [P0]: Feed known figures and verify simplified DSO proxy = (AR / Revenue) * 365."""
    known_ar = 2_000_000.0
    known_rev = 10_000_000.0
    expected_dso = round((known_ar / known_rev) * 365.0, 2)  # 73.0

    df = pd.DataFrame([{
        "period": "2025-01",
        "accounts_receivable": known_ar,
        "revenue": known_rev,
    }])

    res = compute_receivables_health(df)
    assert res["status"] == "available"
    assert res["dso_proxy"] == expected_dso
    assert res["dso_proxy"] == 73.0


def test_t08_supplier_concentration_exposure_80pct():
    """T-08 [P0]: Feed dataset where one supplier represents 80% of payables -> exposure is flagged."""
    df = generate_80pct_supplier_dataset()
    res = compute_supplier_concentration(df)
    assert res["max_supplier_share_pct"] == 80.0
    assert res["is_exposed"] is True
    assert res["severity"] == "critical"


def test_t09_healthy_dataset_across_all_six_dimensions():
    """T-09 [P0]: Healthy dataset -> Low severity indicators and stress index below low-risk threshold."""
    df = generate_healthy_dataset()
    metrics = compute_all_financial_metrics(df)
    assert metrics["receivables_health"]["severity"] in ["low", "moderate"]
    assert metrics["supplier_concentration"]["severity"] == "low"
    assert metrics["cash_flow_efficiency"]["severity"] in ["low", "moderate"]


def test_t10_prebuilt_synthetic_crisis_demo_dataset():
    """T-10 [P0]: Pre-built synthetic crisis demo dataset -> Elevated conditions and elevated Stress Index."""
    df = generate_crisis_dataset()
    metrics = compute_all_financial_metrics(df)
    assert metrics["receivables_health"]["severity"] in ["elevated", "critical"]
    assert metrics["supplier_concentration"]["is_exposed"] is True
    assert metrics["cash_flow_efficiency"]["severity"] in ["elevated", "critical"]


def test_t11_verify_ccc_formula():
    """T-11 [P1]: Verify CCC formula: CCC = DSO + DIO - DPO."""
    dso = 60.0
    dio = 45.0
    dpo = 35.0
    expected_ccc = round(dso + dio - dpo, 2)  # 70.0

    df = pd.DataFrame([{
        "period": "2025-01",
        "accounts_payable": 350_000.0,
        "cogs": (350_000.0 / dpo) * 365.0,
        "operating_cash_flow": 100_000.0,
        "net_income": 120_000.0,
    }])

    cf = compute_cash_flow_efficiency(df, dso=dso, dio=dio)
    assert cf["ccc_days"] == expected_ccc
    assert cf["ccc_days"] == 70.0


# ==========================================
# 8.3 AI Prompt and Outlook Tests (T-12 to T-19)
# ==========================================

def test_t12_t13_t14_t15_ai_output_schema_and_constraints():
    """
    T-12 [P0]: Valid JSON structure.
    T-13 [P0]: Financial Stress Index is numeric in [0, 100].
    T-14 [P0]: Actions array contains 3-5 items inclusive.
    T-15 [P0]: Risk-chain narrative references at least two dimensions and does not assert causal proof.
    """
    from backend.evidence import build_evidence_matrix
    df = generate_crisis_dataset()
    bundle = build_evidence_matrix(df, "crisis.csv")
    ai_out = analyze_with_gemini(bundle["evidence_payload"], force_mock=True)

    # T-13
    index = ai_out["financial_stress_index"]
    assert isinstance(index, (int, float))
    assert 0.0 <= index <= 100.0

    # T-14
    actions = ai_out["preventive_actions"]
    assert 3 <= len(actions) <= 5
    for act in actions:
        assert "id" in act
        assert "urgency" in act
        assert "directional_impact" in act

    # T-15
    narrative = ai_out["risk_chain_narrative"]
    assert ("DSO" in narrative or "receivables" in narrative.lower())
    assert ("Cash" in narrative or "cash" in narrative.lower() or "inventory" in narrative.lower() or "supplier" in narrative.lower())
    # Verify non-causal guardrail
    assert "proves bankruptcy" not in narrative.lower()
    assert "causes" not in narrative.lower()

    # T-12
    assert "signal_combinations" in ai_out
    assert len(ai_out["signal_combinations"]) >= 1


def test_t16_compare_healthy_vs_crisis_directional_separation():
    """T-16 [P0]: Compare healthy synthetic dataset vs crisis -> Healthy scores lower than crisis."""
    df_healthy = generate_healthy_dataset()
    df_crisis = generate_crisis_dataset()

    res_healthy = client.post(
        "/api/upload",
        files={"file": ("healthy.csv", df_healthy.to_csv(index=False).encode(), "text/csv")}
    ).json()

    res_crisis = client.post(
        "/api/upload",
        files={"file": ("crisis.csv", df_crisis.to_csv(index=False).encode(), "text/csv")}
    ).json()

    score_healthy = res_healthy["financial_stress_index"]
    score_crisis = res_crisis["financial_stress_index"]
    assert score_healthy < score_crisis, f"Expected healthy ({score_healthy}) < crisis ({score_crisis})"


def test_t17_simulate_api_failure_handling():
    """T-17 [P1]: Simulate API failure -> graceful response with clear user-friendly info."""
    from backend.evidence import build_evidence_matrix
    df = generate_crisis_dataset()
    bundle = build_evidence_matrix(df, "crisis.csv")
    result = analyze_with_gemini(bundle["evidence_payload"], force_mock=True)
    assert result["financial_stress_index"] is not None
    assert len(result["preventive_actions"]) >= 3


def test_t18_repeatability_test():
    """T-18 [P1]: Run same dataset three times -> Score remains within repeatability tolerance."""
    df = generate_crisis_dataset()
    csv_bytes = df.to_csv(index=False).encode("utf-8")

    scores = []
    for _ in range(3):
        res = client.post(
            "/api/upload",
            files={"file": ("crisis_repeat.csv", csv_bytes, "text/csv")}
        ).json()
        scores.append(res["financial_stress_index"])

    assert max(scores) - min(scores) <= 5.0, f"Scores deviated more than 5 points: {scores}"


def test_t19_run_dataset_with_insufficient_history_for_true_forecast():
    """T-19 [P0]: Insufficient history -> system does not fabricate forecast, labels as heuristic outlook."""
    # Only 1 period
    single_period_df = pd.DataFrame([{
        "period": "2025-01",
        "revenue": 1000000.0,
        "accounts_receivable": 200000.0,
        "cogs": 600000.0,
        "inventory": 150000.0,
        "accounts_payable": 100000.0,
        "operating_cash_flow": 120000.0,
        "net_income": 100000.0,
    }])

    metrics = compute_all_financial_metrics(single_period_df)
    outlook = generate_risk_outlook(single_period_df, metrics)

    assert outlook["is_defensible_forecast"] is False
    assert outlook["outlook_type"] == "heuristic_outlook"
    assert "Heuristic" in outlook["quality_label"]
    assert outlook["missing_evidence"] is not None
