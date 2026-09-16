import React, { useState } from 'react';
import { FileDown, X, Copy, Check, Printer, ShieldAlert } from 'lucide-react';
import type { FirebreakAnalysis } from '../types/firebreak';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: FirebreakAnalysis;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  analysis,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const generateMarkdownReport = () => {
    const metrics = analysis.metrics_summary;
    return `# FINSIGHT FINANCIAL FIREBREAK — EXECUTIVE BRIEFING REPORT
**Scenario / File:** ${analysis.scenario_title || analysis.dataset_name}
**Evaluation Timestamp:** ${new Date().toISOString()}
**Environment:** ${analysis.is_synthetic ? 'Synthetic Benchmark (PRD DC-04)' : 'Enterprise Export'}
**AI Engine:** ${analysis.engine}
**Persistence:** ${analysis.persisted_via || 'Supabase/SQLite'}

---

## 1. Executive Stress Index
- **Financial Stress Index:** ${Math.round(analysis.financial_stress_index)} / 100
- **Severity Zone:** ${analysis.severity_zone} (Prototype Heuristic Thresholds)
- **Status:** ${analysis.severity_zone === 'Critical' || analysis.severity_zone === 'Elevated' ? 'IMMEDIATE MITIGATION RECOMMENDED' : 'MONITORING REQUIRED'}

---

## 2. Multi-Signal Evidence Summary (Deterministic Python Calculations)
| Signal Dimension | Primary Metric | Baseline / Context | Severity Status |
|---|---|---|---|
| Receivables Health | DSO: ${metrics.receivables_health.dso_proxy ?? '--'}d | 90d Delta: +${metrics.receivables_health.dso_delta_90d ?? 0}d | ${metrics.receivables_health.severity.toUpperCase()} |
| Payment Behavior | Deterioration: ${metrics.payment_behavior.deterioration_score}/100 | Late Bucket (>60d): ${metrics.payment_behavior.late_bucket_pct}% | ${metrics.payment_behavior.severity.toUpperCase()} |
| Supplier Concentration | Top Vendor Share: ${metrics.supplier_concentration.max_supplier_share_pct}% | Payables HHI: ${Math.round(metrics.supplier_concentration.hhi)} | ${metrics.supplier_concentration.severity.toUpperCase()} |
| Inventory Efficiency | DIO: ${metrics.inventory_efficiency.dio_days ?? '--'}d | Turnover: ${metrics.inventory_efficiency.turnover_ratio ?? '--'}x | ${metrics.inventory_efficiency.severity.toUpperCase()} |
| Expense Anomalies | Z-Score: ${metrics.expense_anomalies.anomaly_z_score}σ | Status: ${metrics.expense_anomalies.is_anomaly ? 'ANOMALY' : 'NORMAL'} | ${metrics.expense_anomalies.severity.toUpperCase()} |
| Cash-Flow Efficiency | CCC: ${metrics.cash_flow_efficiency.ccc_days}d | OCF/NI Divergence: ${metrics.cash_flow_efficiency.ocf_ni_divergence_score} | ${metrics.cash_flow_efficiency.severity.toUpperCase()} |

---

## 3. Generative Risk-Chain Narrative (Single-Prompt Gemini Synthesis)
${analysis.risk_chain_narrative}

### Interacting Signal Combinations
${analysis.signal_combinations.map((c) => `- **${c.signals.join(' + ')}**: ${c.interaction_mechanism} [Severity: ${c.compounding_severity}]`).join('\n')}

---

## 4. 30 / 60 / 90-Day Trajectory Outlook
**Outlook Quality:** ${analysis.outlook.quality_label}
${analysis.outlook.periods.map((p) => `- **${p.label}**: Projected DSO ${p.projected_dso}d, Projected CCC ${p.projected_ccc}d (${p.directional_stress})`).join('\n')}

---

## 5. Preventive Action Playbook
${analysis.preventive_actions.map((a) => `### ${a.id}: ${a.title}
- **Urgency:** ${a.urgency}
- **Effort:** ${a.effort}
- **Directional Impact:** ${a.directional_impact}
- **Rationale:** ${a.rationale}`).join('\n\n')}

---

## 6. Regulatory & Analytical Disclaimer
${analysis.ai_disclaimer}
`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateMarkdownReport());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '780px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-glass-heavy)',
          border: '1px solid var(--border-medium)',
          padding: '24px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileDown size={20} color="var(--primary-accent)" />
            <h2 style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>Executive Briefing Export</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button onClick={handleCopy} className="btn-secondary" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
              {copied ? <Check size={14} color="var(--severity-low)" /> : <Copy size={14} />}
              <span>{copied ? 'Copied Markdown!' : 'Copy Markdown'}</span>
            </button>
            <button onClick={handlePrint} className="btn-primary" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
              <Printer size={14} />
              <span>Print / Save PDF</span>
            </button>
            <button onClick={onClose} className="btn-ghost">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Report Preview */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          background: 'var(--bg-base)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '10px',
          padding: '20px',
          fontSize: '0.82rem',
          fontFamily: 'var(--font-mono)',
          lineHeight: 1.6,
          color: '#cbd5e1',
          whiteSpace: 'pre-wrap',
        }}>
          {generateMarkdownReport()}
        </div>

        {/* Footer */}
        <div style={{ marginTop: '14px', fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ShieldAlert size={14} color="var(--primary-accent)" />
          <span>Report contains derived signals and Gemini risk synthesis. Formatted for CFO / Risk Committee review.</span>
        </div>
      </div>
    </div>
  );
};
