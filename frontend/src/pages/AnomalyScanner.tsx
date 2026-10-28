import React, { useState, useEffect } from 'react';
import {
  Filter,
  Search,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { scanAnomalies } from '../api/client';
import type { AnomalyFinding } from '../types';
import { FindingDetailModal } from '../components/modals/FindingDetailModal';

interface AnomalyScannerProps {
  onSelectPairForBacktest?: (symA: string, symB: string) => void;
  onNavigate?: (tab: any) => void;
}

export const AnomalyScanner: React.FC<AnomalyScannerProps> = ({
  onSelectPairForBacktest,
  onNavigate,
}) => {
  const [symbolA, setSymbolA] = useState<string>('GOLDM');
  const [symbolB, setSymbolB] = useState<string>('GOLDPETAL');
  const [zThreshold, setZThreshold] = useState<number>(2.0);
  const [lookbackWindow, setLookbackWindow] = useState<number>(20);
  const [minVolume] = useState<number>(10);
  const [minOi] = useState<number>(20);
  const [minDte, setMinDte] = useState<number>(3);
  const [findings, setFindings] = useState<AnomalyFinding[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [filterQualifiedOnly, setFilterQualifiedOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'z_score' | 'date' | 'spread'>('z_score');
  const [selectedFinding, setSelectedFinding] = useState<AnomalyFinding | null>(null);

  const contractOptions = ['GOLDM', 'GOLDTEN', 'GOLDGUINEA', 'GOLDPETAL'];

  useEffect(() => {
    handleScan();
  }, [symbolA, symbolB, zThreshold, lookbackWindow]);

  const handleScan = async () => {
    if (symbolA === symbolB) return;
    try {
      setLoading(true);
      const res = await scanAnomalies(
        symbolA,
        symbolB,
        zThreshold,
        lookbackWindow,
        minVolume,
        minOi,
        minDte
      );
      setFindings(res);
    } catch (err) {
      console.error('Scan error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredFindings = findings
    .filter((f) => (!filterQualifiedOnly ? true : f.overall_qualified))
    .sort((a, b) => {
      if (sortBy === 'z_score') return Math.abs(b.z_score) - Math.abs(a.z_score);
      if (sortBy === 'spread') return Math.abs(b.relative_spread_bps) - Math.abs(a.relative_spread_bps);
      return b.trading_date.localeCompare(a.trading_date);
    });

  const qualifiedCount = findings.filter((f) => f.overall_qualified).length;

  return (
    <div className="space-y-5 max-w-7xl mx-auto font-sans">
      {/* Title Header */}
      <div className="bg-[#FFFFFF] border border-[#DCE2EA] rounded-md p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#F4F6F9] text-[#14243A] border border-[#DCE2EA] font-semibold uppercase">
              Statistical Surveillance
            </span>
            <span className="text-xs text-[#687587] font-mono">Dislocation Scanner</span>
          </div>
          <h2 className="text-base font-bold text-[#14243A] mt-1">Relative-Value Anomaly Scanner</h2>
          <p className="text-xs text-[#687587] mt-0.5">
            Identify standardized relative spread dislocations and independently test them against liquidity, expiry, and friction hurdles.
          </p>
        </div>
      </div>

      {/* Configuration Panel */}
      <div className="bg-[#FFFFFF] border border-[#DCE2EA] rounded-md p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-[#EDF1F7] pb-2.5">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#14243A] uppercase">
            <Filter className="w-3.5 h-3.5 text-[#245BDB]" />
            <span>Surveillance Filters & Thresholds</span>
          </div>
          <button
            onClick={handleScan}
            disabled={loading}
            className="px-3 py-1 rounded bg-[#245BDB] hover:bg-[#1D49AF] text-[#FFFFFF] text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Search className="w-3 h-3" />
            <span>{loading ? 'Scanning...' : 'Rerun Scanner'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs font-mono">
          {/* Leg A & Leg B */}
          <div className="space-y-1">
            <label className="text-[#687587]">Pair:</label>
            <div className="flex items-center gap-1.5">
              <select
                value={symbolA}
                onChange={(e) => setSymbolA(e.target.value)}
                className="w-1/2 bg-[#FFFFFF] border border-[#DCE2EA] rounded px-2 py-1 text-xs text-[#245BDB] font-bold focus:outline-hidden"
              >
                {contractOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <span className="text-[#8E9BAE]">/</span>
              <select
                value={symbolB}
                onChange={(e) => setSymbolB(e.target.value)}
                className="w-1/2 bg-[#FFFFFF] border border-[#DCE2EA] rounded px-2 py-1 text-xs text-[#14243A] font-bold focus:outline-hidden"
              >
                {contractOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Z-Threshold */}
          <div className="space-y-1">
            <div className="flex justify-between text-[#687587]">
              <span>Deviation Threshold (Z):</span>
              <span className="text-[#245BDB] font-bold">|Z| ≥ {zThreshold.toFixed(1)}σ</span>
            </div>
            <input
              type="range"
              min="1.2"
              max="3.5"
              step="0.1"
              value={zThreshold}
              onChange={(e) => setZThreshold(parseFloat(e.target.value))}
              className="w-full accent-[#245BDB] cursor-pointer"
            />
          </div>

          {/* Lookback Window */}
          <div className="space-y-1">
            <div className="flex justify-between text-[#687587]">
              <span>Lookback Window (W):</span>
              <span className="text-[#14243A] font-bold">{lookbackWindow} days</span>
            </div>
            <input
              type="range"
              min="10"
              max="60"
              value={lookbackWindow}
              onChange={(e) => setLookbackWindow(parseInt(e.target.value))}
              className="w-full accent-[#245BDB] cursor-pointer"
            />
          </div>

          {/* Min DTE */}
          <div className="space-y-1">
            <label className="text-[#687587]">Min Expiry Safety (DTE):</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="30"
                value={minDte}
                onChange={(e) => setMinDte(parseInt(e.target.value) || 0)}
                className="w-full bg-[#FFFFFF] border border-[#DCE2EA] rounded px-2 py-1 text-xs text-[#14243A] focus:outline-hidden"
              />
              <span className="text-[11px] text-[#687587] shrink-0">days</span>
            </div>
          </div>
        </div>
      </div>

      {/* Results Header Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#FFFFFF] border border-[#DCE2EA] rounded-md px-4 py-2.5">
        <div className="flex items-center gap-3">
          <div className="text-xs font-mono text-[#687587]">
            Found <span className="font-bold text-[#14243A] tabular-nums">{findings.length}</span> candidate deviations
          </div>
          <span className="text-[#DCE2EA]">•</span>
          <div className="text-xs font-mono text-[#13834A] font-bold tabular-nums">
            {qualifiedCount} qualified ({findings.length > 0 ? ((qualifiedCount / findings.length) * 100).toFixed(0) : 0}%)
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <label className="flex items-center gap-1.5 cursor-pointer text-[#172538]">
            <input
              type="checkbox"
              checked={filterQualifiedOnly}
              onChange={(e) => setFilterQualifiedOnly(e.target.checked)}
              className="accent-[#245BDB] rounded cursor-pointer"
            />
            <span>Qualified Only</span>
          </label>

          <span className="text-[#DCE2EA]">•</span>

          <div className="flex items-center gap-1 text-[#687587]">
            <span>Sort:</span>
            <button
              onClick={() => setSortBy('z_score')}
              className={`px-1.5 py-0.5 rounded cursor-pointer ${
                sortBy === 'z_score' ? 'bg-[#14243A] text-[#FFFFFF] font-semibold' : 'hover:text-[#14243A]'
              }`}
            >
              |Z|
            </button>
            <button
              onClick={() => setSortBy('spread')}
              className={`px-1.5 py-0.5 rounded cursor-pointer ${
                sortBy === 'spread' ? 'bg-[#14243A] text-[#FFFFFF] font-semibold' : 'hover:text-[#14243A]'
              }`}
            >
              Spread
            </button>
            <button
              onClick={() => setSortBy('date')}
              className={`px-1.5 py-0.5 rounded cursor-pointer ${
                sortBy === 'date' ? 'bg-[#14243A] text-[#FFFFFF] font-semibold' : 'hover:text-[#14243A]'
              }`}
            >
              Date
            </button>
          </div>
        </div>
      </div>

      {/* Findings Table */}
      <div className="bg-[#FFFFFF] border border-[#DCE2EA] rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#F4F6F9] text-[#687587] text-[11px] border-b border-[#DCE2EA]">
              <tr>
                <th className="py-2 px-3">Date</th>
                <th className="py-2 px-3">Pair</th>
                <th className="py-2 px-3 text-right">Spread (bps)</th>
                <th className="py-2 px-3 text-right">Z-Score</th>
                <th className="py-2 px-3 text-center">Liquidity</th>
                <th className="py-2 px-3 text-center">Expiry</th>
                <th className="py-2 px-3 text-center">Cost Hurdle</th>
                <th className="py-2 px-3 text-center">Outcome</th>
                <th className="py-2 px-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDF1F7]">
              {filteredFindings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-[#687587] font-mono">
                    No anomalies found matching current filter thresholds.
                  </td>
                </tr>
              ) : (
                filteredFindings.map((finding) => {
                  const isExtreme = Math.abs(finding.z_score) >= 2.5;
                  return (
                    <tr
                      key={finding.id}
                      onClick={() => setSelectedFinding(finding)}
                      className="hover:bg-[#F4F6F9] transition-colors cursor-pointer"
                    >
                      <td className="py-2.5 px-3 text-[#172538] font-medium">{finding.trading_date}</td>
                      <td className="py-2.5 px-3 text-[#14243A] font-semibold">{finding.pair}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-[#245BDB] tabular-nums">
                        {finding.relative_spread_bps > 0 ? '+' : ''}
                        {finding.relative_spread_bps.toFixed(1)} bps
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            isExtreme
                              ? 'bg-[#FEF2F2] text-[#D64550] border border-[#FECACA]'
                              : 'bg-[#EEF3FD] text-[#245BDB] border border-[#BFDBFE]'
                          }`}
                        >
                          {finding.z_score > 0 ? '+' : ''}
                          {finding.z_score.toFixed(2)}σ
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            finding.liquidity_filter.status === 'PASS'
                              ? 'text-[#13834A] bg-[#ECFDF5] border border-[#A7F3D0]'
                              : 'text-[#D64550] bg-[#FEF2F2] border border-[#FECACA]'
                          }`}
                        >
                          {finding.liquidity_filter.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            finding.expiry_filter.status === 'PASS'
                              ? 'text-[#13834A] bg-[#ECFDF5] border border-[#A7F3D0]'
                              : finding.expiry_filter.status === 'WARN'
                              ? 'text-[#D97706] bg-[#FFFBEB] border border-[#FDE68A]'
                              : 'text-[#D64550] bg-[#FEF2F2] border border-[#FECACA]'
                          }`}
                        >
                          {finding.expiry_filter.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            finding.cost_filter.status === 'PASS'
                              ? 'text-[#13834A] bg-[#ECFDF5] border border-[#A7F3D0]'
                              : 'text-[#245BDB] bg-[#EEF3FD] border border-[#BFDBFE]'
                          }`}
                        >
                          {finding.cost_filter.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {finding.overall_qualified ? (
                          <span className="inline-flex items-center gap-1 text-[#13834A] font-bold text-[10px]">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Qualified</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[#8E9BAE] text-[10px]">
                            <XCircle className="w-3 h-3" />
                            <span>Rejected</span>
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span className="text-[#245BDB] hover:underline text-[11px]">
                          Inspect →
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Investigation Modal */}
      <FindingDetailModal
        finding={selectedFinding}
        isOpen={selectedFinding !== null}
        onClose={() => setSelectedFinding(null)}
        onRunBacktestWithPair={(sA, sB) => {
          if (onSelectPairForBacktest) onSelectPairForBacktest(sA, sB);
          if (onNavigate) onNavigate('backtest');
        }}
      />
    </div>
  );
};
