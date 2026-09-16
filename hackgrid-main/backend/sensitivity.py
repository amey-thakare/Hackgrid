"""
What-If Sensitivity Simulation Engine for FinSight Financial Firebreak.
Enables finance executives to test the impact of operational interventions:
- Accelerating collections (reducing DSO)
- Leaner inventory buffers (reducing DIO)
- Diversifying the supply base (reducing dominant vendor concentration)

Calculates:
- Adjusted Cash Conversion Cycle (CCC)
- Estimated working capital freed up / locked up
- Real-time recalibrated prototype Financial Stress Index (0-100)
"""

from typing import Any, Dict
from pydantic import BaseModel, Field
from backend.metrics import HEURISTIC_THRESHOLDS, _severity_label


class SensitivitySimulationRequest(BaseModel):
    baseline_stress_index: float = Field(ge=0.0, le=100.0)
    baseline_dso: float = Field(ge=0.0)
    baseline_dio: float = Field(ge=0.0)
    baseline_dpo: float = Field(ge=0.0)
    baseline_supplier_max_share: float = Field(ge=0.0, le=100.0)
    annual_revenue: float = Field(default=12000000.0)
    annual_cogs: float = Field(default=7800000.0)
    
    # User adjustments
    target_dso_delta: float = Field(default=0.0, description="Shift in DSO days (e.g. -15 to +15)")
    target_dio_delta: float = Field(default=0.0, description="Shift in DIO days (e.g. -15 to +15)")
    target_supplier_max_share: float = Field(default=35.0, ge=5.0, le=100.0, description="Target dominant supplier concentration %")


def run_sensitivity_simulation(req: SensitivitySimulationRequest) -> Dict[str, Any]:
    """
    Simulates operational working capital shifts and outputs recalculated metrics.
    """
    # 1. Adjusted operational metrics
    simulated_dso = max(10.0, round(req.baseline_dso + req.target_dso_delta, 1))
    simulated_dio = max(10.0, round(req.baseline_dio + req.target_dio_delta, 1))
    simulated_dpo = req.baseline_dpo
    simulated_ccc = round(simulated_dso + simulated_dio - simulated_dpo, 1)

    # 2. Working capital impact
    # Cash released when DSO decreases: each day saved = revenue / 365
    daily_revenue = req.annual_revenue / 365.0
    daily_cogs = req.annual_cogs / 365.0
    
    cash_freed_receivables = round(-req.target_dso_delta * daily_revenue, 0)
    cash_freed_inventory = round(-req.target_dio_delta * daily_cogs, 0)
    total_cash_impact = cash_freed_receivables + cash_freed_inventory

    # 3. Severities
    dso_sev = _severity_label(simulated_dso, HEURISTIC_THRESHOLDS["dso_days"])
    dio_sev = _severity_label(simulated_dio, HEURISTIC_THRESHOLDS["dio_days"])
    ccc_sev = _severity_label(simulated_ccc, HEURISTIC_THRESHOLDS["ccc_days"])
    supp_sev = _severity_label(req.target_supplier_max_share, HEURISTIC_THRESHOLDS["supplier_max_share_pct"])

    severity_scores = {"low": 15.0, "moderate": 45.0, "elevated": 75.0, "critical": 95.0}

    # Weighting adjustments
    simulated_index = (
        0.30 * severity_scores.get(dso_sev, 20.0) +
        0.30 * severity_scores.get(ccc_sev, 20.0) +
        0.20 * severity_scores.get(supp_sev, 20.0) +
        0.20 * severity_scores.get(dio_sev, 20.0)
    )
    simulated_index = round(min(100.0, max(0.0, simulated_index)), 1)

    index_delta = round(simulated_index - req.baseline_stress_index, 1)

    if simulated_index >= 80.0:
        simulated_zone = "Critical"
    elif simulated_index >= 60.0:
        simulated_zone = "Elevated"
    elif simulated_index >= 35.0:
        simulated_zone = "Moderate"
    else:
        simulated_zone = "Low"

    # Synthesis narrative
    if index_delta < 0:
        impact_summary = (
            f"Simulated intervention reduces compound working capital stress by {abs(index_delta)} points "
            f"(from {req.baseline_stress_index:.1f} to {simulated_index:.1f}, entering {simulated_zone} Zone). "
            f"Estimated working capital freed up: approximately ${abs(total_cash_impact):,.0f} "
            f"through faster collections and leaner inventory cycles."
        )
    elif index_delta > 0:
        impact_summary = (
            f"Simulated deterioration increases compound stress by {index_delta} points "
            f"(from {req.baseline_stress_index:.1f} to {simulated_index:.1f}, entering {simulated_zone} Zone). "
            f"Estimated liquidity locked up: approximately ${abs(total_cash_impact):,.0f}."
        )
    else:
        impact_summary = "Simulated parameters reflect current baseline conditions."

    return {
        "baseline": {
            "stress_index": req.baseline_stress_index,
            "dso_days": req.baseline_dso,
            "dio_days": req.baseline_dio,
            "ccc_days": round(req.baseline_dso + req.baseline_dio - req.baseline_dpo, 1),
            "supplier_share_pct": req.baseline_supplier_max_share,
        },
        "simulated": {
            "stress_index": simulated_index,
            "severity_zone": simulated_zone,
            "index_delta": index_delta,
            "dso_days": simulated_dso,
            "dio_days": simulated_dio,
            "ccc_days": simulated_ccc,
            "supplier_share_pct": req.target_supplier_max_share,
            "estimated_working_capital_freed": total_cash_impact,
            "receivables_cash_impact": cash_freed_receivables,
            "inventory_cash_impact": cash_freed_inventory,
        },
        "impact_summary": impact_summary,
    }
