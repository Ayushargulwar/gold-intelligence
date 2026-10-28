export interface ContractSpec {
  symbol: string;
  name: string;
  contract_size_grams: number;
  quote_unit_grams: number;
  stated_purity: number;
  tick_size_inr: number;
  delivery_unit_grams: number;
  description: string;
  version: string;
  is_active: boolean;
  exchange: string;
  purity_fraction: number;
  fine_grams_per_quote_unit: number;
  multiplier: number;
}

export interface NormalizationStep {
  step_number: number;
  title: string;
  formula: string;
  input_values: Record<string, any>;
  output_value: number;
  explanation: string;
}

export interface NormalizedPriceResult {
  symbol: string;
  trading_date: string;
  expiry_date: string;
  original_price: number;
  price_basis: string;
  quote_unit_grams: number;
  stated_purity: number;
  fine_grams_per_quote_unit: number;
  normalized_price_per_fine_gram: number;
  normalized_price_per_10g_999: number;
  contract_lot_size_grams: number;
  contract_notional_inr: number;
  metadata_version: string;
  audit_trail: NormalizationStep[];
}

export interface SpreadObservation {
  trading_date: string;
  symbol_a: string;
  symbol_b: string;
  expiry_a: string;
  expiry_b: string;
  price_a_raw: number;
  price_b_raw: number;
  price_a_fine_gram: number;
  price_b_fine_gram: number;
  relative_spread: number;
  relative_spread_bps: number;
  absolute_diff_fine_gram: number;
  rolling_mean: number | null;
  rolling_std: number | null;
  z_score: number | null;
  upper_band_1: number | null;
  lower_band_1: number | null;
  upper_band_2: number | null;
  lower_band_2: number | null;
  volume_a: number;
  volume_b: number;
  open_interest_a: number;
  open_interest_b: number;
  days_to_expiry_a: number;
  days_to_expiry_b: number;
  spread_open_bps?: number | null;
  spread_high_bps?: number | null;
  spread_low_bps?: number | null;
  spread_close_bps?: number | null;
  price_a_open_fine?: number | null;
  price_a_high_fine?: number | null;
  price_a_low_fine?: number | null;
  price_b_open_fine?: number | null;
  price_b_high_fine?: number | null;
  price_b_low_fine?: number | null;
}

export interface RelativeValueSeriesResponse {
  symbol_a: string;
  symbol_b: string;
  lookback_window: number;
  total_observations: number;
  observations: SpreadObservation[];
  summary_statistics: Record<string, any>;
}

export interface FilterEvaluation {
  passed: boolean;
  status: 'PASS' | 'WARN' | 'FAIL' | 'INSUFFICIENT_DATA';
  reason: string;
  metric_name: string;
  observed_value: any;
  threshold_value: any;
}

export interface AnomalyFinding {
  id: string;
  trading_date: string;
  pair: string;
  symbol_a: string;
  symbol_b: string;
  expiry_a: string;
  expiry_b: string;
  relative_spread_bps: number;
  z_score: number;
  classification: 'EXTREME_DEVIATION' | 'ELEVATED_DEVIATION' | 'NORMAL' | 'INSUFFICIENT_HISTORY';
  liquidity_filter: FilterEvaluation;
  expiry_filter: FilterEvaluation;
  cost_filter: FilterEvaluation;
  overall_qualified: boolean;
  direction_implication: string;
  narrative_explanation: string;
}

export interface CostModelSettings {
  brokerage_pct: number;
  exchange_fee_pct: number;
  ctt_pct: number;
  gst_pct: number;
  stamp_duty_pct: number;
  slippage_bps_per_leg: number;
}

export interface BacktestParams {
  symbol_a: string;
  symbol_b: string;
  start_date?: string;
  end_date?: string;
  lookback_window: number;
  entry_z_score: number;
  exit_z_score: number;
  stop_loss_z_score: number;
  max_holding_days: number;
  capital_allocation_inr: number;
  min_volume: number;
  min_days_to_expiry: number;
  costs: CostModelSettings;
}

export interface BacktestTradeEvent {
  trade_id: number;
  entry_date: string;
  exit_date: string;
  holding_days: number;
  signal_direction: string;
  entry_z_score: number;
  exit_z_score: number;
  entry_spread_bps: number;
  exit_spread_bps: number;
  entry_price_a: number;
  entry_price_b: number;
  exit_price_a: number;
  exit_price_b: number;
  size_a_units: number;
  size_b_units: number;
  gross_pnl_inr: number;
  total_costs_inr: number;
  net_pnl_inr: number;
  return_pct: number;
  exit_reason: string;
}

export interface BacktestEquityPoint {
  trading_date: string;
  gross_equity_inr: number;
  net_equity_inr: number;
  cumulative_return_pct: number;
  drawdown_pct: number;
  benchmark_equity_inr: number;
  benchmark_return_pct: number;
  in_position: boolean;
  active_trade_id: number | null;
}

export interface BacktestMetrics {
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  win_rate_pct: number;
  gross_pnl_inr: number;
  net_pnl_inr: number;
  total_transaction_costs_inr: number;
  profit_factor: number | null;
  max_drawdown_inr: number;
  max_drawdown_pct: number;
  average_trade_return_pct: number;
  average_holding_days: number;
  annualized_sharpe_ratio: number | null;
  benchmark_total_return_pct: number;
  strategy_alpha_pct: number;
  strategy_beta_to_gold: number;
  correlation_to_gold: number;
}

export interface BacktestResultResponse {
  parameters: Record<string, any>;
  metrics: BacktestMetrics;
  equity_curve: BacktestEquityPoint[];
  trades: BacktestTradeEvent[];
  insufficient_data_warning: string | null;
}

export interface DatasetSummary {
  total_observations: number;
  supported_contracts: number;
  contract_breakdown: Record<string, number>;
  earliest_date: string | null;
  latest_date: string | null;
  analyzable_pairs_count: number;
  analyzable_pairs: string[];
  has_synthetic_data: boolean;
  has_verified_data: boolean;
  last_ingestion_time: string | null;
  data_quality_issues: string[];
}

export interface IngestionSummary {
  source_name: string;
  total_rows_read: number;
  valid_rows_inserted: number;
  duplicate_rows_skipped: number;
  rejected_rows_count: number;
  rejected_rows: Array<{
    row_number: number;
    raw_data: Record<string, any>;
    rejection_reason: string;
  }>;
  symbols_updated: string[];
  earliest_date: string | null;
  latest_date: string | null;
  is_synthetic: boolean;
  ingestion_timestamp: string;
}
