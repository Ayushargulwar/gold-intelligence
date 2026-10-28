import React, { useState } from 'react';
import type { SpreadObservation } from '../../types';

interface ZScoreOscillatorChartProps {
  observations: SpreadObservation[];
  title?: string;
  height?: number;
}

export const ZScoreOscillatorChart: React.FC<ZScoreOscillatorChartProps> = ({
  observations,
  title = "Standardized Deviation (Z-Score) Oscillator",
  height = 200,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const validObs = observations.filter((o) => o.z_score !== null);
  const chartWidth = 900;
  const padding = { top: 20, right: 36, bottom: 28, left: 65 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const minZ = -3.5;
  const maxZ = 3.5;

  const getX = (idx: number) => {
    if (validObs.length <= 1) return padding.left + innerWidth / 2;
    return padding.left + (idx / (validObs.length - 1)) * innerWidth;
  };

  const getY = (z: number) => {
    return padding.top + (1 - (z - minZ) / (maxZ - minZ)) * innerHeight;
  };

  const latestObs = validObs.length > 0 ? validObs[validObs.length - 1] : null;
  const activeObs = hoverIndex !== null && hoverIndex >= 0 && hoverIndex < validObs.length ? validObs[hoverIndex] : latestObs;

  return (
    <div className="bg-[#FFFFFF] border border-[#DCE2EA] rounded-md p-4 flex flex-col relative select-none font-sans">
      {/* Header Bar */}
      <div className="flex flex-wrap items-baseline justify-between gap-3 pb-3 border-b border-[#EDF1F7]">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#245BDB]" />
          <h4 className="text-xs font-bold text-[#14243A] uppercase tracking-wide">{title}</h4>
        </div>

        {activeObs ? (
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-[#687587]">{activeObs.trading_date}</span>
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-semibold tabular-nums ${
                Math.abs(activeObs.z_score as number) >= 2.5
                  ? 'bg-[#FEF2F2] text-[#D64550] border border-[#FECACA]'
                  : Math.abs(activeObs.z_score as number) >= 2.0
                  ? 'bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]'
                  : 'bg-[#EEF3FD] text-[#245BDB] border border-[#BFDBFE]'
              }`}
            >
              Z = {(activeObs.z_score as number) > 0 ? '+' : ''}
              {(activeObs.z_score as number).toFixed(2)}σ
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-[#D64550] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D64550]" /> Extreme (≥2.5σ)
            </span>
            <span className="flex items-center gap-1.5 text-[#D97706] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" /> Elevated (≥2.0σ)
            </span>
          </div>
        )}
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
          {/* Threshold Lines */}
          {[2.5, 2.0, 0, -2.0, -2.5].map((zVal) => {
            const y = getY(zVal);
            const isZero = zVal === 0;
            const isExtreme = Math.abs(zVal) === 2.5;
            const isElevated = Math.abs(zVal) === 2.0;

            let strokeColor = '#EDF1F7';
            if (isZero) strokeColor = '#B4C0D0';
            else if (isExtreme) strokeColor = '#FCA5A5';
            else if (isElevated) strokeColor = '#FDE68A';

            return (
              <g key={zVal}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={chartWidth - padding.right}
                  y2={y}
                  stroke={strokeColor}
                  strokeWidth={isZero ? 1 : 0.9}
                  strokeDasharray={isZero ? undefined : '3 3'}
                />
                <text
                  x={padding.left - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  className={`font-mono text-[10px] tabular-nums ${
                    isZero ? 'fill-[#172538] font-bold' : isExtreme ? 'fill-[#D64550]' : 'fill-[#687587]'
                  }`}
                >
                  {zVal > 0 ? `+${zVal.toFixed(1)}σ` : `${zVal.toFixed(1)}σ`}
                </text>
              </g>
            );
          })}

          {/* Area between +2.0 and -2.0 (Normal Regime) */}
          <rect
            x={padding.left}
            y={getY(2.0)}
            width={innerWidth}
            height={getY(-2.0) - getY(2.0)}
            fill="#F4F6F9"
            fillOpacity="0.6"
          />

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

          {/* Z-Score Curve */}
          {validObs.length > 0 && (
            <path
              d={validObs.reduce((acc, curr, idx) => {
                const x = getX(idx);
                const y = getY(curr.z_score as number);
                return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
              }, '')}
              fill="none"
              stroke="#245BDB"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Crosshair */}
          {hoverIndex !== null && activeObs && (
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
                cy={getY(activeObs.z_score as number)}
                r="3.5"
                fill={
                  Math.abs(activeObs.z_score as number) >= 2.5
                    ? '#D64550'
                    : Math.abs(activeObs.z_score as number) >= 2.0
                    ? '#D97706'
                    : '#245BDB'
                }
                stroke="#FFFFFF"
                strokeWidth="1.5"
              />
            </g>
          )}

          {/* X Ticks */}
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
