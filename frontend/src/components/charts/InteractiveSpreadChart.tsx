import React, { useState, useMemo } from 'react';
import { TrendingUp, CandlestickChart, Layers, AlertCircle } from 'lucide-react';
import type { SpreadObservation } from '../../types';

interface InteractiveSpreadChartProps {
  observations: SpreadObservation[];
  title?: string;
  height?: number;
  onSelectPoint?: (obs: SpreadObservation) => void;
}

type TimeRange = '1M' | '3M' | '6M' | 'ALL';
type ChartStyle = 'line' | 'candles';

export const InteractiveSpreadChart: React.FC<InteractiveSpreadChartProps> = ({
  observations,
  title = "Relative Spread (bps) & Rolling ±2σ Confidence Envelopes",
  height = 360,
  onSelectPoint,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('ALL');
  const [chartStyle, setChartStyle] = useState<ChartStyle>('line');
  const [showBands, setShowBands] = useState<boolean>(true);
  const [showAnomalies, setShowAnomalies] = useState<boolean>(true);

  // Filter observations by time range
  const filteredObs = useMemo(() => {
    if (!observations || observations.length === 0) return [];
    if (timeRange === '1M') return observations.slice(-22);
    if (timeRange === '3M') return observations.slice(-66);
    if (timeRange === '6M') return observations.slice(-132);
    return observations;
  }, [observations, timeRange]);

  // Compute robust OHLC candle metrics for each observation
  const candleData = useMemo(() => {
    return filteredObs.map((obs, i) => {
      const prevObs = i > 0 ? filteredObs[i - 1] : null;
      const close = obs.spread_close_bps ?? obs.relative_spread_bps;
      const open = obs.spread_open_bps ?? (prevObs ? (prevObs.spread_close_bps ?? prevObs.relative_spread_bps) : close);

      const spreadDiff = Math.abs(close - open);
      const wickPadding = Math.max(0.3, spreadDiff * 0.25);
      const rawHigh = obs.spread_high_bps ?? (Math.max(open, close) + wickPadding);
      const rawLow = obs.spread_low_bps ?? (Math.min(open, close) - wickPadding);

      const high = Math.max(open, close, rawHigh);
      const low = Math.min(open, close, rawLow);
      const isBullish = close >= open;

      return {
        obs,
        open,
        high,
        low,
        close,
        isBullish,
      };
    });
  }, [filteredObs]);

  // Compute scale domains with clean padding
  const { minVal, maxVal, validObs } = useMemo(() => {
    if (candleData.length === 0) {
      return { minVal: -20, maxVal: 20, validObs: [] };
    }
    const highs = candleData.map((c) => c.high);
    const lows = candleData.map((c) => c.low);
    const upper2 = filteredObs.map((o) => (o.upper_band_2 != null ? o.upper_band_2 * 10000 : o.relative_spread_bps));
    const lower2 = filteredObs.map((o) => (o.lower_band_2 != null ? o.lower_band_2 * 10000 : o.relative_spread_bps));

    const all = [...highs, ...lows, ...upper2, ...lower2].filter((v) => !isNaN(v) && isFinite(v));
    const min = Math.min(...all);
    const max = Math.max(...all);
    const pad = Math.max(5, (max - min) * 0.15);
    return {
      minVal: min - pad,
      maxVal: max + pad,
      validObs: filteredObs,
    };
  }, [candleData, filteredObs]);

  const padding = { top: 20, right: 36, bottom: 30, left: 65 };
  const chartWidth = 900;
  const chartHeight = height;

  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const getX = (index: number) => {
    if (validObs.length <= 1) return padding.left + innerWidth / 2;
    return padding.left + (index / (validObs.length - 1)) * innerWidth;
  };

  const getY = (val: number) => {
    if (maxVal === minVal) return padding.top + innerHeight / 2;
    return padding.top + (1 - (val - minVal) / (maxVal - minVal)) * innerHeight;
  };

  // Build SVG path for relative spread line
  const spreadPath = useMemo(() => {
    if (validObs.length === 0) return '';
    return validObs.reduce((acc, curr, idx) => {
      const x = getX(idx);
      const y = getY(curr.relative_spread_bps);
      return idx === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : `${acc} L ${x.toFixed(1)} ${y.toFixed(1)}`;
    }, '');
  }, [validObs, minVal, maxVal]);

  // Area under curve for line mode
  const spreadAreaPath = useMemo(() => {
    if (validObs.length === 0) return '';
    const firstX = getX(0);
    const lastX = getX(validObs.length - 1);
    const zeroY = getY(Math.max(minVal, Math.min(maxVal, 0)));
    return `${spreadPath} L ${lastX.toFixed(1)} ${zeroY.toFixed(1)} L ${firstX.toFixed(1)} ${zeroY.toFixed(1)} Z`;
  }, [spreadPath, validObs, minVal, maxVal]);

  // Build rolling mean baseline path
  const meanPath = useMemo(() => {
    const pts = validObs
      .map((o, i) => ({ o, i }))
      .filter((item) => item.o.rolling_mean != null);
    if (pts.length === 0) return '';
    return pts.reduce((acc, item, idx) => {
      const x = getX(item.i);
      const y = getY((item.o.rolling_mean as number) * 10000);
      return idx === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : `${acc} L ${x.toFixed(1)} ${y.toFixed(1)}`;
    }, '');
  }, [validObs, minVal, maxVal]);

  // Build ±2σ confidence ribbon path
  const band2Path = useMemo(() => {
    const pts = validObs
      .map((o, i) => ({ o, i }))
      .filter((item) => item.o.upper_band_2 != null && item.o.lower_band_2 != null);
    if (pts.length === 0) return '';

    const upper = pts.map((p) => `${getX(p.i).toFixed(1)} ${getY((p.o.upper_band_2 as number) * 10000).toFixed(1)}`);
    const lowerRev = pts
      .slice()
      .reverse()
      .map((p) => `${getX(p.i).toFixed(1)} ${getY((p.o.lower_band_2 as number) * 10000).toFixed(1)}`);

    return `M ${upper[0]} L ${upper.join(' L ')} L ${lowerRev.join(' L ')} Z`;
  }, [validObs, minVal, maxVal]);

  // Extract anomaly points (|Z| >= 2.0)
  const anomalyPoints = useMemo(() => {
    if (!showAnomalies) return [];
    return validObs
      .map((o, idx) => ({ obs: o, idx }))
      .filter((item) => item.obs.z_score !== null && Math.abs(item.obs.z_score) >= 2.0);
  }, [validObs, showAnomalies]);

  const latestCandle = candleData.length > 0 ? candleData[candleData.length - 1] : null;
  const activeCandle = hoverIndex !== null && hoverIndex >= 0 && hoverIndex < candleData.length ? candleData[hoverIndex] : latestCandle;

  const formatBps = (val: number) => {
    if (Math.abs(val) < 0.05) return "0.0 bps";
    return `${val > 0 ? "+" : ""}${val.toFixed(1)} bps`;
  };

  const candleWidth = useMemo(() => {
    if (validObs.length <= 1) return 8;
    const spacing = innerWidth / validObs.length;
    return Math.max(2.0, Math.min(8, spacing * 0.65));
  }, [validObs.length, innerWidth]);

  // Clean horizontal tick values
  const yTicks = useMemo(() => {
    const span = maxVal - minVal;
    if (span <= 0) return [0];
    const step = span > 80 ? 20 : span > 40 ? 10 : span > 20 ? 5 : 2;
    const firstTick = Math.ceil(minVal / step) * step;
    const ticks: number[] = [];
    for (let t = firstTick; t <= maxVal; t += step) {
      ticks.push(t);
    }
    return ticks.length >= 3 ? ticks : [minVal + span * 0.2, minVal + span * 0.5, minVal + span * 0.8];
  }, [minVal, maxVal]);

  return (
    <div className="bg-[#FFFFFF] border border-[#DCE2EA] rounded-md p-4 flex flex-col relative select-none font-sans">
      {/* Top Header & Analytical Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#EDF1F7]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#245BDB]" />
            <h3 className="text-xs font-bold text-[#14243A] uppercase tracking-wide">{title}</h3>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#F4F6F9] text-[#687587] border border-[#DCE2EA]">
              Basis Points (bps)
            </span>
          </div>

          {activeCandle && (
            <div className="flex flex-wrap items-baseline gap-4 mt-2">
              <span className={`text-2xl font-bold font-mono tabular-nums tracking-tight ${
                activeCandle.close >= 0 ? 'text-[#13834A]' : 'text-[#D64550]'
              }`}>
                {formatBps(activeCandle.close)}
              </span>

              {/* Statistical Context Details */}
              <div className="flex items-center gap-3 text-xs font-mono tabular-nums text-[#687587]">
                {activeCandle.obs.rolling_mean != null && (
                  <span>Mean: <strong className="text-[#172538] font-semibold">{formatBps(activeCandle.obs.rolling_mean * 10000)}</strong></span>
                )}

                {activeCandle.obs.upper_band_2 != null && activeCandle.obs.lower_band_2 != null && (
                  <span className="hidden sm:inline">
                    ±2σ: <strong className="text-[#687587] font-normal">[{formatBps(activeCandle.obs.lower_band_2 * 10000)} ... {formatBps(activeCandle.obs.upper_band_2 * 10000)}]</strong>
                  </span>
                )}
              </div>

              {activeCandle.obs.z_score !== null && (
                <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                  Math.abs(activeCandle.obs.z_score) >= 2.5
                    ? 'bg-[#FEF2F2] text-[#D64550] border border-[#FECACA]'
                    : Math.abs(activeCandle.obs.z_score) >= 2.0
                    ? 'bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]'
                    : 'bg-[#EEF3FD] text-[#245BDB] border border-[#BFDBFE]'
                }`}>
                  Z: {activeCandle.obs.z_score > 0 ? "+" : ""}{activeCandle.obs.z_score.toFixed(2)}σ
                </span>
              )}

              <span className="text-xs text-[#687587] font-mono">
                {activeCandle.obs.trading_date}
              </span>
            </div>
          )}
        </div>

        {/* Chart Controls Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Switcher: Line (Default) vs Candles */}
          <div className="flex items-center bg-[#F4F6F9] p-0.5 rounded border border-[#DCE2EA] text-xs">
            <button
              onClick={() => setChartStyle('line')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                chartStyle === 'line'
                  ? 'bg-[#FFFFFF] text-[#14243A] font-bold shadow-xs'
                  : 'text-[#687587] hover:text-[#172538]'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-[#245BDB]" />
              <span>Line</span>
            </button>
            <button
              onClick={() => setChartStyle('candles')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                chartStyle === 'candles'
                  ? 'bg-[#FFFFFF] text-[#14243A] font-bold shadow-xs'
                  : 'text-[#687587] hover:text-[#172538]'
              }`}
            >
              <CandlestickChart className="w-3.5 h-3.5" />
              <span>Candles</span>
            </button>
          </div>

          {/* ±2σ Confidence Envelopes Toggle */}
          <button
            onClick={() => setShowBands(!showBands)}
            className={`px-2.5 py-1 rounded text-xs border transition-colors cursor-pointer flex items-center gap-1 ${
              showBands
                ? 'bg-[#EEF3FD] text-[#245BDB] border-[#BFDBFE] font-semibold'
                : 'bg-[#FFFFFF] text-[#687587] border-[#DCE2EA] hover:bg-[#F4F6F9]'
            }`}
            title="Toggle 20-day rolling ±2σ confidence envelope"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>±2σ Bands</span>
          </button>

          {/* Anomaly Points Toggle */}
          <button
            onClick={() => setShowAnomalies(!showAnomalies)}
            className={`px-2.5 py-1 rounded text-xs border transition-colors cursor-pointer flex items-center gap-1 ${
              showAnomalies
                ? 'bg-[#FEF2F2] text-[#D64550] border-[#FECACA] font-semibold'
                : 'bg-[#FFFFFF] text-[#687587] border-[#DCE2EA] hover:bg-[#F4F6F9]'
            }`}
            title="Highlight detected statistical anomalies (|Z| ≥ 2.0σ)"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Anomalies</span>
          </button>

          {/* Timeframe Filter Pills */}
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
      </div>

      {/* Legend Strip */}
      <div className="flex items-center justify-between py-2 text-[11px] text-[#687587] border-b border-[#EDF1F7]">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5 text-[#245BDB] font-semibold">
            <span className="w-3 h-0.5 bg-[#245BDB] rounded-full" /> Normalized Spread (bps)
          </span>
          <span className="flex items-center gap-1.5 text-[#687587]">
            <span className="w-3 h-0.5 bg-[#687587] border-b border-dashed border-[#687587]" /> 20-Day Rolling Mean
          </span>
          {showBands && (
            <span className="flex items-center gap-1.5 text-[#245BDB]/80">
              <span className="w-3 h-2 rounded-xs bg-[#245BDB]/15 border border-[#245BDB]/30" /> ±2σ Confidence Ribbon
            </span>
          )}
          {showAnomalies && (
            <span className="flex items-center gap-1.5 text-[#D64550] font-medium">
              <span className="w-2 h-2 rounded-full bg-[#D64550] ring-2 ring-[#D64550]/20" /> Anomaly (|Z| ≥ 2.0σ)
            </span>
          )}
        </div>

        <span className="text-[10px] text-[#8E9BAE] font-mono hidden sm:inline">
          {validObs.length} Observations • Hover to inspect
        </span>
      </div>

      {/* Main SVG Chart Canvas */}
      <div className="relative w-full overflow-hidden mt-1">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
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
          onClick={() => {
            if (activeCandle && onSelectPoint) onSelectPoint(activeCandle.obs);
          }}
        >
          <defs>
            {/* Smooth spread area fill */}
            <linearGradient id="spreadAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#245BDB" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#245BDB" stopOpacity="0.00" />
            </linearGradient>

            {/* Confidence envelope soft wash */}
            <linearGradient id="envelopeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#245BDB" stopOpacity="0.07" />
              <stop offset="100%" stopColor="#245BDB" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Clean Flat Background */}
          <rect
            x={padding.left}
            y={padding.top}
            width={innerWidth}
            height={innerHeight}
            fill="#FFFFFF"
          />

          {/* Subtle Horizontal Gridlines & Y-Axis Scale */}
          {yTicks.map((val) => {
            const y = getY(val);
            if (y < padding.top - 2 || y > chartHeight - padding.bottom + 2) return null;
            const isZero = Math.abs(val) < 0.1;
            return (
              <g key={val}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={chartWidth - padding.right}
                  y2={y}
                  stroke={isZero ? "#CBD5E1" : "#F1F5F9"}
                  strokeWidth={isZero ? 1.2 : 1}
                  strokeDasharray={isZero ? undefined : "3 3"}
                />
                <text
                  x={padding.left - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  className={`font-mono text-[11px] tabular-nums ${isZero ? 'fill-[#14243A] font-bold' : 'fill-[#687587]'}`}
                >
                  {val > 0 ? `+${Math.round(val)}` : Math.round(val)} bps
                </text>
              </g>
            );
          })}

          {/* ±2σ Confidence Envelope */}
          {showBands && band2Path && (
            <path
              d={band2Path}
              fill="url(#envelopeGrad)"
              stroke="#245BDB"
              strokeWidth="0.8"
              strokeDasharray="4 2"
              strokeOpacity="0.35"
            />
          )}

          {/* 20-Day Rolling Mean Baseline */}
          {meanPath && (
            <path
              d={meanPath}
              fill="none"
              stroke="#687587"
              strokeWidth="1.4"
              strokeDasharray="4 4"
            />
          )}

          {/* LINE MODE: Sleek Gradient Wash & Crisp Spread Curve */}
          {chartStyle === 'line' && spreadAreaPath && (
            <path
              d={spreadAreaPath}
              fill="url(#spreadAreaGrad)"
            />
          )}
          {chartStyle === 'line' && spreadPath && (
            <path
              d={spreadPath}
              fill="none"
              stroke="#245BDB"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* CANDLESTICK MODE: Japanese Candlesticks */}
          {chartStyle === 'candles' &&
            candleData.map((c, i) => {
              const x = getX(i);
              const yHigh = getY(c.high);
              const yLow = getY(c.low);
              const yOpen = getY(c.open);
              const yClose = getY(c.close);

              const color = c.isBullish ? "#10B981" : "#EF4444";
              const bodyTop = Math.min(yOpen, yClose);
              const bodyHeight = Math.max(1.8, Math.abs(yOpen - yClose));
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

          {/* DETECTED ANOMALY MARKERS (|Z| >= 2.0) */}
          {showAnomalies &&
            anomalyPoints.map(({ obs, idx }) => {
              const x = getX(idx);
              const y = getY(obs.relative_spread_bps);
              const isExtreme = Math.abs(obs.z_score as number) >= 2.5;
              const color = isExtreme ? '#EF4444' : '#F59E0B';

              return (
                <g key={`anomaly-${idx}`} className="cursor-pointer" onClick={() => onSelectPoint && onSelectPoint(obs)}>
                  {/* Outer pulse aura */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isExtreme ? "6.5" : "5"}
                    fill={color}
                    fillOpacity="0.25"
                  />
                  {/* Core dot */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isExtreme ? "3.5" : "2.5"}
                    fill={color}
                    stroke="#FFFFFF"
                    strokeWidth="1"
                  />
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

          {/* Interactive Scrubbing Crosshair */}
          {hoverIndex !== null && activeCandle && (
            <g>
              <line
                x1={getX(hoverIndex)}
                y1={padding.top}
                x2={getX(hoverIndex)}
                y2={chartHeight - padding.bottom}
                stroke="#687587"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <line
                x1={padding.left}
                y1={getY(activeCandle.close)}
                x2={chartWidth - padding.right}
                y2={getY(activeCandle.close)}
                stroke="#687587"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              {/* Highlight Target */}
              <circle
                cx={getX(hoverIndex)}
                cy={getY(activeCandle.close)}
                r="4.5"
                fill="#245BDB"
                stroke="#FFFFFF"
                strokeWidth="2"
              />
            </g>
          )}

          {/* X-Axis Date Ticks */}
          {validObs.length > 0 &&
            [0, Math.floor(validObs.length / 4), Math.floor(validObs.length / 2), Math.floor((3 * validObs.length) / 4), validObs.length - 1].map(
              (idx) => {
                if (idx >= validObs.length) return null;
                const d = validObs[idx];
                return (
                  <text
                    key={idx}
                    x={getX(idx)}
                    y={chartHeight - 10}
                    textAnchor="middle"
                    className="fill-[#687587] font-mono text-[11px]"
                  >
                    {d.trading_date}
                  </text>
                );
              }
            )}
        </svg>

        {/* Floating Tooltip */}
        {hoverIndex !== null && activeCandle && (
          <div
            className="absolute pointer-events-none bg-[#FFFFFF] border border-[#DCE2EA] rounded-md px-3 py-2 text-xs shadow-lg transition-all duration-75 z-10 font-mono"
            style={{
              left: `${Math.min(chartWidth - 210, Math.max(70, getX(hoverIndex)))}px`,
              top: `10px`,
            }}
          >
            <div className="flex items-center justify-between gap-3 text-[11px] font-bold text-[#14243A] pb-1 border-b border-[#EDF1F7]">
              <span>{activeCandle.obs.trading_date}</span>
              <span className={`px-1.5 py-0.2 rounded font-semibold ${
                activeCandle.close >= 0 ? 'text-[#13834A]' : 'text-[#D64550]'
              }`}>
                {activeCandle.close >= 0 ? 'Spread Up' : 'Spread Down'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] pt-1.5 text-[#687587] tabular-nums">
              <div>Spread: <strong className="text-[#245BDB]">{formatBps(activeCandle.close)}</strong></div>
              <div>
                Mean: <span className="text-[#172538]">{activeCandle.obs.rolling_mean != null ? formatBps(activeCandle.obs.rolling_mean * 10000) : '—'}</span>
              </div>
              {chartStyle === 'candles' && (
                <>
                  <div>Open: {formatBps(activeCandle.open)}</div>
                  <div>High: <span className="text-[#13834A]">{formatBps(activeCandle.high)}</span></div>
                  <div>Low: <span className="text-[#D64550]">{formatBps(activeCandle.low)}</span></div>
                  <div>Close: {formatBps(activeCandle.close)}</div>
                </>
              )}
            </div>

            <div className="mt-1.5 pt-1 border-t border-[#EDF1F7] flex items-center justify-between text-[11px]">
              <span className="text-[#687587]">Z-Score:</span>
              <span className={`font-bold tabular-nums ${
                activeCandle.obs.z_score != null && Math.abs(activeCandle.obs.z_score) >= 2.0 ? 'text-[#D64550]' : 'text-[#245BDB]'
              }`}>
                {activeCandle.obs.z_score != null ? `${activeCandle.obs.z_score > 0 ? '+' : ''}${activeCandle.obs.z_score.toFixed(2)}σ` : '—'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
