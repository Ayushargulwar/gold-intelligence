"""
FastAPI Main Application Entry Point for Gold Intelligence.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import (
    APP_NAME, APP_VERSION, APP_DESCRIPTION, API_PREFIX, CORS_ORIGINS
)
from app.db.session import init_db
from app.db.repository import MarketDataRepository
from app.core.demo_data import DemoDataGenerator

# Import API routers
from app.api.health import router as health_router
from app.api.contracts import router as contracts_router
from app.api.data import router as data_router
from app.api.relative_value import router as relative_value_router
from app.api.anomalies import router as anomalies_router
from app.api.backtest import router as backtest_router
from app.api.methodology import router as methodology_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database and seed contracts / demo data on startup."""
    init_db()
    MarketDataRepository.sync_contracts()

    # If database is fresh, populate with the deterministic demo dataset
    summary = MarketDataRepository.get_dataset_summary()
    if summary.total_observations == 0:
        DemoDataGenerator.load_demo_data()
        print("Initialized database with deterministic Hackathon demo dataset.")

    yield


app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION,
    description=APP_DESCRIPTION,
    lifespan=lifespan
)

# CORS middleware for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routes under /api/v1 and /api
app.include_router(health_router, prefix=API_PREFIX, tags=["Health"])
app.include_router(contracts_router, prefix=API_PREFIX, tags=["Contracts"])
app.include_router(data_router, prefix=API_PREFIX, tags=["Data Management"])
app.include_router(relative_value_router, prefix=API_PREFIX, tags=["Relative Value"])
app.include_router(anomalies_router, prefix=API_PREFIX, tags=["Anomalies"])
app.include_router(backtest_router, prefix=API_PREFIX, tags=["Backtesting"])
app.include_router(methodology_router, prefix=API_PREFIX, tags=["Methodology"])

# Also mount under /api for simpler paths
app.include_router(health_router, prefix="/api", tags=["Health"])
app.include_router(contracts_router, prefix="/api", tags=["Contracts"])
app.include_router(data_router, prefix="/api", tags=["Data Management"])
app.include_router(relative_value_router, prefix="/api", tags=["Relative Value"])
app.include_router(anomalies_router, prefix="/api", tags=["Anomalies"])
app.include_router(backtest_router, prefix="/api", tags=["Backtesting"])
app.include_router(methodology_router, prefix="/api", tags=["Methodology"])


@app.get("/")
def root():
    return {
        "app": APP_NAME,
        "version": APP_VERSION,
        "docs_url": "/docs",
        "api_prefix": API_PREFIX
    }
