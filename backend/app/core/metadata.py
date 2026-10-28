"""
Official MCX Gold Contract Specifications and Versioned Metadata.
Provides authoritative contract parameters, units, purity, and multipliers.
"""
from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class ContractSpec(BaseModel):
    symbol: str = Field(..., description="Contract trading symbol e.g. GOLDM")
    name: str = Field(..., description="Human readable name e.g. Gold Mini")
    contract_size_grams: float = Field(..., description="Contract trading unit lot size in grams")
    quote_unit_grams: float = Field(..., description="Quotation basis unit in grams")
    stated_purity: float = Field(..., description="Purity fineness (e.g. 995 or 999)")
    tick_size_inr: float = Field(1.0, description="Minimum price movement in INR")
    delivery_unit_grams: float = Field(..., description="Delivery lot unit in grams")
    description: str = Field("", description="Contract role and notes")
    version: str = Field("MCX-SPEC-2026.1", description="Metadata version specification")
    is_active: bool = Field(True, description="Whether actively traded on MCX")
    exchange: str = Field("MCX", description="Commodity Exchange")

    @property
    def purity_fraction(self) -> float:
        """Purity as fraction of 1000 (e.g. 995/1000 = 0.995)."""
        return self.stated_purity / 1000.0

    @property
    def fine_grams_per_quote_unit(self) -> float:
        """
        Quantity of 1000-fineness pure gold represented by one quoted price unit.
        Example:
        - GOLDM: quote unit is 10g of 995 purity -> 10 * (995 / 1000) = 9.95 fine grams.
        - GOLDTEN: quote unit is 10g of 999 purity -> 10 * (999 / 1000) = 9.99 fine grams.
        - GOLDGUINEA: quote unit is 8g of 999 purity -> 8 * (999 / 1000) = 7.992 fine grams.
        - GOLDPETAL: quote unit is 1g of 999 purity -> 1 * (999 / 1000) = 0.999 fine grams.
        """
        return self.quote_unit_grams * self.purity_fraction

    @property
    def multiplier(self) -> float:
        """Contract lot multiplier (number of quoted units per contract lot)."""
        return self.contract_size_grams / self.quote_unit_grams


# Official MCX Gold Contract Reference Master (Versioned)
MCX_GOLD_CONTRACTS: Dict[str, ContractSpec] = {
    "GOLDM": ContractSpec(
        symbol="GOLDM",
        name="Gold Mini",
        contract_size_grams=100.0,
        quote_unit_grams=10.0,
        stated_purity=995.0,
        tick_size_inr=1.0,
        delivery_unit_grams=100.0,
        description="MCX 100g Mini contract. Quoted per 10g, 995 fineness. Highly liquid retail and institutional benchmark.",
        version="MCX-SPEC-2026.1",
        is_active=True,
    ),
    "GOLDTEN": ContractSpec(
        symbol="GOLDTEN",
        name="Gold Ten",
        contract_size_grams=10.0,
        quote_unit_grams=10.0,
        stated_purity=999.0,
        tick_size_inr=1.0,
        delivery_unit_grams=10.0,
        description="MCX 10g contract. Quoted per 10g, 999 fineness. Standard 999 purity retail contract.",
        version="MCX-SPEC-2026.1",
        is_active=True,
    ),
    "GOLDGUINEA": ContractSpec(
        symbol="GOLDGUINEA",
        name="Gold Guinea",
        contract_size_grams=8.0,
        quote_unit_grams=8.0,
        stated_purity=999.0,
        tick_size_inr=1.0,
        delivery_unit_grams=8.0,
        description="MCX 8g Guinea contract (1 sovereign equivalent). Quoted per 8g, 999 fineness.",
        version="MCX-SPEC-2026.1",
        is_active=True,
    ),
    "GOLDPETAL": ContractSpec(
        symbol="GOLDPETAL",
        name="Gold Petal",
        contract_size_grams=1.0,
        quote_unit_grams=1.0,
        stated_purity=999.0,
        tick_size_inr=1.0,
        delivery_unit_grams=1.0,
        description="MCX 1g Petal micro-contract. Quoted per 1g, 999 fineness. Accessible micro-hedging and savings proxy.",
        version="MCX-SPEC-2026.1",
        is_active=True,
    ),
}


def get_contract_spec(symbol: str) -> Optional[ContractSpec]:
    """Retrieve contract specification for symbol, normalized to uppercase."""
    clean_sym = symbol.strip().upper()
    return MCX_GOLD_CONTRACTS.get(clean_sym)


def get_all_contract_specs() -> List[ContractSpec]:
    """Return all active contract specifications."""
    return list(MCX_GOLD_CONTRACTS.values())


def is_valid_gold_symbol(symbol: str) -> bool:
    """Validate whether symbol is one of the supported MCX gold contracts."""
    return symbol.strip().upper() in MCX_GOLD_CONTRACTS
