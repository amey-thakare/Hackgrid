"""
Database persistence layer for FinSight Financial Firebreak.
Supports Supabase cloud persistence with automatic SQLite fallback for local testing.
Privacy Guardrail (DC-02): Only stores derived metrics, analysis outcomes, and run metadata.
Raw CSV data is NEVER persisted.
"""

import os
import json
import sqlite3
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")

LOCAL_DB_PATH = os.path.join(os.path.dirname(__file__), "financial_firebreak.db")


def _init_sqlite_db():
    conn = sqlite3.connect(LOCAL_DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS analysis_runs (
            id TEXT PRIMARY KEY,
            created_at TEXT NOT NULL,
            dataset_name TEXT NOT NULL,
            is_synthetic INTEGER NOT NULL,
            financial_stress_index REAL NOT NULL,
            severity_zone TEXT NOT NULL,
            metrics_summary TEXT NOT NULL,
            risk_chain_narrative TEXT NOT NULL,
            signal_combinations TEXT NOT NULL,
            outlook TEXT NOT NULL,
            preventive_actions TEXT NOT NULL
        )
    """)
    # Safely add new columns for historical trend tracking if they don't exist
    for col, col_type in [("entity_name", "TEXT"), ("signal_scores", "TEXT"), ("top_signals", "TEXT")]:
        try:
            cursor.execute(f"ALTER TABLE analysis_runs ADD COLUMN {col} {col_type}")
        except sqlite3.OperationalError:
            pass  # Column already exists
    conn.commit()
    conn.close()


_init_sqlite_db()


def _get_supabase_client():
    if not SUPABASE_URL or not SUPABASE_KEY:
        return None
    try:
        from supabase import create_client
        return create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        print(f"Failed to initialize Supabase client: {e}. Falling back to SQLite.")
        return None


def save_analysis_run(run_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Persists derived run metrics and generative AI results.
    Does NOT accept or persist raw CSV transactions.
    """
    run_id = run_data.get("id") or str(uuid.uuid4())
    created_at = run_data.get("created_at") or datetime.now(timezone.utc).isoformat()
    dataset_name = run_data.get("dataset_name", "Uploaded Data")
    entity_name = run_data.get("entity_name") or dataset_name
    is_synthetic = 1 if run_data.get("is_synthetic", False) else 0
    stress_index = float(run_data.get("financial_stress_index", 0.0))
    severity_zone = str(run_data.get("severity_zone", "Moderate"))
    
    metrics = run_data.get("metrics_summary", {})
    metrics_summary = json.dumps(metrics)
    
    # Extract signal_scores from the 6 core metrics
    signal_scores_dict = {
        "receivables": float(metrics.get("receivables_health", {}).get("severity_score", 0)),
        "payment_behavior": float(metrics.get("payment_behavior", {}).get("severity_score", 0)),
        "vendor_concentration": float(metrics.get("supplier_concentration", {}).get("severity_score", 0)),
        "inventory": float(metrics.get("inventory_efficiency", {}).get("severity_score", 0)),
        "expenses": float(metrics.get("expense_anomalies", {}).get("severity_score", 0)),
        "cash_flow": float(metrics.get("cash_flow_efficiency", {}).get("severity_score", 0))
    }
    
    # Compute top 2 flagged signals
    sorted_signals = sorted(signal_scores_dict.items(), key=lambda x: x[1], reverse=True)
    top_signals_list = [k for k, v in sorted_signals[:2] if v > 0]
    
    narrative = str(run_data.get("risk_chain_narrative", ""))
    signal_combinations = json.dumps(run_data.get("signal_combinations", []))
    outlook = json.dumps(run_data.get("outlook", {}))
    actions = json.dumps(run_data.get("preventive_actions", []))

    record = {
        "id": run_id,
        "created_at": created_at,
        "dataset_name": dataset_name,
        "entity_name": entity_name,
        "is_synthetic": is_synthetic,
        "financial_stress_index": stress_index,
        "severity_zone": severity_zone,
        "metrics_summary": metrics_summary,
        "risk_chain_narrative": narrative,
        "signal_combinations": signal_combinations,
        "outlook": outlook,
        "preventive_actions": actions,
        "signal_scores": json.dumps(signal_scores_dict),
        "top_signals": json.dumps(top_signals_list),
    }

    supabase = _get_supabase_client()
    if supabase:
        try:
            supabase.table("analysis_runs").upsert(record).execute()
            record["persisted_via"] = "supabase"
            return record
        except Exception as e:
            print(f"Supabase upsert failed: {e}. Falling back to local SQLite.")

    # SQLite fallback
    conn = sqlite3.connect(LOCAL_DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT OR REPLACE INTO analysis_runs (
            id, created_at, dataset_name, entity_name, is_synthetic, financial_stress_index,
            severity_zone, metrics_summary, risk_chain_narrative,
            signal_combinations, outlook, preventive_actions, signal_scores, top_signals
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        run_id, created_at, dataset_name, entity_name, is_synthetic, stress_index,
        severity_zone, metrics_summary, narrative,
        signal_combinations, outlook, actions, record["signal_scores"], record["top_signals"]
    ))
    conn.commit()
    conn.close()

    record["persisted_via"] = "sqlite"
    return record


def get_recent_runs(limit: int = 10) -> List[Dict[str, Any]]:
    """Retrieve recent analysis runs."""
    supabase = _get_supabase_client()
    if supabase:
        try:
            res = supabase.table("analysis_runs").select("*").order("created_at", desc=True).limit(limit).execute()
            if res.data:
                for r in res.data:
                    for field in ["metrics_summary", "signal_combinations", "outlook", "preventive_actions"]:
                        if isinstance(r.get(field), str):
                            try:
                                r[field] = json.loads(r[field])
                            except Exception:
                                pass
                return res.data
        except Exception as e:
            print(f"Supabase query failed: {e}. Reading from SQLite.")

    conn = sqlite3.connect(LOCAL_DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM analysis_runs ORDER BY created_at DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    results = []
    for row in rows:
        d = dict(row)
        for field in ["metrics_summary", "signal_combinations", "outlook", "preventive_actions", "signal_scores", "top_signals"]:
            try:
                if d.get(field):
                    d[field] = json.loads(d[field])
            except Exception:
                pass
        results.append(d)
    conn.close()
    return results
