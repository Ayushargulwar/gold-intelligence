"""
Contract Specifications and Normalization Inspector Endpoints.
"""
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from app.core.metadata import get_all_contract_specs, get_contract_spec
from app.core.normalizer import PriceNormalizer
from app.models.schemas import ContractSpecSchema, NormalizedPriceResult

router = APIRouter()


@router.get("/contracts", response_model=List[ContractSpecSchema])
def list_contracts():
    """List all supported MCX Gold contract specifications."""
    specs = get_all_contract_specs()
    return [
        ContractSpecSchema(
            symbol=s.symbol,
            name=s.name,
            contract_size_grams=s.contract_size_grams,
            quote_unit_grams=s.quote_unit_grams,
            stated_purity=s.stated_purity,
            tick_size_inr=s.tick_size_inr,
            delivery_unit_grams=s.delivery_unit_grams,
            description=s.description,
            version=s.version,
            is_active=s.is_active,
            exchange=s.exchange,
            purity_fraction=s.purity_fraction,
            fine_grams_per_quote_unit=s.fine_grams_per_quote_unit,
            multiplier=s.multiplier
        )
        for s in specs
    ]


@router.get("/contracts/{symbol}", response_model=ContractSpecSchema)
def get_contract(symbol: str):
    """Get single contract specification by symbol."""
    spec = get_contract_spec(symbol)
    if not spec:
        raise HTTPException(status_code=404, detail=f"Contract '{symbol}' not found.")
    return ContractSpecSchema(
        symbol=spec.symbol,
        name=spec.name,
        contract_size_grams=spec.contract_size_grams,
        quote_unit_grams=spec.quote_unit_grams,
        stated_purity=spec.stated_purity,
        tick_size_inr=spec.tick_size_inr,
        delivery_unit_grams=spec.delivery_unit_grams,
        description=spec.description,
        version=spec.version,
        is_active=spec.is_active,
        exchange=spec.exchange,
        purity_fraction=spec.purity_fraction,
        fine_grams_per_quote_unit=spec.fine_grams_per_quote_unit,
        multiplier=spec.multiplier
    )


@router.get("/contracts/{symbol}/normalize", response_model=NormalizedPriceResult)
def inspect_normalization(
    symbol: str,
    price: float = Query(..., description="Quoted raw contract price in INR"),
    trading_date: Optional[str] = Query("2026-10-22", description="Trading date YYYY-MM-DD"),
    expiry_date: Optional[str] = Query("2026-12-05", description="Expiry date YYYY-MM-DD")
):
    """
    Normalization inspector endpoint.
    Converts a quoted price to INR/fine-gram and provides a 6-step audit trail.
    """
    try:
        return PriceNormalizer.normalize_price(
            symbol=symbol,
            price=price,
            trading_date=trading_date or "",
            expiry_date=expiry_date or ""
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
