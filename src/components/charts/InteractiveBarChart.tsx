import React, { useState } from 'react';
import { formatEsAuto, formatEsDec, formatEsInt } from '../../utils/format';

export interface BarItem {
  id: string;
  label: string;
  value: number;
  secondaryValue?: number;
  highlight?: boolean;
  color?: string;
  subtitle?: string;
}

interface InteractiveBarChartProps {
  items: BarItem[];
  title?: string;
  unit?: string;
  height?: number;
  horizontal?: boolean;
  maxItems?: number;
  benchmarkValue?: number;
  benchmarkLabel?: string;
}

export const InteractiveBarChart: React.FC<InteractiveBarChartProps> = ({
  items,
  title,
  unit = '',
  height = 340,
  horizontal = false,
  maxItems = 15,
  benchmarkValue,
  benchmarkLabel = 'Media regional'
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const displayItems = items.slice(0, maxItems);
  const maxValue = Math.max(...displayItems.map(d => d.value), benchmarkValue || 0, 1);

  if (horizontal) {
    return (
      <div className="w-full bg-[#FAF9F5] rounded-sm border border-[#DAD6CC] p-4 sm:p-5">
        {title && (
          <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-[#DAD6CC]/70">
            <h4 className="text-sm font-semibold text-[#202321]">{title}</h4>
            {unit && <span className="text-[11px] font-mono text-[#77766F]">Unidad: {unit}</span>}
          </div>
        )}
        <div className="space-y-3">
          {displayItems.map(item => {
            const pct = (item.value / maxValue) * 100;
            const isHovered = hoveredId === item.id;
            const barColor = item.color || (item.highlight ? '#C64B37' : '#426C79');

            return (
              <div
                key={item.id}
                className="group relative cursor-pointer"
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <div className="flex items-baseline justify-between text-xs mb-1.5 gap-3">
                  <div className="flex items-baseline gap-1.5 truncate max-w-[70%]">
                    <span className={`transition-colors ${isHovered ? 'text-[#202321] font-bold' : 'text-[#202321] font-medium'}`}>
                      {item.label}
                    </span>
                    {item.subtitle && (
                      <span className="text-[10px] text-[#77766F] font-normal">({item.subtitle})</span>
                    )}
                  </div>
                  <span className="font-mono font-semibold text-[#202321] tabular-nums shrink-0">
                    {formatEsAuto(item.value, 2)} <span className="text-[10px] text-[#77766F] font-normal">{unit}</span>
                  </span>
                </div>

                <div className="w-full h-3.5 bg-[#ECE8DD] rounded-xs overflow-hidden relative">
                  <div
                    className="h-full rounded-xs transition-all duration-200"
                    style={{
                      width: `${Math.max(2, pct)}%`,
                      backgroundColor: barColor,
                      opacity: isHovered ? 1 : 0.88
                    }}
                  />
                  {benchmarkValue && (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-[#C64B37] z-10"
                      style={{ left: `${(benchmarkValue / maxValue) * 100}%` }}
                      title={`${benchmarkLabel}: ${formatEsAuto(benchmarkValue, 2)} ${unit}`}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {benchmarkValue && (
          <div className="flex items-center gap-2 mt-4 pt-2.5 border-t border-[#DAD6CC]/70 text-xs text-[#C64B37] font-mono">
            <span className="w-3 h-0.5 bg-[#C64B37]" />
            <span>{benchmarkLabel}: {formatEsAuto(benchmarkValue, 2)} {unit}</span>
          </div>
        )}
      </div>
    );
  }

  // Vertical Bar Chart
  const paddingLeft = 55;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 65;
  const width = 760;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  const barWidth = Math.min(36, Math.max(12, (chartWidth / displayItems.length) * 0.65));

  const getYCoord = (val: number) => {
    const norm = val / maxValue;
    return paddingTop + (1 - norm) * chartHeight;
  };

  return (
    <div className="w-full bg-[#FAF9F5] rounded-sm border border-[#DAD6CC] p-4 sm:p-5 select-none">
      {title && (
        <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-[#DAD6CC]/70">
          <h4 className="text-sm font-semibold text-[#202321]">{title}</h4>
          {unit && <span className="text-[11px] font-mono text-[#77766F]">Unidad: {unit}</span>}
        </div>
      )}

      <div className="relative w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto max-h-[360px]">
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const val = pct * maxValue;
            const y = paddingTop + (1 - pct) * chartHeight;
            return (
              <g key={`ygrid-${i}`}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke={i === 0 ? '#A6A18F' : '#E6E2D8'}
                  strokeWidth={i === 0 ? '1.2' : '1'}
                />
                <text x={paddingLeft - 8} y={y + 4} textAnchor="end" className="text-[11px] font-mono fill-[#77766F]">
                  {formatEsInt(val)}
                </text>
              </g>
            );
          })}

          {benchmarkValue && (
            <g>
              <line
                x1={paddingLeft}
                y1={getYCoord(benchmarkValue)}
                x2={width - paddingRight}
                y2={getYCoord(benchmarkValue)}
                stroke="#C64B37"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              <text
                x={width - paddingRight - 4}
                y={getYCoord(benchmarkValue) - 5}
                textAnchor="end"
                className="text-[10px] font-mono font-bold fill-[#C64B37]"
              >
                {benchmarkLabel} ({formatEsAuto(benchmarkValue, 2)} {unit})
              </text>
            </g>
          )}

          {displayItems.map((item, idx) => {
            const xCenter = paddingLeft + (idx + 0.5) * (chartWidth / displayItems.length);
            const x = xCenter - barWidth / 2;
            const y = getYCoord(item.value);
            const bHeight = height - paddingBottom - y;
            const isHovered = hoveredId === item.id;
            const fill = item.color || (item.highlight ? '#C64B37' : isHovered ? '#202321' : '#426C79');

            return (
              <g
                key={item.id}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={Math.max(2, bHeight)}
                  rx="1"
                  fill={fill}
                  className="transition-all duration-150"
                />

                <text
                  x={xCenter}
                  y={height - paddingBottom + 16}
                  textAnchor="end"
                  transform={`rotate(-40 ${xCenter} ${height - paddingBottom + 16})`}
                  className={`text-[10px] font-medium transition-colors ${
                    isHovered ? 'fill-[#202321] font-bold' : 'fill-[#77766F]'
                  }`}
                >
                  {item.label.length > 16 ? item.label.slice(0, 14) + '…' : item.label}
                </text>
              </g>
            );
          })}
        </svg>

        {hoveredId && (
          (() => {
            const item = displayItems.find(d => d.id === hoveredId);
            if (!item) return null;
            return (
              <div className="absolute top-2 right-4 bg-[#202321]/95 text-[#FAF9F5] backdrop-blur-xs rounded-sm shadow-xl px-3 py-2 text-xs border border-[#A6A18F]/40 pointer-events-none">
                <div className="font-semibold text-[#E88A78]">{item.label}</div>
                {item.subtitle && <div className="text-[10px] text-[#A6A18F]">{item.subtitle}</div>}
                <div className="mt-1 font-mono font-bold text-[#FAF9F5] tabular-nums">
                  {formatEsAuto(item.value, 2)} {unit}
                </div>
                {benchmarkValue && (
                  <div className="text-[10px] text-[#DAD6CC] font-mono mt-0.5">
                    Diferencia ref: {formatEsDec(item.value - benchmarkValue, 1, { signed: true })} {unit}
                  </div>
                )}
              </div>
            );
          })()
        )}
      </div>
    </div>
  );
};
