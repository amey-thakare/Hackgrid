import React from 'react';
import { Activity, Info } from 'lucide-react';

interface FirebreakMeterProps {
  score: number;
  severityZone: string;
  processingTime?: number;
}

export const FirebreakMeter: React.FC<FirebreakMeterProps> = ({
  score,
  severityZone,
  processingTime,
}) => {
  // Bounded 0-100
  const normalizedScore = Math.max(0, Math.min(100, score));

  // Determine color theme based on score & severity
  const getSeverityColor = () => {
    if (normalizedScore >= 80) return 'var(--severity-critical)';
    if (normalizedScore >= 60) return 'var(--severity-elevated)';
    if (normalizedScore >= 35) return 'var(--severity-moderate)';
    return 'var(--severity-low)';
  };

  const getSeverityBadgeClass = () => {
    if (normalizedScore >= 80) return 'badge badge-critical';
    if (normalizedScore >= 60) return 'badge badge-elevated';
    if (normalizedScore >= 35) return 'badge badge-moderate';
    return 'badge badge-low';
  };

  const activeColor = getSeverityColor();

  // SVG Gauge calculations
  // Arc from 140deg to 400deg (260 degree arc)
  const radius = 88;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * (260 / 360);
  const strokeDashoffset = arcLength - (normalizedScore / 100) * arcLength;

  return (
    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={18} color="var(--primary-accent)" />
          <h2 style={{ fontSize: '1.05rem', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Firebreak Meter
          </h2>
        </div>
        <span className={getSeverityBadgeClass()} id="firebreak-severity-badge">
          {severityZone} Zone
        </span>
      </div>

      <div style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '10px 0',
      }}>
        {/* SVG Circular Gauge */}
        <svg width="220" height="170" viewBox="0 0 220 170" style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id="meterGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="35%" stopColor="#f59e0b" />
              <stop offset="70%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
            <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Track Arc */}
          <path
            d="M 35 150 A 88 88 0 1 1 185 150"
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Active Value Arc */}
          <path
            d="M 35 150 A 88 88 0 1 1 185 150"
            fill="none"
            stroke={activeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            filter="url(#glowFilter)"
            style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.4s ease' }}
          />

          {/* Zone Tick Markers */}
          {/* Low to Moderate (~35%) */}
          <circle cx="68" cy="72" r="3" fill="rgba(255,255,255,0.4)" />
          {/* Moderate to Elevated (~60%) */}
          <circle cx="110" cy="52" r="3" fill="rgba(255,255,255,0.4)" />
          {/* Elevated to Critical (~80%) */}
          <circle cx="152" cy="72" r="3" fill="rgba(255,255,255,0.4)" />
        </svg>

        {/* Center Numeric Readout */}
        <div style={{
          position: 'absolute',
          top: '68px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}>
          <span style={{
            fontSize: '3.1rem',
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            lineHeight: 1,
            color: activeColor,
            textShadow: `0 0 25px ${activeColor}40`,
          }} id="firebreak-score-value">
            {Math.round(normalizedScore)}
          </span>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '4px' }}>
            Financial Stress Index
          </span>
        </div>
      </div>

      {/* Heuristic Severity Zones Labeling (PRD T-21, OC-05) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '6px',
        marginTop: '8px',
        background: 'rgba(0,0,0,0.3)',
        padding: '8px',
        borderRadius: '10px',
        border: '1px solid var(--border-subtle)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--severity-low)' }}>Low</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>0–34</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--severity-moderate)' }}>Moderate</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>35–59</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--severity-elevated)' }}>Elevated</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>60–79</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--severity-critical)' }}>Critical</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>80–100</div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Info size={12} />
          <span>Labeled Prototype Heuristic Thresholds</span>
        </div>
        {processingTime !== undefined && (
          <span style={{ fontFamily: 'var(--font-mono)' }}>{processingTime}s response</span>
        )}
      </div>
    </div>
  );
};

