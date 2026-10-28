import React, { useState, useEffect, useMemo } from 'react';
import {
  Coins,
  ArrowRight,
  Database,
  Calendar,
  Layers,
  Info,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  Sliders,
} from 'lucide-react';
import {
  fetchDatasetSummary,
  fetchRelativeValueSeries,
  scanAnomalies,
  loadDemoData,
  fetchContracts,
} from '../api/client';
import type {
  DatasetSummary,
  SpreadObservation,
  AnomalyFinding,
  ContractSpec,
} from '../types';
import { InteractiveSpreadChart } from '../components/charts/InteractiveSpreadChart';
import { NormalizedPriceChart } from '../components/charts/NormalizedPriceChart';
import { FindingDetailModal } from '../components/modals/FindingDetailModal';

interface OverviewProps {
  onNavigate: (tab: any) => void;
  onSelectPairForBacktest: (symA: string, symB: string) => void;
}

export const Overview: React.FC<OverviewProps> = ({
  onNavigate,
  onSelectPairForBacktest,
}) => {
  const [summary, setSummary] = useState<DatasetSummary | null>(null);
  const [contracts, setContracts] = useState<ContractSpec[]>([]);
  const [observations, setObservations] = useState<SpreadObservation[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyFinding[]>([]);
  const [selectedFinding, setSelectedFinding] = useState<AnomalyFinding | null>(null);
  const [activePair, setActivePair] = useState<string>('GOLDM vs GOLDPETAL');
  const [loading, setLoading] = useState<boolean>(false);

  const pairParts = activePair.split(' vs ');
  const symA = pairParts[0] || 'GOLDM';
  const symB = pairParts[1] || 'GOLDPETAL';

  useEffect(() => {
    loadOverviewData();
  }, [activePair]);

  const loadOverviewData = async () => {
    try {
      setLoading(true);
      const sum = await fetchDatasetSummary();
      setSummary(sum);

      if (sum.total_observations === 0) {
        await loadDemoData();
        const updatedSum = await fetchDatasetSummary();
        setSummary(updatedSum);
      }

      const [specs, seriesResp, findings] = await Promise.all([
        fetchContracts().catch(() => []),
        fetchRelativeValueSeries(symA, symB, 20),
        scanAnomalies(symA, symB, 1.8, 20),
      ]);

      setContracts(specs);
      setObservations(seriesResp.observations);
      setAnomalies(findings);
    } catch (err) {
      console.error('Error loading overview:', err);
    } finally {
      setLoading(false);
    }
  };

  // Find extreme finding for contextual metric
  const maxFinding = useMemo(() => {
    if (anomalies.length === 0) return null;
    return anomalies.reduce((prev, curr) =>
      Math.abs(curr.z_score) > Math.abs(prev.z_score) ? curr : prev
    );
  }, [anomalies]);

  const maxZ = maxFinding ? Math.abs(maxFinding.z_score) : 0;
  const qualifiedCount = anomalies.filter((a) => a.overall_qualified).length;

  const specA = contracts.find((c) => c.symbol === symA);
  const specB = contracts.find((c) => c.symbol === symB);

  return (
    <div className="space-y-5 max-w-7xl mx-auto font-sans">
      {/* 3.C: Research Overview Header */}
      <div className="bg-[#FFFFFF] border border-[#DCE2EA] rounded-md p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-3xl">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-[#F4F6F9] text-[#14243A] border border-[#DCE2EA] uppercase">
              Quantitative Research Thesis
            </span>
            <span className="text-[11px] text-[#687587] font-mono">
              MCX Commodity Derivatives Parity
            </span>
          </div>
          <h1 className="text-base sm:text-lg font-bold text-[#14243A] tracking-tight">
            "Is one MCX gold contract behaving unusually relative to another?"
          </h1>
          <p className="text-xs text-[#687587] leading-relaxed">
            Standardizing heterogeneous contract specifications (GOLDM, GOLDTEN, GOLDGUINEA, GOLDPETAL) to an exact
            INR per fine-gram basis to isolate genuine relative-value dislocations from differences in purity, lot size,
            and quotation conventions.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
          <button
            onClick={() => onNavigate('contracts')}
            className="px-3 py-1.5 rounded bg-[#FFFFFF] hover:bg-[#F4F6F9] border border-[#DCE2EA] text-xs font-semibold text-[#14243A] transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Coins className="w-3.5 h-3.5 text-[#245BDB]" />
            <span>Contract Specs</span>
          </button>
          <button
            onClick={() => {
              onSelectPairForBacktest(symA, symB);
              onNavigate('backtest');
            }}
            className="px-3.5 py-1.5 rounded bg-[#245BDB] hover:bg-[#1D49AF] text-[#FFFFFF] text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <span>Backtesting Lab</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3.D: Key Research Metrics Panels */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Panel 1: Contracts Covered */}
        <div className="p-3.5 rounded-md bg-[#FFFFFF] border border-[#DCE2EA]">
          <div className="text-[10px] font-mono font-semibold text-[#687587] uppercase tracking-wide">
            Contracts Covered
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-[#14243A] mt-1 tabular-nums">
            {summary?.supported_contracts ?? 4}
          </div>
          <div className="text-[11px] text-[#687587] mt-1 font-mono truncate">
            GOLDM • TEN • GUINEA • PETAL
          </div>
          <div className="text-[10px] text-[#8E9BAE] font-mono mt-0.5">
            Normalized to INR/fine-g
          </div>
        </div>

        {/* Panel 2: Historical Observations */}
        <div className="p-3.5 rounded-md bg-[#FFFFFF] border border-[#DCE2EA]">
          <div className="text-[10px] font-mono font-semibold text-[#687587] uppercase tracking-wide">
            Historical Observations
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-[#14243A] mt-1 tabular-nums">
            {summary?.total_observations ? summary.total_observations.toLocaleString() : '—'}
          </div>
          <div className="text-[11px] text-[#687587] mt-1 font-mono flex items-center gap-1 truncate">
            <Calendar className="w-3 h-3 text-[#245BDB]" />
            <span>{summary?.earliest_date?.slice(5) || 'Jan'} → {summary?.latest_date?.slice(5) || 'Oct 2026'}</span>
          </div>
          <div className="text-[10px] text-[#8E9BAE] font-mono mt-0.5">
            Synchronous daily closes
          </div>
        </div>

        {/* Panel 3: Largest Standardized Deviation */}
        <div className="p-3.5 rounded-md bg-[#FFFFFF] border border-[#DCE2EA]">
          <div className="text-[10px] font-mono font-semibold text-[#687587] uppercase tracking-wide">
            Largest Deviation ({activePair.split(' vs ')[0]}/{activePair.split(' vs ')[1]})
          </div>
          <div className={`text-xl sm:text-2xl font-bold font-mono mt-1 tabular-nums ${
            maxZ >= 2.5 ? 'text-[#D64550]' : 'text-[#245BDB]'
          }`}>
            {maxZ > 0 ? `${maxFinding && maxFinding.z_score > 0 ? '+' : ''}${maxFinding?.z_score.toFixed(2)}σ` : '0.00σ'}
          </div>
          <div className="text-[11px] text-[#687587] mt-1 font-mono truncate">
            {maxFinding ? `Observed on ${maxFinding.trading_date}` : 'No anomalies in window'}
          </div>
          <div className="text-[10px] text-[#8E9BAE] font-mono mt-0.5">
            20-day rolling Z-score
          </div>
        </div>

        {/* Panel 4: Qualified Anomalies */}
        <div className="p-3.5 rounded-md bg-[#FFFFFF] border border-[#DCE2EA]">
          <div className="text-[10px] font-mono font-semibold text-[#687587] uppercase tracking-wide">
            Qualified Anomalies
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-[#13834A] mt-1 tabular-nums">
            {qualifiedCount} <span className="text-xs font-normal text-[#687587]">/ {anomalies.length}</span>
          </div>
          <div className="text-[11px] text-[#687587] mt-1 font-mono">
            {anomalies.length > 0 ? `${((qualifiedCount / anomalies.length) * 100).toFixed(0)}% survived friction` : 'Zero candidates'}
          </div>
          <div className="text-[10px] text-[#8E9BAE] font-mono mt-0.5">
            Passed liquidity, DTE & cost gates
          </div>
        </div>
      </div>

      {/* 3.E: Contract Pair Selector & Specification Parity Strip */}
      <div className="bg-[#FFFFFF] border border-[#DCE2EA] rounded-md p-3.5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-mono font-semibold text-[#687587] uppercase tracking-wide">
              Analyzed Pair:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                'GOLDM vs GOLDPETAL',
                'GOLDTEN vs GOLDGUINEA',
                'GOLDM vs GOLDTEN',
                'GOLDGUINEA vs GOLDPETAL',
              ].map((pairName) => {
                const isSelected = activePair === pairName;
                return (
                  <button
                    key={pairName}
                    onClick={() => setActivePair(pairName)}
                    className={`px-2.5 py-1 rounded text-xs font-mono transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#14243A] text-[#FFFFFF] font-semibold'
                        : 'bg-[#F4F6F9] text-[#172538] hover:bg-[#EDF1F7] border border-[#DCE2EA]'
                    }`}
                  >
                    {pairName}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => onNavigate('relative-value')}
            className="text-xs font-mono text-[#245BDB] hover:text-[#1D49AF] flex items-center gap-1 cursor-pointer font-medium"
          >
            <span>Multi-Lookback Analytics</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Contract Specification Parity Comparison Strip */}
        {specA && specB && (
          <div className="pt-2.5 border-t border-[#EDF1F7] grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-2.5 rounded bg-[#F4F6F9] border border-[#DCE2EA] space-y-1">
              <div className="flex justify-between items-center text-[#14243A] font-bold">
                <span>Contract A: {specA.symbol} ({specA.name})</span>
                <span className="text-[11px] text-[#245BDB]">Purity: {specA.stated_purity}‰</span>
              </div>
              <div className="flex justify-between text-[#687587] text-[11px]">
                <span>Lot Size: {specA.contract_size_grams}g • Quoted: Per {specA.quote_unit_grams}g</span>
                <span>Fine Multiplier: {(1000 / (specA.quote_unit_grams * specA.stated_purity)).toFixed(4)}x</span>
              </div>
            </div>

            <div className="p-2.5 rounded bg-[#F4F6F9] border border-[#DCE2EA] space-y-1">
              <div className="flex justify-between items-center text-[#14243A] font-bold">
                <span>Contract B: {specB.symbol} ({specB.name})</span>
                <span className="text-[11px] text-[#245BDB]">Purity: {specB.stated_purity}‰</span>
              </div>
              <div className="flex justify-between text-[#687587] text-[11px]">
                <span>Lot Size: {specB.contract_size_grams}g • Quoted: Per {specB.quote_unit_grams}g</span>
                <span>Fine Multiplier: {(1000 / (specB.quote_unit_grams * specB.stated_purity)).toFixed(4)}x</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3.F: Main Analytical Chart: Relative Spread */}
      <InteractiveSpreadChart
        observations={observations}
        title={`${activePair}: Relative Spread & 20-Day Rolling ±2σ Envelopes`}
        height={340}
        onSelectPoint={(obs) => {
          const match = anomalies.find((a) => a.trading_date === obs.trading_date);
          if (match) setSelectedFinding(match);
        }}
      />

      {/* Synthetic Demonstration Data Disclosure Strip */}
      <div className="px-3.5 py-2 rounded bg-[#F4F6F9] border border-[#DCE2EA] flex items-center justify-between text-[11px] font-mono text-[#687587]">
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-[#245BDB] shrink-0" />
          <span>
            Demonstration dataset calibrated to official MCX contract specifications. Past statistical deviation is not indicative of future market convergence.
          </span>
        </div>
        <span className="text-[10px] text-[#8E9BAE] hidden md:inline">
          Stat-Arb Framework • Lookahead-Free Rolling Engine
        </span>
      </div>

      {/* Secondary Chart: Fine-Gram Price Parity */}
      <NormalizedPriceChart
        observations={observations}
        symbolA={symA}
        symbolB={symB}
        height={220}
      />

      {/* 3.G: Anomaly Research Table */}
      <div className="bg-[#FFFFFF] border border-[#DCE2EA] rounded-md overflow-hidden">
        <div className="px-4 py-3 border-b border-[#DCE2EA] flex items-center justify-between bg-[#F4F6F9]">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D64550]" />
            <h3 className="text-xs font-bold text-[#14243A] uppercase tracking-wide">
              Statistical Relative-Value Dislocations ({activePair})
            </h3>
          </div>
          <span className="text-[11px] font-mono text-[#687587]">
            Select any row to inspect triple-filter audit
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#F4F6F9] text-[#687587] text-[11px] border-b border-[#DCE2EA]">
              <tr>
                <th className="py-2 px-3">Date</th>
                <th className="py-2 px-3">Pair</th>
                <th className="py-2 px-3 text-right">Spread (bps)</th>
                <th className="py-2 px-3 text-right">Z-Score</th>
                <th className="py-2 px-3 text-right">Est. Friction</th>
                <th className="py-2 px-3 text-center">Liquidity</th>
                <th className="py-2 px-3 text-center">Expiry Safety</th>
                <th className="py-2 px-3 text-center">Qualification</th>
                <th className="py-2 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDF1F7]">
              {anomalies.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-[#687587] font-mono">
                    No statistical anomalies detected above threshold (|Z| ≥ 1.8σ) for {activePair}.
                  </td>
                </tr>
              ) : (
                anomalies.slice(0, 10).map((finding) => {
                  const isExtreme = Math.abs(finding.z_score) >= 2.5;
                  return (
                    <tr
                      key={finding.id}
                      onClick={() => setSelectedFinding(finding)}
                      className="hover:bg-[#F4F6F9] transition-colors cursor-pointer"
                    >
                      <td className="py-2.5 px-3 text-[#172538] font-medium">{finding.trading_date}</td>
                      <td className="py-2.5 px-3 text-[#14243A]">{finding.pair}</td>
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
                      <td className="py-2.5 px-3 text-right text-[#687587] tabular-nums">
                        {finding.cost_filter.observed_value != null ? `${Number(finding.cost_filter.observed_value).toFixed(1)} bps` : '3.5 bps'}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
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
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
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
                          className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                            finding.overall_qualified
                              ? 'text-[#13834A] bg-[#ECFDF5] border border-[#A7F3D0]'
                              : 'text-[#687587] bg-[#F4F6F9] border border-[#DCE2EA]'
                          }`}
                        >
                          {finding.overall_qualified ? 'QUALIFIED' : 'REJECTED'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span className="text-[11px] text-[#245BDB] hover:underline">Inspect →</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3.H: Research Methodology & Data Provenance Panel */}
      <div className="bg-[#FFFFFF] border border-[#DCE2EA] rounded-md p-4 sm:p-5 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-[#EDF1F7]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#14243A]" />
          <h3 className="text-xs font-bold text-[#14243A] uppercase tracking-wide">
            Methodology & Data Provenance Disclosure
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3 rounded bg-[#F4F6F9] border border-[#DCE2EA] space-y-1.5">
            <div className="font-bold text-[#14243A] flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-[#245BDB]" />
              <span>1. Data Provenance & Scope</span>
            </div>
            <p className="text-[#687587] text-[11px] leading-relaxed">
              Demonstration records reflect official MCX Daily Bhavcopy structures with calibrated contract specifications.
              No real-time exchange websocket connection is simulated. All metrics reflect strictly chronological daily observations.
            </p>
          </div>

          <div className="p-3 rounded bg-[#F4F6F9] border border-[#DCE2EA] space-y-1.5">
            <div className="font-bold text-[#14243A] flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-[#245BDB]" />
              <span>2. Fine-Gram Normalization</span>
            </div>
            <p className="text-[#687587] text-[11px] leading-relaxed">
              Price normalization converts quotes to pure fine gold parity:
              <code className="block mt-1 font-mono text-[10px] text-[#14243A] bg-[#FFFFFF] p-1 rounded border border-[#DCE2EA]">
                P_fine = P_quote / (Quote_Unit_g × Fineness)
              </code>
              Accounting for GOLDM (995‰) vs GOLDTEN/PETAL/GUINEA (999‰).
            </p>
          </div>

          <div className="p-3 rounded bg-[#F4F6F9] border border-[#DCE2EA] space-y-1.5">
            <div className="font-bold text-[#14243A] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#13834A]" />
              <span>3. Friction & Liquidity Gates</span>
            </div>
            <p className="text-[#687587] text-[11px] leading-relaxed">
              Statistical deviation is never equated to tradable profit. Anomalies must clear:
              (a) Volume ≥ 10 lots, (b) DTE ≥ 3 days prior to tender period, and (c) Spread dislocation exceeding round-trip friction (~3.5 bps).
            </p>
          </div>
        </div>
      </div>

      {/* Investigation Modal */}
      <FindingDetailModal
        finding={selectedFinding}
        isOpen={selectedFinding !== null}
        onClose={() => setSelectedFinding(null)}
        onRunBacktestWithPair={(sA, sB) => {
          onSelectPairForBacktest(sA, sB);
          onNavigate('backtest');
        }}
      />
    </div>
  );
};
