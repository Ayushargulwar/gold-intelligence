"""
Statistical Anomaly Scanner Endpoints.
"""
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from app.db.repository import MarketDataRepository
from app.core.analytics import RelativeValueAnalytics
from app.core.anomaly import AnomalyScannerEngine
from app.models.schemas import AnomalyFinding, AnomalyScanRequest, CostModelSettings

router = APIRouter()


@router.get("/anomalies/scan", response_model=List[AnomalyFinding])
def scan_anomalies(
    symbol_a: str = Query("GOLDM"),
    symbol_b: str = Query("GOLDPETAL"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    lookback_window: int = Query(20, ge=5, le=120),
    z_threshold: float = Query(2.0, ge=1.0, le=5.0),
    min_volume: int = Query(10, ge=0),
    min_open_interest: int = Query(20, ge=0),
    min_days_to_expiry: int = Query(3, ge=0),
    max_days_to_expiry: int = Query(90, ge=5),
    brokerage_pct: float = Query(0.00015),
    slippage_bps: float = Query(2.5)
):
    """
    Scan pairwise market history for statistical deviations and evaluate them
    against liquidity, tender-period expiry safety, and round-trip execution cost hurdles.
    """
    if symbol_a.strip().upper() == symbol_b.strip().upper():
        raise HTTPException(status_code=400, detail="Leg A and Leg B must be different contracts.")

    records = MarketDataRepository.get_aligned_pair_observations(
        symbol_a=symbol_a,
        symbol_b=symbol_b,
        start_date=start_date,
        end_date=end_date
    )

    if not records:
        return []

    series_resp = RelativeValueAnalytics.compute_pair_spread_series(
        aligned_records=records,
        symbol_a=symbol_a,
        symbol_b=symbol_b,
        lookback_window=lookback_window,
        min_periods=max(5, lookback_window // 2)
    )

    scan_params = AnomalyScanRequest(
        symbol_a=symbol_a,
        symbol_b=symbol_b,
        start_date=start_date,
        end_date=end_date,
        lookback_window=lookback_window,
        z_threshold=z_threshold,
        min_volume=min_volume,
        min_open_interest=min_open_interest,
        min_days_to_expiry=min_days_to_expiry,
        max_days_to_expiry=max_days_to_expiry
    )

    cost_settings = CostModelSettings(
        brokerage_pct=brokerage_pct,
        slippage_bps_per_leg=slippage_bps
    )

    return AnomalyScannerEngine.scan_observations(
        observations=series_resp.observations,
        params=scan_params,
        cost_settings=cost_settings
    )
