import React from 'react';
import { Sparkles, Network, ShieldCheck } from 'lucide-react';
import type { SignalCombination } from '../types/firebreak';

interface NarrativePanelProps {
  narrative: string;
  signalCombinations: SignalCombination[];
  engine?: string;
}

export const NarrativePanel: React.FC<NarrativePanelProps> = ({
  narrative,
  signalCombinations,
}) => {
  return (
    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={18} color="var(--primary-accent)" />
          <h2 className="neon-text-primary" style={{ fontSize: '1.1rem', letterSpacing: '-0.01em' }}>
            AI Financial Risk-Chain Narrative
          </h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.72rem', padding: '3px 8px', borderRadius: '6px', background: 'rgba(56, 189, 248, 0.1)', color: 'var(--primary-accent)', border: '1px solid rgba(56, 189, 248, 0.25)', fontFamily: 'var(--font-mono)' }}>
            Single-Prompt Synthesis
          </span>
        </div>
      </div>

      {/* Narrative Body */}
      <div style={{
        background: 'rgba(10, 14, 23, 0.6)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '12px',
        padding: '18px',
        fontSize: '0.92rem',
        lineHeight: 1.65,
        color: '#e2e8f0',
        marginBottom: '16px',
        boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.4)',
      }} id="risk-chain-narrative-text">
        {narrative || "No narrative generated yet. Load a synthetic demo dataset or upload a financial CSV to begin analysis."}
      </div>

      {/* Guardrail Labeling */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
        <ShieldCheck size={14} color="var(--severity-low)" />
        <span>Distinguishes observed operational evidence from inferred risk-chain interactions (No causal claims asserted).</span>
      </div>

      {/* Interacting Signal Combinations */}
      {signalCombinations && signalCombinations.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
            <Network size={14} color="var(--primary-accent)" />
            <span>Identified Compound Signal Interactions:</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {signalCombinations.map((combo, idx) => (
              <div
                key={idx}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {combo.signals.map((sig, sIdx) => (
                    <span
                      key={sIdx}
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: 'rgba(56, 189, 248, 0.12)',
                        color: 'var(--primary-accent)',
                      }}
                    >
                      {sig}
                    </span>
                  ))}
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {combo.interaction_mechanism}
                  </span>
                </div>

                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: combo.compounding_severity === 'Critical' ? 'var(--severity-critical-bg)' : 'var(--severity-moderate-bg)',
                  color: combo.compounding_severity === 'Critical' ? 'var(--severity-critical)' : 'var(--severity-moderate)',
                }}>
                  {combo.compounding_severity}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

