export type SeverityLevel = "low" | "moderate" | "elevated" | "critical" | "unknown";

export interface AgingBuckets {
  ar_0_30?: number;
  ar_31_60?: number;
  ar_61_90?: number;
  ar_90_plus?: number;
}

export interface ReceivablesHealth {
  status: string;
  dso_proxy: number | null;
  dso_delta_90d: number | null;
  aging_buckets_raw: AgingBuckets;
  aging_buckets_pct: AgingBuckets;
  severity: SeverityLevel;
  formula_notes?: string;
  heuristic_threshold?: Record<string, number>;
}

export interface PaymentBehavior {
  status: string;
  deterioration_score: number;
  late_bucket_pct: number;
  severity: SeverityLevel;
  notes?: string;
}

export interface SupplierConcentration {
  status: string;
  hhi: number;
  max_supplier_share_pct: number;
  is_exposed: boolean;
  severity: SeverityLevel;
  notes?: string;
  heuristic_threshold?: Record<string, number>;
}

export interface InventoryEfficiency {
  status: string;
  dio_days: number | null;
  turnover_ratio: number | null;
  severity: SeverityLevel;
  notes?: string;
  heuristic_threshold?: Record<string, number>;
}

export interface ExpenseAnomalies {
  status: string;
  current_expense?: number;
  baseline_mean?: number;
  anomaly_z_score: number;
  is_anomaly: boolean;
  severity: SeverityLevel;
  notes?: string;
  heuristic_threshold?: Record<string, number>;
}

export interface CashFlowEfficiency {
  status: string;
  dpo_days: number;
  ccc_days: number;
  operating_cash_flow: number;
  net_income: number;
  ocf_ni_divergence_score: number;
  severity: SeverityLevel;
  notes?: string;
  heuristic_threshold?: Record<string, number>;
}

export interface MetricsSummary {
  receivables_health: ReceivablesHealth;
  payment_behavior: PaymentBehavior;
  supplier_concentration: SupplierConcentration;
  inventory_efficiency: InventoryEfficiency;
  expense_anomalies: ExpenseAnomalies;
  cash_flow_efficiency: CashFlowEfficiency;
}

export interface OutlookPeriod {
  day_horizon: number;
  label: string;
  projected_dso: number;
  projected_ccc: number;
  directional_stress: string;
  confidence_band: string;
}

export interface OutlookData {
  outlook_type: "projected_forecast" | "heuristic_outlook";
  is_defensible_forecast: boolean;
  quality_label: string;
  missing_evidence?: string | null;
  historical_periods_used?: number;
  periods: OutlookPeriod[];
  methodology: string;
}

export interface SignalCombination {
  signals: string[];
  interaction_mechanism: string;
  compounding_severity: string;
}

export interface PreventiveAction {
  id: string;
  title: string;
  urgency: string;
  effort: string;
  directional_impact: string;
  rationale: string;
}

export interface FirebreakAnalysis {
  id?: string;
  dataset_name: string;
  scenario_title?: string;
  scenario_description?: string;
  is_synthetic: boolean;
  processing_time_seconds: number;
  financial_stress_index: number;
  severity_zone: string;
  metrics_summary: MetricsSummary;
  outlook: OutlookData;
  risk_chain_narrative: string;
  signal_combinations: SignalCombination[];
  preventive_actions: PreventiveAction[];
  missing_columns: string[];
  ai_disclaimer: string;
  engine: string;
  heuristic_thresholds_note: string;
  persisted_via?: string;
}
