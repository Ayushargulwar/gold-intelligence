"""
Tests for relative-value pair analytics, rolling lookback, and look-ahead prevention.
"""
import pytest
import numpy as np
from app.core.analytics import RelativeValueAnalytics


def test_days_to_expiry_calculation():
    dte = RelativeValueAnalytics.calculate_days_to_expiry("2026-05-01", "2026-05-15")
    assert dte == 14
    dte_same = RelativeValueAnalytics.calculate_days_to_expiry("2026-05-15", "2026-05-15")
    assert dte_same == 0
    dte_past = RelativeValueAnalytics.calculate_days_to_expiry("2026-05-20", "2026-05-15")
    assert dte_past == 0


def test_lookahead_free_rolling_zscore():
    """
    Verify that the z-score on day t does NOT include day t in its baseline mean or std.
    """
    records = []
    # Create 30 days of data
    for i in range(30):
        # Let GOLDM price be constant 74500, GOLDPETAL constant 7485
        # Except on day 25, inject a large shock
        p_petal = 7485.0 if i != 25 else 7800.0
        records.append({
            "trading_date": f"2026-01-{i+1:02d}",
            "symbol_a": "GOLDM",
            "symbol_b": "GOLDPETAL",
            "expiry_a": "2026-04-05",
            "expiry_b": "2026-04-05",
            "close_a": 74500.0,
            "close_b": p_petal,
            "volume_a": 200,
            "volume_b": 100,
            "oi_a": 1000,
            "oi_b": 500
        })

    resp = RelativeValueAnalytics.compute_pair_spread_series(
        aligned_records=records,
        symbol_a="GOLDM",
        symbol_b="GOLDPETAL",
        lookback_window=10,
        min_periods=5
    )

    assert resp.total_observations == 30
    # First 4 observations must have z_score = None (min_periods = 5)
    for i in range(4):
        assert resp.observations[i].z_score is None

    # On day 5, z_score exists
    assert resp.observations[5].z_score is not None

    # On day 25, shock occurred
    # Its rolling mean must match the constant prior spread, NOT include day 25's shocked price!
    mean_day_25 = resp.observations[25].rolling_mean
    mean_day_24 = resp.observations[24].rolling_mean
    assert pytest.approx(mean_day_25, 1e-4) == mean_day_24


def test_empty_aligned_records():
    resp = RelativeValueAnalytics.compute_pair_spread_series(
        aligned_records=[],
        symbol_a="GOLDM",
        symbol_b="GOLDPETAL"
    )
    assert resp.total_observations == 0
    assert len(resp.observations) == 0
    assert resp.summary_statistics["status"] == "NO_DATA"
