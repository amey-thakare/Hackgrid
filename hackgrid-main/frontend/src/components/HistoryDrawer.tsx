import React, { useState, useEffect, useMemo } from 'react';
import { History, X, Database, Search, ChevronRight, RefreshCw, FileText } from 'lucide-react';
import { API_BASE } from '../config';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All');

  const fetchRuns = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/runs?limit=50`);
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

  const filteredRuns = useMemo(() => {
    return runs.filter((r) => {
      const matchesSearch = r.dataset_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            r.id?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' || r.severity_zone?.toUpperCase() === statusFilter.toUpperCase();
      const matchesSource = sourceFilter === 'All' || 
                            (sourceFilter === 'Synthetic' && r.is_synthetic) || 
                            (sourceFilter === 'Real' && !r.is_synthetic);
      return matchesSearch && matchesStatus && matchesSource;
    });
  }, [runs, searchQuery, statusFilter, sourceFilter]);

  const stats = useMemo(() => {
    return {
      total: runs.length,
      critical: runs.filter(r => r.severity_zone?.toUpperCase() === 'CRITICAL').length,
      elevated: runs.filter(r => r.severity_zone?.toUpperCase() === 'ELEVATED').length,
      low: runs.filter(r => r.severity_zone?.toUpperCase() === 'LOW').length,
    };
  }, [runs]);

  if (!isOpen) return null;

  const getSeverityColor = (zone: string) => {
    const upper = zone?.toUpperCase();
    if (upper === 'CRITICAL') return 'var(--severity-critical)';
    if (upper === 'ELEVATED') return 'var(--severity-elevated)';
    if (upper === 'MODERATE') return 'var(--severity-moderate)';
    return 'var(--severity-low)';
  };

  const getSeverityBadgeClass = (zone: string) => {
    const upper = zone?.toUpperCase();
    if (upper === 'CRITICAL') return 'badge badge-critical';
    if (upper === 'ELEVATED') return 'badge badge-elevated';
    if (upper === 'MODERATE') return 'badge badge-moderate';
    return 'badge badge-low';
  };

  const StatBox = ({ label, value, color }: { label: string, value: number, color?: string }) => (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
      borderRadius: '8px',
      padding: '12px 16px',
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: '4px'
    }}>
      <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: '1.25rem', fontWeight: 700, color: color || 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{value}</span>
    </div>
  );

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ alignItems: 'flex-start', paddingTop: '40px', overflowY: 'auto' }}>
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '950px',
          margin: '0 auto',
          background: 'var(--bg-base)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1100,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9), 0 0 40px rgba(14, 165, 233, 0.1)',
          minHeight: '400px',
          maxHeight: 'calc(100vh - 80px)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Area */}
        <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '8px', background: 'var(--bg-surface-elevated)', borderRadius: '8px', border: '1px solid var(--border-medium)' }}>
                <History size={24} color="var(--primary-accent)" />
              </div>
              <div>
                <h2 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', lineHeight: '1.2' }}>Analysis Run History</h2>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Review previous financial firebreak analyses and risk assessments.</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button onClick={fetchRuns} className="btn-secondary" title="Refresh runs" style={{ padding: '8px' }}>
                <RefreshCw size={16} className={isLoading ? 'spin' : ''} />
              </button>
              <button onClick={onClose} className="btn-ghost" style={{ padding: '8px' }}>
                <X size={20} />
              </button>
            </div>
          </div>
          
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '16px' }}>
            <Database size={12} color="var(--primary-accent)" />
            <span>Persisted to Supabase / SQLite &bull; Derived metrics only (DC-02)</span>
          </div>
        </div>

        {/* Summary Bar */}
        <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-glass-heavy)', display: 'flex', gap: '16px', flexShrink: 0, flexWrap: 'wrap' }}>
          <StatBox label="Total Runs" value={stats.total} />
          <StatBox label="Critical" value={stats.critical} color="var(--severity-critical)" />
          <StatBox label="Elevated" value={stats.elevated} color="var(--severity-elevated)" />
          <StatBox label="Low Risk" value={stats.low} color="var(--severity-low)" />
        </div>

        {/* Filters */}
        <div style={{ padding: '16px 32px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: '16px', alignItems: 'center', background: 'var(--bg-base)', flexShrink: 0, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search filename or run ID..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ 
                width: '100%', 
                background: 'var(--bg-surface)', 
                border: '1px solid var(--border-medium)', 
                borderRadius: '6px', 
                padding: '8px 12px 8px 36px',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                outline: 'none',
              }} 
            />
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-medium)', color: 'var(--text-secondary)', padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem', outline: 'none' }}>
              <option value="All">All Status</option>
              <option value="CRITICAL">Critical</option>
              <option value="ELEVATED">Elevated</option>
              <option value="MODERATE">Moderate</option>
              <option value="LOW">Low</option>
            </select>
            <select 
              value={sourceFilter} 
              onChange={(e) => setSourceFilter(e.target.value)}
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-medium)', color: 'var(--text-secondary)', padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem', outline: 'none' }}>
              <option value="All">All Sources</option>
              <option value="Synthetic">Synthetic</option>
              <option value="Real">Real Data</option>
            </select>
          </div>
        </div>

        {/* Runs List Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', position: 'relative', minHeight: '0' }}>
          
          {/* Timeline Connector Line */}
          {!isLoading && filteredRuns.length > 0 && (
            <div style={{ position: 'absolute', left: '46px', top: '44px', bottom: '44px', width: '2px', background: 'var(--border-subtle)', zIndex: 0 }} />
          )}

          {isLoading && runs.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', zIndex: 1 }}>
              {[1,2,3].map(i => (
                <div key={i} style={{ height: '110px', background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border-subtle)', animation: 'pulse-synthetic 2s infinite' }} />
              ))}
            </div>
          )}

          {!isLoading && filteredRuns.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)', position: 'relative', zIndex: 1 }}>
              <History size={48} color="var(--border-medium)" style={{ margin: '0 auto 16px auto' }} />
              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '8px' }}>No analysis runs found</h3>
              <p style={{ fontSize: '0.85rem', maxWidth: '300px', margin: '0 auto' }}>Try adjusting your search filters or run a new financial analysis.</p>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative', zIndex: 1 }}>
            {filteredRuns.map((r) => {
              const score = r.financial_stress_index ?? 50;
              const dateObj = r.created_at ? new Date(r.created_at) : new Date();
              const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
              
              const ccc = r.metrics_summary?.cash_flow_efficiency?.ccc_days;
              const dso = r.metrics_summary?.receivables_health?.dso_proxy;
              
              const cccDisplay = ccc !== undefined ? `${Math.round(ccc)}d` : '—';
              const dsoDisplay = dso !== undefined ? `${Math.round(dso)}d` : '—';
              
              const zoneColor = getSeverityColor(r.severity_zone || 'Unknown');

              return (
                <div key={r.id} style={{ display: 'flex', alignItems: 'stretch', gap: '16px' }}>
                  {/* Timeline Dot */}
                  <div style={{ width: '14px', display: 'flex', justifyContent: 'center', marginTop: '40px', position: 'relative', zIndex: 2 }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--bg-base)', border: `2px solid ${zoneColor}`, boxShadow: `0 0 10px ${zoneColor}40`, flexShrink: 0 }} />
                  </div>
                  
                  {/* Card */}
                  <div
                    onClick={() => {
                      onSelectRun(r);
                      onClose();
                    }}
                    className="glass-card-interactive"
                    style={{
                      flex: 1,
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-medium)',
                      borderRadius: '12px',
                      padding: '20px 24px',
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                      flexWrap: 'wrap',
                      gap: '16px',
                    }}
                  >
                    {/* Left Column (Meta) */}
                    <div style={{ flex: '0 0 280px', paddingRight: '20px', borderRight: '1px solid var(--border-subtle)', minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', minWidth: 0 }}>
                        <FileText size={16} color="var(--primary-accent)" style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, minWidth: 0 }}>
                          {r.dataset_name || 'Analysis Run'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        Analysis completed &bull; {dateStr} {timeStr}
                      </div>
                    </div>

                    {/* Middle Column (Metrics) */}
                    <div style={{ flex: '1 1 auto', display: 'grid', gridTemplateColumns: 'minmax(120px, 1.2fr) minmax(80px, 1fr) minmax(80px, 1fr) minmax(90px, 1fr)', alignItems: 'center', gap: '16px', padding: '0 16px', minWidth: 0 }}>
                      
                      {/* Risk Score */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Risk Score</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '2px' }}>
                          <span style={{ fontSize: '2rem', fontWeight: 800, color: zoneColor, fontFamily: 'var(--font-mono)', lineHeight: '1.1' }}>
                            {Math.round(score)}
                          </span>
                          <span className={getSeverityBadgeClass(r.severity_zone || 'Unknown')} style={{ fontSize: '0.65rem', padding: '4px 8px', alignSelf: 'center' }}>
                            {r.severity_zone ? r.severity_zone.toUpperCase() : 'ZONE'}
                          </span>
                        </div>
                      </div>

                      {/* Cash Flow */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, whiteSpace: 'nowrap' }}>Cash Flow</span>
                        <span style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', lineHeight: '1.2', marginTop: '4px' }}>
                          {cccDisplay}
                        </span>
                      </div>

                      {/* Receivables */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, whiteSpace: 'nowrap' }}>Receivables</span>
                        <span style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', lineHeight: '1.2', marginTop: '4px' }}>
                          {dsoDisplay}
                        </span>
                      </div>
                      
                      {/* Source */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0, alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Source</span>
                        <div style={{ marginTop: '4px' }}>
                          {r.is_synthetic ? (
                            <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(14, 165, 233, 0.4)', color: '#38bdf8', background: 'rgba(14, 165, 233, 0.1)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, display: 'inline-block' }}>Synthetic</span>
                          ) : (
                            <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border-medium)', color: 'var(--text-secondary)', background: 'var(--bg-surface-elevated)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, display: 'inline-block' }}>Real Data</span>
                          )}
                        </div>
                      </div>

                    </div>

                    {/* Right Column (Action) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingLeft: '16px', borderLeft: '1px solid var(--border-subtle)', flexShrink: 0, minWidth: '110px', justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-link)', fontWeight: 500, whiteSpace: 'nowrap' }}>View Details</span>
                      <ChevronRight size={16} color="var(--text-link)" style={{ flexShrink: 0 }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
