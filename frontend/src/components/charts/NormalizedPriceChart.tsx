import React, { useState, useMemo } from 'react';
import { TrendingUp, CandlestickChart } from 'lucide-react';
import type { SpreadObservation } from '../../types';

interface NormalizedPriceChartProps {
  observations: SpreadObservation[];
  symbolA: string;
  symbolB: string;
  height?: number;
}

export const NormalizedPriceChart: React.FC<NormalizedPriceChartProps> = ({
  observations,
  symbolA,
  symbolB,
  height = 240,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [chartMode, setChartMode] = useState<'line' | 'candles'>('line');

  // Compute candle bounds for symbolA
  const candleDataA = useMemo(() => {
    return observations.map((o, i) => {
      const prev = i > 0 ? observations[i - 1] : null;
      const close = o.price_a_fine_gram;
      const open = o.price_a_open_fine ?? (prev ? prev.price_a_fine_gram : close);
      const diff = Math.abs(close - open);
      const rawHigh = o.price_a_high_fine ?? (Math.max(open, close) + diff * 0.3 + 2.0);
      const rawLow = o.price_a_low_fine ?? (Math.min(open, close) - diff * 0.3 - 2.0);
      const high = Math.max(open, close, rawHigh);
      const low = Math.min(open, close, rawLow);
      const isBullish = close >= open;

      return {
        obs: o,
        open,
        high,
        low,
        close,
        isBullish,
      };
    });
  }, [observations]);

  const { minVal, maxVal, validObs } = useMemo(() => {
    if (!observations || observations.length === 0) {
      return { minVal: 7000, maxVal: 8000, validObs: [] };
    }
    const highsA = candleDataA.map((c) => c.high);
    const lowsA = candleDataA.map((c) => c.low);
    const pricesB = observations.map((o) => o.price_b_fine_gram);
    const all = [...highsA, ...lowsA, ...pricesB];
    const min = Math.min(...all);
    const max = Math.max(...all);
    const pad = Math.max(10, (max - min) * 0.12);
    return {
      minVal: min - pad,
      maxVal: max + pad,
      validObs: observations,
    };
  }, [observations, candleDataA]);

  const padding = { top: 20, right: 36, bottom: 28, left: 65 };
  const chartWidth = 900;
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const getX = (index: number) => {
    if (validObs.length <= 1) return padding.left + innerWidth / 2;
    return padding.left + (index / (validObs.length - 1)) * innerWidth;
  };

  const getY = (val: number) => {
    if (maxVal === minVal) return padding.top + innerHeight / 2;
    return padding.top + (1 - (val - minVal) / (maxVal - minVal)) * innerHeight;
  };

  // Build SVG path for series B (benchmark)
  const pathB = useMemo(() => {
    if (validObs.length === 0) return '';
    return validObs.reduce((acc, curr, idx) => {
      const x = getX(idx);
      const y = getY(curr.price_b_fine_gram);
      return idx === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : `${acc} L ${x.toFixed(1)} ${y.toFixed(1)}`;
    }, '');
  }, [validObs, minVal, maxVal]);

  // Build SVG path for series A (line mode)
  const pathA = useMemo(() => {
    if (validObs.length === 0) return '';
    return validObs.reduce((acc, curr, idx) => {
      const x = getX(idx);
      const y = getY(curr.price_a_fine_gram);
      return idx === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : `${acc} L ${x.toFixed(1)} ${y.toFixed(1)}`;
    }, '');
  }, [validObs, minVal, maxVal]);

  const candleWidth = useMemo(() => {
    if (validObs.length <= 1) return 8;
    const spacing = innerWidth / validObs.length;
    return Math.max(2.0, Math.min(7, spacing * 0.65));
  }, [validObs.length, innerWidth]);

  const latestObs = validObs.length > 0 ? validObs[validObs.length - 1] : null;
  const activeObs = hoverIndex !== null && hoverIndex >= 0 && hoverIndex < validObs.length ? validObs[hoverIndex] : latestObs;

  return (
    <div className="bg-[#FFFFFF] border border-[#DCE2EA] rounded-md p-4 flex flex-col relative select-none font-sans">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#EDF1F7]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#14243A]" />
            <h4 className="text-xs font-bold text-[#14243A] uppercase tracking-wide">
              Standardized Fine-Gram Parity Prices (INR / Fine-Gram)
            </h4>
          </div>

          {activeObs && (
            <div className="flex items-center gap-4 mt-1.5 text-xs font-mono tabular-nums">
              <span className="text-[#687587]">
                {activeObs.trading_date}
              </span>
              <span className="text-[#245BDB] font-semibold">
                {symbolA}: ₹{activeObs.price_a_fine_gram.toFixed(2)}/g
              </span>
              <span className="text-[#14243A] font-semibold">
                {symbolB}: ₹{activeObs.price_b_fine_gram.toFixed(2)}/g
              </span>
              <span className="text-[#687587]">
                Diff: <strong className="text-[#14243A]">₹{(activeObs.price_a_fine_gram - activeObs.price_b_fine_gram).toFixed(2)}/g</strong>
              </span>
            </div>
          )}
        </div>

        {/* Style Selector */}
        <div className="flex items-center bg-[#F4F6F9] p-0.5 rounded border border-[#DCE2EA] text-xs">
          <button
            onClick={() => setChartMode('line')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
              chartMode === 'line'
                ? 'bg-[#FFFFFF] text-[#14243A] font-bold shadow-xs'
                : 'text-[#687587] hover:text-[#172538]'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-[#245BDB]" />
            <span>Line</span>
          </button>
          <button
            onClick={() => setChartMode('candles')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
              chartMode === 'candles'
                ? 'bg-[#FFFFFF] text-[#14243A] font-bold shadow-xs'
                : 'text-[#687587] hover:text-[#172538]'
            }`}
          >
            <CandlestickChart className="w-3.5 h-3.5" />
            <span>Candles</span>
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between py-2 text-[11px] text-[#687587] border-b border-[#EDF1F7]">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-[#245BDB] font-semibold">
            <span className="w-3 h-0.5 bg-[#245BDB] rounded-full" /> {symbolA} (Normalized)
          </span>
          <span className="flex items-center gap-1.5 text-[#14243A] font-semibold">
            <span className="w-3 h-0.5 bg-[#14243A] rounded-full" /> {symbolB} (Parity Benchmark)
          </span>
          {chartMode === 'candles' && (
            <>
              <span className="flex items-center gap-1 text-[#10B981]">
                <span className="w-2 h-2 rounded-xs bg-[#10B981]" /> {symbolA} Up
              </span>
              <span className="flex items-center gap-1 text-[#EF4444]">
                <span className="w-2 h-2 rounded-xs bg-[#EF4444]" /> {symbolA} Down
              </span>
            </>
          )}
        </div>

        <span className="text-[10px] text-[#8E9BAE] font-mono hidden sm:inline">
          Canonical unit basis: INR per 1.000g pure gold
        </span>
      </div>

      <div className="relative w-full overflow-hidden mt-1">
        <svg
          viewBox={`0 0 ${chartWidth} ${height}`}
          className="w-full h-auto cursor-crosshair"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const relX = ((e.clientX - rect.left) / rect.width) * chartWidth;
            if (relX >= padding.left && relX <= chartWidth - padding.right && validObs.length > 1) {
              const idx = Math.round(((relX - padding.left) / innerWidth) * (validObs.length - 1));
              setHoverIndex(Math.max(0, Math.min(validObs.length - 1, idx)));
            }
          }}
          onMouseLeave={() => setHoverIndex(null)}
        >
          {/* Flat Background */}
          <rect
            x={padding.left}
            y={padding.top}
            width={innerWidth}
            height={innerHeight}
            fill="#FFFFFF"
          />

          {/* Clean Horizontal Gridlines & Price Scale */}
          {[0, 0.33, 0.66, 1.0].map((frac, i) => {
            const val = minVal + frac * (maxVal - minVal);
            const y = getY(val);
            return (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={chartWidth - padding.right}
                  y2={y}
                  stroke="#F1F5F9"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                <text
                  x={padding.left - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  className="fill-[#687587] font-mono text-[10px] tabular-nums"
                >
                  ₹{Math.round(val).toLocaleString('en-IN')}/g
                </text>
              </g>
            );
          })}

          {/* Outer Border Box */}
          <rect
            x={padding.left}
            y={padding.top}
            width={innerWidth}
            height={innerHeight}
            fill="none"
            stroke="#DCE2EA"
            strokeWidth="1"
          />

          {/* Series B Benchmark Curve (Slate Navy) */}
          {pathB && (
            <path
              d={pathB}
              fill="none"
              stroke="#14243A"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Series A Line Mode (Accent Blue) */}
          {chartMode === 'line' && pathA && (
            <path
              d={pathA}
              fill="none"
              stroke="#245BDB"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Series A Candlesticks Mode */}
          {chartMode === 'candles' &&
            candleDataA.map((c, i) => {
              const x = getX(i);
              const yHigh = getY(c.high);
              const yLow = getY(c.low);
              const yOpen = getY(c.open);
              const yClose = getY(c.close);

              const color = c.isBullish ? "#10B981" : "#EF4444";
              const bodyTop = Math.min(yOpen, yClose);
              const bodyHeight = Math.max(1.5, Math.abs(yOpen - yClose));
              const halfWidth = candleWidth / 2;

              return (
                <g key={i}>
                  <line
                    x1={x}
                    y1={yHigh}
                    x2={x}
                    y2={yLow}
                    stroke={color}
                    strokeWidth="1.1"
                  />
                  <rect
                    x={x - halfWidth}
                    y={bodyTop}
                    width={candleWidth}
                    height={bodyHeight}
                    fill={color}
                    rx="0.5"
                  />
                </g>
              );
            })}

          {/* Crosshair */}
          {hoverIndex !== null && activeObs && (
            <g>
              <line
                x1={getX(hoverIndex)}
                y1={padding.top}
                x2={getX(hoverIndex)}
                y2={height - padding.bottom}
                stroke="#687587"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <circle
                cx={getX(hoverIndex)}
                cy={getY(activeObs.price_b_fine_gram)}
                r="3.5"
                fill="#14243A"
                stroke="#FFFFFF"
                strokeWidth="1.5"
              />
              <circle
                cx={getX(hoverIndex)}
                cy={getY(activeObs.price_a_fine_gram)}
                r="3.5"
                fill="#245BDB"
                stroke="#FFFFFF"
                strokeWidth="1.5"
              />
            </g>
          )}

          {/* X-Axis Ticks */}
          {validObs.length > 0 &&
            [0, Math.floor(validObs.length / 3), Math.floor((2 * validObs.length) / 3), validObs.length - 1].map((idx) => {
              if (idx >= validObs.length) return null;
              const d = validObs[idx];
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
