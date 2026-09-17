import React, { useEffect, useState } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea 
} from 'recharts';
import type { FirebreakAnalysis } from '../types/firebreak';
import { TrendingUp, TrendingDown, Clock, AlertTriangle } from 'lucide-react';

import { API_BASE } from '../config';

export const TrendTab: React.FC = () => {
  const [runs, setRuns] = useState<FirebreakAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/runs`)
      .then(res => res.json())
      .then(data => {
        // API returns runs sorted by created_at DESC. We want them in ASC for the chart.
        const sortedRuns = (data.runs || []).sort((a: any, b: any) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        setRuns(sortedRuns);
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Failed to load historical runs.');
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading trends...</div>;
  }

  if (error) {
    return <div style={{ textAlign: 'center', padding: '40px', color: 'var(--severity-critical)' }}>{error}</div>;
  }

  if (runs.length === 0) {
    return <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No analysis runs recorded yet. Upload a dataset to begin.</div>;
  }

  const latestRun = runs[runs.length - 1];
  const prevRun = runs.length > 1 ? runs[runs.length - 2] : null;

  let deltaStr = '';
  let isRising = false;
  if (prevRun) {
    const delta = latestRun.financial_stress_index - prevRun.financial_stress_index;
    isRising = delta > 0;
    deltaStr = `${delta > 0 ? '+' : ''}${delta.toFixed(1)} points since last analysis`;
  } else {
    deltaStr = 'First analysis recorded';
  }

  const chartData = runs.map(r => ({
    name: new Date(r.created_at || '').toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    score: r.financial_stress_index,
    entity: r.entity_name || r.dataset_name
  }));

  return (
    <div className="glass-panel" style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '4px' }}>Financial Stress Trend</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Historical tracking of composite stress index across entities</p>
        </div>
      </div>

      <div style={{ height: '400px', width: '100%', marginBottom: '24px', position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
            <XAxis 
              dataKey="name" 
              stroke="var(--text-muted)" 
              fontSize={12} 
              tickMargin={10} 
            />
            <YAxis 
              domain={[0, 100]} 
              stroke="var(--text-muted)" 
              fontSize={12} 
              tickFormatter={(val) => `${val}`}
            />
            
            {/* Reference bands */}
            <ReferenceArea y1={0} y2={33} fill="var(--severity-low)" fillOpacity={0.05} />
            <ReferenceArea y1={33} y2={66} fill="var(--severity-elevated)" fillOpacity={0.05} />
            <ReferenceArea y1={66} y2={100} fill="var(--severity-critical)" fillOpacity={0.05} />

            <Tooltip 
              contentStyle={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-medium)', borderRadius: '8px' }}
              itemStyle={{ color: '#fff' }}
              labelStyle={{ color: 'var(--text-muted)', marginBottom: '4px' }}
              formatter={(value: any, _name: any, props: any) => [`Score: ${Number(value).toFixed(1)}`, `Entity: ${props.payload.entity}`]}
            />
            
            <Line 
              type="monotone" 
              dataKey="score" 
              stroke="var(--primary-accent)" 
              strokeWidth={3}
              dot={{ fill: 'var(--bg-surface)', stroke: 'var(--primary-accent)', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: 'var(--primary-accent)' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {/* Delta Indicator */}
        <div style={{ 
          padding: '20px', 
          background: 'var(--bg-surface-elevated)', 
          border: '1px solid var(--border-medium)',
          borderRadius: '12px'
        }}>
          <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={16} /> Latest Delta
          </h3>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
            {latestRun.financial_stress_index.toFixed(1)}
          </div>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '6px',
            padding: '6px 12px', 
            borderRadius: '20px',
            background: isRising ? 'rgba(239, 68, 68, 0.1)' : (prevRun ? 'rgba(16, 185, 129, 0.1)' : 'rgba(56, 189, 248, 0.1)'),
            color: isRising ? 'var(--severity-critical)' : (prevRun ? 'var(--severity-low)' : 'var(--primary-accent)'),
            fontSize: '0.85rem',
            fontWeight: 600
          }}>
            {isRising ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            {deltaStr}
          </div>
        </div>

        {/* Signal History Table */}
        <div style={{ 
          padding: '20px', 
          background: 'var(--bg-surface-elevated)', 
          border: '1px solid var(--border-medium)',
          borderRadius: '12px',
          overflow: 'hidden'
        }}>
          <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={16} /> Signal History
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-medium)', color: 'var(--text-muted)', textAlign: 'left' }}>
                  <th style={{ paddingBottom: '10px' }}>Date</th>
                  <th style={{ paddingBottom: '10px' }}>Entity</th>
                  <th style={{ paddingBottom: '10px' }}>Top Flagged Signals</th>
                </tr>
              </thead>
              <tbody>
                {[...runs].reverse().slice(0, 5).map((r, i) => (
                  <tr key={r.id || i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '12px 0', color: 'var(--text-secondary)' }}>
                      {new Date(r.created_at || '').toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px 0', color: '#fff', fontWeight: 500 }}>
                      {r.entity_name || r.dataset_name}
                    </td>
                    <td style={{ padding: '12px 0' }}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {(r.top_signals || []).length > 0 ? (
                          r.top_signals?.map(sig => (
                            <span key={sig} style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: 'rgba(239, 68, 68, 0.1)',
                              color: 'var(--severity-critical)',
                              fontSize: '0.75rem',
                            }}>
                              {sig.replace('_', ' ')}
                            </span>
                          ))
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>None</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
