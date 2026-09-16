"""
Financial Stress Signal Matrix and Evidence Serializer for FinSight Financial Firebreak.
PRD v1.1 Sec 5.3 & 11.1:
- Normalizes derived metric evidence.
- Attaches prototype heuristic threshold metadata.
- Identifies data sufficiency flags.
- Privacy boundary (DC-05): Only derived, non-transaction-level metrics are serialized.
"""

from typing import Any, Dict, List
import pandas as pd
from backend.metrics import compute_all_financial_metrics, HEURISTIC_THRESHOLDS
from backend.forecasting_service import generate_risk_outlook


def build_evidence_matrix(df: pd.DataFrame, dataset_name: str, is_synthetic: bool = False, missing_cols: List[str] = None) -> Dict[str, Any]:
    """
    Constructs the compact structured evidence matrix passed to the single-prompt generative AI.
    """
    metrics = compute_all_financial_metrics(df)
    outlook = generate_risk_outlook(df, metrics)

    rec = metrics["receivables_health"]
    pay = metrics["payment_behavior"]
    supp = metrics["supplier_concentration"]
    inv = metrics["inventory_efficiency"]
    exp = metrics["expense_anomalies"]
    cf = metrics["cash_flow_efficiency"]

    # Calculate deterministic base stress score (0-100) to assist model calibration
    # Weighting heuristic across 6 dimensions
    weights = {
        "receivables": 0.25,
        "cash_flow": 0.25,
        "supplier": 0.15,
        "inventory": 0.15,
        "payment": 0.10,
        "expenses": 0.10,
    }

    severity_scores = {"low": 15.0, "moderate": 45.0, "elevated": 75.0, "critical": 95.0, "unknown": 20.0}

    computed_index = (
        weights["receivables"] * severity_scores.get(rec.get("severity", "low"), 20.0) +
        weights["cash_flow"] * severity_scores.get(cf.get("severity", "low"), 20.0) +
        weights["supplier"] * severity_scores.get(supp.get("severity", "low"), 20.0) +
        weights["inventory"] * severity_scores.get(inv.get("severity", "low"), 20.0) +
        weights["payment"] * severity_scores.get(pay.get("severity", "low"), 20.0) +
        weights["expenses"] * severity_scores.get(exp.get("severity", "low"), 20.0)
    )

    computed_index = round(min(100.0, max(0.0, computed_index)), 1)

    if computed_index >= 80.0:
        severity_zone = "Critical"
    elif computed_index >= 60.0:
        severity_zone = "Elevated"
    elif computed_index >= 35.0:
        severity_zone = "Moderate"
    else:
        severity_zone = "Low"

    evidence_payload = {
        "metadata": {
            "dataset_name": dataset_name,
            "is_synthetic": is_synthetic,
            "row_count": len(df),
            "missing_columns": missing_cols or [],
            "has_sufficient_history": outlook.get("is_defensible_forecast", False),
            "prototype_baseline_stress_index": computed_index,
            "prototype_severity_zone": severity_zone,
        },
        "signal_dimensions": {
            "receivables_health": {
                "dso_proxy": rec.get("dso_proxy"),
                "dso_delta_90d": rec.get("dso_delta_90d"),
                "aging_pcts": rec.get("aging_buckets_pct"),
                "severity": rec.get("severity"),
                "status": rec.get("status"),
            },
            "payment_behavior": {
                "deterioration_score": pay.get("deterioration_score"),
                "late_bucket_pct": pay.get("late_bucket_pct"),
                "severity": pay.get("severity"),
            },
            "supplier_concentration": {
                "hhi": supp.get("hhi"),
                "max_supplier_share_pct": supp.get("max_supplier_share_pct"),
                "is_exposed": supp.get("is_exposed"),
                "severity": supp.get("severity"),
            },
            "inventory_efficiency": {
                "dio_days": inv.get("dio_days"),
                "turnover_ratio": inv.get("turnover_ratio"),
                "severity": inv.get("severity"),
                "status": inv.get("status"),
            },
            "expense_anomalies": {
                "anomaly_z_score": exp.get("anomaly_z_score"),
                "is_anomaly": exp.get("is_anomaly"),
                "severity": exp.get("severity"),
                "status": exp.get("status"),
            },
            "cash_flow_efficiency": {
                "ccc_days": cf.get("ccc_days"),
                "dpo_days": cf.get("dpo_days"),
                "ocf_ni_divergence_score": cf.get("ocf_ni_divergence_score"),
                "operating_cash_flow": cf.get("operating_cash_flow"),
                "net_income": cf.get("net_income"),
                "severity": cf.get("severity"),
            },
        },
        "outlook": outlook,
        "heuristic_thresholds": HEURISTIC_THRESHOLDS,
    }

    return {
        "evidence_payload": evidence_payload,
        "computed_index": computed_index,
        "severity_zone": severity_zone,
        "metrics": metrics,
        "outlook": outlook,
    }
