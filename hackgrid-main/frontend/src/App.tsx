import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { FirebreakMeter } from './components/FirebreakMeter';
import { SignalHeatmap } from './components/SignalHeatmap';
import { NarrativePanel } from './components/NarrativePanel';
import { OutlookChart } from './components/OutlookChart';
import { ActionPlaybook } from './components/ActionPlaybook';
import { SensitivitySimulator } from './components/SensitivitySimulator';
import { HistoryDrawer } from './components/HistoryDrawer';
import { ExportModal } from './components/ExportModal';
import { UploadModal } from './components/UploadModal';
import { AiDisclaimer } from './components/AiDisclaimer';
import type { FirebreakAnalysis } from './types/firebreak';
import { AlertTriangle, Sparkles, Database } from 'lucide-react';

const API_BASE = 'http://localhost:8000';

export function App() {
  const [analysis, setAnalysis] = useState<FirebreakAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [activeScenario, setActiveScenario] = useState<string>('crisis');
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [engineName, setEngineName] = useState<string>('Gemini 2.5 Flash');

  const handleSelectHistoricalRun = (run: any) => {
    // Reconstruct full analysis object if loaded from DB
    const reconstructed: FirebreakAnalysis = {
      ...run,
      scenario_title: `Historical Run: ${run.dataset_name}`,
      scenario_description: `Run evaluated at ${new Date(run.created_at).toLocaleString()}`,
      processing_time_seconds: run.processing_time_seconds ?? 0.05,
      metrics_summary: typeof run.metrics_summary === 'string' ? JSON.parse(run.metrics_summary) : run.metrics_summary,
      outlook: typeof run.outlook === 'string' ? JSON.parse(run.outlook) : run.outlook,
      signal_combinations: typeof run.signal_combinations === 'string' ? JSON.parse(run.signal_combinations) : run.signal_combinations,
      preventive_actions: typeof run.preventive_actions === 'string' ? JSON.parse(run.preventive_actions) : run.preventive_actions,
      missing_columns: run.missing_columns ?? [],
      ai_disclaimer: run.ai_disclaimer ?? 'Outputs are analytical signals for human review and do not constitute financial advice.',
      engine: run.engine ?? 'Historical Run',
      heuristic_thresholds_note: 'Thresholds and zones are prototype design heuristics.',
    };
    setAnalysis(reconstructed);
  };

  // Load initial synthetic crisis demo on startup (PRD T-22)
  useEffect(() => {
    loadDemoScenario('crisis');
  }, []);

  const loadDemoScenario = async (scenario: string) => {
    setIsLoading(true);
    setError(null);
    setActiveScenario(scenario);
    setLoadingStep('Retrieving synthetic enterprise scenario...');

    try {
      setLoadingStep('Executing Python metric & 30/60/90 outlook computation...');
      const response = await fetch(`${API_BASE}/api/demo/${scenario}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Analysis service unavailable - please retry.');
      }

      setLoadingStep('Single-prompt Gemini AI synthesis in progress...');
      const data: FirebreakAnalysis = await response.json();
      setAnalysis(data);
      if (data.engine) {
        setEngineName(data.engine);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Analysis service unavailable - please retry.');
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  const handleCustomUpload = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setIsUploadOpen(false);
    setActiveScenario('custom');
    setLoadingStep('Validating and ingesting CSV in-memory (No raw persistence)...');

    const formData = new FormData();
    formData.append('file', file);

    try {
      setLoadingStep('Computing 6 signal dimensions & trend projections...');
      const response = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Analysis service unavailable - please retry.');
      }

      setLoadingStep('Synthesizing risk-chain narrative with Gemini...');
      const data: FirebreakAnalysis = await response.json();
      setAnalysis(data);
      if (data.engine) {
        setEngineName(data.engine);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Analysis service unavailable - please retry.');
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <Navbar
        onLoadDemo={loadDemoScenario}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        isLoading={isLoading}
        activeScenario={activeScenario}
        isSynthetic={analysis?.is_synthetic ?? true}
        engineName={engineName}
      />

      {/* Main Content Area */}
      <main style={{
        maxWidth: '1540px',
        margin: '0 auto',
        width: '100%',
        padding: '24px 28px',
        flex: 1,
      }}>
        {/* Scenario Info Bar */}
        {analysis && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
            padding: '12px 18px',
            borderRadius: '12px',
            background: 'rgba(14, 18, 29, 0.65)',
            border: '1px solid var(--border-subtle)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {analysis.is_synthetic ? (
                <span className="badge badge-synthetic">
                  <Sparkles size={11} /> Synthetic Benchmark
                </span>
              ) : (
                <span className="badge" style={{ background: 'rgba(56, 189, 248, 0.15)', color: 'var(--primary-accent)', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                  Custom Dataset
                </span>
              )}

              <div>
                <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#ffffff', marginRight: '8px' }}>
                  {analysis.scenario_title || analysis.dataset_name}
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {analysis.scenario_description || `File: ${analysis.dataset_name}`}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {analysis.persisted_via && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--font-mono)' }}>
                  <Database size={13} color="var(--primary-accent)" />
                  Persisted to: {analysis.persisted_via.toUpperCase()}
                </span>
              )}
              <span>Processing: <strong style={{ color: '#ffffff' }}>{analysis.processing_time_seconds}s</strong></span>
            </div>
          </div>
        )}

        {/* Error Alert (PRD T-17) */}
        {error && (
          <div style={{
            padding: '16px 20px',
            borderRadius: '12px',
            background: 'var(--severity-critical-bg)',
            border: '1px solid var(--severity-critical-border)',
            color: 'var(--severity-critical)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
          }} id="error-alert-banner">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertTriangle size={20} />
              <span style={{ fontWeight: 600 }}>{error}</span>
            </div>
            <button
              onClick={() => loadDemoScenario('crisis')}
              className="btn-secondary"
              style={{ fontSize: '0.78rem', padding: '6px 12px' }}
            >
              Retry Demo Scenario
            </button>
          </div>
        )}

        {/* Loading Spinner Overlay (PRD T-25) */}
        {isLoading && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(7, 9, 14, 0.82)',
            backdropFilter: 'blur(10px)',
            zIndex: 999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
          }} id="analysis-loading-state">
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              border: '3px solid rgba(56, 189, 248, 0.2)',
              borderTopColor: 'var(--primary-accent)',
              animation: 'spin 0.8s linear infinite',
            }} />
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', fontFamily: 'var(--font-display)' }}>
              Analyzing Financial Firebreak
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              {loadingStep}
            </div>
          </div>
        )}

        {/* Dashboard Panels */}
        {analysis && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            {/* Top Grid: Meter (40%) + Narrative (60%) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(320px, 4.2fr) minmax(450px, 6.8fr)',
              gap: '22px',
              alignItems: 'stretch',
            }}>
              <FirebreakMeter
                score={analysis.financial_stress_index}
                severityZone={analysis.severity_zone}
                processingTime={analysis.processing_time_seconds}
              />
              <NarrativePanel
                narrative={analysis.risk_chain_narrative}
                signalCombinations={analysis.signal_combinations}
                engine={analysis.engine}
              />
            </div>

            {/* Middle Grid: 30/60/90 Outlook (50%) + Action Playbook (50%) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '22px',
              alignItems: 'stretch',
            }}>
              <OutlookChart outlook={analysis.outlook} />
              <ActionPlaybook actions={analysis.preventive_actions} />
            </div>

            {/* Lower Grid: 6-Dimension Signal Heatmap (Full Width) */}
            <SignalHeatmap metrics={analysis.metrics_summary} />

            {/* What-If Operational Sensitivity Simulator */}
            <SensitivitySimulator analysis={analysis} />
          </div>
        )}

        {/* Persistent AI Disclaimer (PRD OC-02, T-23) */}
        <AiDisclaimer customText={analysis?.ai_disclaimer} />
      </main>

      {/* Upload CSV Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUpload={handleCustomUpload}
        isLoading={isLoading}
      />

      {/* History Runs Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelectRun={handleSelectHistoricalRun}
      />

      {/* Executive Briefing Export Modal */}
      {analysis && (
        <ExportModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          analysis={analysis}
        />
      )}

      {/* Global CSS animation for spinner */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}

export default App;

