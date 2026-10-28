"""
Tests for chronological walk-forward backtester, next-bar execution, and benchmark comparison.
"""
from app.core.analytics import RelativeValueAnalytics
from app.core.backtest import RelativeValueBacktester
from app.models.schemas import BacktestRequest, CostModelSettings


def test_walkforward_backtest_execution():
    # Build 60 days of synthetic pair data with clear mean-reverting deviations
    records = []
    base_price = 74000.0

    for i in range(60):
        # Introduce deviation around day 25 and 45
        shock = 0.0
        if 20 <= i <= 24:
            shock = 1000.0  # Leg A gets rich
        elif 40 <= i <= 44:
            shock = -1000.0  # Leg A gets cheap

        records.append({
            "trading_date": f"2026-02-{i+1:02d}" if i < 28 else f"2026-03-{i-27:02d}",
            "symbol_a": "GOLDM",
            "symbol_b": "GOLDPETAL",
            "expiry_a": "2026-06-05",
            "expiry_b": "2026-06-05",
            "close_a": (base_price + shock) * (9.95 / 9.95),  # 10g quote
            "close_b": (base_price / 10.0) * (0.999 / 0.999),  # 1g quote
            "volume_a": 250,
            "volume_b": 120,
            "oi_a": 1500,
            "oi_b": 800
        })

    series = RelativeValueAnalytics.compute_pair_spread_series(
        aligned_records=records,
        symbol_a="GOLDM",
        symbol_b="GOLDPETAL",
        lookback_window=10,
        min_periods=5
    )

    request = BacktestRequest(
        symbol_a="GOLDM",
        symbol_b="GOLDPETAL",
        lookback_window=10,
        entry_z_score=1.8,
        exit_z_score=0.5,
        capital_allocation_inr=1000000.0,
        costs=CostModelSettings(brokerage_pct=0.0001, slippage_bps_per_leg=1.0)
    )

    result = RelativeValueBacktester.run_backtest(
        observations=series.observations,
        params=request
    )

    assert result.insufficient_data_warning is None
    assert len(result.equity_curve) == 60
    assert result.metrics.total_trades >= 1
    # Check that gross PnL and net PnL are properly computed
    assert result.metrics.gross_pnl_inr != 0.0
    assert result.metrics.total_transaction_costs_inr > 0.0
    # Net PnL must equal Gross PnL - Total Costs
    expected_net = result.metrics.gross_pnl_inr - result.metrics.total_transaction_costs_inr
    assert abs(result.metrics.net_pnl_inr - expected_net) < 0.05
