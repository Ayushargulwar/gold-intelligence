"""
Pydantic schemas and data transfer models for Gold Intelligence.
"""
from typing import List, Optional, Dict, Any
from datetime import date, datetime
from pydantic import BaseModel, Field


# Contract Specification Schemas
class ContractSpecSchema(BaseModel):
    symbol: str
    name: str
    contract_size_grams: float
    quote_unit_grams: float
    stated_purity: float
    tick_size_inr: float
    delivery_unit_grams: float
    description: str
    version: str
    is_active: bool
    exchange: str
    purity_fraction: float
    fine_grams_per_quote_unit: float
    multiplier: float


# Market Data Observation Schemas
class RawObservationCreate(BaseModel):
    trading_date: date
    symbol: str
    expiry_date: date
    open: Optional[float] = None
    high: Optional[float] = None
    low: Optional[float] = None
    close: float
    settlement_price: Optional[float] = None
    volume: Optional[int] = 0
    open_interest: Optional[int] = 0
    source: str = "UPLOAD"
    is_synthetic: bool = False


class MarketObservation(BaseModel):
    id: Optional[int] = None
    trading_date: str
    symbol: str
    expiry_date: str
    open: Optional[float] = None
    high: Optional[float] = None
    low: Optional[float] = None
    close: float
    settlement_price: Optional[float] = None
    volume: int = 0
    open_interest: int = 0
    source: str
    is_synthetic: bool = False
    created_at: Optional[str] = None


# Normalization Audit and Result Schemas
class NormalizationStep(BaseModel):
    step_number: int
    title: str
    formula: str
    input_values: Dict[str, Any]
    output_value: float
    explanation: str


class NormalizedPriceResult(BaseModel):
    symbol: str
    trading_date: str
    expiry_date: str
    original_price: float
    price_basis: str  # e.g. "close" or "settlement_price"
    quote_unit_grams: float
    stated_purity: float
    fine_grams_per_quote_unit: float
    normalized_price_per_fine_gram: float
    normalized_price_per_10g_999: float
    contract_lot_size_grams: float
    contract_notional_inr: float
    metadata_version: str
    audit_trail: List[NormalizationStep]


# Relative Value Analysis Schemas
class SpreadObservation(BaseModel):
    trading_date: str
    symbol_a: str
    symbol_b: str
    expiry_a: str
    expiry_b: str
    price_a_raw: float
    price_b_raw: float
    price_a_fine_gram: float
    price_b_fine_gram: float
    relative_spread: float  # (P_A / P_B) - 1
    relative_spread_bps: float
    absolute_diff_fine_gram: float
    rolling_mean: Optional[float] = None
    rolling_std: Optional[float] = None
    z_score: Optional[float] = None
    upper_band_1: Optional[float] = None  # mean + 1*std
    lower_band_1: Optional[float] = None  # mean - 1*std
    upper_band_2: Optional[float] = None  # mean + 2*std
    lower_band_2: Optional[float] = None  # mean - 2*std
    volume_a: int = 0
    volume_b: int = 0
    open_interest_a: int = 0
    open_interest_b: int = 0
    days_to_expiry_a: int
    days_to_expiry_b: int
    # Candlestick OHLC fields
    spread_open_bps: Optional[float] = None
    spread_high_bps: Optional[float] = None
    spread_low_bps: Optional[float] = None
    spread_close_bps: Optional[float] = None
    price_a_open_fine: Optional[float] = None
    price_a_high_fine: Optional[float] = None
    price_a_low_fine: Optional[float] = None
    price_b_open_fine: Optional[float] = None
    price_b_high_fine: Optional[float] = None
    price_b_low_fine: Optional[float] = None


class RelativeValueSeriesResponse(BaseModel):
    symbol_a: str
    symbol_b: str
    lookback_window: int
    total_observations: int
    observations: List[SpreadObservation]
    summary_statistics: Dict[str, Any]


# Filters and Anomaly Scanner Schemas
class FilterEvaluation(BaseModel):
    passed: bool
    status: str  # "PASS", "WARN", "FAIL", "INSUFFICIENT_DATA"
    reason: str
    metric_name: str
    observed_value: Any
    threshold_value: Any


class AnomalyFinding(BaseModel):
    id: str
    trading_date: str
    pair: str
    symbol_a: str
    symbol_b: str
    expiry_a: str
    expiry_b: str
    relative_spread_bps: float
    z_score: float
    classification: str  # "EXTREME_DEVIATION", "ELEVATED_DEVIATION", "NORMAL", "INSUFFICIENT_HISTORY"
    liquidity_filter: FilterEvaluation
    expiry_filter: FilterEvaluation
    cost_filter: FilterEvaluation
    overall_qualified: bool
    direction_implication: str  # e.g., "Leg A Rich (Short A, Long B)" or "Leg A Cheap (Long A, Short B)"
    narrative_explanation: str


class AnomalyScanRequest(BaseModel):
    symbol_a: Optional[str] = "GOLDM"
    symbol_b: Optional[str] = "GOLDPETAL"
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    lookback_window: int = 20
    z_threshold: float = 2.0
    min_volume: int = 10
    min_open_interest: int = 20
    min_days_to_expiry: int = 3
    max_days_to_expiry: int = 90


# Transaction Cost and Backtest Schemas
class CostModelSettings(BaseModel):
    brokerage_pct: float = Field(0.00015, description="Brokerage percentage (0.015%)")
    exchange_fee_pct: float = Field(0.000021, description="MCX turnover charge (0.0021%)")
    ctt_pct: float = Field(0.0001, description="Commodity Transaction Tax on sell (0.01%)")
    gst_pct: float = Field(0.18, description="GST 18% on brokerage & exchange fees")
    stamp_duty_pct: float = Field(0.00002, description="Stamp duty on buy (0.002%)")
    slippage_bps_per_leg: float = Field(2.5, description="Execution slippage in basis points per leg")


class BacktestRequest(BaseModel):
    symbol_a: str = "GOLDM"
    symbol_b: str = "GOLDPETAL"
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    lookback_window: int = 20
    entry_z_score: float = 2.0
    exit_z_score: float = 0.5
    stop_loss_z_score: float = 3.5
    max_holding_days: int = 15
    capital_allocation_inr: float = 1_000_000.0  # ₹10,00,000 baseline
    min_volume: int = 10
    min_days_to_expiry: int = 3
    costs: CostModelSettings = Field(default_factory=CostModelSettings)


class BacktestTradeEvent(BaseModel):
    trade_id: int
    entry_date: str
    exit_date: str
    holding_days: int
    signal_direction: str  # "SHORT_A_LONG_B" or "LONG_A_SHORT_B"
    entry_z_score: float
    exit_z_score: float
    entry_spread_bps: float
    exit_spread_bps: float
    entry_price_a: float
    entry_price_b: float
    exit_price_a: float
    exit_price_b: float
    size_a_units: float
    size_b_units: float
    gross_pnl_inr: float
    total_costs_inr: float
    net_pnl_inr: float
    return_pct: float
    exit_reason: str  # "MEAN_REVERSION", "STOP_LOSS", "MAX_HOLDING", "EXPIRY_SAFETY"


class BacktestEquityPoint(BaseModel):
    trading_date: str
    gross_equity_inr: float
    net_equity_inr: float
    cumulative_return_pct: float
    drawdown_pct: float
    benchmark_equity_inr: float
    benchmark_return_pct: float
    in_position: bool
    active_trade_id: Optional[int] = None


class BacktestMetrics(BaseModel):
    total_trades: int
    winning_trades: int
    losing_trades: int
    win_rate_pct: float
    gross_pnl_inr: float
    net_pnl_inr: float
    total_transaction_costs_inr: float
    profit_factor: Optional[float] = None
    max_drawdown_inr: float
    max_drawdown_pct: float
    average_trade_return_pct: float
    average_holding_days: float
    annualized_sharpe_ratio: Optional[float] = None
    benchmark_total_return_pct: float
    strategy_alpha_pct: float
    strategy_beta_to_gold: float
    correlation_to_gold: float


class BacktestResultResponse(BaseModel):
    parameters: Dict[str, Any]
    metrics: BacktestMetrics
    equity_curve: List[BacktestEquityPoint]
    trades: List[BacktestTradeEvent]
    insufficient_data_warning: Optional[str] = None


# Dataset Summary & Ingestion Schemas
class RejectedRow(BaseModel):
    row_number: int
    raw_data: Dict[str, Any]
    rejection_reason: str


class IngestionSummary(BaseModel):
    source_name: str
    total_rows_read: int
    valid_rows_inserted: int
    duplicate_rows_skipped: int
    rejected_rows_count: int
    rejected_rows: List[RejectedRow]
    symbols_updated: List[str]
    earliest_date: Optional[str] = None
    latest_date: Optional[str] = None
    is_synthetic: bool = False
    ingestion_timestamp: str


class DatasetSummary(BaseModel):
    total_observations: int
    supported_contracts: int
    contract_breakdown: Dict[str, int]
    earliest_date: Optional[str] = None
    latest_date: Optional[str] = None
    analyzable_pairs_count: int
    analyzable_pairs: List[str]
    has_synthetic_data: bool
    has_verified_data: bool
    last_ingestion_time: Optional[str] = None
    data_quality_issues: List[str]
