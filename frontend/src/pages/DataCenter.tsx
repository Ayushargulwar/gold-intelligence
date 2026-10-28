import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Database,
  ShieldCheck,
  Info,
} from 'lucide-react';
import {
  fetchDatasetSummary,
  uploadBhavcopyCsv,
  loadDemoData,
  clearAllData,
} from '../api/client';
import type { DatasetSummary, IngestionSummary } from '../types';

export const DataCenter: React.FC = () => {
  const [summary, setSummary] = useState<DatasetSummary | null>(null);
  const [ingestionResult, setIngestionResult] = useState<IngestionSummary | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [loadingDemo, setLoadingDemo] = useState<boolean>(false);
  const [clearing, setClearing] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    try {
      const s = await fetchDatasetSummary();
      setSummary(s);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    try {
      setUploading(true);
      setError(null);
      const res = await uploadBhavcopyCsv(file, false);
      setIngestionResult(res);
      await loadSummary();
    } catch (err: any) {
      setError(err.message || 'CSV upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleLoadDemo = async () => {
    try {
      setLoadingDemo(true);
      setError(null);
      await loadDemoData();
      await loadSummary();
    } catch (err: any) {
      setError(err.message || 'Demo data seeding failed');
    } finally {
      setLoadingDemo(false);
    }
  };

  const handleClear = async () => {
    if (!window.confirm('Are you sure you want to clear all market observations?')) return;
    try {
      setClearing(true);
      setError(null);
      await clearAllData();
      setIngestionResult(null);
      await loadSummary();
    } catch (err: any) {
      setError(err.message || 'Clear failed');
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto font-sans">
      {/* Title Header */}
      <div className="bg-[#FFFFFF] border border-[#DCE2EA] rounded-md p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#F4F6F9] text-[#14243A] border border-[#DCE2EA] font-semibold uppercase">
              Data Management
            </span>
            <span className="text-xs text-[#687587] font-mono">Bhavcopy Pipeline</span>
          </div>
          <h2 className="text-base font-bold text-[#14243A] mt-1">Data Center & Ingestion Pipeline</h2>
          <p className="text-xs text-[#687587] mt-0.5">
            Ingest official MCX Commodity Bhavcopy CSVs with column mapping, date/expiry parsing, duplicate prevention, and synthetic fixture management.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleLoadDemo}
            disabled={loadingDemo}
            className="px-3 py-1.5 rounded bg-[#245BDB] hover:bg-[#1D49AF] text-[#FFFFFF] text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Database className="w-3.5 h-3.5" />
            <span>{loadingDemo ? 'Seeding...' : 'Load 180-Day Demo Dataset'}</span>
          </button>

          <button
            onClick={handleClear}
            disabled={clearing}
            className="px-3 py-1.5 rounded bg-[#FFFFFF] hover:bg-[#FEF2F2] border border-[#DCE2EA] hover:border-[#FECACA] text-[#D64550] text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Archive</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-2.5 rounded bg-[#FEF2F2] border border-[#FECACA] text-[#D64550] text-xs font-mono">
          {error}
        </div>
      )}

      {/* Dataset Health Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-md bg-[#FFFFFF] border border-[#DCE2EA]">
          <div className="text-[10px] text-[#687587] font-mono uppercase">TOTAL OBSERVATIONS</div>
          <div className="text-xl font-bold font-mono text-[#14243A] mt-1 tabular-nums">
            {summary?.total_observations.toLocaleString() ?? 0}
          </div>
          <div className="text-[11px] text-[#687587] font-mono mt-0.5">
            Across 4 standardized contracts
          </div>
        </div>

        <div className="p-3.5 rounded-md bg-[#FFFFFF] border border-[#DCE2EA]">
          <div className="text-[10px] text-[#687587] font-mono uppercase">HISTORICAL COVERAGE</div>
          <div className="text-sm font-bold font-mono text-[#13834A] mt-1 truncate">
            {summary?.earliest_date && summary?.latest_date
              ? `${summary.earliest_date} → ${summary.latest_date}`
              : 'No dates loaded'}
          </div>
          <div className="text-[11px] text-[#687587] font-mono mt-0.5">
            Daily settlement archive
          </div>
        </div>

        <div className="p-3.5 rounded-md bg-[#FFFFFF] border border-[#DCE2EA]">
          <div className="text-[10px] text-[#687587] font-mono uppercase">DATA PROVENANCE</div>
          <div className="text-sm font-bold font-mono mt-1">
            {summary?.has_synthetic_data ? (
              <span className="text-[#D97706] flex items-center gap-1">
                <Info className="w-3.5 h-3.5" /> Demo Synthetic Fixture
              </span>
            ) : summary?.has_verified_data ? (
              <span className="text-[#13834A] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Verified MCX Bhavcopy
              </span>
            ) : (
              <span className="text-[#687587]">Empty Database</span>
            )}
          </div>
          <div className="text-[11px] text-[#687587] font-mono mt-0.5">
            Clearly labeled provenance
          </div>
        </div>

        <div className="p-3.5 rounded-md bg-[#FFFFFF] border border-[#DCE2EA]">
          <div className="text-[10px] text-[#687587] font-mono uppercase">ANALYZABLE PAIRS</div>
          <div className="text-xl font-bold font-mono text-[#14243A] mt-1 tabular-nums">
            {summary?.analyzable_pairs_count ?? 0}
          </div>
          <div className="text-[11px] text-[#687587] font-mono mt-0.5">
            Synchronous contract pairs
          </div>
        </div>
      </div>

      {/* CSV Drag and Drop Upload Box */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileUpload(e.dataTransfer.files[0]);
          }
        }}
        className={`p-6 rounded-md border-2 border-dashed transition-colors text-center flex flex-col items-center justify-center space-y-2.5 ${
          dragActive
            ? 'border-[#245BDB] bg-[#EEF3FD]/30'
            : 'border-[#DCE2EA] bg-[#FFFFFF] hover:border-[#B4C0D0]'
        }`}
      >
        <div className="p-2.5 rounded bg-[#F4F6F9] text-[#245BDB] border border-[#DCE2EA]">
          <UploadCloud className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xs font-bold text-[#14243A] uppercase tracking-wide">
            Upload MCX Commodity Bhavcopy CSV
          </h3>
          <p className="text-xs text-[#687587] mt-0.5 max-w-md">
            Drag and drop Bhavcopy CSV file here, or click to browse. The parser auto-detects date formats,
            compact expiries (e.g. 05MAY2026), and column header aliases.
          </p>
        </div>

        <label className="px-3.5 py-1.5 rounded bg-[#FFFFFF] hover:bg-[#F4F6F9] text-xs font-mono text-[#14243A] cursor-pointer transition-colors border border-[#DCE2EA]">
          <span>{uploading ? 'Processing File...' : 'Select Bhavcopy CSV'}</span>
          <input
            type="file"
            accept=".csv,.txt"
            disabled={uploading}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileUpload(e.target.files[0]);
              }
            }}
            className="hidden"
          />
        </label>
      </div>

      {/* Ingestion Report */}
      {ingestionResult && (
        <div className="bg-[#FFFFFF] border border-[#DCE2EA] rounded-md p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-[#EDF1F7] pb-2 font-mono text-xs">
            <div className="flex items-center gap-2 text-[#13834A] font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Ingestion Report: {ingestionResult.source_name}</span>
            </div>
            <span className="text-[#687587]">{ingestionResult.ingestion_timestamp.slice(0, 19)}</span>
          </div>

          <div className="grid grid-cols-4 gap-2.5 font-mono text-xs">
            <div className="p-2.5 rounded bg-[#F4F6F9] border border-[#DCE2EA]">
              <span className="text-[#687587]">Total Rows Read:</span>
              <div className="text-sm font-bold text-[#14243A] mt-0.5 tabular-nums">
                {ingestionResult.total_rows_read}
              </div>
            </div>
            <div className="p-2.5 rounded bg-[#F4F6F9] border border-[#DCE2EA]">
              <span className="text-[#687587]">Valid Inserted:</span>
              <div className="text-sm font-bold text-[#13834A] mt-0.5 tabular-nums">
                {ingestionResult.valid_rows_inserted}
              </div>
            </div>
            <div className="p-2.5 rounded bg-[#F4F6F9] border border-[#DCE2EA]">
              <span className="text-[#687587]">Duplicates Skipped:</span>
              <div className="text-sm font-bold text-[#172538] mt-0.5 tabular-nums">
                {ingestionResult.duplicate_rows_skipped}
              </div>
            </div>
            <div className="p-2.5 rounded bg-[#F4F6F9] border border-[#DCE2EA]">
              <span className="text-[#687587]">Rejected Rows:</span>
              <div className="text-sm font-bold text-[#D64550] mt-0.5 tabular-nums">
                {ingestionResult.rejected_rows_count}
              </div>
            </div>
          </div>

          {ingestionResult.rejected_rows.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <h4 className="text-xs font-mono text-[#D64550] font-bold uppercase">
                Rejected Row Audit Trail ({ingestionResult.rejected_rows.length} rows)
              </h4>
              <div className="max-h-36 overflow-y-auto space-y-1 font-mono text-[11px]">
                {ingestionResult.rejected_rows.map((r, i) => (
                  <div key={i} className="p-1.5 rounded bg-[#FEF2F2] border border-[#FECACA] text-[#D64550] flex justify-between">
                    <span>Row #{r.row_number}: {r.rejection_reason}</span>
                    <span className="text-[#687587] truncate max-w-xs">{JSON.stringify(r.raw_data)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Contract Breakdown & Quality Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Breakdown */}
        <div className="p-4 rounded-md bg-[#FFFFFF] border border-[#DCE2EA] space-y-2.5">
          <h3 className="text-xs font-bold text-[#14243A] uppercase font-mono tracking-wide">
            Contract Observation Distribution
          </h3>
          <div className="space-y-1.5 font-mono text-xs">
            {summary?.contract_breakdown &&
              Object.entries(summary.contract_breakdown).map(([sym, count]) => (
                <div key={sym} className="flex justify-between items-center p-2 rounded bg-[#F4F6F9] border border-[#DCE2EA]">
                  <span className="font-bold text-[#245BDB]">{sym}</span>
                  <span className="text-[#14243A] tabular-nums">{count} observations</span>
                </div>
              ))}
          </div>
        </div>

        {/* Quality Alerts */}
        <div className="p-4 rounded-md bg-[#FFFFFF] border border-[#DCE2EA] space-y-2.5">
          <h3 className="text-xs font-bold text-[#14243A] uppercase font-mono tracking-wide">
            Data Quality & Integrity Audits
          </h3>
          <div className="space-y-1.5 font-mono text-xs">
            {summary?.data_quality_issues && summary.data_quality_issues.length > 0 ? (
              summary.data_quality_issues.map((issue, idx) => (
                <div key={idx} className="p-2 rounded bg-[#FFFBEB] border border-[#FDE68A] text-[#D97706] flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{issue}</span>
                </div>
              ))
            ) : (
              <div className="p-2.5 rounded bg-[#ECFDF5] border border-[#A7F3D0] text-[#13834A] flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>All 4 standard MCX contracts validated with continuous synchronous coverage.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
