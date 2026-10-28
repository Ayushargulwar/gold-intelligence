"""
Tests for price normalization with hand-computed mathematical benchmarks.
"""
import pytest
from app.core.normalizer import PriceNormalizer


def test_goldm_hand_calculated_normalization():
    # GOLDM Quoted at ₹74,500 for 10g of 995 purity
    # Fine grams = 10 * 0.995 = 9.95
    # Expected INR / fine gram = 74500 / 9.95 = 7487.4371859...
    # Expected INR / 10g 999 = 7487.4371859 * 9.99 = 74799.497...
    norm = PriceNormalizer.normalize_price("GOLDM", 74500.0)
    assert norm.symbol == "GOLDM"
    assert norm.original_price == 74500.0
    assert norm.fine_grams_per_quote_unit == 9.95
    assert round(norm.normalized_price_per_fine_gram, 4) == round(74500.0 / 9.95, 4)
    assert round(norm.normalized_price_per_10g_999, 2) == round((74500.0 / 9.95) * 9.99, 2)
    assert norm.contract_notional_inr == 745000.0  # 10 * 74500
    assert len(norm.audit_trail) == 6


def test_goldpetal_hand_calculated_normalization():
    # GOLDPETAL Quoted at ₹7,485 for 1g of 999 purity
    # Fine grams = 1 * 0.999 = 0.999
    # Expected INR / fine gram = 7485 / 0.999 = 7492.49249...
    norm = PriceNormalizer.normalize_price("GOLDPETAL", 7485.0)
    assert norm.symbol == "GOLDPETAL"
    assert round(norm.normalized_price_per_fine_gram, 4) == round(7485.0 / 0.999, 4)
    assert round(norm.normalized_price_per_10g_999, 2) == 74850.0  # (7485 / 0.999) * 9.99
    assert norm.contract_notional_inr == 7485.0


def test_goldguinea_hand_calculated_normalization():
    # GOLDGUINEA Quoted at ₹59,880 for 8g of 999 purity
    # Fine grams = 8 * 0.999 = 7.992
    # Expected INR / fine gram = 59880 / 7.992 = 7492.49249...
    norm = PriceNormalizer.normalize_price("GOLDGUINEA", 59880.0)
    assert norm.symbol == "GOLDGUINEA"
    assert round(norm.normalized_price_per_fine_gram, 4) == round(59880.0 / 7.992, 4)
    assert round(norm.normalized_price_per_10g_999, 2) == 74850.0


def test_goldten_hand_calculated_normalization():
    # GOLDTEN Quoted at ₹74,850 for 10g of 999 purity
    # Fine grams = 10 * 0.999 = 9.99
    # Expected INR / fine gram = 74850 / 9.99 = 7492.49249...
    norm = PriceNormalizer.normalize_price("GOLDTEN", 74850.0)
    assert norm.symbol == "GOLDTEN"
    assert round(norm.normalized_price_per_fine_gram, 4) == round(74850.0 / 9.99, 4)
    assert round(norm.normalized_price_per_10g_999, 2) == 74850.0


def test_invalid_symbol_raises_error():
    with pytest.raises(ValueError):
        PriceNormalizer.normalize_price("INVALID_SYM", 1000.0)
