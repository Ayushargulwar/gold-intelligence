"""
Integration tests for FastAPI endpoints.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import init_db
from app.db.repository import MarketDataRepository
from app.core.demo_data import DemoDataGenerator


@pytest.fixture(scope="session", autouse=True)
def setup_database():
    """Ensure database schema, contracts, and demo data exist for tests."""
    init_db()
    MarketDataRepository.sync_contracts()
    summary = MarketDataRepository.get_dataset_summary()
    if summary.total_observations == 0:
        DemoDataGenerator.load_demo_data()


def test_health_endpoint():
    with TestClient(app) as client:
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "Gold Intelligence" in data["app_name"]


def test_contracts_endpoints():
    with TestClient(app) as client:
        response = client.get("/api/contracts")
        assert response.status_code == 200
        contracts = response.json()
        assert len(contracts) == 4
        symbols = [c["symbol"] for c in contracts]
        assert "GOLDM" in symbols
        assert "GOLDPETAL" in symbols

        # Single contract
        res_single = client.get("/api/contracts/GOLDM")
        assert res_single.status_code == 200
        assert res_single.json()["contract_size_grams"] == 100.0


def test_normalization_inspector():
    with TestClient(app) as client:
        response = client.get("/api/contracts/GOLDM/normalize?price=74500")
        assert response.status_code == 200
        data = response.json()
        assert data["symbol"] == "GOLDM"
        assert data["fine_grams_per_quote_unit"] == 9.95
        assert len(data["audit_trail"]) == 6


def test_methodology_endpoint():
    with TestClient(app) as client:
        response = client.get("/api/methodology/summary")
        assert response.status_code == 200
        data = response.json()
        assert "normalization" in data
        assert "relative_spread" in data
        assert len(data["glossary"]) > 0


def test_relative_value_series():
    with TestClient(app) as client:
        response = client.get("/api/relative-value/series?symbol_a=GOLDM&symbol_b=GOLDPETAL&lookback_window=15")
        assert response.status_code == 200
        data = response.json()
        assert data["symbol_a"] == "GOLDM"
        assert data["symbol_b"] == "GOLDPETAL"
        assert len(data["observations"]) > 0
        assert data["total_observations"] > 0


def test_anomalies_scan():
    with TestClient(app) as client:
        response = client.get("/api/anomalies/scan?symbol_a=GOLDM&symbol_b=GOLDPETAL&z_threshold=1.5")
        assert response.status_code == 200
        findings = response.json()
        assert isinstance(findings, list)
        if findings:
            f = findings[0]
            assert "liquidity_filter" in f
            assert "expiry_filter" in f
            assert "cost_filter" in f


def test_backtest_run():
    with TestClient(app) as client:
        payload = {
            "symbol_a": "GOLDM",
            "symbol_b": "GOLDPETAL",
            "lookback_window": 15,
            "entry_z_score": 1.8,
            "exit_z_score": 0.5,
            "stop_loss_z_score": 3.5,
            "max_holding_days": 15,
            "capital_allocation_inr": 1000000.0,
            "costs": {
                "brokerage_pct": 0.00015,
                "exchange_fee_pct": 0.000021,
                "ctt_pct": 0.0001,
                "gst_pct": 0.18,
                "stamp_duty_pct": 0.00002,
                "slippage_bps_per_leg": 2.5
            }
        }
        response = client.post("/api/backtest/run", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "metrics" in data
        assert "equity_curve" in data
        assert "trades" in data
        assert data["metrics"]["gross_pnl_inr"] is not None
