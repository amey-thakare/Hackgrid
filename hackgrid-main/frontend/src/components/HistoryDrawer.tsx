import React, { useState, useEffect } from 'react';
import { History, X, Database, Calendar, ChevronRight, RefreshCw } from 'lucide-react';
import type { FirebreakAnalysis } from '../types/firebreak';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRun: (run: FirebreakAnalysis) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  onSelectRun,
}) => {
  const [runs, setRuns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchRuns = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/runs?limit=15');
      if (res.ok) {
        const data = await res.json();
        setRuns(data.runs || []);
      }
    } catch (e) {
      console.error('Failed to fetch runs:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRuns();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getSeverityBadgeClass = (score: number) => {
    if (score >= 80) return 'badge badge-critical';
    if (score >= 60) return 'badge badge-elevated';
    if (score >= 35) return 'badge badge-moderate';
    return 'badge badge-low';
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="glass-panel"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          maxWidth: '460px',
          background: 'var(--bg-base)',
          borderLeft: '1px solid var(--border-medium)',
          borderRadius: 0,
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1100,
          boxShadow: 'var(--shadow-card)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', paddingBottom: '14px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={20} color="var(--primary-accent)" />
            <h2 style={{ fontSize: '1.15rem', color: 'var(--text-primary)' }}>Analysis Run History</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button onClick={fetchRuns} className="btn-ghost" title="Refresh runs">
              <RefreshCw size={15} className={isLoading ? 'spin' : ''} />
            </button>
            <button onClick={onClose} className="btn-ghost">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Subtitle / DB Note */}
        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Database size={13} color="var(--primary-accent)" />
          <span>Persisted to Supabase / SQLite &bull; Derived metrics only (DC-02)</span>
        </div>

        {/* Runs List */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {isLoading && runs.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              Loading historical runs...
            </div>
          )}

          {!isLoading && runs.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              No historical runs recorded yet.
            </div>
          )}

          {runs.map((r, idx) => {
            const score = r.financial_stress_index ?? 50;
            const dateStr = r.created_at ? new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Recent';

            return (
              <div
                key={r.id || idx}
                onClick={() => {
                  onSelectRun(r);
                  onClose();
                }}
                className="glass-card-interactive"
                style={{
                  background: 'var(--bg-glass-heavy)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.15s ease',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {r.dataset_name || 'Analysis Run'}
                    </span>
                    {r.is_synthetic ? (
                      <span className="badge badge-synthetic" style={{ fontSize: '0.65rem', padding: '1px 5px' }}>
                        Synthetic
                      </span>
                    ) : null}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={11} />
                    <span>{dateStr}</span>
                    <span>&bull;</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>{r.persisted_via ? r.persisted_via.toUpperCase() : 'DB'}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                      {Math.round(score)}
                    </div>
                    <span className={getSeverityBadgeClass(score)} style={{ fontSize: '0.62rem', padding: '1px 5px' }}>
                      {r.severity_zone || 'Zone'}
                    </span>
                  </div>
                  <ChevronRight size={16} color="var(--text-muted)" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
