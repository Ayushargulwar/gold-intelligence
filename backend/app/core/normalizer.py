"""
Contract Price Normalization Engine.
Converts heterogeneous MCX gold contract quotes into comparable INR/fine-gram units.
Generates comprehensive step-by-step mathematical audit trails for judges and researchers.
"""
from typing import Optional, Dict, Any, List
from app.core.metadata import get_contract_spec, ContractSpec
from app.models.schemas import NormalizedPriceResult, NormalizationStep


class PriceNormalizer:
    """Quantitative normalization engine for MCX Gold contracts."""

    @staticmethod
    def normalize_price(
        symbol: str,
        price: float,
        trading_date: str = "",
        expiry_date: str = "",
        price_basis: str = "close"
    ) -> NormalizedPriceResult:
        """
        Normalize a contract quoted price to INR per pure fine gram (1000 fineness)
        and INR per 10g standard 999 benchmark.
        """
        spec = get_contract_spec(symbol)
        if not spec:
            raise ValueError(f"Unknown contract specification for symbol: {symbol}")

        raw_price = float(price)
        quote_grams = spec.quote_unit_grams
        stated_purity = spec.stated_purity
        purity_fraction = stated_purity / 1000.0
        fine_grams = quote_grams * purity_fraction
        
        # Primary canonical metric: INR per 1 fine gram of pure (1000/1000) gold
        price_per_fine_gram = raw_price / fine_grams

        # Secondary reference metric: INR per 10 grams of 999 standard benchmark gold
        # 10g of 999 gold contains 10 * 0.999 = 9.99 fine grams
        price_per_10g_999 = price_per_fine_gram * 9.99

        # Contract lot total notional value
        lot_size_grams = spec.contract_size_grams
        multiplier = spec.multiplier
        contract_notional = raw_price * multiplier

        # Construct explainability audit trail
        audit_trail: List[NormalizationStep] = [
            NormalizationStep(
                step_number=1,
                title="Quotation Basis Identification",
                formula="Q_unit = spec.quote_unit_grams",
                input_values={"symbol": spec.symbol, "quote_unit_grams": quote_grams},
                output_value=quote_grams,
                explanation=f"{spec.name} is officially quoted on MCX in INR per {quote_grams:.1f} grams."
            ),
            NormalizationStep(
                step_number=2,
                title="Purity Fineness Verification",
                formula="Purity_fraction = stated_purity / 1000.0",
                input_values={"stated_purity": stated_purity},
                output_value=purity_fraction,
                explanation=f"Specification specifies gold fineness of {stated_purity:.0f}/1000 ({purity_fraction * 100:.1f}% gold content)."
            ),
            NormalizationStep(
                step_number=3,
                title="Fine Grams per Quoted Unit",
                formula="Fine_Grams = Q_unit * (Purity / 1000)",
                input_values={"quote_unit_grams": quote_grams, "purity_fraction": purity_fraction},
                output_value=round(fine_grams, 6),
                explanation=f"One quoted contract unit represents exactly {fine_grams:.4f} grams of 100% fine gold."
            ),
            NormalizationStep(
                step_number=4,
                title="Canonical Normalization (INR / fine gram)",
                formula="P_fine_gram = Raw_Price / Fine_Grams",
                input_values={"raw_price": raw_price, "fine_grams": fine_grams},
                output_value=round(price_per_fine_gram, 4),
                explanation=f"Dividing ₹{raw_price:,.2f} by {fine_grams:.4f}g yields ₹{price_per_fine_gram:,.4f} per 1.0g of pure gold."
            ),
            NormalizationStep(
                step_number=5,
                title="Benchmark Equivalent (INR / 10g 999)",
                formula="P_10g_999 = P_fine_gram * 9.99",
                input_values={"price_per_fine_gram": round(price_per_fine_gram, 4), "benchmark_fine_grams": 9.99},
                output_value=round(price_per_10g_999, 2),
                explanation=f"Scaled to standard MCX 10g 999 benchmark price: ₹{price_per_10g_999:,.2f} per 10 grams."
            ),
            NormalizationStep(
                step_number=6,
                title="Full Contract Lot Notional",
                formula="Notional = Raw_Price * (Lot_Size_Grams / Quote_Unit_Grams)",
                input_values={"raw_price": raw_price, "lot_size_grams": lot_size_grams, "multiplier": multiplier},
                output_value=round(contract_notional, 2),
                explanation=f"Full lot size {lot_size_grams:.0f}g represents ₹{contract_notional:,.2f} notional exposure."
            )
        ]

        return NormalizedPriceResult(
            symbol=spec.symbol,
            trading_date=trading_date,
            expiry_date=expiry_date,
            original_price=raw_price,
            price_basis=price_basis,
            quote_unit_grams=quote_grams,
            stated_purity=stated_purity,
            fine_grams_per_quote_unit=fine_grams,
            normalized_price_per_fine_gram=price_per_fine_gram,
            normalized_price_per_10g_999=price_per_10g_999,
            contract_lot_size_grams=lot_size_grams,
            contract_notional_inr=contract_notional,
            metadata_version=spec.version,
            audit_trail=audit_trail
        )
