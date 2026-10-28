import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
  Play,
  Award,
} from 'lucide-react';
import { runBacktest } from '../api/client';
import type { BacktestParams, BacktestResultResponse } from '../types';
import { EquityCurveChart } from '../components/charts/EquityCurveChart';

interface BacktestingLabProps {
  initialPair?: { symbolA: string; symbolB: string };
}

export const BacktestingLab: React.FC<BacktestingLabProps> = ({ initialPair }) => {
  const [symbolA, setSymbolA] = useState<string>(initialPair?.symbolA || 'GOLDM');
  const [symbolB, setSymbolB] = useState<string>(initialPair?.symbolB || 'GOLDPETAL');
  const [lookbackWindow, setLookbackWindow] = useState<number>(20);
  const [entryZ, setEntryZ] = useState<number>(2.0);
  const [exitZ, setExitZ] = useState<number>(0.5);
  const [stopLossZ, setStopLossZ] = useState<number>(3.5);
  const [maxHoldingDays, setMaxHoldingDays] = useState<number>(15);
  const [capital] = useState<number>(1000000);

  const [brokeragePct] = useState<number>(0.00015);
  const [slippageBps, setSlippageBps] = useState<number>(2.5);

  const [result, setResult] = useState<BacktestResultResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const contractOptions = ['GOLDM', 'GOLDTEN', 'GOLDGUINEA', 'GOLDPETAL'];

  useEffect(() => {
    if (initialPair) {
      setSymbolA(initialPair.symbolA);
      setSymbolB(initialPair.symbolB);
    }
  }, [initialPair]);

  useEffect(() => {
    handleRunBacktest();
  }, [symbolA, symbolB]);

  const handleRunBacktest = async () => {
    if (symbolA === symbolB) {
      setError('Please select two distinct contracts.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const params: BacktestParams = {
        symbol_a: symbolA,
        symbol_b: symbolB,
        lookback_window: lookbackWindow,
        entry_z_score: entryZ,
        exit_z_score: exitZ,
        stop_loss_z_score: stopLossZ,
        max_holding_days: maxHoldingDays,
        capital_allocation_inr: capital,
        min_volume: 10,
        min_days_to_expiry: 3,
        costs: {
          brokerage_pct: brokeragePct,
          exchange_fee_pct: 0.000021,
          ctt_pct: 0.0001,
          gst_pct: 0.18,
          stamp_duty_pct: 0.00002,
          slippage_bps_per_leg: slippageBps,
        },
      };

      const res = await runBacktest(params);
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Backtest simulation failed');
    } finally {
      setLoading(false);
    }
  };

  const metrics = result?.metrics;

  return (
    <div className="space-y-5 max-w-7xl mx-auto font-sans">
      {/* Title Header */}
      <div className="bg-[#FFFFFF] border border-[#DCE2EA] rounded-md p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#F4F6F9] text-[#14243A] border border-[#DCE2EA] font-semibold uppercase">
              Walk-Forward Simulation
            </span>
            <span className="text-xs text-[#687587] font-mono">Next-Bar Execution • Zero Look-Ahead</span>
          </div>
          <h2 className="text-base font-bold text-[#14243A] mt-1">Walk-Forward Backtesting Lab</h2>
          <p className="text-xs text-[#687587] mt-0.5">
            Simulate chronological mean-reversion trading between MCX contracts with realistic statutory friction (CTT, SEBI, GST, Stamp duty, slippage).
          </p>
        </div>

        <button
          onClick={handleRunBacktest}
          disabled={loading}
          className="px-4 py-1.5 rounded bg-[#245BDB] hover:bg-[#1D49AF] text-[#FFFFFF] text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
        >
          <Play className={`w-3.5 h-3.5 fill-[#FFFFFF] ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Simulating...' : 'Run Simulation'}</span>
        </button>
      </div>

      {/* Parameter Configuration Drawer */}
      <div className="bg-[#FFFFFF] border border-[#DCE2EA] rounded-md p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-[#EDF1F7] pb-2 text-xs font-mono">
          <div className="flex items-center gap-2 text-[#14243A] font-bold uppercase">
            <FlaskConical className="w-3.5 h-3.5 text-[#245BDB]" />
            <span>Strategy & Risk Parameters</span>
          </div>
          <span className="text-[#687587]">Allocated Capital: ₹{capital.toLocaleString()}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs font-mono">
          {/* Pair Select */}
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

          {/* Lookback Window */}
          <div className="space-y-1">
            <div className="flex justify-between text-[#687587]">
              <span>Lookback Window (W):</span>
              <span className="text-[#14243A] font-bold">{lookbackWindow} days</span>
            </div>
            <input
              type="range"
              min="10"
              max="50"
              value={lookbackWindow}
              onChange={(e) => setLookbackWindow(parseInt(e.target.value))}
              className="w-full accent-[#245BDB] cursor-pointer"
            />
          </div>

          {/* Entry & Exit Z */}
          <div className="space-y-1">
            <div className="flex justify-between text-[#687587]">
              <span>Entry / Exit Z:</span>
              <span className="text-[#13834A] font-bold">±{entryZ.toFixed(1)}σ / ±{exitZ.toFixed(1)}σ</span>
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.1"
                min="1.0"
                max="3.5"
                value={entryZ}
                onChange={(e) => setEntryZ(parseFloat(e.target.value) || 2.0)}
                className="w-1/2 bg-[#FFFFFF] border border-[#DCE2EA] rounded px-2 py-1 text-[#14243A]"
              />
              <input
                type="number"
                step="0.1"
                min="0.0"
                max="1.5"
                value={exitZ}
                onChange={(e) => setExitZ(parseFloat(e.target.value) || 0.5)}
                className="w-1/2 bg-[#FFFFFF] border border-[#DCE2EA] rounded px-2 py-1 text-[#14243A]"
              />
            </div>
          </div>

          {/* Max Holding & Friction */}
          <div className="space-y-1">
            <div className="flex justify-between text-[#687587]">
              <span>Max Hold / Slippage:</span>
              <span className="text-[#172538] font-bold">{maxHoldingDays}d / {slippageBps} bps</span>
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                min="3"
                max="30"
                value={maxHoldingDays}
                onChange={(e) => setMaxHoldingDays(parseInt(e.target.value) || 15)}
                className="w-1/2 bg-[#FFFFFF] border border-[#DCE2EA] rounded px-2 py-1 text-[#14243A]"
              />
              <input
                type="number"
                step="0.5"
                min="0"
                max="10"
                value={slippageBps}
                onChange={(e) => setSlippageBps(parseFloat(e.target.value) || 2.5)}
                className="w-1/2 bg-[#FFFFFF] border border-[#DCE2EA] rounded px-2 py-1 text-[#14243A]"
              />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-2.5 rounded bg-[#FEF2F2] border border-[#FECACA] text-[#D64550] text-xs font-mono">
          {error}
        </div>
      )}

      {/* KPI Performance Strip */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 font-mono">
          {/* Net PnL */}
          <div className="p-3 rounded-md bg-[#FFFFFF] border border-[#DCE2EA]">
            <div className="text-[10px] text-[#687587] uppercase">NET P&L (POST-FEES)</div>
            <div className={`text-base font-bold mt-1 tabular-nums ${metrics.net_pnl_inr >= 0 ? 'text-[#13834A]' : 'text-[#D64550]'}`}>
              ₹{metrics.net_pnl_inr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
            <div className="text-[10px] text-[#687587] mt-0.5 tabular-nums">
              Gross: ₹{metrics.gross_pnl_inr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
          </div>

          {/* Win Rate */}
          <div className="p-3 rounded-md bg-[#FFFFFF] border border-[#DCE2EA]">
            <div className="text-[10px] text-[#687587] uppercase">WIN RATE</div>
            <div className="text-base font-bold text-[#14243A] mt-1 tabular-nums">
              {metrics.win_rate_pct.toFixed(1)}%
            </div>
            <div className="text-[10px] text-[#687587] mt-0.5 tabular-nums">
              {metrics.winning_trades}W / {metrics.losing_trades}L ({metrics.total_trades} trades)
            </div>
          </div>

          {/* Max Drawdown */}
          <div className="p-3 rounded-md bg-[#FFFFFF] border border-[#DCE2EA]">
            <div className="text-[10px] text-[#687587] uppercase">MAX DRAWDOWN</div>
            <div className="text-base font-bold text-[#D64550] mt-1 tabular-nums">
              -{metrics.max_drawdown_pct.toFixed(2)}%
            </div>
            <div className="text-[10px] text-[#687587] mt-0.5 tabular-nums">
              -₹{metrics.max_drawdown_inr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
          </div>

          {/* Total Fees */}
          <div className="p-3 rounded-md bg-[#FFFFFF] border border-[#DCE2EA]">
            <div className="text-[10px] text-[#687587] uppercase">TRANSACTION COSTS</div>
            <div className="text-base font-bold text-[#245BDB] mt-1 tabular-nums">
              ₹{metrics.total_transaction_costs_inr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
            <div className="text-[10px] text-[#687587] mt-0.5">
              CTT, SEBI, GST, Slip
            </div>
          </div>

          {/* Profit Factor */}
          <div className="p-3 rounded-md bg-[#FFFFFF] border border-[#DCE2EA]">
            <div className="text-[10px] text-[#687587] uppercase">PROFIT FACTOR</div>
            <div className="text-base font-bold text-[#14243A] mt-1 tabular-nums">
              {metrics.profit_factor ? metrics.profit_factor.toFixed(2) : 'N/A'}
            </div>
            <div className="text-[10px] text-[#687587] mt-0.5 tabular-nums">
              Avg hold: {metrics.average_holding_days.toFixed(1)}d
            </div>
          </div>

          {/* Annualized Sharpe */}
          <div className="p-3 rounded-md bg-[#FFFFFF] border border-[#DCE2EA]">
            <div className="text-[10px] text-[#687587] uppercase">ANNUALIZED SHARPE</div>
            <div className="text-base font-bold text-[#14243A] mt-1 tabular-nums">
              {metrics.annualized_sharpe_ratio !== null ? metrics.annualized_sharpe_ratio.toFixed(2) : '—'}
            </div>
            <div className="text-[10px] text-[#687587] mt-0.5">
              Risk-Adjusted Basis
            </div>
          </div>
        </div>
      )}

      {/* Benchmark Separation Callout */}
      {metrics && (
        <div className="p-4 rounded-md bg-[#FFFFFF] border border-[#DCE2EA] flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Award className="w-3.5 h-3.5 text-[#245BDB]" />
              <span className="text-xs font-bold text-[#14243A] uppercase font-mono tracking-wide">
                Relative-Value Alpha vs Directional Gold
              </span>
            </div>
            <p className="text-xs text-[#687587] max-w-2xl leading-relaxed">
              Verifying whether performance is driven by true spread mean-reversion rather than passive directional gold market exposure.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono shrink-0">
            <div className="p-2 rounded bg-[#F4F6F9] border border-[#DCE2EA]">
              <div className="text-[9px] text-[#687587]">GOLD BETA (β)</div>
              <div className="text-sm font-bold text-[#13834A] mt-0.5 tabular-nums">
                {metrics.strategy_beta_to_gold.toFixed(3)}
              </div>
            </div>

            <div className="p-2 rounded bg-[#F4F6F9] border border-[#DCE2EA]">
              <div className="text-[9px] text-[#687587]">CORRELATION (ρ)</div>
              <div className="text-sm font-bold text-[#14243A] mt-0.5 tabular-nums">
                {metrics.correlation_to_gold.toFixed(3)}
              </div>
            </div>

            <div className="p-2 rounded bg-[#F4F6F9] border border-[#DCE2EA]">
              <div className="text-[9px] text-[#687587]">STRATEGY ALPHA</div>
              <div className="text-sm font-bold text-[#245BDB] mt-0.5 tabular-nums">
                {metrics.strategy_alpha_pct > 0 ? '+' : ''}{metrics.strategy_alpha_pct.toFixed(2)}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Equity Curve Chart */}
      {result && result.equity_curve.length > 0 && (
        <EquityCurveChart
          equityPoints={result.equity_curve}
          initialCapital={capital}
          height={300}
        />
      )}

      {/* Chronological Trade Log Table */}
      {result && (
        <div className="bg-[#FFFFFF] border border-[#DCE2EA] rounded-md overflow-hidden">
          <div className="px-4 py-3 border-b border-[#DCE2EA] bg-[#F4F6F9] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#245BDB]" />
              <h3 className="text-xs font-bold text-[#14243A] uppercase tracking-wide">
                Chronological Walk-Forward Trade Log ({result.trades.length} Completed Trades)
              </h3>
            </div>
            <span className="text-[10px] font-mono text-[#687587]">Execution on t+1 at Market</span>
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#F4F6F9] text-[#687587] text-[11px] border-b border-[#DCE2EA] sticky top-0">
                <tr>
                  <th className="py-2 px-3">#</th>
                  <th className="py-2 px-3">Entry</th>
                  <th className="py-2 px-3">Exit</th>
                  <th className="py-2 px-3 text-center">Holding</th>
                  <th className="py-2 px-3">Direction</th>
                  <th className="py-2 px-3 text-right">Entry Z</th>
                  <th className="py-2 px-3 text-right">Exit Z</th>
                  <th className="py-2 px-3 text-right">Gross P&L</th>
                  <th className="py-2 px-3 text-right">Costs</th>
                  <th className="py-2 px-3 text-right">Net P&L</th>
                  <th className="py-2 px-3 text-right">Exit Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDF1F7]">
                {result.trades.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-[#687587] font-mono">
                      No trades triggered with current threshold settings.
                    </td>
                  </tr>
                ) : (
                  result.trades.map((t) => (
                    <tr key={t.trade_id} className="hover:bg-[#F4F6F9] transition-colors">
                      <td className="py-2 px-3 text-[#687587]">#{t.trade_id}</td>
                      <td className="py-2 px-3 text-[#14243A]">{t.entry_date}</td>
                      <td className="py-2 px-3 text-[#14243A]">{t.exit_date}</td>
                      <td className="py-2 px-3 text-center text-[#687587]">{t.holding_days}d</td>
                      <td className="py-2 px-3 font-semibold text-[#14243A] text-[11px]">
                        {t.signal_direction.replace(/_/g, ' ')}
                      </td>
                      <td className="py-2 px-3 text-right text-[#687587] tabular-nums">{t.entry_z_score.toFixed(2)}σ</td>
                      <td className="py-2 px-3 text-right text-[#687587] tabular-nums">{t.exit_z_score.toFixed(2)}σ</td>
                      <td className="py-2 px-3 text-right text-[#172538] tabular-nums">
                        ₹{t.gross_pnl_inr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </td>
                      <td className="py-2 px-3 text-right text-[#245BDB] tabular-nums">
                        -₹{t.total_costs_inr.toFixed(0)}
                      </td>
                      <td className={`py-2 px-3 text-right font-bold tabular-nums ${t.net_pnl_inr >= 0 ? 'text-[#13834A]' : 'text-[#D64550]'}`}>
                        ₹{t.net_pnl_inr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <span className="px-1 py-0.5 rounded text-[10px] bg-[#F4F6F9] border border-[#DCE2EA] text-[#687587]">
                          {t.exit_reason}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
