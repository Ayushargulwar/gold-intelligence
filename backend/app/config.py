"""
Application configuration for Gold Intelligence platform.
"""
from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

DATABASE_PATH = os.getenv("DATABASE_PATH", str(DATA_DIR / "gold_intelligence.db"))
DATABASE_URL = f"sqlite:///{DATABASE_PATH}"

API_PREFIX = "/api/v1"
APP_NAME = "Gold Intelligence"
APP_VERSION = "1.0.0"
APP_DESCRIPTION = "MCX Gold Contract Relative-Value Intelligence Platform"

# Default quantitative parameters
DEFAULT_ROLLING_WINDOW = 20
DEFAULT_MIN_PERIODS = 10
DEFAULT_ENTRY_THRESHOLD = 2.0
DEFAULT_EXIT_THRESHOLD = 0.5
DEFAULT_STOP_LOSS_THRESHOLD = 3.5
DEFAULT_MAX_HOLDING_DAYS = 15

# Default MCX execution cost model assumptions (basis points / percentages)
DEFAULT_BROKERAGE_PCT = 0.00015  # 0.015% or ₹20/order proxy
DEFAULT_EXCHANGE_FEE_PCT = 0.000021  # MCX turnover charge: ~0.0021%
DEFAULT_CTT_PCT = 0.0001  # Commodity Transaction Tax on sell: 0.01%
DEFAULT_GST_PCT = 0.18  # 18% on (brokerage + exchange charges)
DEFAULT_STAMP_DUTY_PCT = 0.00002  # 0.002% on buy
DEFAULT_SLIPPAGE_BPS = 2.5  # 2.5 bps bid-ask execution friction per leg

# Cors origins
CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "*"
]
