import React, { useState } from 'react';
import type { MetricsSummary, SeverityLevel, BenchmarkDeltas, BenchmarkSignalDelta } from '../types/firebreak';
import { Calendar, Users, Building2, Package, TrendingUp, DollarSign, ChevronRight, AlertCircle, ArrowDown, ArrowUp, ArrowRight, Zap, CheckCircle2, ShieldCheck, BarChart3 } from 'lucide-react';

interface SignalHeatmapProps {
  metrics: MetricsSummary;
  benchmarkDeltas?: BenchmarkDeltas;
}

interface ChainNode {
  id: string;
  name: string;
  severity: SeverityLevel;
  isolatedReasoning: string;
  relativeReasoning: string | null;
}

// Maps signal card IDs to benchmark keys
const BENCHMARK_KEY_MAP: Record<string, keyof BenchmarkDeltas['signals']> = {
  receivables: 'dso_days',
  payment: 'dso_days', // Payment behavior doesn't have a direct benchmark, reuse DSO proximity
  supplier: 'vendor_concentration_hhi',
  inventory: 'inventory_days',
  expense: 'expense_anomaly_baseline',
  cashflow: 'cash_conversion_cycle',
};

const BenchmarkBadge: React.FC<{ delta: BenchmarkSignalDelta; label: string }> = ({ delta, label }) => {
  const getDeltaColor = () => {
    if (delta.direction === 'below' || delta.direction === 'at') return 'var(--severity-low)';
    if (delta.delta_pct > 20) return 'var(--severity-critical)';
    if (delta.delta_pct > 5) return 'var(--severity-elevated)';
    return 'var(--severity-low)';
  };

  const getDeltaBg = () => {
    if (delta.direction === 'below' || delta.direction === 'at') return 'rgba(16, 185, 129, 0.08)';
    if (delta.delta_pct > 20) return 'rgba(239, 68, 68, 0.08)';
    if (delta.delta_pct > 5) return 'rgba(37, 99, 235, 0.08)';
    return 'rgba(16, 185, 129, 0.08)';
  };

  const getArrowIcon = () => {
    if (delta.direction === 'above') return <ArrowUp size={11} />;
    if (delta.direction === 'below') return <ArrowDown size={11} />;
    return <ArrowRight size={11} />;
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '6px 10px',
      borderRadius: '8px',
      background: getDeltaBg(),
      border: `1px solid ${getDeltaColor()}22`,
      marginTop: '8px',
    }}>
      <BarChart3 size={13} color={getDeltaColor()} style={{ flexShrink: 0 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          {label}
        </span>
        <span style={{
          fontSize: '0.78rem',
          fontWeight: 700,
          fontFamily: 'var(--font-mono)',
          color: '#ffffff',
        }}>
          {delta.user_value}
        </span>
        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>vs</span>
        <span style={{
          fontSize: '0.78rem',
          fontWeight: 600,
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-secondary)',
        }}>
          {delta.sector_median}
        </span>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '2px',
          fontSize: '0.72rem',
          fontWeight: 700,
          color: getDeltaColor(),
        }}>
          {getArrowIcon()}
          {delta.direction === 'at' ? 'At median' : `${delta.delta_pct}% ${delta.direction}`}
        </span>
      </div>
    </div>
  );
};


export const SignalHeatmap: React.FC<SignalHeatmapProps> = ({ metrics, benchmarkDeltas }) => {
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
      benchmarkLabel: 'DSO',
    },
    {
      id: 'payment',
      name: 'Payment Behavior',
      icon: <Users size={18} color="var(--primary-purple)" />,
      severity: metrics.payment_behavior.severity,
      primaryMetric: `${metrics.payment_behavior.deterioration_score} / 100`,
      primaryLabel: 'Deterioration Score',
      secondaryMetric: `${metrics.payment_behavior.late_bucket_pct}%`,
      secondaryLabel: 'Late Bucket (>60d)',
      notes: metrics.payment_behavior.notes || 'Tracks customer payment timing friction.',
      extra: 'Past-due collection transition index',
      benchmarkLabel: 'DSO (proxy)',
    },
    {
      id: 'supplier',
      name: 'Supplier Concentration',
      icon: <Building2 size={18} color="var(--severity-moderate)" />,
      severity: metrics.supplier_concentration.severity,
      primaryMetric: `${metrics.supplier_concentration.max_supplier_share_pct}%`,
      primaryLabel: 'Top Vendor Share',
      secondaryMetric: `${Math.round(metrics.supplier_concentration.hhi)}`,
      secondaryLabel: 'Payables HHI Index',
      notes: metrics.supplier_concentration.notes || 'HHI concentration on payables; exposure flagged if dominant vendor > 50%.',
      extra: metrics.supplier_concentration.is_exposed ? 'High Exposure Exposure Flagged' : 'Diversified Supplier Base',
      benchmarkLabel: 'HHI',
    },
    {
      id: 'inventory',
      name: 'Inventory Efficiency',
      icon: <Package size={18} color="var(--severity-low)" />,
      severity: metrics.inventory_efficiency.severity,
      primaryMetric: `${metrics.inventory_efficiency.dio_days ?? '--'} days`,
      primaryLabel: 'Days Inventory Out (DIO)',
      secondaryMetric: `${metrics.inventory_efficiency.turnover_ratio ?? '--'}x`,
      secondaryLabel: 'Inventory Turnover',
      notes: metrics.inventory_efficiency.notes || 'Prototype formula: (Inventory / COGS) * 365',
      extra: 'Holding duration vs sales velocity',
      benchmarkLabel: 'DIO',
    },
    {
      id: 'expense',
      name: 'Expense Anomalies',
      icon: <TrendingUp size={18} color="var(--severity-elevated)" />,
      severity: metrics.expense_anomalies.severity,
      primaryMetric: `${metrics.expense_anomalies.anomaly_z_score > 0 ? '+' : ''}${metrics.expense_anomalies.anomaly_z_score}σ`,
      primaryLabel: 'Non-Core Z-Score',
      secondaryMetric: metrics.expense_anomalies.is_anomaly ? 'ANOMALY' : 'NORMAL',
      secondaryLabel: 'Variance Status',
      notes: metrics.expense_anomalies.notes || 'Statistical Z-score versus trailing historical baseline.',
      extra: `Baseline Mean: $${metrics.expense_anomalies.baseline_mean?.toLocaleString() ?? 'N/A'}`,
      benchmarkLabel: 'Z-Score',
    },
    {
      id: 'cashflow',
      name: 'Cash-Flow Efficiency',
      icon: <DollarSign size={18} color="var(--primary-accent)" />,
      severity: metrics.cash_flow_efficiency.severity,
      primaryMetric: `${metrics.cash_flow_efficiency.ccc_days} days`,
      primaryLabel: 'Cash Conversion Cycle (CCC)',
      secondaryMetric: `${metrics.cash_flow_efficiency.ocf_ni_divergence_score}`,
      secondaryLabel: 'OCF / NI Divergence',
      notes: 'CCC = DSO + DIO - DPO. High divergence indicates accounting profits without cash collections.',
      extra: `DPO: ${metrics.cash_flow_efficiency.dpo_days}d`,
      benchmarkLabel: 'CCC',
    },
  ];

  const [showChain, setShowChain] = useState(false);

  // Generate the sequential chain from severe or active signals
  const generateChain = (): { isHealthy: boolean; nodes: ChainNode[] } => {
    // 1. Check for severe or elevated signals
    let targetCards = cards.filter(c => c.severity === 'critical' || c.severity === 'elevated');
    
    // 2. If none, check if there are moderate signals
    if (targetCards.length === 0) {
      targetCards = cards.filter(c => c.severity === 'moderate');
    }

    // 3. If still none, all are healthy! Generate an equilibrium operational chain
    if (targetCards.length === 0) {
      const healthyCards = cards.filter(c => ['receivables', 'inventory', 'cashflow'].includes(c.id));
      const nodes = healthyCards.map((c, index) => {
        let isolated = '';
        let relative = null;

        if (c.id === 'receivables') {
          isolated = `Receivables cycle is healthy (${c.primaryMetric}), ensuring predictable inbound customer collections.`;
          if (index > 0) relative = 'Prompt cash inflows provide steady working capital to support operational outlays.';
        } else if (c.id === 'inventory') {
          isolated = `Inventory velocity (${c.primaryMetric}) is balanced, preventing capital from getting trapped in excess stock.`;
          if (index > 0) relative = 'Combined with timely customer collections, liquid capital remains unencumbered in warehouses.';
        } else if (c.id === 'cashflow') {
          isolated = `Cash conversion cycle (${c.primaryMetric}) is short and resilient with minimal accounting-to-cash divergence.`;
          if (index > 0) relative = 'Harmonized collections and inventory turnover yield an internally self-funding business cycle.';
        } else {
          isolated = `${c.name} is operating within safe historical baseline parameters.`;
          if (index > 0) relative = 'Supports overall operational stability.';
        }

        return {
          id: c.id,
          name: c.name,
          severity: c.severity,
          isolatedReasoning: isolated,
          relativeReasoning: index === 0 ? null : relative
        };
      });

      return { isHealthy: true, nodes };
    }

    const nodes = targetCards.map((c, index) => {
      let isolated = '';
      let relative = null;

      if (c.id === 'receivables') {
        isolated = 'DSO has extended beyond historical norms, trapping cash in unpaid invoices.';
        if (index > 0) relative = 'Combined with other factors, delayed collections severely restrict immediate liquidity.';
      } else if (c.id === 'payment') {
        isolated = 'Customer payment deterioration indicates lengthening collection lags.';
        if (index > 0) relative = 'Coupled with supplier and inventory commitments, cash inflow slowdown compounds liquidity stress.';
      } else if (c.id === 'supplier') {
        isolated = 'High supplier concentration increases supply disruption and pricing vulnerability.';
        if (index > 0) relative = 'Limited supplier bargaining power tightens working capital flexibility during operational stress.';
      } else if (c.id === 'inventory') {
        isolated = 'High DIO means capital is locked up in unsold goods for too long.';
        if (index > 0) relative = 'Coupled with delayed collections, working capital is locked up in both warehouses and receivables, reducing cash buffer.';
      } else if (c.id === 'expense') {
        isolated = 'Non-core expenses are statistically higher than historical baseline.';
        if (index > 0) relative = 'Constrained working capital combined with anomalous expenses accelerates cash burn unsustainably.';
      } else if (c.id === 'cashflow') {
        isolated = 'High divergence between operating cash flow and net income shows earnings are not translating to cash.';
        if (index > 0) relative = 'This is the compounding result of previous operational delays, creating an acute liquidity gap.';
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

    return { isHealthy: false, nodes };
  };

  const chainResult = generateChain();

  // Helper to get benchmark delta for a card
  const getBenchmarkForCard = (cardId: string): BenchmarkSignalDelta | null => {
    if (!benchmarkDeltas) return null;
    const key = BENCHMARK_KEY_MAP[cardId];
    if (!key) return null;
    return benchmarkDeltas.signals[key] ?? null;
  };

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h2 className="neon-text-primary" style={{ fontSize: '1.1rem', letterSpacing: '-0.01em' }}>
            Multi-Signal Stress Heatmap
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Evaluated deterministically across 6 core operational dimensions
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {benchmarkDeltas && (
            <span style={{
              fontSize: '0.72rem',
              padding: '3px 10px',
              borderRadius: '6px',
              background: 'rgba(14, 165, 233, 0.1)',
              color: 'var(--primary-accent)',
              border: '1px solid rgba(14, 165, 233, 0.25)',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}>
              <BarChart3 size={12} />
              vs {benchmarkDeltas.industry}
            </span>
          )}
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            6 of 6 Signals Active
          </span>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '14px',
      }}>
        {cards.map((c) => {
          const benchmark = getBenchmarkForCard(c.id);
          return (
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

              {/* Benchmark Comparison Row — only shown when benchmark data exists */}
              {benchmark && c.id !== 'payment' && (
                <BenchmarkBadge delta={benchmark} label={c.benchmarkLabel} />
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)', marginTop: benchmark && c.id !== 'payment' ? '8px' : '0' }}>
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
                  {benchmark && (
                    <div style={{ marginTop: '6px', padding: '6px 8px', borderRadius: '6px', background: 'rgba(14, 165, 233, 0.06)', border: '1px solid rgba(14, 165, 233, 0.12)', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                      <strong style={{ color: 'var(--primary-accent)' }}>Benchmark:</strong>{' '}
                      Your {c.benchmarkLabel} ({benchmark.user_value}) is{' '}
                      {benchmark.direction === 'at'
                        ? `at the ${benchmarkDeltas!.industry} sector median`
                        : `${benchmark.delta_pct}% ${benchmark.direction} the ${benchmarkDeltas!.industry} sector median (${benchmark.sector_median})`
                      }
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
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

      {showChain && (
        <div className="animate-slide-up" style={{
          marginTop: '24px',
          padding: '20px',
          background: chainResult.isHealthy ? 'rgba(16, 185, 129, 0.04)' : 'rgba(0,0,0,0.3)',
          borderRadius: '12px',
          border: `1px solid ${chainResult.isHealthy ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-subtle)'}`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <h3 className={chainResult.isHealthy ? '' : 'neon-text-primary'} style={{ fontSize: '1.05rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: chainResult.isHealthy ? 'var(--severity-low)' : undefined }}>
              {chainResult.isHealthy ? <CheckCircle2 size={18} color="var(--severity-low)" /> : <Zap size={18} color="var(--primary-accent)" />}
              {chainResult.isHealthy ? 'Resilient Baseline Interlock Chain' : 'Predictive Event Chain'}
            </h3>
            {chainResult.isHealthy && (
              <span className="badge badge-low" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={12} /> All Signals Stable
              </span>
            )}
          </div>

          {chainResult.isHealthy && (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
              No compounding crisis chain is currently active because all operational metrics are within healthy limits. Below is the active operational interlock demonstrating how current liquidity remains stable:
            </p>
          )}
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {chainResult.nodes.map((node, i) => (
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
                    <strong style={{ color: '#ffffff' }}>{chainResult.isHealthy ? 'Operational Status:' : 'Isolated Factor:'}</strong> {node.isolatedReasoning}
                  </div>
                  
                  {node.relativeReasoning && (
                    <div style={{
                      fontSize: '0.85rem',
                      color: chainResult.isHealthy ? 'var(--severity-low)' : 'var(--primary-accent)',
                      background: chainResult.isHealthy ? 'rgba(16, 185, 129, 0.08)' : 'rgba(56, 189, 248, 0.1)',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      borderLeft: `3px solid ${chainResult.isHealthy ? 'var(--severity-low)' : 'var(--primary-accent)'}`
                    }}>
                      <strong>{chainResult.isHealthy ? 'System Interlock:' : 'Compounding Effect:'}</strong> {node.relativeReasoning}
                    </div>
                  )}
                </div>
                
                {i < chainResult.nodes.length - 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    <ArrowDown size={20} />
                  </div>
                )}
              </React.Fragment>
            ))}
            
            <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--text-muted)' }}>
              <ArrowDown size={20} />
            </div>
            
            {/* Final Predictive Summary Card */}
            {chainResult.isHealthy ? (
              <div style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(56, 189, 248, 0.12) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                borderRadius: '10px',
                padding: '16px',
                boxShadow: '0 0 20px rgba(16, 185, 129, 0.15)'
              }}>
                <h4 style={{ fontSize: '1rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--severity-low)' }}>
                  <ShieldCheck size={18} /> Enterprise Liquidity Buffer Intact
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.5, margin: 0 }}>
                  Working capital cycles are self-funding with no compounding liquidity friction across operational dimensions.
                </p>
                <div style={{
                  marginTop: '12px',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  background: 'rgba(56, 189, 248, 0.08)',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                  fontSize: '0.82rem',
                  color: 'var(--primary-accent)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Zap size={15} style={{ flexShrink: 0 }} />
                  <span><strong>To simulate a compounding crisis:</strong> Click <strong>"Compounding Crisis"</strong> in the top Demo Scenarios bar to load stressed telemetry and watch a severe multi-stage breakdown unfold.</span>
                </div>
              </div>
            ) : (
              <div style={{
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(37, 99, 235, 0.15) 100%)',
                border: '1px solid var(--severity-critical)',
                borderRadius: '10px',
                padding: '16px',
                boxShadow: '0 0 20px rgba(239, 68, 68, 0.2)'
              }}>
                <h4 className="neon-text-critical" style={{ fontSize: '1rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertCircle size={18} /> Severe Financial Effect Predicted
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.5, margin: 0 }}>
                  The sequential chaining of these factors indicates a highly probable near-term liquidity crunch. The combined inability to collect cash quickly while inventory and expenses drain capital creates an unsustainable cash burn trajectory within the next 30-60 days. Immediate cash preservation actions are required.
                </p>
              </div>
            )}
            
          </div>
        </div>
      )}
    </div>
  );
};
