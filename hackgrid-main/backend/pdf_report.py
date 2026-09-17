"""
PDF Report Generation Engine for FinSight Financial Firebreak.
Uses ReportLab to produce a professional multi-page PDF from analysis results.
"""

import io
from datetime import datetime
from typing import Any, Dict, List

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm, inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable
)


# ── Color Palette ──
HEADER_BLUE = colors.HexColor("#1E3A5F")
DARK_BG = colors.HexColor("#0B0F15")
ACCENT_BLUE = colors.HexColor("#0EA5E9")
LIGHT_GRAY = colors.HexColor("#F5F7FA")
MED_GRAY = colors.HexColor("#7D8A9B")
DARK_GRAY = colors.HexColor("#2D3748")
TABLE_ROW_ALT = colors.HexColor("#F0F4F8")
WHITE = colors.white
BLACK = colors.black

SEVERITY_COLORS = {
    "critical": colors.HexColor("#DC2626"),
    "elevated": colors.HexColor("#2563EB"),
    "moderate": colors.HexColor("#0EA5E9"),
    "low": colors.HexColor("#10B981"),
}

DISCLAIMER_TEXT = (
    "Analytical prototype — outputs are decision-support signals for human "
    "review and do not constitute financial advice."
)


def _get_severity_color(zone: str) -> colors.Color:
    return SEVERITY_COLORS.get(zone.lower(), MED_GRAY)


def _build_styles():
    """Build all paragraph styles used in the report."""
    styles = getSampleStyleSheet()

    styles.add(ParagraphStyle(
        "CoverTitle", fontName="Helvetica-Bold", fontSize=28,
        leading=34, textColor=HEADER_BLUE, alignment=TA_CENTER,
        spaceAfter=6,
    ))
    styles.add(ParagraphStyle(
        "CoverSubtitle", fontName="Helvetica", fontSize=14,
        leading=20, textColor=MED_GRAY, alignment=TA_CENTER,
        spaceAfter=4,
    ))
    styles.add(ParagraphStyle(
        "CoverEntity", fontName="Helvetica-Bold", fontSize=20,
        leading=26, textColor=DARK_GRAY, alignment=TA_CENTER,
        spaceAfter=8,
    ))
    styles.add(ParagraphStyle(
        "CoverDate", fontName="Helvetica", fontSize=12,
        leading=16, textColor=MED_GRAY, alignment=TA_CENTER,
        spaceAfter=20,
    ))
    styles.add(ParagraphStyle(
        "ScoreDisplay", fontName="Helvetica-Bold", fontSize=60,
        leading=66, alignment=TA_CENTER, spaceAfter=4,
    ))
    styles.add(ParagraphStyle(
        "ZoneLabel", fontName="Helvetica-Bold", fontSize=16,
        leading=20, alignment=TA_CENTER, spaceAfter=14,
    ))
    styles.add(ParagraphStyle(
        "SectionHeading", fontName="Helvetica-Bold", fontSize=16,
        leading=22, textColor=HEADER_BLUE, spaceAfter=10,
        spaceBefore=14, borderPadding=(0, 0, 4, 0),
    ))
    styles.add(ParagraphStyle(
        "SubHeading", fontName="Helvetica-Bold", fontSize=12,
        leading=16, textColor=DARK_GRAY, spaceAfter=6,
        spaceBefore=10,
    ))
    styles.add(ParagraphStyle(
        "BodyText_Custom", fontName="Helvetica", fontSize=10,
        leading=15, textColor=DARK_GRAY, alignment=TA_JUSTIFY,
        spaceAfter=8,
    ))
    styles.add(ParagraphStyle(
        "DisclaimerStyle", fontName="Helvetica-Oblique", fontSize=8,
        leading=11, textColor=MED_GRAY, alignment=TA_CENTER,
        spaceBefore=10,
    ))
    styles.add(ParagraphStyle(
        "TableHeader", fontName="Helvetica-Bold", fontSize=9,
        leading=12, textColor=WHITE, alignment=TA_LEFT,
    ))
    styles.add(ParagraphStyle(
        "TableCell", fontName="Helvetica", fontSize=9,
        leading=12, textColor=DARK_GRAY, alignment=TA_LEFT,
    ))
    styles.add(ParagraphStyle(
        "ActionTitle", fontName="Helvetica-Bold", fontSize=11,
        leading=15, textColor=HEADER_BLUE, spaceAfter=2,
    ))
    styles.add(ParagraphStyle(
        "ActionMeta", fontName="Helvetica", fontSize=9,
        leading=13, textColor=MED_GRAY,
    ))
    styles.add(ParagraphStyle(
        "ActionBody", fontName="Helvetica", fontSize=10,
        leading=14, textColor=DARK_GRAY, spaceAfter=10,
    ))
    return styles


def _add_footer(canvas, doc, entity_name: str, run_date: str):
    """Draw a consistent footer on every page."""
    canvas.saveState()
    canvas.setFillColor(colors.HexColor("#E2E8F0"))
    canvas.rect(0, 0, A4[0], 28 * mm, fill=1, stroke=0)

    canvas.setFont("Helvetica", 7)
    canvas.setFillColor(MED_GRAY)
    canvas.drawString(20 * mm, 10 * mm, f"{entity_name}  •  {run_date}")
    canvas.drawRightString(A4[0] - 20 * mm, 10 * mm,
                           "FinSight prototype — not financial advice")
    canvas.drawCentredString(A4[0] / 2, 10 * mm, f"Page {doc.page}")
    canvas.restoreState()


def _section_hr():
    return HRFlowable(
        width="100%", thickness=0.5, color=colors.HexColor("#CBD5E1"),
        spaceAfter=8, spaceBefore=4,
    )


def _build_cover_page(
    styles, entity_name: str, run_date: str,
    stress_index: float, severity_zone: str,
) -> list:
    """Build Page 1: Cover."""
    elements = []
    elements.append(Spacer(1, 60 * mm))

    elements.append(Paragraph("FINSIGHT", styles["CoverTitle"]))
    elements.append(Paragraph("Financial Firebreak Report", styles["CoverSubtitle"]))
    elements.append(Spacer(1, 12 * mm))
    elements.append(_section_hr())
    elements.append(Spacer(1, 8 * mm))

    elements.append(Paragraph(entity_name, styles["CoverEntity"]))
    elements.append(Paragraph(f"Analysis Date: {run_date}", styles["CoverDate"]))
    elements.append(Spacer(1, 16 * mm))

    # Score
    score_color = _get_severity_color(severity_zone)
    score_style = ParagraphStyle(
        "ScoreColored", parent=styles["ScoreDisplay"], textColor=score_color,
    )
    elements.append(Paragraph(str(int(round(stress_index))), score_style))

    zone_style = ParagraphStyle(
        "ZoneColored", parent=styles["ZoneLabel"], textColor=score_color,
    )
    elements.append(Paragraph(severity_zone.upper(), zone_style))
    elements.append(Paragraph("Financial Stress Index", styles["CoverSubtitle"]))

    elements.append(Spacer(1, 30 * mm))
    elements.append(Paragraph(DISCLAIMER_TEXT, styles["DisclaimerStyle"]))
    elements.append(PageBreak())
    return elements


def _build_signal_page(
    styles, metrics: dict, signal_combinations: list,
) -> list:
    """Build Page 2: Signal Summary Table + Interacting Combinations."""
    elements = []
    elements.append(Paragraph("Signal Dimension Summary", styles["SectionHeading"]))
    elements.append(_section_hr())

    # Build signal table
    header_row = [
        Paragraph("Signal Dimension", styles["TableHeader"]),
        Paragraph("Primary Metric", styles["TableHeader"]),
        Paragraph("Context", styles["TableHeader"]),
        Paragraph("Severity", styles["TableHeader"]),
    ]

    dim_map = {
        "Receivables Health": metrics.get("receivables_health", {}),
        "Payment Behavior": metrics.get("payment_behavior", {}),
        "Supplier Concentration": metrics.get("supplier_concentration", {}),
        "Inventory Efficiency": metrics.get("inventory_efficiency", {}),
        "Expense Anomalies": metrics.get("expense_anomalies", {}),
        "Cash-Flow Efficiency": metrics.get("cash_flow_efficiency", {}),
    }

    data_rows = [header_row]
    for dim_name, d in dim_map.items():
        sev = str(d.get("severity", "—")).upper()
        if dim_name == "Receivables Health":
            metric_val = f"DSO: {d.get('dso_proxy', '—')}d"
            context = f"90d Δ: {d.get('dso_delta_90d', '—')}d"
        elif dim_name == "Payment Behavior":
            metric_val = f"Deterioration: {d.get('deterioration_score', '—')}/100"
            context = f"Late (>60d): {d.get('late_bucket_pct', '—')}%"
        elif dim_name == "Supplier Concentration":
            metric_val = f"Top Vendor: {d.get('max_supplier_share_pct', '—')}%"
            context = f"HHI: {round(d.get('hhi', 0))}"
        elif dim_name == "Inventory Efficiency":
            metric_val = f"DIO: {d.get('dio_days', '—')}d"
            context = f"Turnover: {d.get('turnover_ratio', '—')}x"
        elif dim_name == "Expense Anomalies":
            metric_val = f"Z-Score: {d.get('anomaly_z_score', '—')}σ"
            context = "ANOMALY" if d.get("is_anomaly") else "Normal"
        else:
            metric_val = f"CCC: {d.get('ccc_days', '—')}d"
            context = f"OCF/NI Div: {d.get('ocf_ni_divergence_score', '—')}"

        sev_color = SEVERITY_COLORS.get(d.get("severity", "").lower(), MED_GRAY)
        sev_style = ParagraphStyle("SevCell", parent=styles["TableCell"],
                                   textColor=sev_color, fontName="Helvetica-Bold")

        data_rows.append([
            Paragraph(dim_name, styles["TableCell"]),
            Paragraph(metric_val, styles["TableCell"]),
            Paragraph(context, styles["TableCell"]),
            Paragraph(sev, sev_style),
        ])

    col_widths = [120, 130, 120, 80]
    table = Table(data_rows, colWidths=col_widths)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), HEADER_BLUE),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
        ("TOPPADDING", (0, 0), (-1, 0), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, TABLE_ROW_ALT]),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 1), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 6),
    ]))
    elements.append(table)
    elements.append(Spacer(1, 12 * mm))

    # Signal Combinations
    if signal_combinations:
        elements.append(Paragraph("Interacting Signal Combinations", styles["SubHeading"]))
        elements.append(_section_hr())
        for combo in signal_combinations:
            signals = " + ".join(combo.get("signals", []))
            mechanism = combo.get("interaction_mechanism", "")
            sev = combo.get("compounding_severity", "")
            sev_color = SEVERITY_COLORS.get(sev.lower(), MED_GRAY)

            text = (
                f'<b><font color="{sev_color.hexval()}">[{sev.upper()}]</font></b> '
                f'<b>{signals}</b>: {mechanism}'
            )
            elements.append(Paragraph(text, styles["BodyText_Custom"]))

    elements.append(PageBreak())
    return elements


def _build_narrative_page(
    styles, narrative: str, outlook_periods: list,
) -> list:
    """Build Page 3: Risk-chain narrative + 30/60/90 outlook."""
    elements = []
    elements.append(Paragraph("Risk-Chain Narrative", styles["SectionHeading"]))
    elements.append(_section_hr())

    # Wrap narrative
    for para in narrative.split("\n"):
        para = para.strip()
        if para:
            elements.append(Paragraph(para, styles["BodyText_Custom"]))

    elements.append(Spacer(1, 10 * mm))

    # Outlook
    elements.append(Paragraph("30 / 60 / 90-Day Trajectory Outlook", styles["SectionHeading"]))
    elements.append(_section_hr())

    if outlook_periods:
        header = [
            Paragraph("Horizon", styles["TableHeader"]),
            Paragraph("Projected DSO", styles["TableHeader"]),
            Paragraph("Projected CCC", styles["TableHeader"]),
            Paragraph("Directional Stress", styles["TableHeader"]),
        ]
        data = [header]
        for p in outlook_periods:
            stress_label = str(p.get("directional_stress", "—"))
            sev_color = SEVERITY_COLORS.get(stress_label.lower(), MED_GRAY)
            stress_style = ParagraphStyle("StressCell", parent=styles["TableCell"],
                                          textColor=sev_color, fontName="Helvetica-Bold")
            data.append([
                Paragraph(str(p.get("label", f'{p.get("day_horizon", "?")}d')), styles["TableCell"]),
                Paragraph(f'{p.get("projected_dso", "—")}d', styles["TableCell"]),
                Paragraph(f'{p.get("projected_ccc", "—")}d', styles["TableCell"]),
                Paragraph(stress_label.upper(), stress_style),
            ])

        t = Table(data, colWidths=[100, 110, 110, 130])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), HEADER_BLUE),
            ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, TABLE_ROW_ALT]),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ]))
        elements.append(t)
    else:
        elements.append(Paragraph("No outlook data available.", styles["BodyText_Custom"]))

    elements.append(PageBreak())
    return elements


def _build_action_page(styles, actions: list) -> list:
    """Build Page 4: Action Plan."""
    elements = []
    elements.append(Paragraph("Preventive Action Playbook", styles["SectionHeading"]))
    elements.append(_section_hr())

    if not actions:
        elements.append(Paragraph("No preventive actions generated.", styles["BodyText_Custom"]))
        return elements

    for i, action in enumerate(actions, 1):
        title = action.get("title", "Untitled")
        action_id = action.get("id", f"ACT-{i:02d}")
        urgency = action.get("urgency", "—")
        effort = action.get("effort", "—")
        impact = action.get("directional_impact", "—")
        rationale = action.get("rationale", "")

        elements.append(Paragraph(f"{action_id}: {title}", styles["ActionTitle"]))
        meta_text = (
            f'<font color="{HEADER_BLUE.hexval()}">Urgency:</font> {urgency}  •  '
            f'<font color="{HEADER_BLUE.hexval()}">Effort:</font> {effort}  •  '
            f'<font color="{HEADER_BLUE.hexval()}">Impact:</font> {impact}'
        )
        elements.append(Paragraph(meta_text, styles["ActionMeta"]))
        elements.append(Paragraph(rationale, styles["ActionBody"]))

    return elements


def generate_report_pdf(payload: Dict[str, Any]) -> bytes:
    """
    Main entry point: accepts the full analysis JSON and returns PDF bytes.
    """
    entity_name = payload.get("entity_name") or payload.get("dataset_name", "Financial Entity")
    run_date = payload.get("run_date") or datetime.utcnow().strftime("%B %d, %Y")
    stress_index = float(payload.get("financial_stress_index", 50))
    severity_zone = str(payload.get("severity_zone", "Moderate"))
    metrics = payload.get("metrics_summary", payload.get("signal_scores", {}))
    signal_combinations = payload.get("signal_combinations", [])
    narrative = payload.get("risk_chain_narrative", "No narrative available.")
    outlook = payload.get("outlook", payload.get("outlook_30_60_90", {}))
    actions = payload.get("preventive_actions", payload.get("action_plan", []))

    # Extract outlook periods
    if isinstance(outlook, dict):
        outlook_periods = outlook.get("periods", [])
    elif isinstance(outlook, list):
        outlook_periods = outlook
    else:
        outlook_periods = []

    styles = _build_styles()
    buf = io.BytesIO()

    def footer_handler(canvas, doc):
        _add_footer(canvas, doc, entity_name, run_date)

    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        topMargin=20 * mm,
        bottomMargin=32 * mm,
        leftMargin=20 * mm,
        rightMargin=20 * mm,
        title=f"FinSight Report — {entity_name}",
        author="FinSight Financial Firebreak",
    )

    elements = []
    elements.extend(_build_cover_page(styles, entity_name, run_date, stress_index, severity_zone))
    elements.extend(_build_signal_page(styles, metrics, signal_combinations))
    elements.extend(_build_narrative_page(styles, narrative, outlook_periods))
    elements.extend(_build_action_page(styles, actions))

    # Final disclaimer
    elements.append(Spacer(1, 10 * mm))
    elements.append(_section_hr())
    elements.append(Paragraph(DISCLAIMER_TEXT, styles["DisclaimerStyle"]))

    doc.build(elements, onFirstPage=footer_handler, onLaterPages=footer_handler)
    return buf.getvalue()
