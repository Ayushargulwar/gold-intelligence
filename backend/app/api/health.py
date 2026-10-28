"""
Health check and platform status endpoint.
"""
from fastapi import APIRouter
from app.config import APP_NAME, APP_VERSION
from app.db.repository import MarketDataRepository

router = APIRouter()


@router.get("/health")
def health_check():
    """Returns application health status and dataset coverage."""
    summary = MarketDataRepository.get_dataset_summary()
    return {
        "status": "healthy",
        "app_name": APP_NAME,
        "version": APP_VERSION,
        "total_observations": summary.total_observations,
        "supported_contracts": summary.supported_contracts,
        "has_synthetic_data": summary.has_synthetic_data,
        "has_verified_data": summary.has_verified_data,
    }
