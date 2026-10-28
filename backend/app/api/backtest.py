"""
Chronological Walk-Forward Backtesting Endpoints.
"""
from fastapi import APIRouter, HTTPException
from app.db.repository import MarketDataRepository
from app.core.analytics import RelativeValueAnalytics
from app.core.backtest import RelativeValueBacktester
from app.models.schemas import BacktestRequest, BacktestResultResponse

router = APIRouter()


@router.post("/backtest/run", response_model=BacktestResultResponse)
def run_backtest(params: BacktestRequest):
    """
    Execute chronological walk-forward relative-value backtest with next-bar execution,
    realistic MCX regulatory fee friction, and directional gold benchmark comparison.
    """
    if params.symbol_a.strip().upper() == params.symbol_b.strip().upper():
        raise HTTPException(status_code=400, detail="Cannot backtest a contract against itself.")

    records = MarketDataRepository.get_aligned_pair_observations(
        symbol_a=params.symbol_a,
        symbol_b=params.symbol_b,
        start_date=params.start_date,
        end_date=params.end_date
    )

    if not records:
        raise HTTPException(
            status_code=400,
            detail=f"No aligned historical data found for {params.symbol_a} and {params.symbol_b}."
        )

    series_resp = RelativeValueAnalytics.compute_pair_spread_series(
        aligned_records=records,
        symbol_a=params.symbol_a,
        symbol_b=params.symbol_b,
        lookback_window=params.lookback_window,
        min_periods=max(5, params.lookback_window // 2)
    )

    result = RelativeValueBacktester.run_backtest(
        observations=series_resp.observations,
        params=params
    )

    return result
