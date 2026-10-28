"""
Data Ingestion, Bhavcopy Upload, and Dataset Management Endpoints.
"""
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.db.repository import MarketDataRepository
from app.core.ingestion import BhavcopyIngestionEngine
from app.core.demo_data import DemoDataGenerator
from app.models.schemas import DatasetSummary, IngestionSummary

router = APIRouter()


@router.get("/data/summary", response_model=DatasetSummary)
def get_dataset_summary():
    """Retrieve coverage, observation counts, date ranges, and quality warnings."""
    return MarketDataRepository.get_dataset_summary()


@router.post("/data/upload-csv", response_model=IngestionSummary)
async def upload_bhavcopy_csv(
    file: UploadFile = File(...),
    source_name: Optional[str] = Form("MCX_BHAVCOPY_UPLOAD"),
    is_synthetic: Optional[bool] = Form(False)
):
    """
    Upload and parse official MCX Bhavcopy CSV file.
    Validates headers, parses dates and compact expiries, skips duplicates,
    and returns a full rejected-row audit report.
    """
    if not file.filename.endswith(('.csv', '.txt')):
        raise HTTPException(status_code=400, detail="Only CSV or TXT Bhavcopy files are supported.")

    try:
        content_bytes = await file.read()
        csv_text = content_bytes.decode('utf-8', errors='replace')
        summary = BhavcopyIngestionEngine.ingest_csv_content(
            csv_text=csv_text,
            source_name=source_name or file.filename,
            is_synthetic=bool(is_synthetic)
        )
        return summary
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process CSV file: {str(e)}")


@router.post("/data/load-demo", response_model=DatasetSummary)
def load_demo_data():
    """
    Load deterministic 180-day synthetic demonstration dataset across all 4 contracts.
    Clearly labeled with is_synthetic=True for Hack in Hills '26 demo mode.
    """
    inserted = DemoDataGenerator.load_demo_data()
    return MarketDataRepository.get_dataset_summary()


@router.post("/data/clear")
def clear_all_data():
    """Clear all market data observations and reset database."""
    deleted_count = MarketDataRepository.clear_all_observations()
    return {
        "status": "success",
        "message": f"Cleared {deleted_count} observations.",
        "summary": MarketDataRepository.get_dataset_summary()
    }
