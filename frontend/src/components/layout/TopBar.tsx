import React from 'react';
import { RefreshCw, Database, Calendar, ShieldCheck, AlertCircle } from 'lucide-react';
import type { DatasetSummary } from '../../types';

interface TopBarProps {
  summary: DatasetSummary | null;
  loading: boolean;
  onRefresh: () => void;
  onLoadDemo: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  summary,
  loading,
  onRefresh,
  onLoadDemo,
}) => {
  return (
    <header className="h-12 border-b border-[#DCE2EA] bg-[#FFFFFF] px-4 sm:px-6 flex items-center justify-between select-none shrink-0 z-10">
      {/* Left: Active Module & Observation Window */}
      <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
        <div className="flex items-center gap-2 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-[#245BDB]" />
          <span className="text-xs font-mono font-semibold text-[#14243A] tracking-wider uppercase">
            MCX Gold Relative-Value
          </span>
        </div>

        <div className="h-3.5 w-px bg-[#DCE2EA] hidden sm:block shrink-0" />

        {/* Observation Window */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#687587] shrink-0 font-mono">
          <Calendar className="w-3.5 h-3.5 text-[#687587]" />
          <span>Period:</span>
          <span className="text-[#172538] font-medium">
            {summary?.earliest_date && summary?.latest_date
              ? `${summary.earliest_date} → ${summary.latest_date}`
              : 'No Observations'}
          </span>
        </div>
      </div>

      {/* Right: Data Provenance Badge, Metrics & Controls */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Transparent Data Provenance Status Badge */}
        {summary?.has_synthetic_data ? (
          <div
            className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#F4F6F9] border border-[#DCE2EA] text-[#687587] text-[11px] font-mono"
            title="Demonstration dataset calibrated to official MCX contract specifications. Not an exchange live feed."
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
            <span className="font-semibold text-[#172538]">DEMO SYNTHETIC</span>
            <span className="text-[10px] text-[#8E9BAE] hidden md:inline">• MCX Calibrated</span>
          </div>
        ) : summary?.has_verified_data ? (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#ECFDF5] border border-[#A7F3D0] text-[#13834A] text-[11px] font-mono font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-[#13834A]" />
            <span>VERIFIED BHAVCOPY</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#FEF2F2] border border-[#FECACA] text-[#D64550] text-[11px] font-mono font-semibold">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>DATASET EMPTY</span>
          </div>
        )}

        {/* Historical Observations Count */}
        <div className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#F4F6F9] border border-[#DCE2EA] text-[#687587] text-[11px] font-mono">
          <Database className="w-3 h-3 text-[#245BDB]" />
          <span className="text-[#172538] font-bold tabular-nums">
            {summary?.total_observations?.toLocaleString() ?? 0}
          </span>
          <span>Observations</span>
        </div>

        {/* Quick Seed Demo Button if empty */}
        {(!summary || summary.total_observations === 0) && (
          <button
            onClick={onLoadDemo}
            disabled={loading}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#245BDB] hover:bg-[#1D49AF] text-[#FFFFFF] text-xs font-semibold transition-colors cursor-pointer"
          >
            <span>Seed Demo</span>
          </button>
        )}

        {/* Refresh Action */}
        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-1.5 rounded border border-[#DCE2EA] bg-[#FFFFFF] hover:bg-[#F4F6F9] text-[#687587] hover:text-[#172538] transition-colors cursor-pointer"
          title="Refresh dataset telemetry"
          aria-label="Refresh data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#245BDB]' : ''}`} />
        </button>
      </div>
    </header>
  );
};
