import React from 'react';
import { ShieldAlert, Upload, Sparkles, Database, RefreshCw, Cpu, History, FileDown } from 'lucide-react';

interface NavbarProps {
  onLoadDemo: (scenario: string) => void;
  onOpenUpload: () => void;
  onOpenHistory: () => void;
  onOpenExport: () => void;
  isLoading: boolean;
  activeScenario: string;
  engineName: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onLoadDemo,
  onOpenUpload,
  onOpenHistory,
  onOpenExport,
  isLoading,
  activeScenario,
  engineName,
}) => {
  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 28px',
      borderBottom: '1px solid var(--border-subtle)',
      background: 'rgba(7, 9, 14, 0.85)',
      backdropFilter: 'blur(20px)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      {/* Brand & Identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 20px rgba(56, 189, 248, 0.4)',
        }}>
          <ShieldAlert size={24} color="#ffffff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>
              FIN<span style={{ color: 'var(--primary-accent)' }}>SIGHT</span>
            </span>

          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            AI-Powered Early-Warning Decision Support &bull; Team White-Monster
          </div>
        </div>
      </div>

      {/* Center Actions: 1-Click Demo Loaders */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.03)', padding: '4px 6px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', paddingLeft: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Demo Scenarios:
        </span>
        <button
          onClick={() => onLoadDemo('crisis')}
          disabled={isLoading}
          className={`btn-ghost ${activeScenario === 'crisis' ? 'active-scenario' : ''}`}
          style={{
            fontWeight: 600,
            fontSize: '0.82rem',
            color: activeScenario === 'crisis' ? 'var(--severity-critical)' : 'var(--text-secondary)',
            background: activeScenario === 'crisis' ? 'var(--severity-critical-bg)' : 'transparent',
            border: activeScenario === 'crisis' ? '1px solid var(--severity-critical-border)' : '1px solid transparent',
          }}
        >
          {isLoading && activeScenario === 'crisis' ? <RefreshCw size={13} className="spin" /> : <ShieldAlert size={13} />}
          Compounding Crisis
        </button>

        <button
          onClick={() => onLoadDemo('healthy')}
          disabled={isLoading}
          className={`btn-ghost ${activeScenario === 'healthy' ? 'active-scenario' : ''}`}
          style={{
            fontWeight: 600,
            fontSize: '0.82rem',
            color: activeScenario === 'healthy' ? 'var(--severity-low)' : 'var(--text-secondary)',
            background: activeScenario === 'healthy' ? 'var(--severity-low-bg)' : 'transparent',
            border: activeScenario === 'healthy' ? '1px solid var(--severity-low-border)' : '1px solid transparent',
          }}
        >
          {isLoading && activeScenario === 'healthy' ? <RefreshCw size={13} className="spin" /> : <Sparkles size={13} />}
          Healthy Benchmark
        </button>

        <button
          onClick={() => onLoadDemo('supplier_exposure')}
          disabled={isLoading}
          className={`btn-ghost ${activeScenario === 'supplier_exposure' ? 'active-scenario' : ''}`}
          style={{
            fontWeight: 600,
            fontSize: '0.82rem',
            color: activeScenario === 'supplier_exposure' ? 'var(--severity-elevated)' : 'var(--text-secondary)',
            background: activeScenario === 'supplier_exposure' ? 'var(--severity-elevated-bg)' : 'transparent',
            border: activeScenario === 'supplier_exposure' ? '1px solid var(--severity-elevated-border)' : '1px solid transparent',
          }}
        >
          {isLoading && activeScenario === 'supplier_exposure' ? <RefreshCw size={13} className="spin" /> : <Database size={13} />}
          80% Supplier Exposure
        </button>
      </div>

      {/* Right Actions: History, Export, Upload & Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-muted)', marginRight: '4px' }}>
          <Cpu size={14} color="var(--primary-accent)" />
          <span style={{ fontFamily: 'var(--font-mono)' }}>{engineName.replace('_', ' ')}</span>
        </div>

        <button
          onClick={onOpenHistory}
          className="btn-secondary"
          style={{ fontSize: '0.82rem', padding: '8px 14px' }}
          title="Browse historical analysis runs"
        >
          <History size={14} />
          <span>History</span>
        </button>

        <button
          onClick={onOpenExport}
          className="btn-secondary"
          style={{ fontSize: '0.82rem', padding: '8px 14px' }}
          title="Export executive briefing report"
        >
          <FileDown size={14} />
          <span>Export</span>
        </button>

        <button
          onClick={onOpenUpload}
          className="btn-primary"
          id="btn-upload-csv"
          disabled={isLoading}
        >
          <Upload size={16} />
          <span>Upload CSV</span>
        </button>
      </div>
    </header>
  );
};

