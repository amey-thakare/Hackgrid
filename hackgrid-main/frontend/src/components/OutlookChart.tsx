import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { TrendingUp, AlertCircle, CheckCircle2, HelpCircle } from 'lucide-react';
import type { OutlookData } from '../types/firebreak';

interface OutlookChartProps {
  outlook: OutlookData;
}

export const OutlookChart: React.FC<OutlookChartProps> = ({ outlook }) => {
  const chartData = [
    { name: 'Current', dso: outlook.periods[0] ? Math.round(outlook.periods[0].projected_dso * 0.96) : 50, ccc: outlook.periods[0] ? Math.round(outlook.periods[0].projected_ccc * 0.95) : 60 },
    ...outlook.periods.map((p) => ({
      name: p.label,
      dso: p.projected_dso,
      ccc: p.projected_ccc,
      stress: p.directional_stress,
      confidence: p.confidence_band,
    })),
  ];

  const isDefensible = outlook.is_defensible_forecast;

  return (
    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} color="var(--primary-accent)" />
            <h2 className="neon-text-primary" style={{ fontSize: '1.1rem', letterSpacing: '-0.01em' }}>
              30 / 60 / 90-Day Trajectory Outlook
            </h2>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Projected working capital and collection delay trajectories
          </p>
        </div>

        {/* Quality Labeling Badge (PRD T-19) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          borderRadius: '8px',
          background: isDefensible ? 'rgba(56, 189, 248, 0.12)' : 'rgba(37, 99, 235, 0.12)',
          border: isDefensible ? '1px solid var(--severity-moderate-border)' : '1px solid var(--severity-elevated-border)',
          color: isDefensible ? 'var(--severity-moderate)' : 'var(--severity-elevated)',
          fontSize: '0.74rem',
          fontWeight: 600,
        }} id="outlook-quality-badge">
          {isDefensible ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
          <span>{outlook.quality_label}</span>
        </div>
      </div>

      {/* Missing evidence banner if heuristic */}
      {outlook.missing_evidence && (
        <div style={{
          background: 'rgba(37, 99, 235, 0.08)',
          border: '1px solid rgba(37, 99, 235, 0.25)',
          borderRadius: '8px',
          padding: '8px 12px',
          marginBottom: '14px',
          fontSize: '0.75rem',
          color: 'var(--primary-accent)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <HelpCircle size={14} style={{ flexShrink: 0 }} />
          <span>{outlook.missing_evidence} Trajectory labeled as heuristic outlook.</span>
        </div>
      )}

      {/* Recharts Area Chart */}
      <div style={{ width: '100%', height: '220px', marginTop: '6px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="dsoGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--severity-moderate)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="var(--severity-moderate)" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="cccGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--severity-elevated)" stopOpacity={0.35} />
                <stop offset="95%" stopColor="var(--severity-elevated)" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f1422',
                borderColor: 'rgba(255,255,255,0.1)',
                borderRadius: '8px',
                fontSize: '0.75rem',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '0.75rem', paddingTop: '6px' }} />
            <Area
              type="monotone"
              dataKey="dso"
              name="Projected DSO (Days)"
              stroke="var(--severity-moderate)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#dsoGradient)"
            />
            <Area
              type="monotone"
              dataKey="ccc"
              name="Projected CCC (Days)"
              stroke="var(--severity-elevated)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#cccGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '14px', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
        {outlook.periods.map((p, idx) => (
          <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{p.label} Horizon</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
              {p.projected_dso}d DSO
            </div>
            <div style={{ fontSize: '0.68rem', color: p.directional_stress.includes('Critical') ? 'var(--severity-critical)' : 'var(--text-secondary)' }}>
              {p.directional_stress}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

