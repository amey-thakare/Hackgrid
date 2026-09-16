import React from 'react';
import { ShieldAlert } from 'lucide-react';

interface AiDisclaimerProps {
  customText?: string;
}

export const AiDisclaimer: React.FC<AiDisclaimerProps> = ({ customText }) => {
  const defaultText =
    "FinSight Financial Firebreak is a decision-support prototype. Outputs are analytical signals for human review " +
    "and do not constitute legal, tax, accounting, or professional financial advice. " +
    "All score thresholds and severity zones are prototype heuristics.";

  return (
    <footer
      id="ai-disclaimer-banner"
      style={{
        marginTop: '32px',
        padding: '14px 20px',
        borderRadius: '12px',
        background: 'var(--bg-glass-heavy)',
        border: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '0.76rem',
        color: 'var(--text-muted)',
        lineHeight: 1.45,
      }}
    >
      <ShieldAlert size={18} color="var(--primary-accent)" style={{ flexShrink: 0 }} />
      <div>
        <strong style={{ color: 'var(--text-secondary)' }}>Regulatory & Analytical Disclaimer: </strong>
        {customText || defaultText}
      </div>
    </footer>
  );
};
