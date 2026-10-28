"""
Tests for contract metadata and official specifications.
"""
from app.core.metadata import MCX_GOLD_CONTRACTS, get_contract_spec, is_valid_gold_symbol


def test_contract_specifications_present():
    symbols = ["GOLDM", "GOLDTEN", "GOLDGUINEA", "GOLDPETAL"]
    for sym in symbols:
        spec = get_contract_spec(sym)
        assert spec is not None
        assert spec.symbol == sym
        assert spec.is_active is True
        assert spec.exchange == "MCX"


def test_fine_grams_calculation():
    # GOLDM: 10g quote unit * (995 / 1000) = 9.95 fine grams
    goldm = get_contract_spec("GOLDM")
    assert round(goldm.fine_grams_per_quote_unit, 4) == 9.95

    # GOLDTEN: 10g quote unit * (999 / 1000) = 9.99 fine grams
    goldten = get_contract_spec("GOLDTEN")
    assert round(goldten.fine_grams_per_quote_unit, 4) == 9.99

    # GOLDGUINEA: 8g quote unit * (999 / 1000) = 7.992 fine grams
    guinea = get_contract_spec("GOLDGUINEA")
    assert round(guinea.fine_grams_per_quote_unit, 4) == 7.992

    # GOLDPETAL: 1g quote unit * (999 / 1000) = 0.999 fine grams
    petal = get_contract_spec("GOLDPETAL")
    assert round(petal.fine_grams_per_quote_unit, 4) == 0.999


def test_multipliers():
    # GOLDM: 100g contract size / 10g quote unit = 10
    assert get_contract_spec("GOLDM").multiplier == 10.0
    # GOLDTEN: 10g contract size / 10g quote unit = 1
    assert get_contract_spec("GOLDTEN").multiplier == 1.0
    # GOLDGUINEA: 8g contract size / 8g quote unit = 1
    assert get_contract_spec("GOLDGUINEA").multiplier == 1.0
    # GOLDPETAL: 1g contract size / 1g quote unit = 1
    assert get_contract_spec("GOLDPETAL").multiplier == 1.0


def test_symbol_validation():
    assert is_valid_gold_symbol("GOLDM") is True
    assert is_valid_gold_symbol("goldm") is True
    assert is_valid_gold_symbol("SILVERM") is False
    assert is_valid_gold_symbol("UNKNOWN") is False
