import React, { useState, useMemo } from 'react';
import type { BacktestEquityPoint } from '../../types';

interface EquityCurveChartProps {
  equityPoints: BacktestEquityPoint[];
  initialCapital?: number;
  height?: number;
}

type TimeRange = '1M' | '3M' | '6M' | 'ALL';

export const EquityCurveChart: React.FC<EquityCurveChartProps> = ({
  equityPoints,
  initialCapital = 1000000,
  height = 300,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('ALL');

  // Filter by selected range
  const filteredPts = useMemo(() => {
    if (!equityPoints || equityPoints.length === 0) return [];
    if (timeRange === '1M') return equityPoints.slice(-22);
    if (timeRange === '3M') return equityPoints.slice(-66);
    if (timeRange === '6M') return equityPoints.slice(-132);
    return equityPoints;
  }, [equityPoints, timeRange]);

  const { minVal, maxVal, validPts } = useMemo(() => {
    if (filteredPts.length === 0) {
      return { minVal: initialCapital * 0.95, maxVal: initialCapital * 1.05, validPts: [] };
    }
    const nets = filteredPts.map((p) => p.net_equity_inr);
    const grosses = filteredPts.map((p) => p.gross_equity_inr);
    const benchmarks = filteredPts.map((p) => p.benchmark_equity_inr);
    const all = [...nets, ...grosses, ...benchmarks];
    const min = Math.min(...all);
    const max = Math.max(...all);
    const pad = Math.max(2000, (max - min) * 0.12);
    return {
      minVal: min - pad,
      maxVal: max + pad,
      validPts: filteredPts,
    };
  }, [filteredPts, initialCapital]);

  const chartWidth = 900;
  const padding = { top: 20, right: 36, bottom: 28, left: 80 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const getX = (idx: number) => {
    if (validPts.length <= 1) return padding.left + innerWidth / 2;
    return padding.left + (idx / (validPts.length - 1)) * innerWidth;
  };

  const getY = (val: number) => {
    if (maxVal === minVal) return padding.top + innerHeight / 2;
    return padding.top + (1 - (val - minVal) / (maxVal - minVal)) * innerHeight;
  };

  // Build paths
  const netPath = useMemo(() => {
    if (validPts.length === 0) return '';
    return validPts.reduce((acc, curr, idx) => {
      const x = getX(idx);
      const y = getY(curr.net_equity_inr);
      return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  }, [validPts, minVal, maxVal]);

  const grossPath = useMemo(() => {
    if (validPts.length === 0) return '';
    return validPts.reduce((acc, curr, idx) => {
      const x = getX(idx);
      const y = getY(curr.gross_equity_inr);
      return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  }, [validPts, minVal, maxVal]);

  const benchPath = useMemo(() => {
    if (validPts.length === 0) return '';
    return validPts.reduce((acc, curr, idx) => {
      const x = getX(idx);
      const y = getY(curr.benchmark_equity_inr);
      return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  }, [validPts, minVal, maxVal]);

  const netAreaPath = useMemo(() => {
    if (validPts.length === 0) return '';
    const firstX = getX(0);
    const lastX = getX(validPts.length - 1);
    const bottomY = getY(minVal);
    return `${netPath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [netPath, validPts, minVal, maxVal]);

  const latestPt = validPts.length > 0 ? validPts[validPts.length - 1] : null;
  const activePt = hoverIndex !== null && hoverIndex >= 0 && hoverIndex < validPts.length ? validPts[hoverIndex] : latestPt;

  return (
    <div className="bg-[#FFFFFF] border border-[#DCE2EA] rounded-md p-4 flex flex-col relative select-none font-sans">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#EDF1F7]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#13834A]" />
            <h4 className="text-xs font-bold text-[#14243A] uppercase tracking-wide">
              Portfolio Net Capital Trajectory (INR)
            </h4>
          </div>

          {activePt && (
            <div className="flex items-center gap-4 mt-1.5 text-xs font-mono tabular-nums">
              <span className="text-[#687587]">{activePt.trading_date}</span>
              <span className="text-[#13834A]">
                Net Equity: <strong>₹{activePt.net_equity_inr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong>
              </span>
              <span className="text-[#245BDB]">
                Gross: ₹{activePt.gross_equity_inr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
              <span className="text-[#687587]">
                Benchmark: ₹{activePt.benchmark_equity_inr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
            </div>
          )}
        </div>

        {/* Time range selector */}
        <div className="flex items-center bg-[#F4F6F9] p-0.5 rounded border border-[#DCE2EA] text-xs font-mono">
          {(['1M', '3M', '6M', 'ALL'] as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                timeRange === r
                  ? 'bg-[#14243A] text-[#FFFFFF] font-semibold'
                  : 'text-[#687587] hover:text-[#172538]'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between py-2 text-[11px] text-[#687587] border-b border-[#EDF1F7]">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-[#13834A] font-medium">
            <span className="w-3 h-0.5 bg-[#13834A] rounded-full" /> Net Equity (Post-Friction)
          </span>
          <span className="flex items-center gap-1.5 text-[#245BDB]">
            <span className="w-3 h-0.5 bg-[#245BDB] rounded-full" /> Gross Equity
          </span>
          <span className="flex items-center gap-1.5 text-[#687587]">
            <span className="w-3 h-0.5 bg-[#8E9BAE] border-b border-dashed border-[#8E9BAE]" /> Buy & Hold Benchmark
          </span>
        </div>

        <span className="text-[10px] text-[#8E9BAE] font-mono hidden sm:inline">
          Round-trip costs and slippage deducted daily
        </span>
      </div>

      <div className="relative w-full overflow-hidden mt-1">
        <svg
          viewBox={`0 0 ${chartWidth} ${height}`}
          className="w-full h-auto cursor-crosshair"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const relX = ((e.clientX - rect.left) / rect.width) * chartWidth;
            if (relX >= padding.left && relX <= chartWidth - padding.right && validPts.length > 1) {
              const idx = Math.round(((relX - padding.left) / innerWidth) * (validPts.length - 1));
              setHoverIndex(Math.max(0, Math.min(validPts.length - 1, idx)));
            }
          }}
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id="netEquityGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#13834A" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#13834A" stopOpacity="0.00" />
            </linearGradient>
          </defs>

          {/* Gridlines */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((frac, i) => {
            const val = minVal + frac * (maxVal - minVal);
            const y = getY(val);
            return (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={chartWidth - padding.right}
                  y2={y}
                  stroke="#EDF1F7"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                <text
                  x={padding.left - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  className="fill-[#687587] font-mono text-[10px] tabular-nums"
                >
                  ₹{Math.round(val).toLocaleString('en-IN')}
                </text>
              </g>
            );
          })}

          {/* Initial Capital Line */}
          <line
            x1={padding.left}
            y1={getY(initialCapital)}
            x2={chartWidth - padding.right}
            y2={getY(initialCapital)}
            stroke="#B4C0D0"
            strokeWidth="1"
            strokeDasharray="4 2"
          />

          {/* Benchmark Curve */}
          {benchPath && (
            <path
              d={benchPath}
              fill="none"
              stroke="#8E9BAE"
              strokeWidth="1.2"
              strokeDasharray="4 3"
            />
          )}

          {/* Gross Equity Curve */}
          {grossPath && (
            <path
              d={grossPath}
              fill="none"
              stroke="#245BDB"
              strokeWidth="1.5"
            />
          )}

          {/* Net Equity Area & Curve */}
          {netAreaPath && (
            <path
              d={netAreaPath}
              fill="url(#netEquityGradient)"
            />
          )}
          {netPath && (
            <path
              d={netPath}
              fill="none"
              stroke="#13834A"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Crosshair */}
          {hoverIndex !== null && activePt && (
            <g>
              <line
                x1={getX(hoverIndex)}
                y1={padding.top}
                x2={getX(hoverIndex)}
                y2={height - padding.bottom}
                stroke="#172538"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <circle
                cx={getX(hoverIndex)}
                cy={getY(activePt.net_equity_inr)}
                r="3.5"
                fill="#13834A"
                stroke="#FFFFFF"
                strokeWidth="1.5"
              />
            </g>
          )}

          {/* X Ticks */}
          {validPts.length > 0 &&
            [0, Math.floor(validPts.length / 3), Math.floor((2 * validPts.length) / 3), validPts.length - 1].map((idx) => {
              if (idx >= validPts.length) return null;
              const d = validPts[idx];
              return (
                <text
                  key={idx}
                  x={getX(idx)}
                  y={height - 8}
                  textAnchor="middle"
                  className="fill-[#687587] font-mono text-[10px]"
                >
                  {d.trading_date}
                </text>
              );
            })}
        </svg>
      </div>
    </div>
  );
};
