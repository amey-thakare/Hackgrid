-- ====================================================================
-- FinSight Financial Firebreak v1.1 — Supabase Database Migration
-- Table: analysis_runs
-- Constraint DC-02: Only derived metrics and analysis outputs are stored.
-- Raw financial CSV records are NEVER stored in this database.
-- ====================================================================

-- 1. Create table
CREATE TABLE IF NOT EXISTS public.analysis_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    dataset_name TEXT NOT NULL,
    is_synthetic INTEGER NOT NULL DEFAULT 0,
    financial_stress_index NUMERIC(5,2) NOT NULL,
    severity_zone TEXT NOT NULL,
    metrics_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
    risk_chain_narrative TEXT NOT NULL DEFAULT '',
    signal_combinations JSONB NOT NULL DEFAULT '[]'::jsonb,
    outlook JSONB NOT NULL DEFAULT '{}'::jsonb,
    preventive_actions JSONB NOT NULL DEFAULT '[]'::jsonb
);

-- 2. Performance indexes
CREATE INDEX IF NOT EXISTS idx_analysis_runs_created_at ON public.analysis_runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analysis_runs_stress_index ON public.analysis_runs(financial_stress_index);
CREATE INDEX IF NOT EXISTS idx_analysis_runs_synthetic ON public.analysis_runs(is_synthetic);

-- 3. Row Level Security (RLS)
ALTER TABLE public.analysis_runs ENABLE ROW LEVEL SECURITY;

-- Allow public read access to analysis runs for prototype demo
CREATE POLICY "Allow public read access to analysis_runs"
ON public.analysis_runs
FOR SELECT
TO anon, authenticated
USING (true);

-- Allow public insert access for prototype demo runs
CREATE POLICY "Allow public insert to analysis_runs"
ON public.analysis_runs
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

COMMENT ON TABLE public.analysis_runs IS 'Stores derived executive stress indexes, risk narratives, and action playbooks. Zero raw transaction rows are persisted.';
