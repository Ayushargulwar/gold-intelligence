"""
Tests for liquidity filters, tender-period expiry safety, and MCX cost model.
"""
from app.core.filters import QuantitativeFilters
from app.core.cost_model import TransactionCostEngine
from app.models.schemas import CostModelSettings


def test_liquidity_filter_evaluation():
    # Pass scenario
    res_pass = QuantitativeFilters.evaluate_liquidity(volume_a=150, volume_b=80, oi_a=600, oi_b=300, min_volume=10, min_oi=20)
    assert res_pass.passed is True
    assert res_pass.status == "PASS"

    # Warning scenario (low OI)
    res_warn = QuantitativeFilters.evaluate_liquidity(volume_a=150, volume_b=80, oi_a=10, oi_b=5, min_volume=10, min_oi=20)
    assert res_warn.passed is True
    assert res_warn.status == "WARN"

    # Fail scenario (low volume)
    res_fail = QuantitativeFilters.evaluate_liquidity(volume_a=150, volume_b=3, oi_a=600, oi_b=300, min_volume=10, min_oi=20)
    assert res_fail.passed is False
    assert res_fail.status == "FAIL"

    # None data scenario
    res_none = QuantitativeFilters.evaluate_liquidity(volume_a=None, volume_b=80, oi_a=0, oi_b=0)
    assert res_none.passed is False
    assert res_none.status == "INSUFFICIENT_DATA"


def test_expiry_filter_evaluation():
    # Normal DTE
    res_pass = QuantitativeFilters.evaluate_expiry(dte_a=45, dte_b=45, min_days_to_expiry=3)
    assert res_pass.passed is True
    assert res_pass.status == "PASS"

    # Near expiry warning
    res_warn = QuantitativeFilters.evaluate_expiry(dte_a=5, dte_b=5, min_days_to_expiry=3)
    assert res_warn.passed is True
    assert res_warn.status == "WARN"

    # Tender period hazard (DTE <= 2)
    res_fail_tender = QuantitativeFilters.evaluate_expiry(dte_a=2, dte_b=2, min_days_to_expiry=3)
    assert res_fail_tender.passed is False
    assert res_fail_tender.status == "FAIL"

    # Excessive divergence (> 65 days)
    res_fail_div = QuantitativeFilters.evaluate_expiry(dte_a=10, dte_b=85, max_expiry_divergence_days=65)
    assert res_fail_div.passed is False
    assert res_fail_div.status == "FAIL"


def test_mcx_transaction_cost_calculation():
    settings = CostModelSettings(
        brokerage_pct=0.00015,
        exchange_fee_pct=0.000021,
        ctt_pct=0.0001,
        gst_pct=0.18,
        stamp_duty_pct=0.00002,
        slippage_bps_per_leg=2.5
    )

    # ₹500,000 notional per leg
    friction = TransactionCostEngine.calculate_trade_friction(
        notional_entry_a=500000.0,
        notional_exit_a=500000.0,
        notional_entry_b=500000.0,
        notional_exit_b=500000.0,
        direction="SHORT_A_LONG_B",
        settings=settings
    )

    assert friction["total_turnover"] == 2000000.0  # 4 x ₹500k
    assert friction["brokerage"] == 300.0  # 2M * 0.00015
    assert round(friction["exchange_fees"], 2) == 42.0  # 2M * 0.000021
    # CTT only on sell turnover: Entry A (500k) + Exit B (500k) = 1M sell turnover -> 1M * 0.0001 = ₹100
    assert friction["ctt"] == 100.0
    # Stamp duty only on buy turnover: Entry B (500k) + Exit A (500k) = 1M buy turnover -> 1M * 0.00002 = ₹20
    assert friction["stamp_duty"] == 20.0
    # GST: 18% of (300 + 42) = 61.56
    assert round(friction["gst"], 2) == 61.56
    # Total friction must be > 0 and include slippage
    assert friction["total_cost"] > 500.0
