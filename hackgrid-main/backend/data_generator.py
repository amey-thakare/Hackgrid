"""
Synthetic Dataset Generator and Pre-loaded Scenarios for FinSight Financial Firebreak.
Complies with PRD Sec 5.5, DC-04, T-08, T-09, T-10, T-16.
Rule (DC-04): All demo data must be clearly labeled synthetic. No real company figures or names.
"""

import os
from typing import Dict, Tuple
import pandas as pd
import numpy as np

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
os.makedirs(DATA_DIR, exist_ok=True)


def generate_crisis_dataset() -> pd.DataFrame:
    """
    Generates a 12-month trailing enterprise dataset with compounding stress signals:
    - DSO deteriorating from 48 to 82 days.
    - Receivables aging past 60 days growing from 8% to 28%.
    - Supplier concentration high (top vendor 62% of payables).
    - DIO expanding from 55 to 94 days.
    - Operating Cash Flow diverging sharply from positive Net Income.
    """
    months = [f"2025-{m:02d}" for m in range(1, 13)]
    n = len(months)

    # Base financial trajectories
    revenue = [12000000 + i * 150000 for i in range(n)]
    cogs = [7800000 + i * 120000 for i in range(n)]

    # Receivables compounding stress
    dso_curve = np.linspace(48.0, 84.0, n)
    accounts_receivable = [(dso / 365.0) * rev for dso, rev in zip(dso_curve, revenue)]

    # Aging buckets (increasing late buckets)
    ar_0_30 = [ar * 0.45 for ar in accounts_receivable]
    ar_31_60 = [ar * 0.25 for ar in accounts_receivable]
    ar_61_90 = [ar * 0.18 for ar in accounts_receivable]
    ar_90_plus = [ar * 0.12 for ar in accounts_receivable]

    # Inventory stress (DIO rising)
    dio_curve = np.linspace(55.0, 95.0, n)
    inventory = [(dio / 365.0) * cg for dio, cg in zip(dio_curve, cogs)]

    # Payables and high supplier concentration
    accounts_payable = [c * 0.20 for c in cogs]
    supplier_concentration_pct = [62.0] * n  # 62% concentrated on top vendor

    # Cash flow divergence: positive net income, but negative/lagging OCF
    net_income = [950000 - i * 20000 for i in range(n)]
    operating_cash_flow = [800000 - i * 110000 for i in range(n)]  # Turns negative in late months

    # Non-core expense spike in latest quarter
    non_core_expenses = [120000 + (350000 if i >= 9 else 10000 * np.sin(i)) for i in range(n)]

    df = pd.DataFrame({
        "period": months,
        "revenue": revenue,
        "accounts_receivable": accounts_receivable,
        "ar_0_30": ar_0_30,
        "ar_31_60": ar_31_60,
        "ar_61_90": ar_61_90,
        "ar_90_plus": ar_90_plus,
        "cogs": cogs,
        "inventory": inventory,
        "accounts_payable": accounts_payable,
        "supplier_concentration_pct": supplier_concentration_pct,
        "operating_cash_flow": operating_cash_flow,
        "net_income": net_income,
        "non_core_expenses": non_core_expenses,
    })
    return df


def generate_healthy_dataset() -> pd.DataFrame:
    """
    Generates a 12-month healthy benchmark enterprise dataset:
    - Stable DSO around 35-38 days.
    - Low aging past 60 days (< 5%).
    - Diversified supplier base (top vendor 22%).
    - Lean inventory turnover with DIO around 42 days.
    - Strong operating cash flow matching net income.
    """
    months = [f"2025-{m:02d}" for m in range(1, 13)]
    n = len(months)

    revenue = [15000000 + i * 200000 for i in range(n)]
    cogs = [9000000 + i * 100000 for i in range(n)]

    dso_curve = [36.0 + np.sin(i) * 2.0 for i in range(n)]
    accounts_receivable = [(dso / 365.0) * rev for dso, rev in zip(dso_curve, revenue)]

    ar_0_30 = [ar * 0.75 for ar in accounts_receivable]
    ar_31_60 = [ar * 0.18 for ar in accounts_receivable]
    ar_61_90 = [ar * 0.05 for ar in accounts_receivable]
    ar_90_plus = [ar * 0.02 for ar in accounts_receivable]

    dio_curve = [42.0 + np.cos(i) * 2.0 for i in range(n)]
    inventory = [(dio / 365.0) * cg for dio, cg in zip(dio_curve, cogs)]

    accounts_payable = [c * 0.18 for c in cogs]
    supplier_concentration_pct = [22.0] * n

    net_income = [1800000 + i * 40000 for i in range(n)]
    operating_cash_flow = [1900000 + i * 45000 for i in range(n)]

    non_core_expenses = [80000 + (i % 3) * 5000 for i in range(n)]

    df = pd.DataFrame({
        "period": months,
        "revenue": revenue,
        "accounts_receivable": accounts_receivable,
        "ar_0_30": ar_0_30,
        "ar_31_60": ar_31_60,
        "ar_61_90": ar_61_90,
        "ar_90_plus": ar_90_plus,
        "cogs": cogs,
        "inventory": inventory,
        "accounts_payable": accounts_payable,
        "supplier_concentration_pct": supplier_concentration_pct,
        "operating_cash_flow": operating_cash_flow,
        "net_income": net_income,
        "non_core_expenses": non_core_expenses,
    })
    return df


def generate_80pct_supplier_dataset() -> pd.DataFrame:
    """Dataset with a dominant single supplier at 80% payables (Test T-08)."""
    df = generate_healthy_dataset()
    df["supplier_concentration_pct"] = 80.0
    return df


def generate_missing_columns_dataset() -> pd.DataFrame:
    """Dataset missing inventory and non_core_expenses (Test T-02)."""
    df = generate_crisis_dataset()
    return df.drop(columns=["inventory", "non_core_expenses"])


def generate_all_zero_dataset() -> pd.DataFrame:
    """Dataset with all zero values (Test T-05)."""
    df = generate_healthy_dataset()
    for col in df.columns:
        if col != "period":
            df[col] = 0.0
    return df


def generate_negative_flows_dataset() -> pd.DataFrame:
    """Dataset with negative operating cash flow and negative net income (Test T-06)."""
    df = generate_crisis_dataset()
    df["operating_cash_flow"] = -1500000.0
    df["net_income"] = -800000.0
    return df


def get_synthetic_dataset(scenario: str) -> Tuple[pd.DataFrame, Dict[str, str]]:
    """Retrieves synthetic scenario with metadata and synthetic badge text."""
    scenarios = {
        "crisis": {
            "title": "Compounding Stress Scenario (Synthetic Demo)",
            "description": "Synthetic multi-signal stress scenario exhibiting deteriorating DSO, supplier concentration, rising DIO, and cash-flow divergence.",
            "filename": "synthetic_crisis_scenario.csv",
            "generator": generate_crisis_dataset,
        },
        "healthy": {
            "title": "Healthy Benchmark Scenario (Synthetic Demo)",
            "description": "Synthetic benchmark showing stable working capital, prompt collections, diversified supply chain, and positive cash flow.",
            "filename": "synthetic_healthy_scenario.csv",
            "generator": generate_healthy_dataset,
        },
        "supplier_exposure": {
            "title": "80% Supplier Concentration Scenario (Synthetic Demo)",
            "description": "Synthetic test vector where one single supplier accounts for 80% of total accounts payable.",
            "filename": "synthetic_supplier_concentration_80.csv",
            "generator": generate_80pct_supplier_dataset,
        },
    }

    if scenario not in scenarios:
        raise ValueError(f"Unknown scenario '{scenario}'. Supported: {list(scenarios.keys())}")

    info = scenarios[scenario]
    df = info["generator"]()
    return df, info


# Save canned CSVs to backend/data/ for convenient ingestion tests
def init_canned_datasets():
    generate_crisis_dataset().to_csv(os.path.join(DATA_DIR, "synthetic_crisis_scenario.csv"), index=False)
    generate_healthy_dataset().to_csv(os.path.join(DATA_DIR, "synthetic_healthy_scenario.csv"), index=False)
    generate_80pct_supplier_dataset().to_csv(os.path.join(DATA_DIR, "synthetic_supplier_concentration_80.csv"), index=False)
    generate_missing_columns_dataset().to_csv(os.path.join(DATA_DIR, "test_missing_columns.csv"), index=False)
    generate_all_zero_dataset().to_csv(os.path.join(DATA_DIR, "test_all_zeros.csv"), index=False)
    generate_negative_flows_dataset().to_csv(os.path.join(DATA_DIR, "test_negative_flows.csv"), index=False)


init_canned_datasets()
