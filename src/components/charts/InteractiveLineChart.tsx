import React, { useState, useMemo } from 'react';
import { formatEsAuto } from '../../utils/format';

export interface DataPoint {
  x: string | number;
  y: number | null;
  lower80?: number;
  upper80?: number;
  lower95?: number;
  upper95?: number;
  extra?: Record<string, any>;
}

export interface LineSeries {
  id: string;
  name: string;
  color: string;
  data: DataPoint[];
  dashed?: boolean;
  showConfidence?: boolean;
  firstPeriod?: string | null;
  lastPeriod?: string | null;
  missingPeriods?: string[];
}

interface InteractiveLineChartProps {
  series: LineSeries[];
  title?: string;
  yLabel?: string;
  xLabel?: string;
  height?: number;
  unit?: string;
  benchmarkLine?: { y: number; label: string; color?: string };
}

export const InteractiveLineChart: React.FC<InteractiveLineChartProps> = ({
  series,
  title,
  height = 320,
  unit = '',
  benchmarkLine
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Compute unified sorted X axis across ALL series so misaligned start/end years never shift points
  const { allX, alignedSeries } = useMemo(() => {
    const xSet = new Set<string>();
    const orderedFirst: string[] = [];

    series.forEach(s => {
      s.data.forEach(d => {
        const key = String(d.x);
        if (!xSet.has(key)) {
          xSet.add(key);
          orderedFirst.push(key);
        }
      });
    });

    // Sort chronologically if all X values are numeric years; otherwise preserve insertion order
    const allNumeric = orderedFirst.length > 0 && orderedFirst.every(v => /^\d{4}$/.test(v));
    const unifiedX = allNumeric
      ? [...orderedFirst].sort((a, b) => Number(a) - Number(b))
      : orderedFirst;

    const mapped = series.map(s => {
      const pointMap = new Map<string, DataPoint>();
      s.data.forEach(d => pointMap.set(String(d.x), d));

      const alignedData: DataPoint[] = unifiedX.map(xVal => {
        const found = pointMap.get(xVal);
        return found ? found : { x: xVal, y: null };
      });

      const validPoints = alignedData.filter(d => d.y !== null && !isNaN(d.y));
      const firstObs = s.firstPeriod ?? (validPoints.length > 0 ? String(validPoints[0].x) : null);
      const lastObs = s.lastPeriod ?? (validPoints.length > 0 ? String(validPoints[validPoints.length - 1].x) : null);

      return {
        ...s,
        data: alignedData,
        computedFirst: firstObs,
        computedLast: lastObs
      };
    });

    return { allX: unifiedX, alignedSeries: mapped };
  }, [series]);

  if (allX.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 bg-[#FAF9F5] border border-[#DAD6CC] rounded-sm text-[#77766F] text-sm">
        Datos insuficientes para renderizar la serie temporal.
      </div>
    );
  }

  let minY = Infinity;
  let maxY = -Infinity;

  alignedSeries.forEach(s => {
    s.data.forEach(d => {
      if (d.y !== null && !isNaN(d.y)) {
        minY = Math.min(minY, d.y);
        maxY = Math.max(maxY, d.y);
      }
      if (d.lower95 !== undefined && d.lower95 !== null) minY = Math.min(minY, d.lower95);
      if (d.upper95 !== undefined && d.upper95 !== null) maxY = Math.max(maxY, d.upper95);
    });
  });

  if (benchmarkLine) {
    minY = Math.min(minY, benchmarkLine.y);
    maxY = Math.max(maxY, benchmarkLine.y);
  }

  if (minY === Infinity) {
    minY = 0;
    maxY = 100;
  } else {
    const span = maxY - minY || Math.max(10, maxY * 0.2);
    const padding = span * 0.12;
    minY = Math.max(0, Math.floor((minY - padding) / 5) * 5);
    maxY = Math.ceil((maxY + padding) / 5) * 5;
    if (maxY === minY) maxY = minY + 10;
  }

  const paddingLeft = 65;
  const paddingRight = 30;
  const paddingTop = 25;
  const paddingBottom = 42;
  const width = 760;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const getXCoord = (index: number) => {
    if (allX.length <= 1) return paddingLeft + chartWidth / 2;
    return paddingLeft + (index / (allX.length - 1)) * chartWidth;
  };

  const getYCoord = (val: number | null) => {
    if (val === null || isNaN(val)) return 0;
    const normalized = (val - minY) / (maxY - minY || 1);
    return paddingTop + (1 - normalized) * chartHeight;
  };

  const yTicks = [];
  const tickCount = 5;
  for (let i = 0; i <= tickCount; i++) {
    const val = minY + (i / tickCount) * (maxY - minY);
    yTicks.push(Math.round(val * 10) / 10);
  }

  const activePointX = hoverIndex !== null ? getXCoord(hoverIndex) : null;

  return (
    <div className="w-full bg-[#FAF9F5] rounded-sm border border-[#DAD6CC] p-4 sm:p-5 select-none">
      {title && (
        <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-[#DAD6CC]/70">
          <h4 className="text-sm font-semibold text-[#202321]">{title}</h4>
          {unit && <span className="text-[11px] font-mono text-[#77766F]">Unidad: {unit}</span>}
        </div>
      )}

      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto max-h-[400px]"
          onMouseLeave={() => setHoverIndex(null)}
        >
          {/* Y Grid lines */}
          {yTicks.map((tick, i) => {
            const y = getYCoord(tick);
            return (
              <g key={`ytick-${i}`}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke={i === 0 ? '#A6A18F' : '#E6E2D8'}
                  strokeWidth={i === 0 ? '1.2' : '1'}
                />
                <text
                  x={paddingLeft - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="text-[11px] font-mono fill-[#77766F]"
                >
                  {formatEsAuto(tick, 1)}
                </text>
              </g>
            );
          })}

          {/* Benchmark line */}
          {benchmarkLine && (
            <g>
              <line
                x1={paddingLeft}
                y1={getYCoord(benchmarkLine.y)}
                x2={width - paddingRight}
                y2={getYCoord(benchmarkLine.y)}
                stroke={benchmarkLine.color || '#C64B37'}
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              <text
                x={width - paddingRight - 6}
                y={getYCoord(benchmarkLine.y) - 6}
                textAnchor="end"
                className="text-[10px] font-semibold font-mono"
                fill={benchmarkLine.color || '#C64B37'}
              >
                {benchmarkLine.label} ({formatEsAuto(benchmarkLine.y, 2)} {unit})
              </text>
            </g>
          )}

          {/* Confidence interval bands (only for points with non-null confidence bounds) */}
          {alignedSeries.map(s => {
            if (!s.showConfidence) return null;
            const bandPts = s.data
              .map((d, i) => ({ d, i }))
              .filter(item => item.d.y !== null && item.d.lower95 !== undefined && item.d.upper95 !== undefined);

            if (bandPts.length < 2) return null;

            const points95Upper = bandPts.map(({ d, i }) => `${getXCoord(i)},${getYCoord(d.upper95!)}`).join(' ');
            const points95Lower = [...bandPts]
              .reverse()
              .map(({ d, i }) => `${getXCoord(i)},${getYCoord(d.lower95!)}`)
              .join(' ');
            const polygon95 = `${points95Upper} ${points95Lower}`;

            const points80Upper = bandPts.map(({ d, i }) => `${getXCoord(i)},${getYCoord(d.upper80 ?? d.y!)}`).join(' ');
            const points80Lower = [...bandPts]
              .reverse()
              .map(({ d, i }) => `${getXCoord(i)},${getYCoord(d.lower80 ?? d.y!)}`)
              .join(' ');
            const polygon80 = `${points80Upper} ${points80Lower}`;

            return (
              <g key={`conf-${s.id}`}>
                <polygon points={polygon95} fill={s.color} fillOpacity="0.11" />
                <polygon points={polygon80} fill={s.color} fillOpacity="0.21" />
              </g>
            );
          })}

          {/* Series lines: split into contiguous segments across null gaps so missing data is visibly broken */}
          {alignedSeries.map(s => {
            const segments: { x: number; y: number; val: number; idx: number }[][] = [];
            let currentSeg: { x: number; y: number; val: number; idx: number }[] = [];
            const gapBridges: { x1: number; y1: number; x2: number; y2: number; missingIndices: number[] }[] = [];

            s.data.forEach((d, idx) => {
              if (d.y !== null && !isNaN(d.y)) {
                currentSeg.push({ x: getXCoord(idx), y: getYCoord(d.y), val: d.y, idx });
              } else if (currentSeg.length > 0) {
                segments.push(currentSeg);
                currentSeg = [];
              }
            });
            if (currentSeg.length > 0) segments.push(currentSeg);

            // Detect internal gaps (between two observed segments)
            for (let k = 0; k < segments.length - 1; k++) {
              const prevEnd = segments[k][segments[k].length - 1];
              const nextStart = segments[k + 1][0];
              const missingIndices: number[] = [];
              for (let m = prevEnd.idx + 1; m < nextStart.idx; m++) {
                missingIndices.push(m);
              }
              gapBridges.push({
                x1: prevEnd.x,
                y1: prevEnd.y,
                x2: nextStart.x,
                y2: nextStart.y,
                missingIndices
              });
            }

            const allValidPoints = segments.flat();
            if (allValidPoints.length === 0) return null;

            return (
              <g key={s.id}>
                {/* Subtle dotted bridge across internal missing years */}
                {gapBridges.map((g, gi) => (
                  <g key={`gap-${s.id}-${gi}`}>
                    <line
                      x1={g.x1}
                      y1={g.y1}
                      x2={g.x2}
                      y2={g.y2}
                      stroke={s.color}
                      strokeWidth="1.5"
                      strokeDasharray="2 4"
                      strokeOpacity="0.45"
                    />
                    {g.missingIndices.map(mi => {
                      const mx = getXCoord(mi);
                      const tFrac = (mx - g.x1) / (g.x2 - g.x1 || 1);
                      const my = g.y1 + tFrac * (g.y2 - g.y1);
                      return (
                        <circle
                          key={`miss-${s.id}-${mi}`}
                          cx={mx}
                          cy={my}
                          r={3.5}
                          fill="#FAF9F5"
                          stroke={s.color}
                          strokeWidth="1.5"
                          strokeDasharray="2 1"
                        />
                      );
                    })}
                  </g>
                ))}

                {/* Observed solid/dashed segments */}
                {segments.map((seg, si) => {
                  if (seg.length < 2) return null;
                  const pathD = seg.reduce(
                    (acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`),
                    ''
                  );
                  return (
                    <path
                      key={`seg-${s.id}-${si}`}
                      d={pathD}
                      fill="none"
                      stroke={s.color}
                      strokeWidth="2.2"
                      strokeDasharray={s.dashed ? '5 4' : undefined}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  );
                })}

                {/* Observed data dots */}
                {allValidPoints.map(p => (
                  <circle
                    key={`dot-${s.id}-${p.idx}`}
                    cx={p.x}
                    cy={p.y}
                    r={hoverIndex === p.idx ? 5 : 3.2}
                    fill={hoverIndex === p.idx ? '#FAF9F5' : s.color}
                    stroke={s.color}
                    strokeWidth="2"
                    className="transition-all duration-150"
                  />
                ))}
              </g>
            );
          })}

          {/* Vertical Hover Crosshair */}
          {activePointX !== null && (
            <line
              x1={activePointX}
              y1={paddingTop}
              x2={activePointX}
              y2={height - paddingBottom}
              stroke="#A6A18F"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
          )}

          {/* X Axis labels & hover columns */}
          {allX.map((xVal, i) => {
            const x = getXCoord(i);
            const isHovered = hoverIndex === i;
            return (
              <g key={`xlabel-${i}`}>
                <text
                  x={x}
                  y={height - paddingBottom + 20}
                  textAnchor="middle"
                  className={`text-[11px] font-mono transition-colors ${
                    isHovered ? 'fill-[#202321] font-bold' : 'fill-[#77766F]'
                  }`}
                >
                  {xVal}
                </text>
                <rect
                  x={x - chartWidth / Math.max(allX.length, 1) / 2}
                  y={paddingTop}
                  width={chartWidth / Math.max(allX.length, 1)}
                  height={chartHeight + 25}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoverIndex(i)}
                />
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip Box */}
        {hoverIndex !== null && (
          <div
            className="absolute top-3 pointer-events-none bg-[#202321]/95 text-[#FAF9F5] backdrop-blur-xs rounded-sm shadow-xl px-3.5 py-2.5 text-xs border border-[#A6A18F]/40 z-20 min-w-[215px]"
            style={{
              left: Math.min(Math.max(10, getXCoord(hoverIndex) - 90), width - 230)
            }}
          >
            <div className="font-semibold text-[#E88A78] border-b border-[#FAF9F5]/15 pb-1 mb-1.5 flex justify-between">
              <span>Periodo</span>
              <span className="font-mono text-[#FAF9F5]">{allX[hoverIndex]}</span>
            </div>
            {alignedSeries.map(s => {
              const pt = s.data[hoverIndex];
              const withinSpan =
                s.computedFirst &&
                s.computedLast &&
                String(allX[hoverIndex]) >= String(s.computedFirst) &&
                String(allX[hoverIndex]) <= String(s.computedLast);

              if (!pt || pt.y === null) {
                if (!withinSpan) return null;
                return (
                  <div key={s.id} className="flex items-center justify-between py-0.5 gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full border border-dashed" style={{ borderColor: s.color }} />
                      <span className="text-[#DAD6CC] truncate max-w-[130px]">{s.name}:</span>
                    </div>
                    <span className="font-mono text-[10px] text-[#E6B86A]">Dato ausente (N/D)</span>
                  </div>
                );
              }
              return (
                <div key={s.id} className="flex items-center justify-between py-0.5 gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs" style={{ backgroundColor: s.color }} />
                    <span className="text-[#DAD6CC] truncate max-w-[135px]">{s.name}:</span>
                  </div>
                  <span className="font-mono font-semibold text-[#FAF9F5] tabular-nums">
                    {formatEsAuto(pt.y, 2)} {unit}
                  </span>
                </div>
              );
            })}
            {alignedSeries.some(
              s => s.showConfidence && s.data[hoverIndex]?.upper95 !== undefined && s.data[hoverIndex]?.lower95 !== undefined
            ) && (
              <div className="mt-1.5 pt-1.5 border-t border-[#FAF9F5]/15 text-[10px] text-[#DAD6CC] font-mono space-y-0.5">
                {alignedSeries
                  .filter(s => s.showConfidence && s.data[hoverIndex]?.upper95 !== undefined)
                  .map(s => (
                    <div key={`ci-${s.id}`}>
                      IC 80%: [{formatEsAuto(s.data[hoverIndex]?.lower80, 2)} –{' '}
                      {formatEsAuto(s.data[hoverIndex]?.upper80, 2)}]
                      <br />
                      IC 95%: [{formatEsAuto(s.data[hoverIndex]?.lower95, 2)} –{' '}
                      {formatEsAuto(s.data[hoverIndex]?.upper95, 2)}]
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Interactive Legend with First/Last Period & Missing Gap Indicator */}
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mt-3 pt-3 border-t border-[#DAD6CC]/70">
        {alignedSeries.map(s => (
          <div key={`legend-${s.id}`} className="flex items-center gap-1.5 text-xs text-[#55544E]">
            <span
              className={`w-3.5 h-1 rounded-none ${s.dashed ? 'border-t-2 border-dashed' : ''}`}
              style={{ backgroundColor: s.dashed ? 'transparent' : s.color, borderColor: s.color }}
            />
            <span>{s.name}</span>
            {s.computedFirst && s.computedLast && (
              <span className="text-[10px] font-mono text-[#77766F]">
                ({s.computedFirst === s.computedLast ? s.computedFirst : `${s.computedFirst}–${s.computedLast}`})
              </span>
            )}
            {s.missingPeriods && s.missingPeriods.length > 0 && (
              <span
                className="text-[10px] text-[#9A4D10] font-mono bg-[#FDF1E6] border border-[#D47528]/35 px-1.5 rounded-xs"
                title={`Periodos sin dato oficial publicado: ${s.missingPeriods.join(', ')}`}
              >
                Hueco: {s.missingPeriods.join(', ')}
              </span>
            )}
            {s.showConfidence && (
              <span className="text-[10px] text-[#4F3559] font-mono bg-[#F4EFF7] border border-[#6E4D7B]/25 px-1.5 rounded-xs">
                (Banda 80-95%)
              </span>
            )}
          </div>
        ))}
        {benchmarkLine && (
          <div className="flex items-center gap-1.5 text-xs text-[#C64B37]">
            <span className="w-3.5 h-0.5 border-t border-dashed" style={{ borderColor: benchmarkLine.color || '#C64B37' }} />
            <span>{benchmarkLine.label} ({formatEsAuto(benchmarkLine.y, 2)} {unit})</span>
          </div>
        )}
      </div>
    </div>
  );
};
