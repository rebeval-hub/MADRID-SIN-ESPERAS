import React, { useState } from 'react';
import { HospitalMetadata, HospitalViewCategory } from '../../types';
import { formatEsDec, formatEsInt } from '../../utils/format';

export interface MapHospitalPoint {
  hospital: HospitalMetadata;
  patients: number | null;
  delay: number | null;
  bottleneckQueue?: string | null;
  activeQueuesCount?: number;
  cutoffLabel: string;
}

export interface HighlightedMapPair {
  fromId: string;
  toId: string;
  label?: string;
}

interface MadridHealthMapProps {
  hospitals: Record<string, HospitalMetadata>;
  filteredIds?: Set<string>;
  activeCategory: HospitalViewCategory;
  onCategoryChange: (cat: HospitalViewCategory) => void;
  selectedYear: string;
  selectedHospitalId?: string | null;
  onSelectHospital: (hospital: HospitalMetadata) => void;
  highlightedPairs?: HighlightedMapPair[];
}

const CATEGORY_TABS: { id: HospitalViewCategory; label: string; short: string }[] = [
  { id: 'general', label: 'Visión General', short: 'General (2024)' },
  { id: 'quirurgica', label: 'Quirúrgica', short: 'Quirúrgica (2025)' },
  { id: 'consultas', label: 'Consultas Externas', short: 'Consultas (2024)' },
  { id: 'pruebas', label: 'Pruebas Diagnósticas', short: 'Pruebas (2024)' }
];

export const MadridHealthMap: React.FC<MadridHealthMapProps> = ({
  hospitals,
  filteredIds,
  activeCategory,
  onCategoryChange,
  selectedYear,
  selectedHospitalId,
  onSelectHospital,
  highlightedPairs = []
}) => {
  const [hoveredHosp, setHoveredHosp] = useState<HospitalMetadata | null>(null);
  const [filterArea, setFilterArea] = useState<string>('ALL');

  const minLat = 40.0;
  const maxLat = 40.72;
  const minLng = -4.2;
  const maxLng = -3.25;

  const width = 760;
  const height = 480;

  const project = (lat: number, lng: number) => {
    const x = ((lng - minLng) / (maxLng - minLng)) * width;
    const y = ((maxLat - lat) / (maxLat - minLat)) * height;
    return { x, y };
  };

  const hospitalList = Object.values(hospitals).filter(h => {
    if (filteredIds && !filteredIds.has(h.id)) return false;
    if (filterArea !== 'ALL' && h.area !== filterArea) return false;
    return true;
  });

  const getMapMetrics = (h: HospitalMetadata): MapHospitalPoint => {
    if (activeCategory === 'general') {
      // Common cutoff 31-dic-2024 across LEQ, LECE, LEPD (never mix 2025 + 2024 in sums)
      const qP = h.series.quirurgica?.pacientes['2024'] ?? null;
      const cP = h.series.consultas?.pacientes['2024'] ?? null;
      const pP = h.series.pruebas?.pacientes['2024'] ?? null;

      const qD = h.series.quirurgica?.demora['2024'] ?? null;
      const cD = h.series.consultas?.demora['2024'] ?? null;
      const pD = h.series.pruebas?.demora['2024'] ?? null;

      const validP = [qP, cP, pP].filter((v): v is number => v !== null && v !== undefined && !isNaN(v));
      const totalPatients = validP.length > 0 ? validP.reduce((a, b) => a + b, 0) : null;

      const queues: { name: string; delay: number }[] = [];
      if (qD !== null && !isNaN(qD)) queues.push({ name: 'Quirúrgica', delay: qD });
      if (cD !== null && !isNaN(cD)) queues.push({ name: 'Consultas', delay: cD });
      if (pD !== null && !isNaN(pD)) queues.push({ name: 'Pruebas', delay: pD });

      let maxDelay: number | null = null;
      let bottleneckQueue: string | null = null;
      if (queues.length > 0) {
        const worst = queues.reduce((a, b) => (b.delay > a.delay ? b : a));
        maxDelay = worst.delay;
        bottleneckQueue = worst.name;
      }

      return {
        hospital: h,
        patients: totalPatients,
        delay: maxDelay,
        bottleneckQueue,
        activeQueuesCount: queues.length,
        cutoffLabel: '31-dic-2024'
      };
    }

    const delay = h.series[activeCategory]?.demora[selectedYear] ?? null;
    const patients = h.series[activeCategory]?.pacientes[selectedYear] ?? null;
    return {
      hospital: h,
      patients,
      delay,
      cutoffLabel: `31-dic-${selectedYear}`
    };
  };

  const getDelayColor = (delay: number | null | undefined) => {
    if (delay === undefined || delay === null || isNaN(delay)) return '#94a3b8';
    if (delay < 45) return '#10b981';
    if (delay < 65) return '#0284c7';
    if (delay < 80) return '#f59e0b';
    return '#e11d48';
  };

  const validCentersCount = hospitalList.filter(h => getMapMetrics(h).delay !== null).length;
  const missingCentersCount = hospitalList.length - validCentersCount;

  const hoveredMetrics = hoveredHosp ? getMapMetrics(hoveredHosp) : null;

  return (
    <div className="w-full bg-[#FAF9F5] rounded-sm border border-[#DAD6CC] p-5 select-none flex flex-col justify-between">
      {/* Header & Integrated Category + Area Selectors */}
      <div className="space-y-3 pb-3 mb-3 border-b border-[#DAD6CC]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-base font-bold text-[#202321] flex items-center gap-2">
              <span className="w-2 h-2 bg-[#426C79] shrink-0" aria-hidden="true" />
              Mapa Geosanitario de la Red Hospitalaria de Madrid
            </h4>
            <p className="text-xs text-[#77766F] mt-0.5">
              {activeCategory === 'general'
                ? 'Visión General (corte común 31-dic-2024) · Tamaño = Carga acumulada (LEQ+LECE+LEPD) · Color = Demora máxima entre listas separadas'
                : `Geolocalización SERMAS · Corte 31-dic-${selectedYear} · Tamaño = Pacientes, Color = Demora media`}
            </p>
          </div>
        </div>

        {/* Integrated Category Tabs inside the Map */}
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

          <div className="flex flex-wrap items-center gap-1 bg-[#ECE8DD] p-1 rounded-sm text-[11px] font-medium">
            {['ALL', 'Centro', 'Norte', 'Sur', 'Este', 'Oeste'].map(area => (
              <button
                key={area}
                onClick={() => setFilterArea(area)}
                className={`px-2 py-1 rounded-xs transition-colors cursor-pointer ${
                  filterArea === area
                    ? 'bg-[#FAF9F5] text-[#202321] font-bold border border-[#DAD6CC]'
                    : 'text-[#55544E] hover:text-[#202321]'
                }`}
              >
                {area === 'ALL' ? 'Toda la región' : area}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="relative w-full bg-[#EFECE3] rounded-sm border border-[#DAD6CC] overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto max-h-[460px]">
          {/* Subtle cartographic coordinate graticule */}
          {[0.2, 0.4, 0.6, 0.8].map(f => (
            <g key={`grid-${f}`} stroke="#DAD6CC" strokeWidth="0.6" strokeDasharray="2 4">
              <line x1={width * f} y1={0} x2={width * f} y2={height} />
              <line x1={0} y1={height * f} x2={width} y2={height * f} />
            </g>
          ))}

          <path
            d="M 280 20 L 410 15 L 530 60 L 610 110 L 670 170 L 690 260 L 630 350 L 560 410 L 460 460 L 390 470 L 320 450 L 220 400 L 140 330 L 100 240 L 120 140 L 180 70 Z"
            fill="#E3DEC9"
            fillOpacity="0.6"
            stroke="#A6A18F"
            strokeWidth="1.5"
            strokeDasharray="4 2"
          />

          <text x="380" y="225" textAnchor="middle" className="text-xs font-extrabold fill-[#A6A18F]/80 tracking-widest uppercase">
            Área Centro / Madrid Capital
          </text>
          <text x="390" y="80" textAnchor="middle" className="text-[11px] font-bold fill-[#A6A18F]/80 tracking-wider uppercase">
            Sierra Norte
          </text>
          <text x="360" y="380" textAnchor="middle" className="text-[11px] font-bold fill-[#A6A18F]/80 tracking-wider uppercase">
            Área Sur Metropolitana
          </text>
          <text x="590" y="240" textAnchor="middle" className="text-[11px] font-bold fill-[#A6A18F]/80 tracking-wider uppercase">
            Corredor del Henares (Este)
          </text>
          <text x="180" y="240" textAnchor="middle" className="text-[11px] font-bold fill-[#A6A18F]/80 tracking-wider uppercase">
            Área Noroeste / Guadarrama
          </text>

          {/* Optional territorial comparable neighbor pairs (used by Section C) */}
          {highlightedPairs.map((pair, idx) => {
            const hA = hospitals[pair.fromId];
            const hB = hospitals[pair.toId];
            if (!hA || !hB) return null;
            const pA = project(hA.lat, hA.lng);
            const pB = project(hB.lat, hB.lng);
            const midX = (pA.x + pB.x) / 2;
            const midY = (pA.y + pB.y) / 2;
            return (
              <g key={`${pair.fromId}-${pair.toId}-${idx}`} className="pointer-events-none">
                <line
                  x1={pA.x}
                  y1={pA.y}
                  x2={pB.x}
                  y2={pB.y}
                  stroke="#426C79"
                  strokeWidth="1.8"
                  strokeDasharray="4 3"
                  strokeOpacity="0.85"
                />
                {pair.label && (
                  <g transform={`translate(${midX}, ${midY})`}>
                    <rect x="-26" y="-8" width="52" height="14" rx="2" fill="#426C79" fillOpacity="0.95" />
                    <text x="0" y="2" textAnchor="middle" className="text-[8px] font-mono font-bold fill-[#FAF9F5]">
                      {pair.label}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {hospitalList.map(h => {
            const { x, y } = project(h.lat, h.lng);
            const m = getMapMetrics(h);
            const hasData = m.delay !== null && m.patients !== null;
            const color = getDelayColor(m.delay);
            const isSelected = selectedHospitalId === h.id;
            const isHovered = hoveredHosp?.id === h.id;
            const radius = hasData
              ? activeCategory === 'general'
                ? Math.min(18, Math.max(6, Math.sqrt(m.patients || 100) * 0.085))
                : Math.min(16, Math.max(6, Math.sqrt(m.patients || 100) * 0.16))
              : 6;

            return (
              <g
                key={h.id}
                className="cursor-pointer transition-transform duration-200"
                onClick={() => onSelectHospital(h)}
                onMouseEnter={() => setHoveredHosp(h)}
                onMouseLeave={() => setHoveredHosp(null)}
              >
                {isSelected && (
                  <circle
                    cx={x}
                    cy={y}
                    r={radius + 7}
                    fill="none"
                    stroke="#C64B37"
                    strokeWidth="2.5"
                    strokeDasharray="3 3"
                  />
                )}

                <circle
                  cx={x}
                  cy={y}
                  r={radius}
                  fill={color}
                  fillOpacity={hasData ? (isHovered || isSelected ? 0.96 : 0.82) : 0.45}
                  stroke={hasData ? '#FAF9F5' : '#55544E'}
                  strokeWidth={hasData ? '1.8' : '1.4'}
                  strokeDasharray={hasData ? undefined : '2 2'}
                />

                <circle cx={x} cy={y} r="2.2" fill="#FAF9F5" />

                {(isHovered || isSelected || radius > 10 || !hasData) && (
                  <text
                    x={x}
                    y={y - radius - 3}
                    textAnchor="middle"
                    className={`text-[9px] font-bold ${
                      !hasData
                        ? 'fill-[#77766F] italic'
                        : isSelected
                        ? 'fill-[#C64B37] font-extrabold'
                        : 'fill-[#202321]'
                    }`}
                  >
                    {h.shortName}{!hasData ? ' (N/D)' : ''}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {hoveredHosp && hoveredMetrics && (
          <div className="absolute top-3 right-3 bg-[#202321]/95 text-[#FAF9F5] backdrop-blur-xs rounded-sm shadow-2xl p-3.5 text-xs border border-[#A6A18F]/40 pointer-events-none z-30 min-w-[295px] max-w-[330px]">
            <div className="border-b border-[#FAF9F5]/15 pb-2 mb-2">
              <h5 className="font-bold text-[#E88A78] text-sm">{hoveredHosp.fullName}</h5>
              <p className="text-[11px] text-[#DAD6CC]">
                {hoveredHosp.complexityGroup} · {hoveredHosp.managementModel}
              </p>
              <p className="text-[10px] text-[#A6A18F]">
                Titularidad {hoveredHosp.ownership} · {hoveredHosp.municipality}
              </p>
            </div>

            {activeCategory === 'general' ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2 font-mono">
                  <div className="bg-[#2B2F2C] p-2 rounded-xs">
                    <span className="text-[#A6A18F] text-[9px] block font-sans">Carga acumulada (31-dic-2024):</span>
                    <span className="text-[#84C6A3] font-bold text-sm tabular-nums">
                      {formatEsInt(hoveredMetrics.patients)}
                    </span>
                    <span className="text-[9px] text-[#A6A18F] block">
                      {hoveredMetrics.activeQueuesCount}/3 listas activas
                    </span>
                  </div>
                  <div className="bg-[#2B2F2C] p-2 rounded-xs">
                    <span className="text-[#A6A18F] text-[9px] block font-sans">Cuello de botella (2024):</span>
                    <span className="text-[#E6B86A] font-bold text-sm tabular-nums">
                      {hoveredMetrics.delay !== null ? `${formatEsDec(hoveredMetrics.delay, 1)} d` : 'N/D'}
                    </span>
                    <span className="text-[9px] text-[#A6A18F] block">
                      {hoveredMetrics.bottleneckQueue || 'N/A'}
                    </span>
                  </div>
                </div>
                <div className="bg-[#2B2F2C]/70 rounded-xs p-2 text-[10px] font-mono space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[#A6A18F] font-sans">Quirúrgica (2024 / 2025):</span>
                    <span className="text-[#FAF9F5]">
                      {hoveredHosp.series.quirurgica.demora['2024'] !== null
                        ? `${formatEsDec(hoveredHosp.series.quirurgica.demora['2024'], 1)} d / ${hoveredHosp.series.quirurgica.demora['2025'] !== null ? `${formatEsDec(hoveredHosp.series.quirurgica.demora['2025'], 1)} d` : 'N/D'}`
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#A6A18F] font-sans">Consultas Ext. (2024):</span>
                    <span className="text-[#FAF9F5]">
                      {hoveredHosp.series.consultas.demora['2024'] !== null
                        ? `${formatEsDec(hoveredHosp.series.consultas.demora['2024'], 1)} d (${formatEsInt(hoveredHosp.series.consultas.pacientes['2024'])} pac.)`
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#A6A18F] font-sans">Pruebas Diag. (2024):</span>
                    <span className="text-[#FAF9F5]">
                      {hoveredHosp.series.pruebas.demora['2024'] !== null
                        ? `${formatEsDec(hoveredHosp.series.pruebas.demora['2024'], 1)} d (${formatEsInt(hoveredHosp.series.pruebas.pacientes['2024'])} pac.)`
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 font-mono">
                <div className="bg-[#2B2F2C] p-2 rounded-xs">
                  <span className="text-[#A6A18F] text-[10px] block font-sans">Demora Media ({selectedYear}):</span>
                  <span className="text-[#E6B86A] font-bold text-sm tabular-nums">
                    {hoveredMetrics.delay !== null ? `${formatEsDec(hoveredMetrics.delay, 1)} días` : 'No aplicable / N/D'}
                  </span>
                </div>
                <div className="bg-[#2B2F2C] p-2 rounded-xs">
                  <span className="text-[#A6A18F] text-[10px] block font-sans">Pacientes ({selectedYear}):</span>
                  <span className="text-[#84C6A3] font-bold text-sm tabular-nums">
                    {hoveredMetrics.patients !== null ? formatEsInt(hoveredMetrics.patients) : 'No aplicable / N/D'}
                  </span>
                </div>
              </div>
            )}

            <div className="mt-2 flex items-center justify-between text-[10px] text-[#A6A18F] border-t border-[#FAF9F5]/15 pt-1.5">
              <span>Camas inst.: <strong className="text-[#FAF9F5]">{hoveredHosp.beds !== null ? formatEsInt(hoveredHosp.beds) : 'No disp.'}</strong></span>
              <span>Quir.: <strong className="text-[#FAF9F5]">{hoveredHosp.quirofanos !== null ? formatEsInt(hoveredHosp.quirofanos) : 'No disp.'}</strong></span>
              <span>Área: <strong className="text-[#FAF9F5]">{hoveredHosp.area}</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* Dynamic Legend */}
      <div className="mt-3 pt-3 border-t border-[#DAD6CC] space-y-2 text-xs text-[#55544E]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-semibold text-[#202321]">
              {activeCategory === 'general' ? 'Demora máxima entre listas (2024):' : 'Escala de Demora:'}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" /> &lt; 45 d
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7]" /> 45–65 d
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" /> 65–80 d
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#e11d48]" /> &gt; 80 d
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#94a3b8] border border-dashed border-[#55544E]" /> Sin registro ({missingCentersCount})
            </span>
          </div>
          <span className="text-[#77766F] text-[11px] font-mono">
            {validCentersCount} con dato / {hospitalList.length} mostrados
          </span>
        </div>

        {activeCategory === 'general' && (
          <div className="text-[11px] text-[#55544E] bg-[#F3F0E8] border border-[#DAD6CC] rounded-sm px-3 py-2">
            <strong className="text-[#202321]">Criterio Visión General:</strong> No se suman ni promedian días de espera de colas distintas. Los volúmenes se agregan en el corte común <strong>31-dic-2024</strong> (LEQ total + LECE estructural + LEPD estructural) y el color muestra la peor demora observada entre las listas disponibles del centro.
          </div>
        )}
      </div>
    </div>
  );
};
