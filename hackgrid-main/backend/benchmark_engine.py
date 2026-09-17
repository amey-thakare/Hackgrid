"""
Industry Benchmark Comparison Engine for FinSight Financial Firebreak.
Loads sector-specific median values and computes deltas against user metrics.
Purely additive — if no industry is selected, the pipeline is unchanged.
"""

import json
import os
from typing import Any, Dict, Optional

BENCHMARKS_PATH = os.path.join(os.path.dirname(__file__), "benchmarks.json")


def load_benchmarks() -> Dict[str, Any]:
    """Load the full benchmarks.json file."""
    with open(BENCHMARKS_PATH, "r") as f:
        return json.load(f)


def get_sector_benchmarks(industry: str) -> Optional[Dict[str, Any]]:
    """Return benchmark medians for a specific industry, or None if not found."""
    benchmarks = load_benchmarks()
    return benchmarks.get(industry)


def _compute_delta(user_value: float, median_value: float) -> Dict[str, Any]:
    """Compute the percentage delta and direction for a single metric."""
    if median_value == 0:
        # Avoid division by zero; if median is 0 and user has a value, it's "above"
        if user_value > 0:
            return {
                "delta_pct": 100.0,
                "direction": "above",
            }
        return {
            "delta_pct": 0.0,
            "direction": "at",
        }

    delta_pct = round(((user_value - median_value) / abs(median_value)) * 100, 1)

    if delta_pct > 0:
        direction = "above"
    elif delta_pct < 0:
        direction = "below"
    else:
        direction = "at"

    return {
        "delta_pct": abs(delta_pct),
        "direction": direction,
    }


def compute_benchmark_deltas(
    metrics: Dict[str, Any],
    industry: str,
) -> Optional[Dict[str, Any]]:
    """
    Given the computed metrics and an industry name, return benchmark_context
    with per-signal deltas. Returns None if industry is invalid.
    """
    sector = get_sector_benchmarks(industry)
    if not sector:
        return None

    rec = metrics.get("receivables_health", {})
    cf = metrics.get("cash_flow_efficiency", {})
    inv = metrics.get("inventory_efficiency", {})
    supp = metrics.get("supplier_concentration", {})
    exp = metrics.get("expense_anomalies", {})

    user_dso = rec.get("dso_proxy") or 0
    user_dpo = cf.get("dpo_days") or 0
    user_dio = inv.get("dio_days") or 0
    user_ccc = cf.get("ccc_days") or 0
    user_hhi = supp.get("hhi") or 0
    user_z = exp.get("anomaly_z_score") or 0

    deltas = {
        "industry": industry,
        "signals": {
            "dso_days": {
                "user_value": round(user_dso, 1),
                "sector_median": sector["dso_days"],
                **_compute_delta(user_dso, sector["dso_days"]),
            },
            "dpo_days": {
                "user_value": round(user_dpo, 1),
                "sector_median": sector["dpo_days"],
                **_compute_delta(user_dpo, sector["dpo_days"]),
            },
            "inventory_days": {
                "user_value": round(user_dio, 1),
                "sector_median": sector["inventory_days"],
                **_compute_delta(user_dio, sector["inventory_days"]),
            },
            "cash_conversion_cycle": {
                "user_value": round(user_ccc, 1),
                "sector_median": sector["cash_conversion_cycle"],
                **_compute_delta(user_ccc, sector["cash_conversion_cycle"]),
            },
            "vendor_concentration_hhi": {
                "user_value": round(user_hhi),
                "sector_median": sector["vendor_concentration_hhi"],
                **_compute_delta(user_hhi, sector["vendor_concentration_hhi"]),
            },
            "expense_anomaly_baseline": {
                "user_value": round(user_z, 2),
                "sector_median": sector["expense_anomaly_baseline"],
                **_compute_delta(abs(user_z), sector["expense_anomaly_baseline"]),
            },
        },
    }

    # Generate human-readable summary strings for the AI prompt
    summaries = []
    signal_labels = {
        "dso_days": "DSO",
        "dpo_days": "DPO",
        "inventory_days": "DIO (Inventory Days)",
        "cash_conversion_cycle": "Cash Conversion Cycle",
        "vendor_concentration_hhi": "Vendor HHI",
        "expense_anomaly_baseline": "Expense Z-Score",
    }

    for key, info in deltas["signals"].items():
        label = signal_labels.get(key, key)
        if info["direction"] == "above":
            summaries.append(
                f"{label} is {info['delta_pct']:.0f}% above the {industry} sector median "
                f"({info['user_value']} vs median {info['sector_median']})"
            )
        elif info["direction"] == "below":
            summaries.append(
                f"{label} is {info['delta_pct']:.0f}% below the {industry} sector median "
                f"({info['user_value']} vs median {info['sector_median']})"
            )
        else:
            summaries.append(
                f"{label} is at the {industry} sector median ({info['sector_median']})"
            )

    deltas["benchmark_narrative_context"] = "; ".join(summaries)

    return deltas
