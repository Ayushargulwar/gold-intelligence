import React, { useState, useEffect } from 'react';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { fetchRelativeValueSeries } from '../api/client';
import type { RelativeValueSeriesResponse } from '../types';
import { InteractiveSpreadChart } from '../components/charts/InteractiveSpreadChart';
import { ZScoreOscillatorChart } from '../components/charts/ZScoreOscillatorChart';
import { NormalizedPriceChart } from '../components/charts/NormalizedPriceChart';

export const RelativeValue: React.FC = () => {
  const [symbolA, setSymbolA] = useState<string>('GOLDM');
  const [symbolB, setSymbolB] = useState<string>('GOLDPETAL');
  const [lookbackWindow, setLookbackWindow] = useState<number>(20);
  const [seriesData, setSeriesData] = useState<RelativeValueSeriesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const contractOptions = ['GOLDM', 'GOLDTEN', 'GOLDGUINEA', 'GOLDPETAL'];

  useEffect(() => {
    loadSeries();
  }, [symbolA, symbolB, lookbackWindow]);

  const loadSeries = async () => {
    if (symbolA === symbolB) {
      setError('Please select two distinct contracts.');
      return;
    }
    try {
      setError(null);
      const res = await fetchRelativeValueSeries(symbolA, symbolB, lookbackWindow);
      setSeriesData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch relative value series');
    }
  };

  const stats = seriesData?.summary_statistics || {};

  return (
    <div className="space-y-5 max-w-7xl mx-auto font-sans">
      {/* Title Header */}
      <div className="bg-[#FFFFFF] border border-[#DCE2EA] rounded-md p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#F4F6F9] text-[#14243A] border border-[#DCE2EA] font-semibold uppercase">
              Pairwise Quantitative Analytics
            </span>
            <span className="text-xs text-[#687587] font-mono">Fine-Gram Parity Basis</span>
          </div>
          <h2 className="text-base font-bold text-[#14243A] mt-1">
            Relative Value Engine: {symbolA} vs {symbolB}
          </h2>
          <p className="text-xs text-[#687587] mt-0.5">
            Synchronous historical spread tracking, lookahead-free rolling baselines, and statistical deviation envelopes.
          </p>
        </div>

        {/* Live Z-Score Callout */}
        {stats.latest_z_score !== undefined && stats.latest_z_score !== null && (
          <div className="p-2.5 rounded bg-[#F4F6F9] border border-[#DCE2EA] flex items-center gap-4">
            <div>
              <div className="text-[9px] text-[#687587] font-mono uppercase">LATEST Z-SCORE</div>
              <div
                className={`text-base font-bold font-mono tabular-nums ${
                  Math.abs(stats.latest_z_score) >= 2.0 ? 'text-[#D64550]' : 'text-[#13834A]'
                }`}
              >
                {stats.latest_z_score > 0 ? '+' : ''}
                {stats.latest_z_score.toFixed(2)}σ
              </div>
            </div>
            <div className="h-6 w-px bg-[#DCE2EA]" />
            <div>
              <div className="text-[9px] text-[#687587] font-mono uppercase">LATEST SPREAD</div>
              <div className="text-base font-bold font-mono text-[#245BDB] tabular-nums">
                {stats.latest_relative_spread_bps > 0 ? '+' : ''}
                {stats.latest_relative_spread_bps?.toFixed(1) ?? '—'} bps
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Configuration Controls Bar */}
      <div className="bg-[#FFFFFF] border border-[#DCE2EA] rounded-md p-3.5 flex flex-wrap items-center justify-between gap-3">
        {/* Pair Dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-mono text-[#687587]">Leg A:</label>
            <select
              value={symbolA}
              onChange={(e) => setSymbolA(e.target.value)}
              className="bg-[#FFFFFF] border border-[#DCE2EA] rounded px-2.5 py-1 text-xs font-mono font-bold text-[#245BDB] focus:outline-hidden"
            >
              {contractOptions.map((sym) => (
                <option key={sym} value={sym}>
                  {sym}
                </option>
              ))}
            </select>
          </div>

          <span className="text-[#8E9BAE] font-mono text-xs">vs</span>

          <div className="flex items-center gap-2">
            <label className="text-xs font-mono text-[#687587]">Leg B:</label>
            <select
              value={symbolB}
              onChange={(e) => setSymbolB(e.target.value)}
              className="bg-[#FFFFFF] border border-[#DCE2EA] rounded px-2.5 py-1 text-xs font-mono font-bold text-[#14243A] focus:outline-hidden"
            >
              {contractOptions.map((sym) => (
                <option key={sym} value={sym}>
                  {sym}
                </option>
              ))}
            </select>
          </div>

          <div className="h-4 w-px bg-[#DCE2EA] hidden sm:block" />

          {/* Lookback Window Slider */}
          <div className="flex items-center gap-2.5">
            <label className="text-xs font-mono text-[#687587]">Rolling Lookback (W):</label>
            <input
              type="range"
              min="5"
              max="60"
              value={lookbackWindow}
              onChange={(e) => setLookbackWindow(parseInt(e.target.value))}
              className="accent-[#245BDB] w-28 cursor-pointer"
            />
            <span className="text-xs font-mono font-semibold text-[#14243A]">{lookbackWindow} days</span>
          </div>
        </div>

        {/* Lookahead Safety Badge */}
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#13834A] px-2 py-0.5 rounded bg-[#ECFDF5] border border-[#A7F3D0]">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Lookahead-Free Rolling Window Active</span>
        </div>
      </div>

      {error && (
        <div className="p-2.5 rounded bg-[#FEF2F2] border border-[#FECACA] text-[#D64550] text-xs font-mono">
          {error}
        </div>
      )}

      {/* Summary Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 font-mono">
        <div className="p-3 rounded-md bg-[#FFFFFF] border border-[#DCE2EA]">
          <div className="text-[10px] text-[#687587] uppercase">TOTAL OBSERVATIONS</div>
          <div className="text-base font-bold text-[#14243A] mt-1 tabular-nums">
            {seriesData?.total_observations ?? 0}
          </div>
        </div>

        <div className="p-3 rounded-md bg-[#FFFFFF] border border-[#DCE2EA]">
          <div className="text-[10px] text-[#687587] uppercase">MEAN RELATIVE SPREAD</div>
          <div className="text-base font-bold text-[#14243A] mt-1 tabular-nums">
            {stats.mean_spread_bps?.toFixed(1) ?? 0.0} bps
          </div>
        </div>

        <div className="p-3 rounded-md bg-[#FFFFFF] border border-[#DCE2EA]">
          <div className="text-[10px] text-[#687587] uppercase">SPREAD VOLATILITY (STD)</div>
          <div className="text-base font-bold text-[#245BDB] mt-1 tabular-nums">
            {stats.std_spread_bps?.toFixed(1) ?? 0.0} bps
          </div>
        </div>

        <div className="p-3 rounded-md bg-[#FFFFFF] border border-[#DCE2EA]">
          <div className="text-[10px] text-[#687587] uppercase">MIN / MAX SPREAD</div>
          <div className="text-base font-bold text-[#172538] mt-1 tabular-nums">
            {stats.min_spread_bps?.toFixed(0) ?? 0} / {stats.max_spread_bps?.toFixed(0) ?? 0} bps
          </div>
        </div>

        <div className="p-3 rounded-md bg-[#FFFFFF] border border-[#DCE2EA]">
          <div className="text-[10px] text-[#687587] uppercase">MAX DETECTED Z-SCORE</div>
          <div className="text-base font-bold text-[#D64550] mt-1 tabular-nums">
            {stats.max_z_score?.toFixed(2) ?? 0.00}σ
          </div>
        </div>
      </div>

      {/* Main Charts */}
      {seriesData && seriesData.observations.length > 0 ? (
        <div className="space-y-4">
          <InteractiveSpreadChart
            observations={seriesData.observations}
            title={`${symbolA} vs ${symbolB}: Relative Spread & Rolling ±2σ Envelopes`}
            height={320}
          />

          <ZScoreOscillatorChart
            observations={seriesData.observations}
            title={`${symbolA} vs ${symbolB}: Standardized Deviation (Z-Score) Oscillator`}
            height={190}
          />

          <NormalizedPriceChart
            observations={seriesData.observations}
            symbolA={symbolA}
            symbolB={symbolB}
            height={200}
          />
        </div>
      ) : (
        <div className="bg-[#FFFFFF] border border-[#DCE2EA] rounded-md p-10 text-center text-xs font-mono text-[#687587]">
          No aligned observations found for {symbolA} vs {symbolB}.
        </div>
      )}
    </div>
  );
};
