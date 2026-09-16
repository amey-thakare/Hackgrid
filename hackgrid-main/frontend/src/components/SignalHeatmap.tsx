import React, { useState } from 'react';
import type { MetricsSummary, SeverityLevel } from '../types/firebreak';
import { Calendar, Users, Building2, Package, TrendingUp, DollarSign, ChevronRight, AlertCircle, ArrowDown, Zap } from 'lucide-react';

interface SignalHeatmapProps {
  metrics: MetricsSummary;
}

interface ChainNode {
  id: string;
  name: string;
  severity: SeverityLevel;
  isolatedReasoning: string;
  relativeReasoning: string | null;
}

export const SignalHeatmap: React.FC<SignalHeatmapProps> = ({ metrics }) => {
  const [selectedSignal, setSelectedSignal] = useState<string | null>(null);

  const getSeverityBadge = (severity: SeverityLevel) => {
    switch (severity) {
      case 'critical':
        return <span className="badge badge-critical">Critical</span>;
      case 'elevated':
        return <span className="badge badge-elevated">Elevated</span>;
      case 'moderate':
        return <span className="badge badge-moderate">Moderate</span>;
      default:
        return <span className="badge badge-low">Healthy</span>;
    }
  };

  const getBorderGlow = (severity: SeverityLevel) => {
    switch (severity) {
      case 'critical':
        return 'var(--severity-critical-border)';
      case 'elevated':
        return 'var(--severity-elevated-border)';
      case 'moderate':
        return 'var(--severity-moderate-border)';
      default:
        return 'var(--border-subtle)';
    }
  };

  const cards = [
    {
      id: 'receivables',
      name: 'Receivables Health',
      icon: <Calendar size={18} color="var(--primary-accent)" />,
      severity: metrics.receivables_health.severity,
      primaryMetric: `${metrics.receivables_health.dso_proxy ?? '--'} days`,
      primaryLabel: 'Simplified DSO Proxy',
      secondaryMetric: `+${metrics.receivables_health.dso_delta_90d ?? 0}d`,
      secondaryLabel: '90-Day Delta',
      notes: metrics.receivables_health.formula_notes || 'Simplified prototype proxy: (AR / Revenue) * 365',
      extra: `Past 90d Aging: ${metrics.receivables_health.aging_buckets_pct?.ar_90_plus ?? 0}%`,
    },
    {
      id: 'payment',
      name: 'Payment Behavior',
      icon: <Users size={18} color="#818cf8" />,
      severity: metrics.payment_behavior.severity,
      primaryMetric: `${metrics.payment_behavior.deterioration_score} / 100`,
      primaryLabel: 'Deterioration Score',
      secondaryMetric: `${metrics.payment_behavior.late_bucket_pct}%`,
      secondaryLabel: 'Late Bucket (>60d)',
      notes: metrics.payment_behavior.notes || 'Tracks customer payment timing friction.',
      extra: 'Past-due collection transition index',
    },
    {
      id: 'supplier',
      name: 'Supplier Concentration',
      icon: <Building2 size={18} color="#f59e0b" />,
      severity: metrics.supplier_concentration.severity,
      primaryMetric: `${metrics.supplier_concentration.max_supplier_share_pct}%`,
      primaryLabel: 'Top Vendor Share',
      secondaryMetric: `${Math.round(metrics.supplier_concentration.hhi)}`,
      secondaryLabel: 'Payables HHI Index',
      notes: metrics.supplier_concentration.notes || 'HHI concentration on payables; exposure flagged if dominant vendor > 50%.',
      extra: metrics.supplier_concentration.is_exposed ? 'High Exposure Exposure Flagged' : 'Diversified Supplier Base',
    },
    {
      id: 'inventory',
      name: 'Inventory Efficiency',
      icon: <Package size={18} color="#10b981" />,
      severity: metrics.inventory_efficiency.severity,
      primaryMetric: `${metrics.inventory_efficiency.dio_days ?? '--'} days`,
      primaryLabel: 'Days Inventory Out (DIO)',
      secondaryMetric: `${metrics.inventory_efficiency.turnover_ratio ?? '--'}x`,
      secondaryLabel: 'Inventory Turnover',
      notes: metrics.inventory_efficiency.notes || 'Prototype formula: (Inventory / COGS) * 365',
      extra: 'Holding duration vs sales velocity',
    },
    {
      id: 'expense',
      name: 'Expense Anomalies',
      icon: <TrendingUp size={18} color="#ec4899" />,
      severity: metrics.expense_anomalies.severity,
      primaryMetric: `${metrics.expense_anomalies.anomaly_z_score > 0 ? '+' : ''}${metrics.expense_anomalies.anomaly_z_score}σ`,
      primaryLabel: 'Non-Core Z-Score',
      secondaryMetric: metrics.expense_anomalies.is_anomaly ? 'ANOMALY' : 'NORMAL',
      secondaryLabel: 'Variance Status',
      notes: metrics.expense_anomalies.notes || 'Statistical Z-score versus trailing historical baseline.',
      extra: `Baseline Mean: $${metrics.expense_anomalies.baseline_mean?.toLocaleString() ?? 'N/A'}`,
    },
    {
      id: 'cashflow',
      name: 'Cash-Flow Efficiency',
      icon: <DollarSign size={18} color="#38bdf8" />,
      severity: metrics.cash_flow_efficiency.severity,
      primaryMetric: `${metrics.cash_flow_efficiency.ccc_days} days`,
      primaryLabel: 'Cash Conversion Cycle (CCC)',
      secondaryMetric: `${metrics.cash_flow_efficiency.ocf_ni_divergence_score}`,
      secondaryLabel: 'OCF / NI Divergence',
      notes: 'CCC = DSO + DIO - DPO. High divergence indicates accounting profits without cash collections.',
      extra: `DPO: ${metrics.cash_flow_efficiency.dpo_days}d`,
    },
  ];

  const [showChain, setShowChain] = useState(false);

  // Generate the sequential chain from severe signals
  const generateChain = (): ChainNode[] => {
    const severeCards = cards.filter(c => c.severity === 'critical' || c.severity === 'elevated');
    
    return severeCards.map((c, index) => {
      let isolated = '';
      let relative = null;

      if (c.id === 'receivables') {
        isolated = 'DSO has extended beyond historical norms, trapping cash in unpaid invoices.';
        if (index > 0) relative = 'Combined with other factors, delayed collections severely restrict immediate liquidity.';
      } else if (c.id === 'inventory') {
        isolated = 'High DIO means capital is locked up in unsold goods for too long.';
        if (index > 0) relative = 'Coupled with previous factors (like slow receivables), capital is doubly locked up in both warehouses and unpaid invoices, drastically reducing cash buffer.';
      } else if (c.id === 'expense') {
        isolated = 'Non-core expenses are statistically much higher than the historical baseline.';
        if (index > 0) relative = 'Since capital is already constrained from previous operational delays, these anomalous expenses are accelerating cash burn unsustainably.';
      } else if (c.id === 'cashflow') {
        isolated = 'High divergence between OCF and Net Income shows accounting profits are not translating to cash.';
        if (index > 0) relative = 'This is the compounding result of the previous operational delays, creating a severe liquidity gap.';
      } else {
        isolated = `The metric ${c.name} is showing concerning levels.`;
        if (index > 0) relative = `This further exacerbates the stress from preceding factors.`;
      }

      return {
        id: c.id,
        name: c.name,
        severity: c.severity,
        isolatedReasoning: isolated,
        relativeReasoning: index === 0 ? null : relative
      };
    });
  };

  const chainNodes = generateChain();

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', color: '#ffffff', letterSpacing: '-0.01em' }}>
            Multi-Signal Stress Heatmap
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Evaluated deterministically across 6 core operational dimensions
          </p>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          6 of 6 Signals Active
        </span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '14px',
      }}>
        {cards.map((c) => (
          <div
            key={c.id}
            onClick={() => setSelectedSignal(selectedSignal === c.id ? null : c.id)}
            className="glass-card-interactive"
            style={{
              background: 'rgba(14, 18, 29, 0.65)',
              border: `1px solid ${getBorderGlow(c.severity)}`,
              borderRadius: '12px',
              padding: '16px',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {c.icon}
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#ffffff' }}>
                  {c.name}
                </span>
              </div>
              {getSeverityBadge(c.severity)}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', margin: '10px 0' }}>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                  {c.primaryMetric}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {c.primaryLabel}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                  {c.secondaryMetric}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {c.secondaryLabel}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
              <span>{c.extra}</span>
              <ChevronRight size={14} />
            </div>

            {selectedSignal === c.id && (
              <div style={{ marginTop: '10px', padding: '8px', background: 'rgba(0,0,0,0.4)', borderRadius: '8px', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary-accent)', marginBottom: '3px' }}>
                  <AlertCircle size={12} />
                  <strong>Analytical Context:</strong>
                </div>
                {c.notes}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <button 
          onClick={() => setShowChain(!showChain)}
          style={{
            background: showChain ? 'rgba(56, 189, 248, 0.1)' : 'var(--primary-accent)',
            color: showChain ? 'var(--primary-accent)' : '#0f172a',
            border: showChain ? '1px solid var(--primary-accent)' : 'none',
            padding: '10px 24px',
            borderRadius: '8px',
            fontSize: '0.9rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: showChain ? 'none' : '0 4px 15px rgba(56, 189, 248, 0.4)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Zap size={16} />
          {showChain ? 'Hide Chained Events' : 'Create Chained Events'}
        </button>
      </div>

      {showChain && chainNodes.length > 0 && (
        <div className="animate-slide-up" style={{ marginTop: '24px', padding: '20px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
          <h3 style={{ fontSize: '1.05rem', color: '#ffffff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={18} color="var(--primary-accent)" /> Predictive Event Chain
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {chainNodes.map((node, i) => (
              <React.Fragment key={node.id}>
                <div style={{
                  background: 'rgba(14, 18, 29, 0.8)',
                  border: `1px solid ${getBorderGlow(node.severity)}`,
                  borderRadius: '10px',
                  padding: '16px',
                  position: 'relative'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.95rem' }}>{i + 1}. {node.name}</span>
                    {getSeverityBadge(node.severity)}
                  </div>
                  
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    <strong style={{ color: '#ffffff' }}>Isolated Factor:</strong> {node.isolatedReasoning}
                  </div>
                  
                  {node.relativeReasoning && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--primary-accent)', background: 'rgba(56, 189, 248, 0.1)', padding: '8px 12px', borderRadius: '6px', borderLeft: '3px solid var(--primary-accent)' }}>
                      <strong>Compounding Effect:</strong> {node.relativeReasoning}
                    </div>
                  )}
                </div>
                
                {i < chainNodes.length - 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    <ArrowDown size={20} />
                  </div>
                )}
              </React.Fragment>
            ))}
            
            <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--text-muted)' }}>
              <ArrowDown size={20} />
            </div>
            
            {/* Final Predictive Financial Effect */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(249, 115, 22, 0.15) 100%)',
              border: '1px solid var(--severity-critical)',
              borderRadius: '10px',
              padding: '16px',
              boxShadow: '0 0 20px rgba(239, 68, 68, 0.2)'
            }}>
              <h4 style={{ color: 'var(--severity-critical)', fontSize: '1rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={18} /> Severe Financial Effect Predicted
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                The sequential chaining of these factors indicates a highly probable near-term liquidity crunch. The combined inability to collect cash quickly while inventory and expenses drain capital creates an unsustainable cash burn trajectory within the next 30-60 days. Immediate cash preservation actions are required.
              </p>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
};

