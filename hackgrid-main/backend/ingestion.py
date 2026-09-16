"""
In-memory CSV Ingestion & Validation Engine for FinSight Financial Firebreak.

Constraints:
- DC-01: Reject files exceeding 10MB with "File exceeds 10MB limit."
- T-03: Reject non-CSV with "Only CSV files are supported."
- DC-02: Never persist raw CSV records. In-memory processing only.
- DC-03 & T-02: Graceful missing column handling; partial analysis proceeds without crashing.
- T-05 & T-06: Zero-value and negative-value resilience.
"""

import io
from typing import Any, Dict, List, Optional, Tuple
import pandas as pd


MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

# Canonical column names and common aliases
COLUMN_ALIASES: Dict[str, List[str]] = {
    "period": ["period", "date", "month", "quarter", "timestamp"],
    "revenue": ["revenue", "sales", "total_revenue", "gross_revenue"],
    "accounts_receivable": ["accounts_receivable", "ar", "receivables", "trade_receivables"],
    "ar_0_30": ["ar_0_30", "receivables_0_30", "aging_0_30", "current_ar"],
    "ar_31_60": ["ar_31_60", "receivables_31_60", "aging_31_60"],
    "ar_61_90": ["ar_61_90", "receivables_61_90", "aging_61_90"],
    "ar_90_plus": ["ar_90_plus", "receivables_90_plus", "aging_90_plus", "ar_over_90"],
    "cogs": ["cogs", "cost_of_goods_sold", "cost_of_sales"],
    "inventory": ["inventory", "total_inventory", "stock"],
    "accounts_payable": ["accounts_payable", "ap", "payables", "trade_payables"],
    "operating_cash_flow": ["operating_cash_flow", "ocf", "cash_from_operations"],
    "net_income": ["net_income", "profit_after_tax", "earnings", "net_profit"],
    "non_core_expenses": ["non_core_expenses", "other_expenses", "opex", "operating_expenses"],
    "supplier_id": ["supplier_id", "vendor_id", "supplier_name", "vendor_name", "supplier"],
    "payable_amount": ["payable_amount", "vendor_amount", "supplier_payables", "supplier_amount"],
}


class IngestionError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def validate_file_metadata(filename: str, file_bytes: bytes) -> None:
    """Validate file extension and size limits."""
    if not filename.lower().endswith(".csv"):
        raise IngestionError("Only CSV files are supported.", status_code=400)

    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        raise IngestionError("File exceeds 10MB limit.", status_code=413)

    if len(file_bytes) == 0:
        raise IngestionError("Uploaded file is empty.", status_code=400)


def normalize_column_names(df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, str]]:
    """Map CSV column headers to canonical domain names."""
    normalized = df.copy()
    raw_to_canonical = {}

    lower_cols = {str(c).strip().lower(): c for c in df.columns}

    for canonical, aliases in COLUMN_ALIASES.items():
        for alias in aliases:
            if alias in lower_cols:
                raw_col = lower_cols[alias]
                normalized.rename(columns={raw_col: canonical}, inplace=True)
                raw_to_canonical[raw_col] = canonical
                break

    return normalized, raw_to_canonical


def parse_csv_in_memory(file_bytes: bytes, filename: str) -> Dict[str, Any]:
    """
    Parses CSV in memory, standardizes schema, and identifies available vs missing signals.
    Never writes CSV to disk or database.
    """
    validate_file_metadata(filename, file_bytes)

    try:
        content = file_bytes.decode("utf-8")
    except UnicodeDecodeError:
        try:
            content = file_bytes.decode("latin-1")
        except Exception:
            raise IngestionError("Unable to decode CSV file. Please ensure valid UTF-8 encoding.")

    try:
        df = pd.read_csv(io.StringIO(content))
    except Exception as e:
        raise IngestionError(f"Failed to parse CSV: {str(e)}")

    if df.empty:
        raise IngestionError("CSV file contains no records.")

    normalized_df, mapping = normalize_column_names(df)

    # Detect present and missing critical columns
    expected_core = [
        "revenue", "accounts_receivable", "cogs", "inventory",
        "accounts_payable", "operating_cash_flow", "net_income"
    ]
    present_columns = [col for col in normalized_df.columns if col in COLUMN_ALIASES]
    missing_columns = [col for col in expected_core if col not in normalized_df.columns]

    # Convert numeric columns safely without blanket rejection of zero or negative numbers
    numeric_candidates = [c for c in normalized_df.columns if c != "period" and c != "supplier_id"]
    for col in numeric_candidates:
        normalized_df[col] = pd.to_numeric(normalized_df[col], errors="coerce").fillna(0.0)

    # Check for all-zero condition
    is_all_zero = False
    if numeric_candidates:
        numeric_sums = normalized_df[numeric_candidates].abs().sum().sum()
        if numeric_sums == 0.0:
            is_all_zero = True

    return {
        "dataframe": normalized_df,
        "row_count": len(normalized_df),
        "present_columns": present_columns,
        "missing_columns": missing_columns,
        "is_all_zero": is_all_zero,
        "filename": filename,
    }
