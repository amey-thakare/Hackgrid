import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, FileText, AlertCircle, CheckCircle, Download, Building2 } from 'lucide-react';

import { API_BASE } from '../config';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File, entityName: string) => void;
  isLoading: boolean;
  selectedIndustry: string;
  onIndustryChange: (industry: string) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onUpload,
  isLoading,
  selectedIndustry,
  onIndustryChange,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [entityName, setEntityName] = useState<string>('');
  const [industries, setIndustries] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch available industries from the backend
  useEffect(() => {
    if (isOpen) {
      fetch(`${API_BASE}/api/benchmarks`)
        .then(res => res.json())
        .then(data => {
          setIndustries(Object.keys(data));
        })
        .catch(() => {
          // Silently fail — benchmarks are optional
          setIndustries([]);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const validateAndSelect = (file: File) => {
    setError(null);
    // T-03: Non-CSV validation
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Only CSV files are supported.');
      return;
    }
    // T-04: Size limit 10MB
    if (file.size > 10 * 1024 * 1024) {
      setError('File exceeds 10MB limit.');
      return;
    }
    setSelectedFile(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSelect(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSelect(e.target.files[0]);
    }
  };

  const handleSubmit = () => {
    if (selectedFile) {
      onUpload(selectedFile, entityName);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '520px',
          padding: '28px',
          background: 'var(--bg-glass-heavy)',
          border: '1px solid var(--border-medium)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>Upload Financial Data</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Standard ERP / Accounting CSV export (Max 10MB)
            </p>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ padding: '6px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Drag & Drop Area */}
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          style={{
            border: `2px dashed ${dragActive ? 'var(--primary-accent)' : 'var(--border-medium)'}`,
            borderRadius: '12px',
            padding: '36px 20px',
            textAlign: 'center',
            cursor: 'pointer',
            background: dragActive ? 'var(--severity-low-bg)' : 'var(--bg-surface-hover)',
            transition: 'all 0.2s ease',
            marginBottom: '18px',
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            style={{ display: 'none' }}
            onChange={handleChange}
          />
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'var(--bg-surface-elevated)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px auto',
          }}>
            <Upload size={22} color="var(--primary-accent)" />
          </div>
          <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
            {selectedFile ? selectedFile.name : 'Click to select or drag and drop CSV'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            CSV up to 10MB &bull; Raw records are parsed in-memory and never stored
          </div>
          <div style={{ marginTop: '12px' }}>
            <a
              href="http://127.0.0.1:8000/api/sample-csv"
              download="sample_financial_export.csv"
              onClick={(e) => e.stopPropagation()}
              className="btn-ghost"
              style={{ fontSize: '0.74rem', color: 'var(--primary-accent)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
            >
              <Download size={13} />
              <span>Download Standard Template CSV</span>
            </a>
          </div>
        </div>

        {/* Industry Benchmark Selector */}
        {industries.length > 0 && (
          <div style={{
            marginBottom: '16px',
            padding: '12px 14px',
            borderRadius: '10px',
            background: 'rgba(14, 165, 233, 0.06)',
            border: '1px solid rgba(14, 165, 233, 0.15)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <Building2 size={15} color="var(--primary-accent)" />
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Industry Benchmark (Optional)
              </span>
            </div>
            <select
              value={selectedIndustry}
              onChange={(e) => onIndustryChange(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-medium)',
                background: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                outline: 'none',
                cursor: 'pointer',
                appearance: 'auto',
              }}
            >
              <option value="">— No benchmark (default) —</option>
              {industries.map((ind) => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '6px' }}>
              Selecting an industry adds sector median comparisons to each signal dimension.
            </p>
          </div>
        )}

        {/* Entity Name Input */}
        <div style={{
          marginBottom: '16px',
          padding: '12px 14px',
          borderRadius: '10px',
          background: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-medium)',
        }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <Building2 size={15} color="var(--text-primary)" />
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Entity Name (Optional)
              </span>
            </div>
            <input 
              type="text" 
              value={entityName}
              onChange={(e) => setEntityName(e.target.value)}
              placeholder="e.g. Acme Corp (Q3)"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-medium)',
                background: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            />
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '6px' }}>
              Label this analysis run for historical trend tracking.
            </p>
        </div>

        {/* Selected file card */}
        {selectedFile && !error && (
          <div style={{
            background: 'var(--severity-low-bg)',
            border: '1px solid var(--severity-low-border)',
            borderRadius: '8px',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} color="var(--severity-low)" />
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{selectedFile.name}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </div>
              </div>
            </div>
            <CheckCircle size={18} color="var(--severity-low)" />
          </div>
        )}

        {/* Error message */}
        {error && (
          <div style={{
            background: 'var(--severity-critical-bg)',
            border: '1px solid var(--severity-critical-border)',
            borderRadius: '8px',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px',
            color: 'var(--severity-critical)',
            fontSize: '0.82rem',
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Data Privacy Note (DC-02, DC-05) */}
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: '20px' }}>
          <strong>Privacy Boundary (PRD DC-02 / DC-05):</strong> Uploaded CSV data is never stored in the database.
          Only derived numerical aggregates and stress signals are generated and analyzed.
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
          <button onClick={onClose} className="btn-secondary" disabled={isLoading}>
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="btn-primary"
            disabled={!selectedFile || !!error || isLoading}
          >
            {isLoading ? 'Processing In-Memory...' : 'Analyze Financial Stress'}
          </button>
        </div>
      </div>
    </div>
  );
};
