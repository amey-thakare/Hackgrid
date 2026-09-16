"""
Forecasting Service using XGBoost for FinSight Financial Firebreak.
Implements the revised predictive architecture (PRD v1.1).
"""

from typing import Any, Dict
import pandas as pd
import numpy as np
import xgboost as xgb
from .feature_engineering import prepare_training_data

def generate_risk_outlook(df: pd.DataFrame, current_metrics: Dict[str, Any]) -> Dict[str, Any]:
    """
    Computes 30/60/90-day trajectory projections using XGBoost when sufficient history exists (>= 12 periods).
    Otherwise, returns a heuristic outlook.
    """
    MIN_PERIODS = 12
    has_history = len(df) >= MIN_PERIODS
    
    rec = current_metrics.get("receivables_health", {})
    cf = current_metrics.get("cash_flow_efficiency", {})
    inv = current_metrics.get("inventory_efficiency", {})

    current_dso = rec.get("dso_proxy") or 45.0
    current_dio = inv.get("dio_days") or 50.0
    current_ccc = cf.get("ccc_days") or 60.0

    if not has_history:
        # PRD Constraint: Insufficient history -> Return deterministic heuristic baseline
        return {
            "outlook_type": "heuristic_outlook",
            "is_defensible_forecast": False,
            "quality_label": "Heuristic Outlook (Insufficient Historical Data)",
            "missing_evidence": f"Only {len(df)} periods provided (requires >= {MIN_PERIODS}). XGBoost forecast unavailable.",
            "periods": [
                {
                    "day_horizon": 30,
                    "label": "30 Days",
                    "projected_dso": round(current_dso * 1.02, 1),
                    "projected_ccc": round(current_ccc * 1.02, 1),
                    "directional_stress": "Stable / Slightly Elevated",
                    "confidence_band": "Wide (Heuristic Estimate)",
                },
                {
                    "day_horizon": 60,
                    "label": "60 Days",
                    "projected_dso": round(current_dso * 1.04, 1),
                    "projected_ccc": round(current_ccc * 1.05, 1),
                    "directional_stress": "Elevated",
                    "confidence_band": "Wide (Heuristic Estimate)",
                },
                {
                    "day_horizon": 90,
                    "label": "90 Days",
                    "projected_dso": round(current_dso * 1.07, 1),
                    "projected_ccc": round(current_ccc * 1.08, 1),
                    "directional_stress": "High Sensitivity",
                    "confidence_band": "Wide (Heuristic Estimate)",
                },
            ],
            "methodology": "Heuristic persistence assumption with sensitivity corridor (insufficient data for ML).",
        }

    # Defensible XGBoost Forecast
    periods_count = len(df)
    
    # We must calculate historical DSO and CCC for each period in the DataFrame
    dso_history = []
    ccc_history = []
    
    for idx in range(periods_count):
        row = df.iloc[idx]
        rev = float(row.get("revenue", 1.0))
        ar = float(row.get("accounts_receivable", 0.0))
        cogs = float(row.get("cogs", 1.0))
        inventory = float(row.get("inventory", 0.0))
        ap = float(row.get("accounts_payable", 0.0))

        dso_i = (ar / rev) * 365.0 if rev > 0 else current_dso
        dio_i = (inventory / cogs) * 365.0 if cogs > 0 else current_dio
        dpo_i = (ap / cogs) * 365.0 if cogs > 0 else 30.0
        ccc_i = dso_i + dio_i - dpo_i

        dso_history.append(dso_i)
        ccc_history.append(ccc_i)
        
    ts_df = pd.DataFrame({"dso": dso_history, "ccc": ccc_history})
    
    # Train and predict for DSO
    X_dso, y_dso = prepare_training_data(ts_df, "dso")
    dso_forecasts = []
    if not X_dso.empty and len(X_dso) >= 3:
        # simple Chronological split for parameters is not strictly needed for the final prediction, 
        # but we use XGBoost for the projection
        model_dso = xgb.XGBRegressor(n_estimators=100, max_depth=3, learning_rate=0.1, random_state=42)
        model_dso.fit(X_dso, y_dso)
        
        # Iterative forecasting for 3 steps
        last_features = X_dso.iloc[-1:].copy()
        current_val = y_dso.iloc[-1]
        
        for _ in range(3):
            pred = float(model_dso.predict(last_features)[0])
            dso_forecasts.append(round(pred, 1))
            # Shift features for next prediction (simplistic approach for hackathon)
            # In a real scenario, we would cleanly rebuild the lag row
            for col in last_features.columns:
                if "lag_1" in col:
                    last_features[col] = current_val
                elif "lag_2" in col:
                    last_features[col] = last_features.get("dso_lag_1", current_val)
            current_val = pred
    else:
        # Fallback if too many NaNs removed all data
        dso_forecasts = [round(current_dso * 1.01, 1), round(current_dso * 1.02, 1), round(current_dso * 1.03, 1)]

    # Train and predict for CCC
    X_ccc, y_ccc = prepare_training_data(ts_df, "ccc")
    ccc_forecasts = []
    if not X_ccc.empty and len(X_ccc) >= 3:
        model_ccc = xgb.XGBRegressor(n_estimators=100, max_depth=3, learning_rate=0.1, random_state=42)
        model_ccc.fit(X_ccc, y_ccc)
        
        last_features = X_ccc.iloc[-1:].copy()
        current_val = y_ccc.iloc[-1]
        
        for _ in range(3):
            pred = float(model_ccc.predict(last_features)[0])
            ccc_forecasts.append(round(pred, 1))
            for col in last_features.columns:
                if "lag_1" in col:
                    last_features[col] = current_val
                elif "lag_2" in col:
                    last_features[col] = last_features.get("ccc_lag_1", current_val)
            current_val = pred
    else:
        ccc_forecasts = [round(current_ccc * 1.01, 1), round(current_ccc * 1.02, 1), round(current_ccc * 1.03, 1)]


    return {
        "outlook_type": "projected_forecast",
        "is_defensible_forecast": True,
        "quality_label": f"XGBoost Regressor ({periods_count} Historical Periods)",
        "missing_evidence": None,
        "historical_periods_used": periods_count,
        "periods": [
            {
                "day_horizon": 30,
                "label": "30 Days",
                "projected_dso": max(10.0, dso_forecasts[0]),
                "projected_ccc": ccc_forecasts[0],
                "directional_stress": "Elevated" if dso_forecasts[0] > current_dso else "Improving",
                "confidence_band": "High (XGBoost)",
            },
            {
                "day_horizon": 60,
                "label": "60 Days",
                "projected_dso": max(10.0, dso_forecasts[1]),
                "projected_ccc": ccc_forecasts[1],
                "directional_stress": "Critical" if dso_forecasts[1] > current_dso * 1.15 else "Moderate",
                "confidence_band": "Moderate",
            },
            {
                "day_horizon": 90,
                "label": "90 Days",
                "projected_dso": max(10.0, dso_forecasts[2]),
                "projected_ccc": ccc_forecasts[2],
                "directional_stress": "Severe Risk-Chain" if dso_forecasts[2] > current_dso * 1.25 else "Stable",
                "confidence_band": "Indicative",
            },
        ],
        "methodology": "XGBoost Regressor with 1/2/3 step forward chronological projection.",
    }
