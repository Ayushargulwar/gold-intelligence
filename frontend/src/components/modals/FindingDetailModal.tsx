import React from 'react';
import { X, CheckCircle2, AlertTriangle, ArrowRight, Activity, DollarSign, Clock } from 'lucide-react';
import type { AnomalyFinding } from '../../types';

interface FindingDetailModalProps {
  finding: AnomalyFinding | null;
  isOpen: boolean;
  onClose: () => void;
  onRunBacktestWithPair?: (symbolA: string, symbolB: string) => void;
}

export const FindingDetailModal: React.FC<FindingDetailModalProps> = ({
  finding,
  isOpen,
  onClose,
  onRunBacktestWithPair,
}) => {
  if (!isOpen || !finding) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#14243A]/50 backdrop-blur-xs p-4">
      <div className="bg-[#FFFFFF] border border-[#DCE2EA] rounded-md w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl overflow-hidden font-sans">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#DCE2EA] flex items-center justify-between bg-[#F4F6F9]">
          <div className="flex items-center gap-3">
            <div className={`p-1.5 rounded ${
              finding.overall_qualified ? 'bg-[#ECFDF5] text-[#13834A] border border-[#A7F3D0]' : 'bg-[#FEF2F2] text-[#D64550] border border-[#FECACA]'
            }`}>
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-[#14243A] uppercase tracking-wide">
                  Statistical Audit: {finding.pair}
                </h3>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold ${
                  finding.overall_qualified ? 'bg-[#ECFDF5] text-[#13834A] border border-[#A7F3D0]' : 'bg-[#FEF2F2] text-[#D64550] border border-[#FECACA]'
                }`}>
                  {finding.overall_qualified ? 'QUALIFIED FOR CONVERGENCE' : 'BLOCKED BY FILTERS'}
                </span>
              </div>
              <p className="text-[11px] text-[#687587] font-mono mt-0.5">
                Date: {finding.trading_date} • Regime: {finding.classification.replace('_', ' ')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#687587] hover:text-[#172538] hover:bg-[#EDF1F7] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Statistical Metrics Strip */}
        <div className="p-4 border-b border-[#DCE2EA] bg-[#F4F6F9] grid grid-cols-3 gap-3">
          <div className="p-2.5 rounded bg-[#FFFFFF] border border-[#DCE2EA]">
            <div className="text-[10px] text-[#687587] font-mono uppercase">Normalized Spread</div>
            <div className="text-sm font-bold text-[#245BDB] font-mono mt-0.5 tabular-nums">
              {finding.relative_spread_bps > 0 ? '+' : ''}{finding.relative_spread_bps.toFixed(1)} bps
            </div>
          </div>

          <div className="p-2.5 rounded bg-[#FFFFFF] border border-[#DCE2EA]">
            <div className="text-[10px] text-[#687587] font-mono uppercase">Standardized Deviation</div>
            <div className={`text-sm font-bold font-mono mt-0.5 tabular-nums ${
              Math.abs(finding.z_score) >= 2.5 ? 'text-[#D64550]' : 'text-[#14243A]'
            }`}>
              {finding.z_score > 0 ? '+' : ''}{finding.z_score.toFixed(2)}σ
            </div>
          </div>

          <div className="p-2.5 rounded bg-[#FFFFFF] border border-[#DCE2EA]">
            <div className="text-[10px] text-[#687587] font-mono uppercase">Execution Viability</div>
            <div className="text-xs font-bold font-mono mt-1 text-[#14243A]">
              {finding.overall_qualified ? 'Hurdle Cleared' : 'Friction Exceeds Dislocation'}
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Directional Implication */}
          <div className="p-3 rounded bg-[#F4F6F9] border border-[#DCE2EA]">
            <div className="text-[10px] font-mono text-[#687587] uppercase tracking-wide mb-1 font-semibold">
              Relative-Value Positioning
            </div>
            <div className="text-xs font-bold text-[#14243A]">
              {finding.direction_implication}
            </div>
            <p className="text-[11px] text-[#687587] mt-1 leading-relaxed">
              Relative value models do not predict outright gold direction. They capture mispricing between
              two economically equivalent gold claims, expecting the spread to revert to its rolling mean.
            </p>
          </div>

          {/* Three Independent Filters */}
          <div className="space-y-2.5">
            <h4 className="text-[10px] font-mono text-[#687587] uppercase tracking-wider font-bold">
              Independent Filter Evaluations
            </h4>

            {/* 1. Liquidity Filter */}
            <div className="p-3 rounded bg-[#FFFFFF] border border-[#DCE2EA] flex items-start gap-2.5">
              <div className="mt-0.5 shrink-0">
                {finding.liquidity_filter.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-[#13834A]" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-[#D64550]" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-[#14243A]">Liquidity Proxy Gate</div>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                    finding.liquidity_filter.status === 'PASS' ? 'bg-[#ECFDF5] text-[#13834A] border border-[#A7F3D0]' :
                    finding.liquidity_filter.status === 'WARN' ? 'bg-[#EEF3FD] text-[#245BDB] border border-[#BFDBFE]' : 'bg-[#FEF2F2] text-[#D64550] border border-[#FECACA]'
                  }`}>
                    {finding.liquidity_filter.status}
                  </span>
                </div>
                <p className="text-[11px] text-[#687587] mt-1">{finding.liquidity_filter.reason}</p>
              </div>
            </div>

            {/* 2. Expiry Filter */}
            <div className="p-3 rounded bg-[#FFFFFF] border border-[#DCE2EA] flex items-start gap-2.5">
              <div className="mt-0.5 shrink-0">
                {finding.expiry_filter.passed ? (
                  <Clock className="w-4 h-4 text-[#13834A]" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-[#D64550]" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-[#14243A]">Expiry & Delivery Window</div>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                    finding.expiry_filter.status === 'PASS' ? 'bg-[#ECFDF5] text-[#13834A] border border-[#A7F3D0]' :
                    finding.expiry_filter.status === 'WARN' ? 'bg-[#EEF3FD] text-[#245BDB] border border-[#BFDBFE]' : 'bg-[#FEF2F2] text-[#D64550] border border-[#FECACA]'
                  }`}>
                    {finding.expiry_filter.status}
                  </span>
                </div>
                <p className="text-[11px] text-[#687587] mt-1">{finding.expiry_filter.reason}</p>
              </div>
            </div>

            {/* 3. Cost Hurdle Filter */}
            <div className="p-3 rounded bg-[#FFFFFF] border border-[#DCE2EA] flex items-start gap-2.5">
              <div className="mt-0.5 shrink-0">
                {finding.cost_filter.passed ? (
                  <DollarSign className="w-4 h-4 text-[#13834A]" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-[#D64550]" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-[#14243A]">Transaction Friction Hurdle</div>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                    finding.cost_filter.status === 'PASS' ? 'bg-[#ECFDF5] text-[#13834A] border border-[#A7F3D0]' :
                    finding.cost_filter.status === 'WARN' ? 'bg-[#EEF3FD] text-[#245BDB] border border-[#BFDBFE]' : 'bg-[#FEF2F2] text-[#D64550] border border-[#FECACA]'
                  }`}>
                    {finding.cost_filter.status}
                  </span>
                </div>
                <p className="text-[11px] text-[#687587] mt-1">{finding.cost_filter.reason}</p>
              </div>
            </div>
          </div>

          {/* Full Narrative Explanation */}
          <div className="p-3 rounded bg-[#F4F6F9] border border-[#DCE2EA]">
            <div className="text-[10px] font-mono text-[#687587] uppercase tracking-wide mb-1 font-bold">
              Quantitative Audit Explanation
            </div>
            <p className="text-xs text-[#172538] leading-relaxed font-mono">
              "{finding.narrative_explanation}"
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-[#DCE2EA] bg-[#F4F6F9] flex justify-between items-center">
          <div className="text-[10px] text-[#8E9BAE] font-mono">
            Analytical screening only • Historical deviation is not a profit guarantee
          </div>
          <div className="flex items-center gap-2">
            {onRunBacktestWithPair && (
              <button
                onClick={() => {
                  onRunBacktestWithPair(finding.symbol_a, finding.symbol_b);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#245BDB] hover:bg-[#1D49AF] text-[#FFFFFF] text-xs font-semibold transition-colors cursor-pointer"
              >
                <span>Backtest Pair</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded bg-[#FFFFFF] hover:bg-[#F4F6F9] border border-[#DCE2EA] text-[#172538] text-xs font-semibold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
