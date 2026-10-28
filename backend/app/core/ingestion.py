"""
MCX Bhavcopy Ingestion and Schema Validation Engine.
Provides resilient column mapping, multi-format date and compact expiry parsing,
symbol trimming, duplicate filtering, and explicit rejected-row auditing.
"""
from typing import List, Dict, Any, Tuple, Optional
import io
import re
import csv
from datetime import datetime, date
import dateutil.parser
from app.core.metadata import is_valid_gold_symbol
from app.models.schemas import IngestionSummary, RejectedRow
from app.db.repository import MarketDataRepository


class BhavcopyIngestionEngine:
    """Robust parser for official MCX Commodity Bhavcopy CSV files."""

    # Common MCX Bhavcopy column header synonyms
    COLUMN_SYNONYMS = {
        "trading_date": ["date", "trade_date", "trading_date", "tradedate", "dt", "date_time"],
        "symbol": ["symbol", "commodity", "inst_symbol", "asset", "contract"],
        "expiry_date": ["expiry_date", "expiry", "exp_date", "expirydate", "exp_dt"],
        "open": ["open", "open_price", "op_prc"],
        "high": ["high", "high_price", "hi_prc"],
        "low": ["low", "low_price", "lo_prc"],
        "close": ["close", "close_price", "cl_prc", "ltp", "last_price"],
        "settlement_price": ["settlement_price", "settle_price", "settlement", "settl_prc", "cl_prc_adj"],
        "volume": ["volume", "volume_in_lots", "vol", "traded_qty", "qty", "volume_lots"],
        "open_interest": ["open_interest", "oi", "open_int", "openinterest"]
    }

    @classmethod
    def detect_column_mapping(cls, headers: List[str]) -> Dict[str, str]:
        """Auto-detect mapping between canonical field names and CSV headers."""
        cleaned_headers = {h.strip().lower().replace(" ", "_"): h for h in headers}
        mapping: Dict[str, str] = {}

        for canonical, synonyms in cls.COLUMN_SYNONYMS.items():
            for syn in synonyms:
                if syn in cleaned_headers:
                    mapping[canonical] = cleaned_headers[syn]
                    break
        return mapping

    @classmethod
    def parse_flexible_date(cls, date_str: str) -> Optional[str]:
        """
        Parse ambiguous dates (supporting DD-MM-YYYY, DD/MM/YYYY, YYYY-MM-DD, and compact 05MAY2026).
        Returns ISO standard 'YYYY-MM-DD' string or None.
        """
        if not date_str:
            return None
        cleaned = str(date_str).strip()

        # Handle compact format like '05MAY2026' or '4SEP2026'
        compact_match = re.match(r"^(\d{1,2})([A-Za-z]{3})(\d{4})$", cleaned)
        if compact_match:
            d, mon, y = compact_match.groups()
            try:
                dt = datetime.strptime(f"{d.zfill(2)}-{mon.upper()}-{y}", "%d-%b-%Y")
                return dt.strftime("%Y-%m-%d")
            except Exception:
                pass

        # Try standard known formats first with dayfirst=True for Indian conventions
        try:
            dt = dateutil.parser.parse(cleaned, dayfirst=True)
            return dt.strftime("%Y-%m-%d")
        except Exception:
            return None

    @classmethod
    def parse_float(cls, val: Any) -> Optional[float]:
        """Clean string and convert to float."""
        if val is None or val == "":
            return None
        try:
            cleaned = str(val).replace(",", "").strip()
            return float(cleaned)
        except Exception:
            return None

    @classmethod
    def parse_int(cls, val: Any) -> int:
        """Clean string and convert to integer."""
        if val is None or val == "":
            return 0
        try:
            cleaned = str(val).replace(",", "").strip()
            return int(float(cleaned))
        except Exception:
            return 0

    @classmethod
    def ingest_csv_content(
        cls,
        csv_text: str,
        source_name: str = "UPLOAD",
        is_synthetic: bool = False
    ) -> IngestionSummary:
        """
        Ingest and validate CSV text content.
        """
        reader = csv.reader(io.StringIO(csv_text.strip()))
        try:
            headers = next(reader)
        except StopIteration:
            return IngestionSummary(
                source_name=source_name,
                total_rows_read=0,
                valid_rows_inserted=0,
                duplicate_rows_skipped=0,
                rejected_rows_count=0,
                rejected_rows=[],
                symbols_updated=[],
                is_synthetic=is_synthetic,
                ingestion_timestamp=datetime.now().isoformat()
            )

        mapping = cls.detect_column_mapping(headers)
        
        # Verify essential minimum fields exist
        essential = ["trading_date", "symbol", "close"]
        for ess in essential:
            if ess not in mapping:
                raise ValueError(
                    f"Missing required column '{ess}'. Detected headers: {headers}. "
                    f"Please provide at least trading date, contract symbol, and close price."
                )

        # Header index lookup
        col_indices = {canonical: headers.index(orig_col) for canonical, orig_col in mapping.items()}

        valid_rows: List[Dict[str, Any]] = []
        rejected_rows: List[RejectedRow] = []
        symbols_seen = set()

        for row_idx, row in enumerate(reader, start=2):
            if not row or all(c.strip() == "" for c in row):
                continue  # skip blank lines

            raw_dict = {headers[i]: row[i] if i < len(row) else "" for i in range(len(headers))}

            # Extract Symbol
            sym_raw = row[col_indices["symbol"]] if "symbol" in col_indices and col_indices["symbol"] < len(row) else ""
            sym = sym_raw.strip().upper()
            if not sym:
                rejected_rows.append(RejectedRow(row_number=row_idx, raw_data=raw_dict, rejection_reason="Missing symbol."))
                continue

            # Check if supported MCX gold symbol
            if not is_valid_gold_symbol(sym):
                rejected_rows.append(RejectedRow(
                    row_number=row_idx, 
                    raw_data=raw_dict, 
                    rejection_reason=f"Unsupported symbol '{sym}'. Only GOLDM, GOLDTEN, GOLDGUINEA, GOLDPETAL are tracked."
                ))
                continue

            # Extract Trading Date
            date_raw = row[col_indices["trading_date"]] if "trading_date" in col_indices and col_indices["trading_date"] < len(row) else ""
            t_date = cls.parse_flexible_date(date_raw)
            if not t_date:
                rejected_rows.append(RejectedRow(
                    row_number=row_idx, 
                    raw_data=raw_dict, 
                    rejection_reason=f"Invalid trading date '{date_raw}'."
                ))
                continue

            # Extract Expiry Date
            exp_raw = row[col_indices["expiry_date"]] if "expiry_date" in col_indices and col_indices["expiry_date"] < len(row) else ""
            exp_date = cls.parse_flexible_date(exp_raw)
            if not exp_date:
                # If expiry date not supplied, default to trading date + 30 days provisional
                exp_date = t_date

            # Extract Close Price
            close_raw = row[col_indices["close"]] if "close" in col_indices and col_indices["close"] < len(row) else ""
            close_val = cls.parse_float(close_raw)
            if close_val is None or close_val <= 0:
                rejected_rows.append(RejectedRow(
                    row_number=row_idx, 
                    raw_data=raw_dict, 
                    rejection_reason=f"Invalid close price '{close_raw}'."
                ))
                continue

            # Optional fields
            open_val = cls.parse_float(row[col_indices["open"]]) if "open" in col_indices and col_indices["open"] < len(row) else None
            high_val = cls.parse_float(row[col_indices["high"]]) if "high" in col_indices and col_indices["high"] < len(row) else None
            low_val = cls.parse_float(row[col_indices["low"]]) if "low" in col_indices and col_indices["low"] < len(row) else None
            settle_val = cls.parse_float(row[col_indices["settlement_price"]]) if "settlement_price" in col_indices and col_indices["settlement_price"] < len(row) else None
            vol_val = cls.parse_int(row[col_indices["volume"]]) if "volume" in col_indices and col_indices["volume"] < len(row) else 0
            oi_val = cls.parse_int(row[col_indices["open_interest"]]) if "open_interest" in col_indices and col_indices["open_interest"] < len(row) else 0

            valid_rows.append({
                "trading_date": t_date,
                "symbol": sym,
                "expiry_date": exp_date,
                "open": open_val,
                "high": high_val,
                "low": low_val,
                "close": close_val,
                "settlement_price": settle_val,
                "volume": vol_val,
                "open_interest": oi_val,
            })
            symbols_seen.add(sym)

        # Batch insert into repository
        inserted, duplicates = MarketDataRepository.insert_observations(
            rows=valid_rows,
            source=source_name,
            is_synthetic=is_synthetic
        )

        all_dates = [r["trading_date"] for r in valid_rows]
        earliest = min(all_dates) if all_dates else None
        latest = max(all_dates) if all_dates else None

        # Log ingestion
        MarketDataRepository.log_ingestion(
            source_name=source_name,
            total=len(valid_rows) + len(rejected_rows),
            valid=inserted,
            duplicate=duplicates,
            rejected=len(rejected_rows),
            earliest_date=earliest,
            latest_date=latest,
            is_synthetic=is_synthetic
        )

        return IngestionSummary(
            source_name=source_name,
            total_rows_read=len(valid_rows) + len(rejected_rows),
            valid_rows_inserted=inserted,
            duplicate_rows_skipped=duplicates,
            rejected_rows_count=len(rejected_rows),
            rejected_rows=rejected_rows[:100],  # cap at first 100 for API response size
            symbols_updated=sorted(list(symbols_seen)),
            earliest_date=earliest,
            latest_date=latest,
            is_synthetic=is_synthetic,
            ingestion_timestamp=datetime.now().isoformat()
        )
