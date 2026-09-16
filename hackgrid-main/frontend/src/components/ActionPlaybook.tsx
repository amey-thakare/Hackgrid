import React from 'react';
import { CheckSquare, Clock, Zap } from 'lucide-react';
import type { PreventiveAction } from '../types/firebreak';

interface ActionPlaybookProps {
  actions: PreventiveAction[];
}

export const ActionPlaybook: React.FC<ActionPlaybookProps> = ({ actions }) => {
  const getUrgencyBadge = (urgency: string) => {
    if (urgency.toLowerCase().includes('immediate')) {
      return <span className="badge badge-critical"><Clock size={11} /> {urgency}</span>;
    }
    if (urgency.toLowerCase().includes('near') || urgency.includes('30')) {
      return <span className="badge badge-elevated"><Clock size={11} /> {urgency}</span>;
    }
    return <span className="badge badge-moderate"><Clock size={11} /> {urgency}</span>;
  };

  const getImpactBadge = (impact: string) => {
    if (impact.toLowerCase().includes('high')) {
      return <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary-accent)', background: 'rgba(56, 189, 248, 0.1)', padding: '2px 8px', borderRadius: '6px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>High Directional Impact</span>;
    }
    if (impact.toLowerCase().includes('medium')) {
      return <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)', padding: '2px 8px', borderRadius: '6px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>Medium Directional Impact</span>;
    }
    return <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#94a3b8', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '6px' }}>Low Impact</span>;
  };

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckSquare size={18} color="var(--primary-accent)" />
            <h2 style={{ fontSize: '1.1rem', color: '#ffffff', letterSpacing: '-0.01em' }}>
              Preventive Action Playbook
            </h2>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Bounded 3–5 actionable interventions with directional impact prioritization
          </p>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {actions.length} Interventions
        </span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '14px',
      }}>
        {actions.map((act) => (
          <div
            key={act.id}
            className="glass-card-interactive"
            style={{
              background: 'rgba(14, 18, 29, 0.65)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-accent)', fontFamily: 'var(--font-mono)' }}>
                  {act.id}
                </span>
                {getUrgencyBadge(act.urgency)}
              </div>

              <h3 style={{ fontSize: '0.94rem', fontWeight: 700, color: '#ffffff', lineHeight: 1.35, marginBottom: '8px' }}>
                {act.title}
              </h3>

              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '12px' }}>
                {act.rationale}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
              {getImpactBadge(act.directional_impact)}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                <Zap size={12} />
                <span>Effort: <strong>{act.effort}</strong></span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

