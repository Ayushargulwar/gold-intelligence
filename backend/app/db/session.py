"""
Database connection and session initialization for SQLite.
Provides lightweight connection management with WAL mode for performance.
"""
import sqlite3
from pathlib import Path
from contextlib import contextmanager
from app.config import DATABASE_PATH

Path(DATABASE_PATH).parent.mkdir(parents=True, exist_ok=True)


def get_db_connection() -> sqlite3.Connection:
    """Create a new SQLite connection with foreign keys and dict-like row factory."""
    conn = sqlite3.connect(DATABASE_PATH, timeout=30.0, check_same_thread=False)
    conn.execute("PRAGMA journal_mode = WAL")
    conn.execute("PRAGMA synchronous = NORMAL")
    conn.execute("PRAGMA foreign_keys = ON")
    conn.row_factory = sqlite3.Row
    return conn


@contextmanager
def db_session():
    """Context manager for safe database transactions."""
    conn = get_db_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db():
    """Create table schema if not existing."""
    with db_session() as conn:
        cursor = conn.cursor()
        
        # 1. Contracts metadata table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS contracts (
                symbol TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                contract_size_grams REAL NOT NULL,
                quote_unit_grams REAL NOT NULL,
                stated_purity REAL NOT NULL,
                tick_size_inr REAL NOT NULL,
                delivery_unit_grams REAL NOT NULL,
                description TEXT,
                version TEXT NOT NULL,
                is_active INTEGER NOT NULL DEFAULT 1
            );
        """)

        # 2. Market observations table (Historical Bhavcopy)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS market_observations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                trading_date TEXT NOT NULL,
                symbol TEXT NOT NULL,
                expiry_date TEXT NOT NULL,
                open REAL,
                high REAL,
                low REAL,
                close REAL NOT NULL,
                settlement_price REAL,
                volume INTEGER NOT NULL DEFAULT 0,
                open_interest INTEGER NOT NULL DEFAULT 0,
                source TEXT NOT NULL DEFAULT 'UPLOAD',
                is_synthetic INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                UNIQUE(trading_date, symbol, expiry_date)
            );
        """)

        # Create indexes for fast relative-value queries
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_obs_symbol_date 
            ON market_observations(symbol, trading_date);
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_obs_date 
            ON market_observations(trading_date);
        """)

        # 3. Ingestion audit log
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS ingestion_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                source_name TEXT NOT NULL,
                total_rows INTEGER NOT NULL,
                valid_rows INTEGER NOT NULL,
                duplicate_rows INTEGER NOT NULL,
                rejected_rows INTEGER NOT NULL,
                earliest_date TEXT,
                latest_date TEXT,
                is_synthetic INTEGER NOT NULL DEFAULT 0,
                timestamp TEXT NOT NULL
            );
        """)

        # 4. Backtest runs log
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS backtest_runs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                symbol_a TEXT NOT NULL,
                symbol_b TEXT NOT NULL,
                run_timestamp TEXT NOT NULL,
                total_trades INTEGER NOT NULL,
                net_pnl_inr REAL NOT NULL,
                win_rate_pct REAL NOT NULL,
                max_drawdown_pct REAL NOT NULL,
                parameters_json TEXT NOT NULL
            );
        """)

# Initialize schema automatically
init_db()
