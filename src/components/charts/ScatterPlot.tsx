import React, { useState } from 'react';
import { HospitalMetadata, ComplexityGroup, ManagementModel, HospitalViewCategory } from '../../types';
import { exactMean, exactMedian } from '../../utils/statistics';
import { formatEsDec, formatEsInt } from '../../utils/format';

export interface ScatterPoint {
  id: string;
  name: string;
  shortName: string;
  tier: string;
  complexityGroup: ComplexityGroup;
  managementModel: ManagementModel;
  area: string;
  patients: number;
  delay: number;
  beds: number | null;
  quirofanos: number | null;
  hospital: HospitalMetadata;
  bottleneckQueue?: string;
  activeQueuesCount?: number;
}

interface ScatterPlotProps {
  data: ScatterPoint[];
  selectedHospitalId?: string | null;
  onSelectHospital: (hospital: HospitalMetadata) => void;
  activeCategory: HospitalViewCategory;
  onCategoryChange: (cat: HospitalViewCategory) => void;
  title?: string;
  year: string;
  listLabel: string;
  regionalOfficialDelay?: number | null;
  regionalComparable?: boolean;
  regionalComparisonNote?: string;
  weightedMeanDelay?: number | null;
}

const CATEGORY_TABS: { id: HospitalViewCategory; label: string }[] = [
  { id: 'general', label: 'Visión General' },
  { id: 'quirurgica', label: 'Quirúrgica' },
  { id: 'consultas', label: 'Consultas' },
  { id: 'pruebas', label: 'Pruebas' }
];

export const ScatterPlot: React.FC<ScatterPlotProps> = ({
  data,
  selectedHospitalId,
  onSelectHospital,
  activeCategory,
  onCategoryChange,
  title = 'Matriz de Posicionamiento Hospitalario',
  year,
  listLabel,
  regionalOfficialDelay = null,
  regionalComparable = true,
  regionalComparisonNote,
  weightedMeanDelay = null
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<ScatterPoint | null>(null);

  if (data.length === 0) {
    return (
      <div className="bg-[#FAF9F5] rounded-sm border border-[#DAD6CC] p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#DAD6CC]">
          <h4 className="text-base font-bold text-[#202321]">{title}</h4>
          <div className="flex flex-wrap items-center gap-1 bg-[#ECE8DD] p-1 rounded-sm text-[11px] font-semibold">
            {CATEGORY_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => onCategoryChange(tab.id)}
                className={`px-2.5 py-1 rounded-xs transition-colors cursor-pointer ${
                  activeCategory === tab.id ? 'bg-[#202321] text-[#FAF9F5]' : 'text-[#55544E] hover:text-[#202321]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-center p-8 bg-[#F3F0E8] border border-[#DAD6CC] rounded-sm text-[#77766F] text-sm">
          No hay centros con datos válidos para los filtros actuales en esta categoría.
        </div>
      </div>
    );
  }

  const patientsArr = data.map(d => d.patients);
  const delayArr = data.map(d => d.delay);

  const simpleMeanPatients = exactMean(patientsArr) ?? 0;
  const simpleMeanDelay = exactMean(delayArr) ?? 0;
  const medianPatients = exactMedian(patientsArr) ?? simpleMeanPatients;
  const medianDelay = exactMedian(delayArr) ?? simpleMeanDelay;

  const aboveSimpleCount = data.filter(d => d.delay > simpleMeanDelay).length;
  const belowSimpleCount = data.length - aboveSimpleCount;
  const aboveRegionalCount =
    regionalOfficialDelay !== null && regionalComparable
      ? data.filter(d => d.delay > regionalOfficialDelay).length
      : null;

  const maxPatients = Math.max(...patientsArr, 1000) * 1.1;
  const maxDelay =
    Math.max(...delayArr, regionalComparable && regionalOfficialDelay ? regionalOfficialDelay : 0, 80) * 1.15;

  const width = 760;
  const height = 430;
  const paddingLeft = 65;
  const paddingRight = 35;
  const paddingTop = 35;
  const paddingBottom = 55;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const getXCoord = (val: number) => paddingLeft + (val / maxPatients) * chartWidth;
  const getYCoord = (val: number) => paddingTop + (1 - val / maxDelay) * chartHeight;

  const getGroupColor = (group: ComplexityGroup) => {
    if (group === 'Grupo 3') return '#426C79';
    if (group === 'Grupo 2') return '#2D6A4F';
    if (group === 'Grupo 1') return '#C64B37';
    return '#77766F';
  };

  return (
    <div className="w-full bg-[#FAF9F5] rounded-sm border border-[#DAD6CC] p-5 select-none flex flex-col justify-between">
      <div className="space-y-3 pb-3 mb-2 border-b border-[#DAD6CC]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-base font-bold text-[#202321]">{title}</h4>
            <p className="text-xs text-[#77766F]">
              {activeCategory === 'general' ? `Visión General ${year}` : listLabel} (N={data.length} centros)
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1.5 font-medium text-[#202321]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#426C79]" /> G3
            </span>
            <span className="flex items-center gap-1.5 font-medium text-[#202321]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2D6A4F]" /> G2
            </span>
            <span className="flex items-center gap-1.5 font-medium text-[#202321]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C64B37]" /> G1
            </span>
            <span className="flex items-center gap-1.5 font-medium text-[#202321]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#77766F]" /> Apoyo / Monogr.
            </span>
            <span className="flex items-center gap-1.5 font-medium text-[#77766F]">
              <span className="w-2.5 h-2.5 rounded-full border border-[#77766F] bg-[#ECE8DD]" /> Tamaño=Número de camas
            </span>
          </div>
        </div>

        {/* Integrated Category Tabs inside the Matrix */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1 bg-[#ECE8DD] p-1 rounded-sm text-[11px] font-semibold">
            {CATEGORY_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => onCategoryChange(tab.id)}
                className={`px-2.5 py-1 rounded-xs transition-colors cursor-pointer ${
                  activeCategory === tab.id
                    ? 'bg-[#202321] text-[#FAF9F5]'
                    : 'text-[#55544E] hover:text-[#202321]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="text-[11px] font-mono text-[#77766F] tabular-nums">
            Sobre promedio simple: <strong className="text-[#C64B37]">{aboveSimpleCount}</strong> · Bajo:{' '}
            <strong className="text-[#2D6A4F]">{belowSimpleCount}</strong>
            {aboveRegionalCount !== null && (
              <>
                {' '}· Sobre ref. oficial:{' '}
                <strong className="text-[#C64B37]">{aboveRegionalCount}</strong>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="relative w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto max-h-[430px]">
          {/* Quadrant Background Shading around Simple Mean */}
          <rect
            x={getXCoord(simpleMeanPatients)}
            y={paddingTop}
            width={Math.max(0, width - paddingRight - getXCoord(simpleMeanPatients))}
            height={Math.max(0, getYCoord(simpleMeanDelay) - paddingTop)}
            fill="#C64B37"
            fillOpacity="0.06"
          />
          <rect
            x={paddingLeft}
            y={getYCoord(simpleMeanDelay)}
            width={Math.max(0, getXCoord(simpleMeanPatients) - paddingLeft)}
            height={Math.max(0, height - paddingBottom - getYCoord(simpleMeanDelay))}
            fill="#2D6A4F"
            fillOpacity="0.06"
          />

          {/* Quadrant Labels */}
          <text
            x={width - paddingRight - 8}
            y={paddingTop + 16}
            textAnchor="end"
            className="text-[10px] font-bold fill-[#C64B37] tracking-wide uppercase"
          >
            Cuadrante Crítico: Sobre media pacientes y demora
          </text>
          <text
            x={paddingLeft + 8}
            y={height - paddingBottom - 10}
            textAnchor="start"
            className="text-[10px] font-bold fill-[#2D6A4F] tracking-wide uppercase"
          >
            Cuadrante Favorable: Bajo media pacientes y demora
          </text>

          {/* Line 1: Hospital Simple Mean Delay */}
          <line
            x1={paddingLeft}
            y1={getYCoord(simpleMeanDelay)}
            x2={width - paddingRight}
            y2={getYCoord(simpleMeanDelay)}
            stroke="#426C79"
            strokeWidth="1.75"
            strokeDasharray="5 3"
          />
          <text
            x={paddingLeft + 4}
            y={getYCoord(simpleMeanDelay) - 5}
            className="text-[10px] font-semibold fill-[#426C79]"
          >
            Promedio simple hospitales ({activeCategory === 'general' ? 'máx. listas' : 'centros'}): {formatEsDec(simpleMeanDelay, 1)} d
          </text>

          {/* Line 2: Official Regional Reference (when directly comparable) */}
          {regionalOfficialDelay !== null && regionalComparable && (
            <>
              <line
                x1={paddingLeft}
                y1={getYCoord(regionalOfficialDelay)}
                x2={width - paddingRight}
                y2={getYCoord(regionalOfficialDelay)}
                stroke="#C64B37"
                strokeWidth="1.75"
                strokeDasharray="2 3"
              />
              <text
                x={width - paddingRight - 4}
                y={
                  Math.abs(getYCoord(regionalOfficialDelay) - getYCoord(simpleMeanDelay)) < 14
                    ? getYCoord(regionalOfficialDelay) + 12
                    : getYCoord(regionalOfficialDelay) - 5
                }
                textAnchor="end"
                className="text-[10px] font-semibold fill-[#C64B37]"
              >
                Referencia regional oficial SERMAS: {formatEsDec(regionalOfficialDelay, 2)} d
              </text>
            </>
          )}

          {/* Vertical Simple Mean Patients Line */}
          <line
            x1={getXCoord(simpleMeanPatients)}
            y1={paddingTop}
            x2={getXCoord(simpleMeanPatients)}
            y2={height - paddingBottom}
            stroke="#A6A18F"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          <text
            x={getXCoord(simpleMeanPatients) + 4}
            y={paddingTop + 14}
            className="text-[10px] font-semibold fill-[#77766F]"
          >
            Promedio pac./centro: {formatEsInt(simpleMeanPatients)}
          </text>

          {/* Y Axis Grid */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const val = pct * maxDelay;
            const y = paddingTop + (1 - pct) * chartHeight;
            return (
              <g key={`ygrid-${i}`}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke={i === 0 ? '#A6A18F' : '#E6E2D8'}
                  strokeWidth="1"
                />
                <text x={paddingLeft - 8} y={y + 4} textAnchor="end" className="text-[11px] font-mono fill-[#77766F]">
                  {formatEsInt(val)} d
                </text>
              </g>
            );
          })}

          {/* X Axis Grid */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const val = pct * maxPatients;
            const x = paddingLeft + pct * chartWidth;
            return (
              <g key={`xgrid-${i}`}>
                <line
                  x1={x}
                  y1={paddingTop}
                  x2={x}
                  y2={height - paddingBottom}
                  stroke={i === 0 ? '#A6A18F' : '#E6E2D8'}
                  strokeWidth="1"
                />
                <text x={x} y={height - paddingBottom + 18} textAnchor="middle" className="text-[10px] font-mono fill-[#77766F]">
                  {formatEsInt(val)}
                </text>
              </g>
            );
          })}

          {/* Axis Titles */}
          <text
            x={paddingLeft + chartWidth / 2}
            y={height - 12}
            textAnchor="middle"
            className="text-xs font-semibold fill-[#202321]"
          >
            {activeCategory === 'general'
              ? 'Carga Agregada de Pacientes Pendientes (LEQ + LECE + LEPD, 31-dic-2024) →'
              : 'Pacientes en Lista de Espera Activa (Volumen Absoluto) →'}
          </text>
          <text
            x={-height / 2}
            y={16}
            transform="rotate(-90)"
            textAnchor="middle"
            className="text-xs font-semibold fill-[#202321]"
          >
            {activeCategory === 'general'
              ? 'Demora Máxima entre Listas Separadas (Días) →'
              : 'Demora Media en Días Naturales →'}
          </text>

          {/* Scatter Bubbles */}
          {data.map(pt => {
            const cx = getXCoord(pt.patients);
            const cy = getYCoord(pt.delay);
            const isSelected = selectedHospitalId === pt.id;
            const isHovered = hoveredPoint?.id === pt.id;
            const radius = Math.min(18, Math.max(6, Math.sqrt(pt.beds || 300) * 0.45));
            const color = getGroupColor(pt.complexityGroup);

            return (
              <g
                key={pt.id}
                className="cursor-pointer transition-transform duration-200"
                onClick={() => onSelectHospital(pt.hospital)}
                onMouseEnter={() => setHoveredPoint(pt)}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                {isSelected && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={radius + 6}
                    fill="none"
                    stroke="#C64B37"
                    strokeWidth="2.5"
                    strokeDasharray="3 3"
                  />
                )}
                <circle
                  cx={cx}
                  cy={cy}
                  r={radius}
                  fill={color}
                  fillOpacity={isHovered || isSelected ? 0.94 : 0.72}
                  stroke={isSelected ? '#202321' : '#FAF9F5'}
                  strokeWidth={isSelected ? 2.2 : 1.5}
                />
                {(isHovered || isSelected || pt.patients > simpleMeanPatients * 1.3 || pt.delay > simpleMeanDelay * 1.3) && (
                  <text
                    x={cx}
                    y={cy - radius - 4}
                    textAnchor="middle"
                    className={`text-[9px] font-bold ${
                      isSelected ? 'fill-[#C64B37] font-extrabold' : 'fill-[#202321]'
                    }`}
                  >
                    {pt.shortName}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip */}
        {hoveredPoint && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-[#202321]/95 text-[#FAF9F5] backdrop-blur-xs rounded-sm shadow-2xl p-3 text-xs border border-[#A6A18F]/40 pointer-events-none z-30 min-w-[300px]">
            <div className="flex items-start justify-between border-b border-[#FAF9F5]/15 pb-2 mb-2 gap-2">
              <div>
                <h5 className="font-bold text-[#E88A78] text-sm">{hoveredPoint.name}</h5>
                <p className="text-[11px] text-[#DAD6CC]">
                  {hoveredPoint.complexityGroup} · {hoveredPoint.managementModel}
                </p>
                <p className="text-[10px] text-[#A6A18F]">
                  Titularidad {hoveredPoint.hospital.ownership} · Área {hoveredPoint.area}
                </p>
              </div>
              <span className="text-[10px] font-mono bg-[#2F3330] text-[#FAF9F5] px-2 py-0.5 rounded-xs border border-[#A6A18F]/30 shrink-0">
                {hoveredPoint.beds !== null ? `${formatEsInt(hoveredPoint.beds)} camas inst.` : 'Camas N/D'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2.5 font-mono">
              <div className="bg-[#2B2F2C] p-2 rounded-xs">
                <span className="text-[#A6A18F] text-[9px] block font-sans">
                  {activeCategory === 'general' ? 'Carga agregada (2024):' : 'Pacientes en Lista:'}
                </span>
                <span className="text-[#84C6A3] font-bold text-sm tabular-nums">
                  {formatEsInt(hoveredPoint.patients)}
                </span>
                <span className="text-[9px] text-[#A6A18F] block mt-0.5">
                  Mediana centros: {formatEsInt(medianPatients)}
                </span>
              </div>
              <div className="bg-[#2B2F2C] p-2 rounded-xs">
                <span className="text-[#A6A18F] text-[9px] block font-sans">
                  {activeCategory === 'general'
                    ? `Máx. lista (${hoveredPoint.bottleneckQueue || ''}):`
                    : 'Demora Media:'}
                </span>
                <span className="text-[#E6B86A] font-bold text-sm tabular-nums">
                  {formatEsDec(hoveredPoint.delay, 1)} días
                </span>
                <span className="text-[9px] text-[#A6A18F] block mt-0.5">
                  Prom. simple: {formatEsDec(simpleMeanDelay, 1)} d | Mediana: {formatEsDec(medianDelay, 1)} d
                </span>
              </div>
            </div>
            {activeCategory === 'general' && (
              <div className="mt-2 bg-[#2B2F2C]/70 rounded-xs p-2 text-[10px] font-mono space-y-0.5">
                <div className="flex justify-between">
                  <span className="text-[#A6A18F] font-sans">Quirúrgica (2024):</span>
                  <span>{formatEsDec(hoveredPoint.hospital.series.quirurgica.demora['2024'], 1, { fallback: 'N/A' })} d</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#A6A18F] font-sans">Consultas (2024):</span>
                  <span>{formatEsDec(hoveredPoint.hospital.series.consultas.demora['2024'], 1, { fallback: 'N/A' })} d</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#A6A18F] font-sans">Pruebas (2024):</span>
                  <span>{formatEsDec(hoveredPoint.hospital.series.pruebas.demora['2024'], 1, { fallback: 'N/A' })} d</span>
                </div>
              </div>
            )}
            <div className="mt-2 text-[10px] text-[#A6A18F] italic text-center">
              Haz clic para abrir el expediente completo del centro.
            </div>
          </div>
        )}
      </div>

      {/* Explicit Legend distinguishing Simple Mean, Weighted Mean, Median, and Regional Reference */}
      <div className="mt-3 pt-2.5 border-t border-[#DAD6CC] space-y-1.5 text-[11px] text-[#55544E]">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-4 border-t-2 border-dashed border-[#426C79]" />
            <span>
              <strong className="text-[#202321]">Línea 1 — Promedio simple hospitales ({formatEsDec(simpleMeanDelay, 1)} d):</strong> igual peso por centro (1/N).{' '}
              Mediana: <strong className="text-[#202321]">{formatEsDec(medianDelay, 1)} d</strong>
              {weightedMeanDelay !== null && weightedMeanDelay !== undefined && (
                <> · Media ponderada por pacientes: <strong className="text-[#202321]">{formatEsDec(weightedMeanDelay, 1)} d</strong></>
              )}.
            </span>
          </span>
          {regionalOfficialDelay !== null && regionalComparable && (
            <span className="flex items-center gap-1.5">
              <span className="w-4 border-t-2 border-dotted border-[#C64B37]" />
              <span>
                <strong className="text-[#202321]">Línea 2 — Referencia regional oficial SERMAS ({formatEsDec(regionalOfficialDelay, 2)} d):</strong> agregado oficial (corte 31-dic-{year}).
              </span>
            </span>
          )}
        </div>
      </div>

      {regionalComparisonNote && (
        <div className="mt-2.5 p-3 bg-[#F3F0E8] border border-[#DAD6CC] rounded-sm text-[11px] text-[#55544E] leading-relaxed">
          <strong className="text-[#426C79]">Nota: </strong>
          {regionalComparisonNote}
        </div>
      )}
    </div>
  );
};
