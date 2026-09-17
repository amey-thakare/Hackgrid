"""
Single-Prompt Gemini AI Engine for FinSight Financial Firebreak.
PRD v1.1 Architecture Principle:
- Single structured prompt: One call per analysis run.
- Zero raw data sent: receives derived metrics and outlook evidence only.
- Strict schema-valid JSON output.
- Explicitly distinguishes between "Observed evidence" and "XGBoost forecast".
"""

import json
import os
from typing import Any, Dict, List
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

AI_DISCLAIMER_TEXT = (
    "Outputs are analytical signals for human review and decision support only. "
    "They do not constitute formal audit opinions, solvency certifications, or professional financial advice."
)


class SignalCombination(BaseModel):
    signals: List[str] = Field(description="Interacting signal dimensions identified")
    interaction_mechanism: str = Field(description="How these signals may interact under current conditions")
    compounding_severity: str = Field(description="Qualitative assessment: Low, Moderate, Elevated, or Critical")


class PreventiveAction(BaseModel):
    id: str = Field(description="Action identifier e.g. ACT-01")
    title: str = Field(description="Concise action title")
    urgency: str = Field(description="Urgency category: Immediate (0-15d), Near-Term (30d), or Medium-Term (60-90d)")
    effort: str = Field(description="Implementation effort: Low, Medium, High")
    directional_impact: str = Field(description="Directional impact label: High, Medium, or Low")
    rationale: str = Field(description="Why this intervention mitigates the compound risk chain")


class OutlookStep(BaseModel):
    day_horizon: int = Field(description="30, 60, or 90 days")
    projected_trajectory: str = Field(description="Narrative directional summary of trajectory (must reference XGBoost projection if available)")
    directional_stress: str = Field(description="Stable, Elevated, or Critical")


class FirebreakAIOutput(BaseModel):
    financial_stress_index: float = Field(ge=0.0, le=100.0, description="Analytical 0-100 financial stress index")
    severity_zone: str = Field(description="Low, Moderate, Elevated, or Critical (prototype heuristic zone)")
    signal_combinations: List[SignalCombination] = Field(description="Key interacting signal combinations")
    risk_chain_narrative: str = Field(description="Plain-English explanation referencing >= 2 dimensions, distinguishing observed evidence from inferred interaction without claiming causal proof")
    outlook_30_60_90: List[OutlookStep] = Field(description="Trajectory outlook across 30, 60, and 90 days")
    preventive_actions: List[PreventiveAction] = Field(min_length=3, max_length=5, description="3 to 5 actionable preventive interventions")
    ai_disclaimer: str = Field(default=AI_DISCLAIMER_TEXT)


def _build_system_prompt() -> str:
    return f"""You are the FinSight Financial Firebreak analytical synthesis engine.
You are a decision-support system for enterprise finance executives (CFO, Treasury Manager, Risk Officer).
You analyze structured derived evidence across six financial dimensions:
1. Receivables Health
2. Payment Behavior
3. Supplier Concentration
4. Inventory Efficiency
5. Expense Anomalies
6. Cash-Flow Efficiency

CRITICAL REGULATORY & PRODUCT GUARDRAILS:
1. DO NOT claim causal proof or use terms like "causes", "proves bankruptcy", or "guaranteed failure".
   Use terms such as "contributing risk-chain", "possible interaction under current conditions", "compounding friction", and "directional outlook".
2. You must reference at least TWO distinct signal dimensions in the risk_chain_narrative, clearly distinguishing observed evidence from inferred interactions.
3. You must explicitly distinguish between observed evidence and the XGBoost forecast trajectory provided in the outlook_evidence.
4. Financial Stress Index must be a single numeric float between 0 and 100.
5. You must recommend between 3 and 5 actionable preventive interventions with directional impact labels (High, Medium, Low), never unsupported monetary promises.
6. All score thresholds and severity zones must be treated as prototype heuristic thresholds.
7. The AI disclaimer must always be present: "{AI_DISCLAIMER_TEXT}".
8. Return ONLY schema-valid JSON conforming to the requested schema.
"""


def _generate_fallback_response(evidence_payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Deterministic mock fallback generator adhering strictly to the JSON schema.
    Used for local testing, CI/CD, or when API keys are absent.
    """
    meta = evidence_payload.get("metadata", {})
    base_index = float(meta.get("prototype_baseline_stress_index", 50.0))
    severity_zone = meta.get("prototype_severity_zone", "Moderate")

    signals = evidence_payload.get("signal_dimensions", {})
    rec = signals.get("receivables_health", {})
    supp = signals.get("supplier_concentration", {})
    cf = signals.get("cash_flow_efficiency", {})
    inv = signals.get("inventory_efficiency", {})

    dso = rec.get("dso_proxy", 50.0) or 50.0
    hhi = supp.get("hhi", 1800.0) or 1800.0
    ccc = cf.get("ccc_days", 75.0) or 75.0
    dio = inv.get("dio_days", 60.0) or 60.0

    narrative = (
        f"Observed operational evidence indicates a simplified DSO proxy of {dso:.1f} days "
        f"coinciding with a Cash Conversion Cycle (CCC) of {ccc:.1f} days and Days Inventory Outstanding of {dio:.1f} days. "
        f"In terms of supplier exposure, payables concentration reflects an HHI index of {hhi:.0f}. "
        f"Under current working capital conditions, the observed elongation in receivables collection appears to interact "
        f"with inventory holding duration, placing directional pressure on operating cash flow rather than representing "
        f"an isolated receivables delay. These contributing signals reinforce cash-flow divergence without asserting "
        f"unilateral causality."
    )

    actions = []
    
    if dso > 60.0:
        actions.append({
            "id": "ACT-REC",
            "title": "Aggressive Collections & Aging Protocol",
            "urgency": "Immediate (0-15d)",
            "effort": "Medium",
            "directional_impact": "High",
            "rationale": f"DSO is elevated at {dso:.1f} days. Immediate enforcement of past-due collections is required to free up cash.",
        })
    else:
        actions.append({
            "id": "ACT-REC",
            "title": "Maintain Collection Efficiency",
            "urgency": "Medium-Term (60-90d)",
            "effort": "Low",
            "directional_impact": "Low",
            "rationale": "DSO is healthy. Continue standard invoicing workflows without adding customer friction.",
        })

    if hhi > 2500.0:
        actions.append({
            "id": "ACT-SUP",
            "title": "Alternative Sourcing & Vendor Diversification",
            "urgency": "Near-Term (30d)",
            "effort": "High",
            "directional_impact": "High",
            "rationale": f"Supplier HHI of {hhi:.0f} indicates severe concentration risk. Identify secondary vendors immediately.",
        })
    else:
        actions.append({
            "id": "ACT-SUP",
            "title": "Vendor Terms Optimization",
            "urgency": "Medium-Term (60-90d)",
            "effort": "Medium",
            "directional_impact": "Medium",
            "rationale": "Supplier exposure is diversified. Negotiate extended payment terms selectively to improve DPO.",
        })

    if dio > 75.0:
        actions.append({
            "id": "ACT-INV",
            "title": "Inventory Depletion & Lead Time Re-calibration",
            "urgency": "Immediate (0-15d)",
            "effort": "Medium",
            "directional_impact": "Medium",
            "rationale": f"DIO is high at {dio:.1f} days. Halt non-essential replenishment and push aging inventory discounts.",
        })
    
    if ccc > 90.0:
        actions.append({
            "id": "ACT-CCC",
            "title": "Liquidity Buffer & Cash Flow Reconciliation",
            "urgency": "Immediate (0-15d)",
            "effort": "Low",
            "directional_impact": "High",
            "rationale": f"CCC is severely elongated at {ccc:.1f} days. Implement weekly cash divergence tracking against net income.",
        })
    
    # Ensure we always have at least 3 actions to satisfy the UI validation
    if len(actions) < 3:
        actions.append({
            "id": "ACT-CAP",
            "title": "Capital Allocation Review",
            "urgency": "Near-Term (30d)",
            "effort": "Low",
            "directional_impact": "Medium",
            "rationale": "Review overall working capital efficiency to ensure sufficient liquidity buffers are maintained.",
        })

    signal_combinations = [
        {
            "signals": ["Receivables Health", "Cash-Flow Efficiency"],
            "interaction_mechanism": "Rising collection delays directly extend working capital lockup and depress operating cash flow.",
            "compounding_severity": severity_zone,
        },
        {
            "signals": ["Supplier Concentration", "Inventory Efficiency"],
            "interaction_mechanism": "High supplier reliance limits flexibility when inventory turn speeds fluctuate.",
            "compounding_severity": "Moderate" if severity_zone != "Critical" else "Elevated",
        },
    ]

    outlook = [
        {"day_horizon": 30, "projected_trajectory": "Initial working capital friction stabilizes if early billing reminders trigger.", "directional_stress": "Moderate"},
        {"day_horizon": 60, "projected_trajectory": "Elevated liquidity strain as vendor payments come due faster than receivables clear.", "directional_stress": severity_zone},
        {"day_horizon": 90, "projected_trajectory": "Compounded stress scenario unless preventive working capital actions are deployed.", "directional_stress": "Critical" if base_index > 65 else "Elevated"},
    ]

    return {
        "financial_stress_index": base_index,
        "severity_zone": severity_zone,
        "signal_combinations": signal_combinations,
        "risk_chain_narrative": narrative,
        "outlook_30_60_90": outlook,
        "preventive_actions": actions,
        "ai_disclaimer": AI_DISCLAIMER_TEXT,
        "engine": "deterministic_fallback_simulator",
    }


def analyze_with_gemini(evidence_payload: Dict[str, Any], force_mock: bool = False) -> Dict[str, Any]:
    """
    Executes a single structured prompt call to Google Gemini API.
    Preserves AC-01 (Single Prompt).
    """
    if force_mock or not GEMINI_API_KEY:
        return _generate_fallback_response(evidence_payload)

    try:
        from google import genai
        from google.genai import types
        
        client = genai.Client(api_key=GEMINI_API_KEY)

        prompt_text = (
            "Analyze the following financial evidence matrix and produce an executive Firebreak analysis:\n\n"
            f"```json\n{json.dumps(evidence_payload, indent=2)}\n```"
        )

        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt_text,
            config=types.GenerateContentConfig(
                system_instruction=_build_system_prompt(),
                response_mime_type="application/json",
                response_schema=FirebreakAIOutput,
                temperature=0.2,
            ),
        )

        if not response.text:
            raise ValueError("Gemini returned an empty response.")
            
        parsed_json = json.loads(response.text)
        
        validated = FirebreakAIOutput.model_validate(parsed_json)
        result = validated.model_dump()
        result["engine"] = f"gemini_{GEMINI_MODEL}"
        return result

    except Exception as e:
        print(f"Gemini API invocation error: {e}. Falling back to deterministic simulation.")
        fallback = _generate_fallback_response(evidence_payload)
        fallback["engine_warning"] = f"Gemini API unavailable ({str(e)}). Returned schema-valid deterministic fallback."
        return fallback


def explain_simulation(payload: Dict[str, Any], force_mock: bool = False) -> str:
    """
    Generates a natural-language explanation of a what-if scenario.
    """
    if force_mock or not GEMINI_API_KEY:
        return "Simulated adjustments indicate a shift in working capital dynamics. This is a deterministic fallback explanation because the AI engine is unavailable."

    try:
        from google import genai
        client = genai.Client(api_key=GEMINI_API_KEY)

        prompt_text = (
            "You are a CFO advising a company. A what-if financial scenario simulation was just run.\n"
            f"Here are the adjusted metrics and the resulting score shifts:\n{json.dumps(payload, indent=2)}\n\n"
            "In 2-3 short sentences, explain what this means in plain English, highlighting the key drivers of the change. Do NOT use overly complex jargon."
        )

        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt_text,
        )

        return response.text or "No explanation generated."
    except Exception as e:
        print(f"Gemini API invocation error: {e}")
        return "An error occurred while generating the explanation."
