import React, { useState } from 'react';
import { formatEsDec } from '../../utils/format';

export interface SpcPoint {
  id: string;
  label: string;
  value: number;
  isAnomaly: boolean;
  isWarning: boolean;
  zScore: number;
  modifiedZ: number;
  statusLabel: string;
  metadata?: string;
}

interface ControlChartProps {
  data: SpcPoint[];
  centerLine: number;
  medianLine?: number;
  ucl: number;
  lcl: number;
  uwl: number;
  lwl: number;
  title: string;
  unit: string;
  height?: number;
}

export const ControlChart: React.FC<ControlChartProps> = ({
  data,
  centerLine,
  medianLine,
  ucl,
  lcl,
  uwl,
  unit,
  title,
  height = 360
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<SpcPoint | null>(null);

  if (data.length === 0) return null;

  const maxVal = Math.max(...data.map(d => d.value), ucl) * 1.12;
  const minVal = Math.min(...data.map(d => d.value), lcl);
  const baselineMin = Math.max(0, Math.floor(minVal * 0.8));

  const width = 760;
  const paddingLeft = 60;
  const paddingRight = 95;
  const paddingTop = 40;
  const paddingBottom = 65;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const getX = (index: number) => paddingLeft + (index / (data.length - 1 || 1)) * chartWidth;

  const getY = (val: number) => {
    const norm = (val - baselineMin) / (maxVal - baselineMin || 1);
    return paddingTop + (1 - norm) * chartHeight;
  };

  return (
    <div className="w-full bg-[#FAF9F5] rounded-sm border border-[#DAD6CC] p-5 select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-[#DAD6CC] gap-2">
        <div>
          <h4 className="text-sm font-bold text-[#202321] flex items-center gap-2">
            <span className="w-2 h-2 bg-[#C64B37] shrink-0" aria-hidden="true" />
            {title}
          </h4>
          <p className="text-[11px] text-[#77766F] mt-0.5">
            Control Estadístico de Procesos (SPC)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono shrink-0 tabular-nums">
          <span className="text-[#77766F]">
            Media: <strong className="text-[#202321]">{formatEsDec(centerLine, 1)} {unit}</strong>
          </span>
          {medianLine !== undefined && (
            <span className="text-[#77766F]">
              Mediana: <strong className="text-[#202321]">{formatEsDec(medianLine, 1)} {unit}</strong>
            </span>
          )}
          <span className="text-[#C64B37]">
            LCS (+3σ): <strong>{formatEsDec(ucl, 1)}</strong>
          </span>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-4 items-stretch">
        <div className="relative flex-1 min-w-0 overflow-x-auto">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto max-h-[400px]">
          {/* Shaded Red Zone (> +3σ) */}
          <rect
            x={paddingLeft}
            y={paddingTop}
            width={chartWidth}
            height={Math.max(0, getY(ucl) - paddingTop)}
            fill="#C64B37"
            fillOpacity="0.08"
          />

          {/* Shaded Amber Zone (+2σ to +3σ) */}
          <rect
            x={paddingLeft}
            y={getY(ucl)}
            width={chartWidth}
            height={Math.max(0, getY(uwl) - getY(ucl))}
            fill="#D47528"
            fillOpacity="0.07"
          />

          {/* Baseline frame */}
          <line
            x1={paddingLeft}
            y1={height - paddingBottom}
            x2={width - paddingRight}
            y2={height - paddingBottom}
            stroke="#A6A18F"
            strokeWidth="1.2"
          />

          {/* UCL (+3σ) */}
          <line
            x1={paddingLeft}
            y1={getY(ucl)}
            x2={width - paddingRight}
            y2={getY(ucl)}
            stroke="#C64B37"
            strokeWidth="1.75"
            strokeDasharray="6 3"
          />
          <text x={width - paddingRight + 6} y={getY(ucl) + 3} className="text-[10px] font-mono font-bold fill-[#C64B37]">
            LCS (+3σ): {formatEsDec(ucl, 1)}
          </text>

          {/* UWL (+2σ) */}
          <line
            x1={paddingLeft}
            y1={getY(uwl)}
            x2={width - paddingRight}
            y2={getY(uwl)}
            stroke="#D47528"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
          <text x={width - paddingRight + 6} y={getY(uwl) + 3} className="text-[9px] font-mono fill-[#B4691E]">
            LA (+2σ): {formatEsDec(uwl, 1)}
          </text>

          {/* Center Line (Mean) */}
          <line
            x1={paddingLeft}
            y1={getY(centerLine)}
            x2={width - paddingRight}
            y2={getY(centerLine)}
            stroke="#426C79"
            strokeWidth="1.75"
          />
          <text
            x={paddingLeft - 6}
            y={getY(centerLine) + 3}
            textAnchor="end"
            className="text-[10px] font-mono font-bold fill-[#426C79]"
          >
            Media ({formatEsDec(centerLine, 1)})
          </text>

          {/* LCL (-3σ) if > 0 */}
          {lcl > 0 && (
            <>
              <line
                x1={paddingLeft}
                y1={getY(lcl)}
                x2={width - paddingRight}
                y2={getY(lcl)}
                stroke="#2D6A4F"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              <text x={width - paddingRight + 6} y={getY(lcl) + 3} className="text-[10px] font-mono fill-[#2D6A4F]">
                LCI (-3σ): {formatEsDec(lcl, 1)}
              </text>
            </>
          )}

          {/* Connecting line */}
          <path
            d={data.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(pt.value)}`, '')}
            fill="none"
            stroke="#A6A18F"
            strokeWidth="1.4"
          />

          {/* Points */}
          {data.map((pt, idx) => {
            const cx = getX(idx);
            const cy = getY(pt.value);
            const isHovered = hoveredPoint?.id === pt.id;

            let ptColor = '#2B6CB0';
            let ptRadius = 4;
            if (pt.isAnomaly) {
              ptColor = '#C64B37';
              ptRadius = 6;
            } else if (pt.isWarning) {
              ptColor = '#D97706';
              ptRadius = 5;
            }

            return (
              <g
                key={pt.id}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredPoint(pt)}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                {pt.isAnomaly && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={ptRadius + 4}
                    fill="none"
                    stroke="#C64B37"
                    strokeWidth="1.25"
                    strokeOpacity="0.55"
                  />
                )}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? ptRadius + 2 : ptRadius}
                  fill={ptColor}
                  stroke="#FAF9F5"
                  strokeWidth="1.75"
                  className="transition-all duration-150"
                />

                <line
                  x1={cx}
                  y1={height - paddingBottom}
                  x2={cx}
                  y2={height - paddingBottom + 5}
                  stroke="#A6A18F"
                  strokeWidth="1"
                />

                <text
                  x={cx}
                  y={height - paddingBottom + 18}
                  textAnchor="end"
                  transform={`rotate(-45 ${cx} ${height - paddingBottom + 18})`}
                  className={`text-[9px] font-mono transition-colors ${
                    pt.isAnomaly
                      ? 'fill-[#C64B37] font-bold'
                      : pt.isWarning
                      ? 'fill-[#9A4D10] font-semibold'
                      : isHovered
                      ? 'fill-[#202321] font-semibold'
                      : 'fill-[#77766F]'
                  }`}
                >
                  {pt.label.length > 15 ? pt.label.slice(0, 13) + '…' : pt.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Coherent Hover Tooltip matching exact mathematical scores */}
        {hoveredPoint && (
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-[#202321]/95 text-[#FAF9F5] backdrop-blur-xs rounded-sm shadow-xl px-3.5 py-2.5 text-xs border border-[#A6A18F]/40 pointer-events-none z-20 min-w-[265px]">
            <div className="font-bold text-[#E88A78]">{hoveredPoint.label}</div>
            {hoveredPoint.metadata && (
              <div className="text-[10px] text-[#A6A18F] mb-1">{hoveredPoint.metadata}</div>
            )}
            <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-[#FAF9F5]/15">
              <span className="text-[#DAD6CC]">Valor Observado:</span>
              <span className="font-mono font-bold text-[#FAF9F5] tabular-nums">
                {formatEsDec(hoveredPoint.value, 1)} {unit}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#DAD6CC] mt-0.5">
              <span>Z-Score SPC (Media/DE):</span>
              <span
                className={`font-mono font-bold ${
                  hoveredPoint.zScore >= 3
                    ? 'text-[#E88A78]'
                    : hoveredPoint.zScore >= 2
                    ? 'text-[#E6B86A]'
                    : 'text-[#8EC3D1]'
                }`}
              >
                {formatEsDec(hoveredPoint.zScore, 2, { signed: true })}σ
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#DAD6CC] mt-0.5">
              <span>Modified Z-Score (Mediana/MAD):</span>
              <span
                className={`font-mono font-bold ${
                  hoveredPoint.modifiedZ >= 3.5
                    ? 'text-[#E88A78]'
                    : hoveredPoint.modifiedZ >= 2.0
                    ? 'text-[#E6B86A]'
                    : 'text-[#84C6A3]'
                }`}
              >
                {formatEsDec(hoveredPoint.modifiedZ, 2, { signed: true })}
              </span>
            </div>
            <div className="mt-1.5 pt-1.5 border-t border-[#FAF9F5]/15 text-[10px] font-semibold">
              {hoveredPoint.isAnomaly ? (
                <span className="text-[#E88A78]">■ {hoveredPoint.statusLabel}</span>
              ) : hoveredPoint.isWarning ? (
                <span className="text-[#E6B86A]">◆ {hoveredPoint.statusLabel}</span>
              ) : (
                <span className="text-[#84C6A3]">✓ {hoveredPoint.statusLabel}</span>
              )}
            </div>
          </div>
        )}
        </div>

        {/* Side Legend Panel */}
        <aside className="xl:w-64 shrink-0 bg-[#F3F0E8]/75 border border-[#DAD6CC] rounded-xs p-3.5 flex flex-col justify-center gap-2.5">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#202321] border-b border-[#DAD6CC] pb-1.5">
            Clasificación SPC
          </div>

          <div className="bg-[#FAF9F5] border border-[#DAD6CC] rounded-xs p-2.5 space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1D5B8C] shrink-0" />
              <span className="text-xs font-bold text-[#1D5B8C]">Azul · Habitual</span>
            </div>
            <p className="text-[10.5px] text-[#4A4D48] leading-snug pl-4.5">
              &lt; +2σ y Mod Z &lt; 2,0 (incluidos centros bajo mediana)
            </p>
          </div>

          <div className="bg-[#FAF9F5] border border-[#DAD6CC] rounded-xs p-2.5 space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D47528] shrink-0" />
              <span className="text-xs font-bold text-[#B4691E]">Ámbar · Vigilancia</span>
            </div>
            <p className="text-[10.5px] text-[#4A4D48] leading-snug pl-4.5">
              +2σ–+3σ o Mod Z 2,0–3,5
            </p>
          </div>

          <div className="bg-[#FAF9F5] border border-[#DAD6CC] rounded-xs p-2.5 space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C64B37] shrink-0" />
              <span className="text-xs font-bold text-[#C64B37]">Rojo · Anomalía</span>
            </div>
            <p className="text-[10.5px] text-[#4A4D48] leading-snug pl-4.5">
              ≥ +3σ o Mod Z ≥ 3,5
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};
