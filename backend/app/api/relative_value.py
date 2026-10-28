"""
Pairwise Relative Value Analytics Endpoints.
"""
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from app.db.repository import MarketDataRepository
from app.core.analytics import RelativeValueAnalytics
from app.models.schemas import RelativeValueSeriesResponse

router = APIRouter()


@router.get("/relative-value/series", response_model=RelativeValueSeriesResponse)
def get_relative_value_series(
    symbol_a: str = Query("GOLDM", description="First contract symbol"),
    symbol_b: str = Query("GOLDPETAL", description="Second contract symbol"),
    start_date: Optional[str] = Query(None, description="Start date YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="End date YYYY-MM-DD"),
    lookback_window: int = Query(20, ge=5, le=120, description="Rolling lookback days"),
    min_periods: int = Query(10, ge=3, le=60, description="Minimum observations before computing z-score")
):
    """
    Compute full pairwise relative spread time series, rolling statistical baselines,
    and deviation bands with strict lookahead avoidance.
    """
    if symbol_a.strip().upper() == symbol_b.strip().upper():
        raise HTTPException(status_code=400, detail="Cannot compare a contract with itself. Choose two distinct contracts.")

    records = MarketDataRepository.get_aligned_pair_observations(
        symbol_a=symbol_a,
        symbol_b=symbol_b,
        start_date=start_date,
        end_date=end_date
    )

    if not records:
        return RelativeValueSeriesResponse(
            symbol_a=symbol_a,
            symbol_b=symbol_b,
            lookback_window=lookback_window,
            total_observations=0,
            observations=[],
            summary_statistics={
                "status": "NO_OVERLAPPING_DATA",
                "message": f"No overlapping trading dates found for {symbol_a} and {symbol_b}."
            }
        )

    return RelativeValueAnalytics.compute_pair_spread_series(
        aligned_records=records,
        symbol_a=symbol_a,
        symbol_b=symbol_b,
        lookback_window=lookback_window,
        min_periods=min_periods
    )
