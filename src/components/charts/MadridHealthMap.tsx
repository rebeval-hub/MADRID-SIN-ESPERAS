import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { HospitalMetadata, HospitalViewCategory } from '../../types';
import { formatEsDec, formatEsInt } from '../../utils/format';
import {
  initMadridMap,
  createHospitalBuildingIcon
} from '../../utils/leafletMapConfig';

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
  const [filterArea, setFilterArea] = useState<string>('ALL');

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const polylinesLayerRef = useRef<L.LayerGroup | null>(null);

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

  // Initialize unified Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = initMadridMap(mapContainerRef.current, {
      zoom: 10,
      minZoom: 8,
      maxZoom: 18
    });

    const polylinesLayer = L.layerGroup().addTo(map);
    const markersLayer = L.layerGroup().addTo(map);

    polylinesLayerRef.current = polylinesLayer;
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersLayerRef.current = null;
      polylinesLayerRef.current = null;
    };
  }, []);

  // Update Markers and Polylines
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    const polylinesLayer = polylinesLayerRef.current;
    if (!map || !markersLayer || !polylinesLayer) return;

    markersLayer.clearLayers();
    polylinesLayer.clearLayers();

    // 1. Render highlighted pairs as polylines
    highlightedPairs.forEach((pair, idx) => {
      const hA = hospitals[pair.fromId];
      const hB = hospitals[pair.toId];
      if (!hA || !hB) return;

      const polyline = L.polyline(
        [
          [hA.lat, hA.lng],
          [hB.lat, hB.lng]
        ],
        {
          color: '#426C79',
          weight: 2.5,
          dashArray: '5, 4',
          opacity: 0.85
        }
      );

      if (pair.label) {
        polyline.bindTooltip(pair.label, {
          permanent: true,
          direction: 'center',
          className: 'leaflet-pair-tooltip font-mono text-[10px] font-bold bg-[#202321] text-[#FAF9F5] px-1.5 py-0.5 rounded-xs'
        });
      }

      polylinesLayer.addLayer(polyline);
    });

    // 2. Render hospital building markers
    hospitalList.forEach(h => {
      const m = getMapMetrics(h);
      const color = getDelayColor(m.delay);
      const isSelected = selectedHospitalId === h.id;
      const delayFormatted = m.delay !== null && !isNaN(m.delay) ? `${Math.round(m.delay)}d` : 'S/D';

      const hospIcon = createHospitalBuildingIcon({
        hospital: h,
        delayFormatted,
        metricColor: color,
        isSelected
      });

      const marker = L.marker([h.lat, h.lng], {
        icon: hospIcon,
        zIndexOffset: isSelected ? 900 : 100
      });

      marker.on('click', () => {
        onSelectHospital(h);
      });

      // Rich popup with full official metrics
      const popupHtml = `
        <div style="font-family:sans-serif; padding:4px; font-size:12px; line-height:1.4; min-width:220px; color:#202321;">
          <div style="font-size:10px; font-weight:700; color:#426C79; text-transform:uppercase;">
            ${h.complexityGroup} · ${h.managementModel}
          </div>
          <strong style="color:#202321; font-size:13px; display:block; margin:2px 0;">${h.fullName}</strong>
          <div style="color:#77766F; font-size:11px;">
            ${h.municipality} · Área ${h.area}
          </div>

          <div style="margin-top:8px; padding-top:6px; border-top:1px solid #DAD6CC; display:grid; grid-template-columns:1fr 1fr; gap:6px;">
            <div style="background:#F3F0E8; padding:4px 6px; border-radius:3px;">
              <span style="font-size:10px; color:#77766F; display:block;">
                ${activeCategory === 'general' ? 'Peor Demora:' : `Demora (${selectedYear}):`}
              </span>
              <strong style="font-size:13px; color:${color};">
                ${m.delay !== null ? `${formatEsDec(m.delay, 1)} d` : 'No disp.'}
              </strong>
              ${m.bottleneckQueue ? `<span style="font-size:9px; color:#77766F; display:block;">${m.bottleneckQueue}</span>` : ''}
            </div>
            <div style="background:#F3F0E8; padding:4px 6px; border-radius:3px;">
              <span style="font-size:10px; color:#77766F; display:block;">Pacientes:</span>
              <strong style="font-size:13px; color:#202321;">
                ${m.patients !== null ? formatEsInt(m.patients) : 'No disp.'}
              </strong>
              <span style="font-size:9px; color:#77766F; display:block;">${m.cutoffLabel}</span>
            </div>
          </div>

          <div style="margin-top:6px; display:flex; justify-content:space-between; font-size:10px; color:#77766F; border-top:1px solid #ECE8DD; padding-top:4px;">
            <span>Camas: <strong style="color:#202321;">${h.beds !== null ? formatEsInt(h.beds) : 'N/D'}</strong></span>
            <span>Quirófanos: <strong style="color:#202321;">${h.quirofanos !== null ? formatEsInt(h.quirofanos) : 'N/D'}</strong></span>
          </div>

          <button
            onclick="document.dispatchEvent(new CustomEvent('open-hospital-modal', { detail: '${h.id}' }))"
            style="width:100%; margin-top:8px; background:#426C79; color:#FAF9F5; border:none; padding:4px 8px; border-radius:3px; font-weight:600; font-size:11px; cursor:pointer;"
          >
            Ver Ficha Completa
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml);
      markersLayer.addLayer(marker);
    });

    // Auto-fit if filtered
    if (hospitalList.length > 0) {
      const bounds = L.latLngBounds(hospitalList.map(h => [h.lat, h.lng] as [number, number]));
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 12 });
    }
  }, [hospitalList, activeCategory, selectedYear, selectedHospitalId, highlightedPairs]);

  // Listener for popup "Ver Ficha Completa" button
  useEffect(() => {
    const handleCustomOpen = (e: any) => {
      const hId = e.detail;
      const target = hospitals[hId];
      if (target) {
        onSelectHospital(target);
      }
    };
    document.addEventListener('open-hospital-modal', handleCustomOpen);
    return () => {
      document.removeEventListener('open-hospital-modal', handleCustomOpen);
    };
  }, [hospitals, onSelectHospital]);

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
                ? 'Visión General (corte común 31-dic-2024) · Cartografía realista unificada · Iconos de edificios hospitalarios con cruz médica'
                : `Geolocalización SERMAS · Corte 31-dic-${selectedYear} · Base cartográfica oficial`}
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

      {/* Realistic Leaflet Map Canvas */}
      <div className="relative w-full rounded-sm border border-[#DAD6CC] overflow-hidden bg-[#EFECE3]">
        <div
          ref={mapContainerRef}
          style={{ height: '460px', width: '100%' }}
          className="z-10 focus:outline-none"
        />
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
