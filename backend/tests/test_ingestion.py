"""
Tests for MCX Bhavcopy CSV ingestion, multi-format date and expiry parsing, and duplicate skipping.
"""
from app.core.ingestion import BhavcopyIngestionEngine
from app.db.repository import MarketDataRepository
from app.db.session import init_db


def test_date_parsing():
    assert BhavcopyIngestionEngine.parse_flexible_date("22-10-2026") == "2026-10-22"
    assert BhavcopyIngestionEngine.parse_flexible_date("2026-10-22") == "2026-10-22"
    assert BhavcopyIngestionEngine.parse_flexible_date("22/10/2026") == "2026-10-22"
    # Compact MCX expiry format
    assert BhavcopyIngestionEngine.parse_flexible_date("05MAY2026") == "2026-05-05"
    assert BhavcopyIngestionEngine.parse_flexible_date("4SEP2026") == "2026-09-04"


def test_csv_ingestion_with_rejections_and_duplicates():
    init_db()
    MarketDataRepository.sync_contracts()

    sample_csv = """Date,Symbol,Expiry,Close,Volume,Open Interest
2026-03-01,GOLDM,2026-06-05,74500,300,1500
2026-03-01,GOLDPETAL,2026-06-05,7485,120,600
2026-03-01,UNKNOWN_COMMODITY,2026-06-05,100,5,10
2026-03-01,GOLDM,2026-06-05,74500,300,1500
"""

    summary = BhavcopyIngestionEngine.ingest_csv_content(
        csv_text=sample_csv,
        source_name="TEST_BHAVCOPY_SAMPLE",
        is_synthetic=False
    )

    assert summary.total_rows_read == 4
    # Valid inserted must be 2 (GOLDM and GOLDPETAL)
    # The duplicate GOLDM row should be skipped
    # UNKNOWN_COMMODITY should be rejected
    assert summary.rejected_rows_count == 1
    assert "Unsupported symbol" in summary.rejected_rows[0].rejection_reason
    assert "GOLDM" in summary.symbols_updated
    assert "GOLDPETAL" in summary.symbols_updated
