"""
Database repository implementation for Gold Intelligence.
Provides safe parameterized queries, contract synchronization, and market data queries.
"""
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
import json
import sqlite3
from app.db.session import db_session
from app.core.metadata import MCX_GOLD_CONTRACTS, ContractSpec
from app.models.schemas import MarketObservation, DatasetSummary


class MarketDataRepository:
    """Repository handling persistence for contracts and market data."""

    @staticmethod
    def sync_contracts() -> None:
        """Seed or update official contract specifications in the database."""
        with db_session() as conn:
            cursor = conn.cursor()
            for spec in MCX_GOLD_CONTRACTS.values():
                cursor.execute("""
                    INSERT INTO contracts (
                        symbol, name, contract_size_grams, quote_unit_grams,
                        stated_purity, tick_size_inr, delivery_unit_grams,
                        description, version, is_active
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(symbol) DO UPDATE SET
                        name = excluded.name,
                        contract_size_grams = excluded.contract_size_grams,
                        quote_unit_grams = excluded.quote_unit_grams,
                        stated_purity = excluded.stated_purity,
                        tick_size_inr = excluded.tick_size_inr,
                        delivery_unit_grams = excluded.delivery_unit_grams,
                        description = excluded.description,
                        version = excluded.version,
                        is_active = excluded.is_active;
                """, (
                    spec.symbol, spec.name, spec.contract_size_grams,
                    spec.quote_unit_grams, spec.stated_purity, spec.tick_size_inr,
                    spec.delivery_unit_grams, spec.description, spec.version,
                    1 if spec.is_active else 0
                ))

    @staticmethod
    def insert_observations(
        rows: List[Dict[str, Any]], 
        source: str = "UPLOAD", 
        is_synthetic: bool = False
    ) -> Tuple[int, int]:
        """
        Insert market data observations.
        Returns: (inserted_count, duplicate_count)
        """
        now_iso = datetime.now().isoformat()
        inserted_count = 0
        duplicate_count = 0

        with db_session() as conn:
            cursor = conn.cursor()
            for r in rows:
                try:
                    cursor.execute("""
                        INSERT INTO market_observations (
                            trading_date, symbol, expiry_date, open, high, low, close,
                            settlement_price, volume, open_interest, source,
                            is_synthetic, created_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        r["trading_date"],
                        r["symbol"].strip().upper(),
                        r["expiry_date"],
                        r.get("open"),
                        r.get("high"),
                        r.get("low"),
                        float(r["close"]),
                        r.get("settlement_price"),
                        int(r.get("volume", 0)),
                        int(r.get("open_interest", 0)),
                        source,
                        1 if is_synthetic else 0,
                        now_iso
                    ))
                    inserted_count += 1
                except sqlite3.IntegrityError:
                    duplicate_count += 1

        return inserted_count, duplicate_count

    @staticmethod
    def log_ingestion(
        source_name: str,
        total: int,
        valid: int,
        duplicate: int,
        rejected: int,
        earliest_date: Optional[str],
        latest_date: Optional[str],
        is_synthetic: bool
    ) -> None:
        with db_session() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO ingestion_logs (
                    source_name, total_rows, valid_rows, duplicate_rows,
                    rejected_rows, earliest_date, latest_date, is_synthetic, timestamp
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                source_name, total, valid, duplicate, rejected,
                earliest_date, latest_date, 1 if is_synthetic else 0,
                datetime.now().isoformat()
            ))

    @staticmethod
    def get_dataset_summary() -> DatasetSummary:
        """Calculate and return dataset coverage and quality metrics."""
        with db_session() as conn:
            cursor = conn.cursor()
            
            # Total count
            cursor.execute("SELECT COUNT(*) FROM market_observations")
            total_obs = cursor.fetchone()[0]

            # Breakdown by symbol
            cursor.execute("""
                SELECT symbol, COUNT(*) 
                FROM market_observations 
                GROUP BY symbol 
                ORDER BY symbol
            """)
            symbol_counts = dict(cursor.fetchall())

            # Min/max dates
            cursor.execute("SELECT MIN(trading_date), MAX(trading_date) FROM market_observations")
            row = cursor.fetchone()
            earliest_date = row[0]
            latest_date = row[1]

            # Synthetic vs verified flags
            cursor.execute("SELECT MAX(is_synthetic), MIN(is_synthetic) FROM market_observations")
            flags = cursor.fetchone()
            has_synthetic = (flags[0] == 1) if flags and flags[0] is not None else False
            has_verified = (flags[1] == 0) if flags and flags[1] is not None else False

            # Ingestion log latest
            cursor.execute("SELECT timestamp FROM ingestion_logs ORDER BY id DESC LIMIT 1")
            last_ingestion = cursor.fetchone()
            last_ingestion_time = last_ingestion[0] if last_ingestion else None

            # Calculate analyzable pairs
            supported_symbols = [s for s in MCX_GOLD_CONTRACTS.keys() if symbol_counts.get(s, 0) > 0]
            analyzable_pairs = []
            for i in range(len(supported_symbols)):
                for j in range(i + 1, len(supported_symbols)):
                    analyzable_pairs.append(f"{supported_symbols[i]} vs {supported_symbols[j]}")

            # Data quality checks
            data_quality_issues = []
            if total_obs == 0:
                data_quality_issues.append("No market data currently ingested. Load synthetic demo data or upload Bhavcopy CSV.")
            else:
                for sym in MCX_GOLD_CONTRACTS.keys():
                    if sym not in symbol_counts:
                        data_quality_issues.append(f"Missing historical data for standard contract {sym}.")

        return DatasetSummary(
            total_observations=total_obs,
            supported_contracts=len(symbol_counts),
            contract_breakdown=symbol_counts,
            earliest_date=earliest_date,
            latest_date=latest_date,
            analyzable_pairs_count=len(analyzable_pairs),
            analyzable_pairs=analyzable_pairs,
            has_synthetic_data=has_synthetic,
            has_verified_data=has_verified,
            last_ingestion_time=last_ingestion_time,
            data_quality_issues=data_quality_issues
        )

    @staticmethod
    def get_contract_observations(
        symbol: str, 
        start_date: Optional[str] = None, 
        end_date: Optional[str] = None,
        limit: int = 1000
    ) -> List[Dict[str, Any]]:
        """Fetch observations for a single contract."""
        with db_session() as conn:
            cursor = conn.cursor()
            query = "SELECT * FROM market_observations WHERE symbol = ?"
            params: List[Any] = [symbol.strip().upper()]

            if start_date:
                query += " AND trading_date >= ?"
                params.append(start_date)
            if end_date:
                query += " AND trading_date <= ?"
                params.append(end_date)

            query += " ORDER BY trading_date ASC, expiry_date ASC LIMIT ?"
            params.append(limit)

            cursor.execute(query, params)
            return [dict(row) for row in cursor.fetchall()]

    @staticmethod
    def get_aligned_pair_observations(
        symbol_a: str,
        symbol_b: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Fetch paired observations for symbol_a and symbol_b aligned by trading_date.
        For each date, selects the front/nearest active expiry for both contracts.
        """
        with db_session() as conn:
            cursor = conn.cursor()
            query = """
                WITH ranked_a AS (
                    SELECT *,
                           ROW_NUMBER() OVER (PARTITION BY trading_date ORDER BY expiry_date ASC) as rank
                    FROM market_observations
                    WHERE symbol = ?
                ),
                ranked_b AS (
                    SELECT *,
                           ROW_NUMBER() OVER (PARTITION BY trading_date ORDER BY expiry_date ASC) as rank
                    FROM market_observations
                    WHERE symbol = ?
                )
                SELECT 
                    a.trading_date,
                    a.symbol as symbol_a,
                    a.expiry_date as expiry_a,
                    a.open as open_a,
                    a.high as high_a,
                    a.low as low_a,
                    a.close as close_a,
                    a.settlement_price as settlement_a,
                    a.volume as volume_a,
                    a.open_interest as oi_a,
                    b.symbol as symbol_b,
                    b.expiry_date as expiry_b,
                    b.open as open_b,
                    b.high as high_b,
                    b.low as low_b,
                    b.close as close_b,
                    b.settlement_price as settlement_b,
                    b.volume as volume_b,
                    b.open_interest as oi_b
                FROM ranked_a a
                INNER JOIN ranked_b b ON a.trading_date = b.trading_date
                WHERE a.rank = 1 AND b.rank = 1
            """
            params: List[Any] = [symbol_a.strip().upper(), symbol_b.strip().upper()]

            if start_date:
                query += " AND a.trading_date >= ?"
                params.append(start_date)
            if end_date:
                query += " AND a.trading_date <= ?"
                params.append(end_date)

            query += " ORDER BY a.trading_date ASC"

            cursor.execute(query, params)
            return [dict(row) for row in cursor.fetchall()]

    @staticmethod
    def clear_all_observations() -> int:
        """Clear all market observations and logs."""
        with db_session() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM market_observations")
            count = cursor.fetchone()[0]
            cursor.execute("DELETE FROM market_observations")
            cursor.execute("DELETE FROM ingestion_logs")
            cursor.execute("DELETE FROM backtest_runs")
            return count
