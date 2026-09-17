import React, { useState, useEffect } from 'react';
import type { FirebreakAnalysis } from '../types/firebreak';
import { API_BASE } from '../config';
import { Activity, Cpu, AlertTriangle, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';

interface ScenarioSimulatorProps {
  analysis: FirebreakAnalysis;
}

export const ScenarioSimulator: React.FC<ScenarioSimulatorProps> = ({ analysis }) => {
  const signals = analysis.metrics_summary;
  
  const baselineDso = signals.receivables_health?.dso_proxy || 45;
  const baselineVendor = signals.supplier_concentration?.max_supplier_share_pct || 30;
  const baselineInventory = signals.inventory_efficiency?.dio_days || 60;
  const baselineExpense = signals.expense_anomalies?.anomaly_z_score || 0;
  
  const [dso, setDso] = useState(baselineDso);
  const [vendor, setVendor] = useState(baselineVendor);
  const [inventory, setInventory] = useState(baselineInventory);
  const [expense, setExpense] = useState(baselineExpense);

  const [simulatedScore, setSimulatedScore] = useState<number>(analysis.financial_stress_index);
  const [signalDeltas, setSignalDeltas] = useState<Record<string, number>>({});
  const [explanation, setExplanation] = useState<string | null>(null);
  const [explaining, setExplaining] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      runSimulation();
    }, 300);
    return () => clearTimeout(timer);
  }, [dso, vendor, inventory, expense]);

  const runSimulation = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dso_days: dso,
          vendor_concentration_pct: vendor,
          inventory_days: inventory,
          expense_anomaly_score: expense,
          baseline_stress_index: analysis.financial_stress_index,
          baseline_dpo: signals.cash_flow_efficiency?.dpo_days || 45,
          baseline_payment_severity: signals.payment_behavior?.severity || "Low",
          baseline_dso: baselineDso,
          baseline_vendor_pct: baselineVendor,
          baseline_inventory: baselineInventory,
          baseline_expense_score: baselineExpense,
        })
      });
      const data = await res.json();
      if (data.simulated_stress_index !== undefined) {
        setSimulatedScore(data.simulated_stress_index);
        setSignalDeltas(data.signal_deltas);
        setExplanation(null); // Clear explanation when sliders move
      }
    } catch (e) {
      console.error("Simulation failed", e);
    }
  };

  const getExplanation = async () => {
    setExplaining(true);
    try {
      const res = await fetch(`${API_BASE}/api/simulate/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adjusted_metrics: {
            dso_days: dso,
            vendor_concentration_pct: vendor,
            inventory_days: inventory,
            expense_anomaly_score: expense,
          },
          simulated_score: simulatedScore,
          deltas: signalDeltas
        })
      });
      const data = await res.json();
      setExplanation(data.explanation);
    } catch (e) {
      console.error(e);
      setExplanation("Unable to generate AI explanation at this time.");
    } finally {
      setExplaining(false);
    }
  };

  const scoreDelta = simulatedScore - analysis.financial_stress_index;
  const isWorse = scoreDelta > 0;
  
  const getZoneColor = (score: number) => {
    if (score < 40) return 'text-emerald-400';
    if (score < 70) return 'text-amber-400';
    return 'text-rose-500';
  };

  return (
    <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6 mt-6 backdrop-blur-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-500/10 rounded-lg">
          <Activity className="w-5 h-5 text-blue-400" />
        </div>
        <h3 className="text-xl font-semibold text-slate-100">CFO What-If Scenario Simulator</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Sliders Panel */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm text-slate-300 font-medium">DSO (Days Sales Outstanding)</label>
                <span className="text-sm font-mono text-blue-300">{dso.toFixed(1)} days</span>
              </div>
              <input
                type="range"
                min="0"
                max="180"
                step="1"
                value={dso}
                onChange={(e) => setDso(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>0</span>
                <span>Baseline: {baselineDso.toFixed(1)}</span>
                <span>180</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm text-slate-300 font-medium">Top Vendor Concentration</label>
                <span className="text-sm font-mono text-blue-300">{vendor.toFixed(1)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={vendor}
                onChange={(e) => setVendor(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>0%</span>
                <span>Baseline: {baselineVendor.toFixed(1)}%</span>
                <span>100%</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm text-slate-300 font-medium">Inventory Days Outstanding (DIO)</label>
                <span className="text-sm font-mono text-blue-300">{inventory.toFixed(1)} days</span>
              </div>
              <input
                type="range"
                min="0"
                max="180"
                step="1"
                value={inventory}
                onChange={(e) => setInventory(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>0</span>
                <span>Baseline: {baselineInventory.toFixed(1)}</span>
                <span>180</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm text-slate-300 font-medium">Expense Anomaly Z-Score</label>
                <span className="text-sm font-mono text-blue-300">{expense.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                step="0.1"
                value={expense}
                onChange={(e) => setExpense(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>0</span>
                <span>Baseline: {baselineExpense.toFixed(2)}</span>
                <span>5.0</span>
              </div>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700/50 flex flex-col items-center justify-center relative overflow-hidden">
          
          <div className="text-center z-10 mb-6">
            <h4 className="text-slate-400 text-sm font-medium mb-2 uppercase tracking-wider">Simulated Stress Index</h4>
            
            <div className="flex items-end justify-center gap-4">
              <div className="text-center opacity-50 line-through">
                <span className="text-2xl font-bold font-mono">{analysis.financial_stress_index.toFixed(1)}</span>
              </div>
              <ArrowRight className="w-5 h-5 mb-2 text-slate-500" />
              <div className="text-center">
                <span className={`text-6xl font-bold font-mono tracking-tight ${getZoneColor(simulatedScore)}`}>
                  {simulatedScore.toFixed(1)}
                </span>
              </div>
            </div>

            {Math.abs(scoreDelta) > 0.1 && (
              <div className={`flex items-center justify-center gap-1 mt-2 text-sm font-medium ${isWorse ? 'text-rose-400' : 'text-emerald-400'}`}>
                {isWorse ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {Math.abs(scoreDelta).toFixed(1)} pts {isWorse ? 'worse' : 'better'}
              </div>
            )}
          </div>

          <button 
            onClick={getExplanation}
            disabled={explaining || Math.abs(scoreDelta) < 0.1}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg font-medium transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 z-10"
          >
            <Cpu className="w-4 h-4" />
            {explaining ? "Analyzing impact..." : "What does this mean?"}
          </button>
        </div>
      </div>
      
      {explanation && (
        <div className="mt-6 p-4 bg-blue-950/30 border border-blue-800/50 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <p className="text-slate-300 text-sm leading-relaxed">{explanation}</p>
          </div>
        </div>
      )}
    </div>
  );
};
