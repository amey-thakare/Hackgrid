import React, { useState, useEffect } from 'react';
import { Sliders, RotateCcw } from 'lucide-react';
import type { FirebreakAnalysis } from '../types/firebreak';

interface SensitivitySimulatorProps {
  analysis: FirebreakAnalysis;
}

export const SensitivitySimulator: React.FC<SensitivitySimulatorProps> = ({ analysis }) => {
  const baselineDso = analysis.metrics_summary.receivables_health.dso_proxy ?? 60;
  const baselineDio = analysis.metrics_summary.inventory_efficiency.dio_days ?? 65;
  const baselineDpo = analysis.metrics_summary.cash_flow_efficiency.dpo_days ?? 30;
  const baselineSupplier = analysis.metrics_summary.supplier_concentration.max_supplier_share_pct ?? 50;

  const [dsoDelta, setDsoDelta] = useState<number>(0);
  const [dioDelta, setDioDelta] = useState<number>(0);
  const [targetSupplier, setTargetSupplier] = useState<number>(baselineSupplier);
  const [simulationResult, setSimulationResult] = useState<any>(null);

  // Recalculate sensitivity whenever sliders move
  useEffect(() => {
    const fetchSimulation = async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/api/simulate-sensitivity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            baseline_stress_index: analysis.financial_stress_index,
            baseline_dso: baselineDso,
            baseline_dio: baselineDio,
            baseline_dpo: baselineDpo,
            baseline_supplier_max_share: baselineSupplier,
            annual_revenue: 12000000.0,
            annual_cogs: 7800000.0,
            target_dso_delta: dsoDelta,
            target_dio_delta: dioDelta,
            target_supplier_max_share: targetSupplier,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setSimulationResult(data);
        }
      } catch (e) {
        console.error('Sensitivity simulation error:', e);
      }
    };

    fetchSimulation();
  }, [dsoDelta, dioDelta, targetSupplier, analysis.financial_stress_index, baselineDso, baselineDio, baselineDpo, baselineSupplier]);

  const handleReset = () => {
    setDsoDelta(0);
    setDioDelta(0);
    setTargetSupplier(baselineSupplier);
  };

  const sim = simulationResult?.simulated;
  const isImproved = sim && sim.index_delta < 0;
  const isWorsened = sim && sim.index_delta > 0;

  return (
    <div className="glass-panel" style={{ padding: '32px', marginTop: '32px', position: 'relative', overflow: 'hidden' }}>
      {/* Glow highlight */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '300px',
        height: '100%',
        background: 'radial-gradient(circle at 100% 0%, rgba(56, 189, 248, 0.08) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={20} color="var(--primary-accent)" />
            <h2 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              What-If Sensitivity Sandbox
            </h2>
            <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '6px', background: 'rgba(56, 189, 248, 0.12)', color: 'var(--primary-accent)', fontWeight: 600 }}>
              Interactive Recalibration
            </span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Simulate the working capital and stress index impact of targeted operational interventions
          </p>
        </div>

        <button onClick={handleReset} className="btn-secondary" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
          <RotateCcw size={14} />
          <span>Reset Sliders</span>
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(320px, 1.2fr) minmax(320px, 1.8fr)',
        gap: '32px',
        alignItems: 'start',
      }}>
        {/* Left: Interactive Control Sliders */}
        <div style={{ background: 'var(--bg-glass-heavy)', padding: '28px', borderRadius: '12px', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Slider 1: DSO Delta */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.84rem' }}>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Collection Shift (DSO)</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: dsoDelta < 0 ? 'var(--severity-low)' : dsoDelta > 0 ? 'var(--severity-critical)' : 'var(--text-muted)' }}>
                {dsoDelta > 0 ? `+${dsoDelta}d` : `${dsoDelta}d`} (Simulated: {Math.round(baselineDso + dsoDelta)}d)
              </span>
            </div>
            <input
              type="range"
              min="-30"
              max="30"
              step="1"
              value={dsoDelta}
              onChange={(e) => setDsoDelta(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--primary-accent)', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '3px' }}>
              <span>-30d (Accelerate)</span>
              <span>Baseline: {Math.round(baselineDso)}d</span>
              <span>+30d (Delay)</span>
            </div>
          </div>

          {/* Slider 2: DIO Delta */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.84rem' }}>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Inventory Velocity Shift (DIO)</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: dioDelta < 0 ? 'var(--severity-low)' : dioDelta > 0 ? 'var(--severity-critical)' : 'var(--text-muted)' }}>
                {dioDelta > 0 ? `+${dioDelta}d` : `${dioDelta}d`} (Simulated: {Math.round(baselineDio + dioDelta)}d)
              </span>
            </div>
            <input
              type="range"
              min="-30"
              max="30"
              step="1"
              value={dioDelta}
              onChange={(e) => setDioDelta(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--primary-accent)', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '3px' }}>
              <span>-30d (Lean Buffer)</span>
              <span>Baseline: {Math.round(baselineDio)}d</span>
              <span>+30d (Overstock)</span>
            </div>
          </div>

          {/* Slider 3: Supplier Concentration */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.84rem' }}>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Target Top Supplier Concentration</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: targetSupplier < 40 ? 'var(--severity-low)' : targetSupplier > 60 ? 'var(--severity-critical)' : 'var(--severity-moderate)' }}>
                {targetSupplier}%
              </span>
            </div>
            <input
              type="range"
              min="15"
              max="85"
              step="1"
              value={targetSupplier}
              onChange={(e) => setTargetSupplier(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--primary-accent)', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '3px' }}>
              <span>15% (Diversified)</span>
              <span>Baseline: {Math.round(baselineSupplier)}%</span>
              <span>85% (High Exposure)</span>
            </div>
          </div>
        </div>

        {/* Right: Real-Time Impact Dashboard */}
        {sim && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '20px',
            }}>
              {/* Card 1: Stress Score Impact */}
              <div style={{ background: 'var(--bg-glass-heavy)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '20px' }}>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Recalibrated Stress Index
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                    {Math.round(sim.stress_index)}
                  </span>
                  <span style={{
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: isImproved ? 'var(--severity-low)' : isWorsened ? 'var(--severity-critical)' : 'var(--text-muted)'
                  }}>
                    {sim.index_delta > 0 ? `+${sim.index_delta}` : `${sim.index_delta}`}
                  </span>
                </div>
                <span className={`badge ${sim.severity_zone === 'Critical' ? 'badge-critical' : sim.severity_zone === 'Elevated' ? 'badge-elevated' : sim.severity_zone === 'Moderate' ? 'badge-moderate' : 'badge-low'}`} style={{ marginTop: '6px' }}>
                  {sim.severity_zone} Zone
                </span>
              </div>

              {/* Card 2: Estimated Working Capital Impact */}
              <div style={{ background: 'var(--bg-glass-heavy)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '20px' }}>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Working Capital Impact
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  <span style={{
                    fontSize: '1.6rem',
                    fontWeight: 800,
                    fontFamily: 'var(--font-display)',
                    color: sim.estimated_working_capital_freed > 0 ? 'var(--severity-low)' : sim.estimated_working_capital_freed < 0 ? 'var(--severity-critical)' : 'var(--text-muted)',
                  }}>
                    {sim.estimated_working_capital_freed > 0 ? `+$${(sim.estimated_working_capital_freed / 1000).toFixed(0)}k` : sim.estimated_working_capital_freed < 0 ? `-$${(Math.abs(sim.estimated_working_capital_freed) / 1000).toFixed(0)}k` : '$0'}
                  </span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                  {sim.estimated_working_capital_freed > 0 ? 'Liquidity Freed Up' : sim.estimated_working_capital_freed < 0 ? 'Additional Cash Tied Up' : 'No Net Shift'}
                </div>
              </div>

              {/* Card 3: New Cash Conversion Cycle */}
              <div style={{ background: 'var(--bg-glass-heavy)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '20px' }}>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Simulated CCC Cycle
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                    {Math.round(sim.ccc_days)}d
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    (was {Math.round(baselineDso + baselineDio - baselineDpo)}d)
                  </span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                  DSO: {Math.round(sim.dso_days)}d | DIO: {Math.round(sim.dio_days)}d
                </div>
              </div>
            </div>

            {/* Simulated Narrative Summary */}
            <div style={{
              background: 'var(--severity-low-bg)',
              border: '1px solid var(--severity-low-border)',
              borderRadius: '10px',
              padding: '12px 16px',
              fontSize: '0.82rem',
              color: 'var(--text-primary)',
              lineHeight: 1.5,
            }}>
              <strong>Sensitivity Analysis Synthesis: </strong>
              {simulationResult.impact_summary}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
