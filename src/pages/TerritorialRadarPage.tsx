import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Compass,
  Search,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ArrowLeftRight,
  MapPin,
  AlertCircle,
  CheckSquare,
  ExternalLink
} from 'lucide-react';
import {
  FullHealthData,
  HospitalMetadata,
  WaitListType,
  ComplexityGroup
} from '../types';
import { CategoryBadge } from '../components/common/Badge';
import { InteractiveLineChart, LineSeries } from '../components/charts/InteractiveLineChart';
import { formatEsDec, formatEsInt } from '../utils/format';

interface TerritorialRadarPageProps {
  data: FullHealthData;
  selectedHospitalId?: string | null;
  onSelectHospital: (hospital: HospitalMetadata) => void;
}

type IndicatorType = 'demora' | 'pacientes';

const LIST_OPTIONS: { id: WaitListType; label: string; shortLabel: string; dataset: string }[] = [
  { id: 'quirurgica', label: 'Lista Quirúrgica (LEQ_Hosp)', shortLabel: 'LEQ (Quirúrgica)', dataset: 'LEQ_Hosp' },
  { id: 'consultas', label: 'Consultas Externas (LECE_Hosp)', shortLabel: 'LECE (Consultas)', dataset: 'LECE_Hosp' },
  { id: 'pruebas', label: 'Pruebas Diagnósticas (LEPD_Hosp)', shortLabel: 'LEPD (Pruebas)', dataset: 'LEPD_Hosp' }
];

const COMPLEXITY_OPTIONS: ('ALL' | ComplexityGroup)[] = [
  'ALL',
  'Grupo 3',
  'Grupo 2',
  'Grupo 1',
  'Apoyo / Especialidades',
  'Media y Larga Estancia',
  'Salud Mental Monográfico'
];

const COMPLEXITY_RING_COLOR: Record<ComplexityGroup, string> = {
  'Grupo 3': '#202321',
  'Grupo 2': '#426C79',
  'Grupo 1': '#2D6A4F',
  'Apoyo / Especialidades': '#6E4D7B',
  'Media y Larga Estancia': '#B4691E',
  'Salud Mental Monográfico': '#C64B37'
};

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const TerritorialRadarPage: React.FC<TerritorialRadarPageProps> = ({
  data,
  onSelectHospital
}) => {
  const allHospitals = useMemo(() => Object.values(data.hospitals), [data.hospitals]);

  const [selectedList, setSelectedList] = useState<WaitListType>('quirurgica');
  const availableYears = useMemo(() => {
    const yearsSet = new Set<string>();
    allHospitals.forEach(h => {
      h.series[selectedList]?.years.forEach(y => yearsSet.add(y));
    });
    return Array.from(yearsSet).sort();
  }, [allHospitals, selectedList]);

  const [selectedYear, setSelectedYear] = useState<string>('2025');
  useEffect(() => {
    if (availableYears.length > 0 && !availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[availableYears.length - 1]);
    }
  }, [availableYears, selectedYear]);

  const [complexityFilter, setComplexityFilter] = useState<'ALL' | ComplexityGroup>('ALL');
  const [indicator, setIndicator] = useState<IndicatorType>('demora');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Selection & side-by-side comparison state
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [peerId, setPeerId] = useState<string | null>(null);

  // Interactive Zoom & Pan state
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const didDragRef = useRef<boolean>(false);
  const [hoveredHosp, setHoveredHosp] = useState<HospitalMetadata | null>(null);

  // Geographic projection box covering Comunidad de Madrid
  const minLat = 39.98;
  const maxLat = 40.72;
  const minLng = -4.22;
  const maxLng = -3.22;
  const width = 860;
  const height = 520;

  const project = (lat: number, lng: number) => ({
    x: ((lng - minLng) / (maxLng - minLng)) * width,
    y: ((maxLat - lat) / (maxLat - minLat)) * height
  });

  // Extract official values for a hospital under active list + year
  const getHospitalObs = (h: HospitalMetadata, year = selectedYear) => {
    const s = h.series[selectedList];
    const delay = s?.demora[year] ?? null;
    const patients = s?.pacientes[year] ?? null;
    const prevYear = String(parseInt(year, 10) - 1);
    const prevDelay = availableYears.includes(prevYear) ? (s?.demora[prevYear] ?? null) : null;
    const prevPatients = availableYears.includes(prevYear) ? (s?.pacientes[prevYear] ?? null) : null;

    const yoyDelayDiff =
      delay !== null && prevDelay !== null ? delay - prevDelay : null;
    const yoyPatientsPct =
      patients !== null && prevPatients !== null && prevPatients > 0
        ? ((patients - prevPatients) / prevPatients) * 100
        : null;

    return {
      delay: delay !== null && !Number.isNaN(delay) ? delay : null,
      patients: patients !== null && !Number.isNaN(patients) ? patients : null,
      prevYear: availableYears.includes(prevYear) ? prevYear : null,
      yoyDelayDiff,
      yoyPatientsPct
    };
  };

  // Filtered hospitals
  const filteredHospitals = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return allHospitals.filter(h => {
      if (complexityFilter !== 'ALL' && h.complexityGroup !== complexityFilter) return false;
      if (
        term &&
        !h.fullName.toLowerCase().includes(term) &&
        !h.shortName.toLowerCase().includes(term) &&
        !h.municipality.toLowerCase().includes(term)
      ) {
        return false;
      }
      return true;
    });
  }, [allHospitals, complexityFilter, searchTerm]);

  // Quantile / magnitude thresholds for patient indicator coloring
  const maxPatientsInView = useMemo(() => {
    const vals = filteredHospitals
      .map(h => getHospitalObs(h).patients)
      .filter((v): v is number => v !== null);
    return vals.length > 0 ? Math.max(...vals) : 1;
  }, [filteredHospitals, selectedList, selectedYear]);

  const getMarkerColor = (obs: ReturnType<typeof getHospitalObs>) => {
    if (indicator === 'demora') {
      if (obs.delay === null) return '#A6A18F';
      if (obs.delay < 45) return '#10b981';
      if (obs.delay < 65) return '#0284c7';
      if (obs.delay < 80) return '#f59e0b';
      return '#e11d48';
    }
    if (obs.patients === null) return '#A6A18F';
    const ratio = obs.patients / Math.max(1, maxPatientsInView);
    if (ratio < 0.25) return '#10b981';
    if (ratio < 0.5) return '#0284c7';
    if (ratio < 0.75) return '#f59e0b';
    return '#e11d48';
  };

  const getMarkerRadius = (patients: number | null) => {
    if (patients === null) return 6.5;
    if (selectedList === 'consultas') {
      return Math.min(20, Math.max(6.5, Math.sqrt(patients) * 0.085));
    }
    if (selectedList === 'pruebas') {
      return Math.min(19, Math.max(6.5, Math.sqrt(patients) * 0.14));
    }
    return Math.min(18, Math.max(6.5, Math.sqrt(patients) * 0.18));
  };

  // Ensure focused hospital defaults cleanly if null or filtered out
  const focusedHospital = useMemo(() => {
    if (focusedId && data.hospitals[focusedId]) return data.hospitals[focusedId];
    return filteredHospitals[0] || allHospitals[0] || null;
  }, [focusedId, data.hospitals, filteredHospitals, allHospitals]);

  // Nearest hospitals & same-complexity peers for focused hospital
  const neighborsInfo = useMemo(() => {
    if (!focusedHospital) return { allNearest: [], sameComplexityNearest: [] };
    const others = allHospitals
      .filter(h => h.id !== focusedHospital.id)
      .map(h => ({
        hospital: h,
        distanceKm: haversineKm(focusedHospital.lat, focusedHospital.lng, h.lat, h.lng),
        obs: getHospitalObs(h)
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm);

    const sameComplexityNearest = others.filter(
      o => o.hospital.complexityGroup === focusedHospital.complexityGroup
    );
    return {
      allNearest: others.slice(0, 6),
      sameComplexityNearest
    };
  }, [focusedHospital, allHospitals, selectedList, selectedYear]);

  // Sync comparison peer when focused hospital changes
  useEffect(() => {
    if (!focusedHospital) return;
    const validPeerExists =
      peerId &&
      peerId !== focusedHospital.id &&
      data.hospitals[peerId] !== undefined &&
      data.hospitals[peerId].complexityGroup === focusedHospital.complexityGroup;

    if (!validPeerExists) {
      const preferred =
        neighborsInfo.sameComplexityNearest.find(n => n.obs.delay !== null) ||
        neighborsInfo.sameComplexityNearest[0] ||
        neighborsInfo.allNearest[0] ||
        null;
      setPeerId(preferred ? preferred.hospital.id : null);
    }
  }, [focusedHospital?.id, selectedList, selectedYear]);

  const peerHospital = peerId && data.hospitals[peerId] ? data.hospitals[peerId] : null;

  // Territorial summary metrics
  const territorialSummary = useMemo(() => {
    const validObs = filteredHospitals
      .map(h => ({ hospital: h, obs: getHospitalObs(h) }))
      .filter(x => x.obs.delay !== null || x.obs.patients !== null);

    const byDelay = validObs
      .filter(x => x.obs.delay !== null)
      .sort((a, b) => (b.obs.delay as number) - (a.obs.delay as number));
    const byPatients = validObs
      .filter(x => x.obs.patients !== null)
      .sort((a, b) => (b.obs.patients as number) - (a.obs.patients as number));

    const maxDelayEntry = byDelay[0] || null;
    const maxVolumeEntry = byPatients[0] || null;

    const pairs: {
      a: HospitalMetadata;
      b: HospitalMetadata;
      distanceKm: number;
      delayA: number;
      delayB: number;
      delayDiff: number;
      patientsA: number | null;
      patientsB: number | null;
    }[] = [];

    for (let i = 0; i < validObs.length; i++) {
      for (let j = i + 1; j < validObs.length; j++) {
        const A = validObs[i];
        const B = validObs[j];
        if (A.hospital.complexityGroup !== B.hospital.complexityGroup) continue;
        if (A.obs.delay === null || B.obs.delay === null) continue;
        const dist = haversineKm(A.hospital.lat, A.hospital.lng, B.hospital.lat, B.hospital.lng);
        pairs.push({
          a: A.hospital,
          b: B.hospital,
          distanceKm: dist,
          delayA: A.obs.delay,
          delayB: B.obs.delay,
          delayDiff: Math.abs(A.obs.delay - B.obs.delay),
          patientsA: A.obs.patients,
          patientsB: B.obs.patients
        });
      }
    }

    pairs.sort((p1, p2) => p1.distanceKm - p2.distanceKm);

    return {
      validCount: validObs.length,
      maxDelayEntry,
      maxVolumeEntry,
      nearestSameComplexityPairs: pairs.slice(0, 8)
    };
  }, [filteredHospitals, selectedList, selectedYear]);

  // Historical comparison line chart series between focusedHospital and peerHospital
  const comparisonChartSeries: LineSeries[] = useMemo(() => {
    if (!focusedHospital || !peerHospital) return [];
    const buildSeries = (h: HospitalMetadata, id: string, color: string): LineSeries => {
      const s = h.series[selectedList];
      return {
        id,
        name: h.shortName,
        color,
        firstPeriod: availableYears[0],
        lastPeriod: availableYears[availableYears.length - 1],
        data: availableYears.map(y => ({
          x: y,
          y:
            indicator === 'demora'
              ? s?.demora[y] ?? null
              : s?.pacientes[y] ?? null
        }))
      };
    };
    return [
      buildSeries(focusedHospital, 'hospA', '#C64B37'),
      buildSeries(peerHospital, 'hospB', '#426C79')
    ];
  }, [focusedHospital, peerHospital, selectedList, availableYears, indicator]);

  // Pan & Zoom Handlers
  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 0.87;
    setZoom(z => Math.min(4.5, Math.max(0.85, Number((z * factor).toFixed(2)))));
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    didDragRef.current = false;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) didDragRef.current = true;
    setPan({
      x: dragStartRef.current.panX + dx / zoom,
      y: dragStartRef.current.panY + dy / zoom
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  const resetMapView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const activeListMeta = LIST_OPTIONS.find(l => l.id === selectedList)!;
  const focusedObs = focusedHospital ? getHospitalObs(focusedHospital) : null;
  const peerObs = peerHospital ? getHospitalObs(peerHospital) : null;
  const focusedToPeerKm =
    focusedHospital && peerHospital
      ? haversineKm(focusedHospital.lat, focusedHospital.lng, peerHospital.lat, peerHospital.lng)
      : null;

  const missingInViewCount = filteredHospitals.filter(h => {
    const o = getHospitalObs(h);
    return indicator === 'demora' ? o.delay === null : o.patients === null;
  }).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#FAF9F5] border border-[#DAD6CC] rounded-sm p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Compass className="w-5 h-5 text-[#426C79]" />
            <h2 className="font-serif text-2xl tracking-tight text-[#202321]">
              RADAR TERRITORIAL
            </h2>
            <CategoryBadge category="CALCULADO" />
          </div>
          <p className="text-xs text-[#77766F] mt-1">
            Desigualdades hospitalarias y oportunidades de cooperación sanitaria.
          </p>
        </div>

        <div className="flex flex-wrap xl:flex-nowrap items-center gap-2 text-[11px] font-mono text-[#4A4D48] shrink-0">
          <span className="bg-[#F3F0E8] border border-[#DAD6CC] px-2.5 py-1 rounded-xs whitespace-nowrap">
            Fuente: <strong className="text-[#202321]">{activeListMeta.dataset}</strong>
          </span>
          <span className="bg-[#F3F0E8] border border-[#DAD6CC] px-2.5 py-1 rounded-xs whitespace-nowrap">
            Corte: <strong className="text-[#202321]">31-dic-{selectedYear}</strong>
          </span>
          <span className="bg-[#F3F0E8] border border-[#DAD6CC] px-2.5 py-1 rounded-xs whitespace-nowrap">
            Centros mostrados: <strong className="text-[#202321]">{formatEsInt(filteredHospitals.length)}</strong>
          </span>
        </div>
      </div>

      {/* Synchronized Filter Bar */}
      <div className="bg-[#FAF9F5] border border-[#DAD6CC] rounded-sm p-4 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap items-center bg-[#ECE8DD] p-1 rounded-xs text-xs font-medium gap-0.5">
          {LIST_OPTIONS.map(opt => (
            <button
              key={opt.id}
              onClick={() => setSelectedList(opt.id)}
              className={`px-2.5 py-1.5 rounded-xs transition-colors cursor-pointer ${
                selectedList === opt.id
                  ? 'bg-[#426C79] text-[#FAF9F5] font-semibold'
                  : 'text-[#4A4D48] hover:text-[#202321]'
              }`}
            >
              {opt.shortLabel}
            </button>
          ))}
        </div>

        <select
          value={selectedYear}
          onChange={e => setSelectedYear(e.target.value)}
          className="bg-[#F3F0E8] border border-[#DAD6CC] text-xs rounded-xs px-2.5 py-1.5 text-[#202321] font-semibold focus:outline-none focus:border-[#426C79]"
        >
          {availableYears.map(y => (
            <option key={y} value={y}>
              Año {y}
            </option>
          ))}
        </select>

        <select
          value={complexityFilter}
          onChange={e => setComplexityFilter(e.target.value as 'ALL' | ComplexityGroup)}
          className="bg-[#F3F0E8] border border-[#DAD6CC] text-xs rounded-xs px-2.5 py-1.5 text-[#202321] focus:outline-none focus:border-[#426C79]"
        >
          {COMPLEXITY_OPTIONS.map(grp => (
            <option key={grp} value={grp}>
              {grp === 'ALL' ? 'Complejidad: Todas' : grp}
            </option>
          ))}
        </select>

        <div className="flex items-center bg-[#ECE8DD] p-1 rounded-xs text-xs font-medium gap-0.5">
          <button
            onClick={() => setIndicator('demora')}
            className={`px-2.5 py-1 rounded-xs cursor-pointer ${
              indicator === 'demora' ? 'bg-[#FAF9F5] text-[#202321] font-semibold' : 'text-[#4A4D48] hover:text-[#202321]'
            }`}
          >
            Demora media
          </button>
          <button
            onClick={() => setIndicator('pacientes')}
            className={`px-2.5 py-1 rounded-xs cursor-pointer ${
              indicator === 'pacientes' ? 'bg-[#FAF9F5] text-[#202321] font-semibold' : 'text-[#4A4D48] hover:text-[#202321]'
            }`}
          >
            Pacientes pendientes
          </button>
        </div>

        <div className="relative ml-auto">
          <Search className="w-3.5 h-3.5 text-[#77766F] absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar hospital o municipio..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="bg-[#F3F0E8] border border-[#DAD6CC] text-xs rounded-xs pl-8 pr-3 py-1.5 text-[#202321] placeholder:text-[#77766F] focus:outline-none focus:border-[#426C79] w-52"
          />
        </div>
      </div>

      {/* Main Layout: Dominant Interactive Map (7 cols) + Hospital Detail Panel (5 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Dominant Map */}
        <div className="xl:col-span-7 bg-[#FAF9F5] border border-[#DAD6CC] rounded-sm p-5 space-y-3 select-none">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#E6E2D8]">
            <div>
              <h3 className="font-serif text-lg text-[#202321] flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#426C79]" />
                <span>Mapa Interactivo de Desigualdad Territorial — {activeListMeta.shortLabel} ({selectedYear})</span>
              </h3>
              <p className="text-[11px] text-[#77766F] mt-0.5">
                Color = {indicator === 'demora' ? 'Demora media (días)' : 'Pacientes pendientes'} • Radio = Volumen de pacientes • Aro exterior = Complejidad SERMAS • Arrastra para mover y haz clic en cualquier nodo.
              </p>
            </div>

            <div className="flex items-center gap-1 bg-[#ECE8DD] p-1 rounded-xs text-xs">
              <button
                onClick={() => setZoom(z => Math.min(4.5, Number((z + 0.35).toFixed(2))))}
                title="Acercar"
                className="p-1.5 rounded-xs bg-[#FAF9F5] text-[#202321] hover:bg-[#F3F0E8] border border-[#DAD6CC] cursor-pointer"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoom(z => Math.max(0.85, Number((z - 0.35).toFixed(2))))}
                title="Alejar"
                className="p-1.5 rounded-xs bg-[#FAF9F5] text-[#202321] hover:bg-[#F3F0E8] border border-[#DAD6CC] cursor-pointer"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={resetMapView}
                title="Restablecer encuadre"
                className="px-2 py-1 rounded-xs bg-[#FAF9F5] text-[#202321] hover:bg-[#F3F0E8] border border-[#DAD6CC] text-[11px] font-mono font-semibold inline-flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{formatEsDec(zoom, 1)}x</span>
              </button>
            </div>
          </div>

          <div className="relative w-full bg-[#EFECE3] rounded-xs border border-[#DAD6CC] overflow-hidden">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className={`w-full h-auto min-h-[420px] max-h-[540px] ${
                isDragging ? 'cursor-grabbing' : 'cursor-grab'
              }`}
            >
              {/* Cartographic subtle coordinate graticule */}
              <g stroke="#DDD8CA" strokeWidth="0.8" opacity="0.65">
                {[120, 260, 400, 540, 680].map(gx => (
                  <line key={`vx-${gx}`} x1={gx} y1={0} x2={gx} y2={height} />
                ))}
                {[100, 220, 340, 460].map(gy => (
                  <line key={`hy-${gy}`} x1={0} y1={gy} x2={width} y2={gy} />
                ))}
              </g>

              <g
                transform={`translate(${width / 2}, ${height / 2}) scale(${zoom}) translate(${
                  -width / 2 + pan.x
                }, ${-height / 2 + pan.y})`}
              >
                {/* Madrid regional contour */}
                <path
                  d="M 310 22 L 455 16 L 590 65 L 685 120 L 755 185 L 775 280 L 708 380 L 625 445 L 515 495 L 435 505 L 350 485 L 235 430 L 145 355 L 105 255 L 130 150 L 200 72 Z"
                  fill="#E3DEC9"
                  fillOpacity="0.68"
                  stroke="#A6A18F"
                  strokeWidth={1.4 / zoom}
                  strokeDasharray="5 3"
                />

                {/* Geographic area labels */}
                <text x="430" y="245" textAnchor="middle" className="text-[12px] font-bold fill-[#A6A18F] tracking-widest uppercase pointer-events-none">
                  Área Centro / Madrid Capital
                </text>
                <text x="440" y="85" textAnchor="middle" className="text-[11px] font-bold fill-[#A6A18F] tracking-wider uppercase pointer-events-none">
                  Sierra Norte
                </text>
                <text x="415" y="415" textAnchor="middle" className="text-[11px] font-bold fill-[#A6A18F] tracking-wider uppercase pointer-events-none">
                  Área Sur Metropolitana
                </text>
                <text x="665" y="255" textAnchor="middle" className="text-[11px] font-bold fill-[#A6A18F] tracking-wider uppercase pointer-events-none">
                  Corredor del Henares
                </text>
                <text x="205" y="255" textAnchor="middle" className="text-[11px] font-bold fill-[#A6A18F] tracking-wider uppercase pointer-events-none">
                  Área Noroeste
                </text>

                {/* Highlight geodesic links to nearby same-complexity hospitals */}
                {focusedHospital &&
                  neighborsInfo.sameComplexityNearest.slice(0, 3).map(neighbor => {
                    const pA = project(focusedHospital.lat, focusedHospital.lng);
                    const pB = project(neighbor.hospital.lat, neighbor.hospital.lng);
                    const isActivePeer = peerHospital?.id === neighbor.hospital.id;
                    const midX = (pA.x + pB.x) / 2;
                    const midY = (pA.y + pB.y) / 2;
                    return (
                      <g key={neighbor.hospital.id} className="pointer-events-none">
                        <line
                          x1={pA.x}
                          y1={pA.y}
                          x2={pB.x}
                          y2={pB.y}
                          stroke={isActivePeer ? '#426C79' : '#77766F'}
                          strokeWidth={(isActivePeer ? 2.4 : 1.3) / zoom}
                          strokeDasharray="4 3"
                          strokeOpacity={isActivePeer ? 0.92 : 0.45}
                        />
                        {isActivePeer && (
                          <g transform={`translate(${midX}, ${midY}) scale(${1 / Math.max(0.9, Math.sqrt(zoom))})`}>
                            <rect x="-28" y="-9" width="56" height="16" rx="2" fill="#202321" />
                            <text x="0" y="2" textAnchor="middle" className="text-[9px] font-mono font-bold fill-[#FAF9F5]">
                              {formatEsDec(neighbor.distanceKm, 1)} km
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}

                {/* Hospital nodes */}
                {filteredHospitals.map(h => {
                  const { x, y } = project(h.lat, h.lng);
                  const obs = getHospitalObs(h);
                  const valueAvailable =
                    indicator === 'demora' ? obs.delay !== null : obs.patients !== null;
                  const fillColor = getMarkerColor(obs);
                  const ringColor = COMPLEXITY_RING_COLOR[h.complexityGroup] || '#4A4D48';
                  const baseR = getMarkerRadius(obs.patients);
                  const r = baseR / Math.pow(zoom, 0.35);
                  const isFocused = focusedHospital?.id === h.id;
                  const isPeer = peerHospital?.id === h.id;
                  const isHovered = hoveredHosp?.id === h.id;

                  return (
                    <g
                      key={h.id}
                      className="cursor-pointer"
                      onClick={e => {
                        e.stopPropagation();
                        if (didDragRef.current) return;
                        setFocusedId(h.id);
                      }}
                      onMouseEnter={() => setHoveredHosp(h)}
                      onMouseLeave={() => setHoveredHosp(null)}
                    >
                      {isFocused && (
                        <circle
                          cx={x}
                          cy={y}
                          r={r + 6 / Math.pow(zoom, 0.35)}
                          fill="none"
                          stroke="#C64B37"
                          strokeWidth={2.5 / zoom}
                          strokeDasharray="3 2"
                        />
                      )}
                      {isPeer && (
                        <circle
                          cx={x}
                          cy={y}
                          r={r + 5 / Math.pow(zoom, 0.35)}
                          fill="none"
                          stroke="#426C79"
                          strokeWidth={2.2 / zoom}
                        />
                      )}

                      <circle
                        cx={x}
                        cy={y}
                        r={r}
                        fill={fillColor}
                        fillOpacity={valueAvailable ? (isFocused || isHovered ? 0.96 : 0.85) : 0.45}
                        stroke={valueAvailable ? ringColor : '#77766F'}
                        strokeWidth={(valueAvailable ? 2.1 : 1.5) / zoom}
                        strokeDasharray={valueAvailable ? undefined : '2 2'}
                      />

                      {(isFocused || isPeer || isHovered || zoom >= 1.35 || !valueAvailable || baseR >= 12) && (
                        <text
                          x={x}
                          y={y - r - 3 / Math.pow(zoom, 0.35)}
                          textAnchor="middle"
                          style={{ fontSize: `${9.5 / Math.pow(zoom, 0.45)}px` }}
                          className={`font-bold pointer-events-none ${
                            !valueAvailable
                              ? 'fill-[#77766F] italic'
                              : isFocused
                              ? 'fill-[#9A3323]'
                              : isPeer
                              ? 'fill-[#2D4F5A]'
                              : 'fill-[#202321]'
                          }`}
                        >
                          {h.shortName}
                          {!valueAvailable ? ' (N/D)' : ''}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            </svg>

            {/* Hover Tooltip */}
            {hoveredHosp && (() => {
              const o = getHospitalObs(hoveredHosp);
              return (
                <div className="absolute top-3 right-3 bg-[#202321] text-[#FAF9F5] rounded-xs shadow-lg p-3 text-xs border border-[#3B3F3C] pointer-events-none z-20 max-w-[290px]">
                  <div className="font-bold text-[#FAF9F5]">{hoveredHosp.fullName}</div>
                  <div className="text-[10px] text-[#D7D2C5] mt-0.5">
                    {hoveredHosp.complexityGroup} • {hoveredHosp.managementModel}
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2 font-mono text-[11px]">
                    <div className="bg-[#2C302D] p-1.5 rounded-xs">
                      <span className="text-[9px] text-[#A6A18F] font-sans block">Demora ({selectedYear}):</span>
                      <strong className="text-[#E7BE73]">
                        {o.delay !== null ? `${formatEsDec(o.delay, 1)} d` : 'Sin registro'}
                      </strong>
                    </div>
                    <div className="bg-[#2C302D] p-1.5 rounded-xs">
                      <span className="text-[9px] text-[#A6A18F] font-sans block">Pacientes ({selectedYear}):</span>
                      <strong className="text-[#8FC6AA]">
                        {o.patients !== null ? formatEsInt(o.patients) : 'Sin registro'}
                      </strong>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Map Legend */}
          <div className="pt-2.5 border-t border-[#E6E2D8] space-y-2 text-[11px] text-[#4A4D48]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-semibold text-[#202321]">
                  {indicator === 'demora' ? 'Demora media:' : 'Pacientes (relativo al máx.):'}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
                  {indicator === 'demora' ? '< 45 d' : '< 25% máx.'}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7]" />
                  {indicator === 'demora' ? '45–65 d' : '25–50% máx.'}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
                  {indicator === 'demora' ? '65–80 d' : '50–75% máx.'}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#e11d48]" />
                  {indicator === 'demora' ? '> 80 d' : '> 75% máx.'}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#A6A18F] border border-dashed border-[#4A4D48]" />
                  N/D ({formatEsInt(missingInViewCount)})
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[10px] text-[#77766F]">
              <span className="font-semibold text-[#202321]">Aro de complejidad:</span>
              {(Object.entries(COMPLEXITY_RING_COLOR) as [ComplexityGroup, string][]).map(([grp, col]) => (
                <span key={grp} className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full border-2 bg-[#FAF9F5]" style={{ borderColor: col }} />
                  {grp}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side Panel: Selected Hospital Card & Side-by-Side Comparison */}
        <div className="xl:col-span-5 space-y-4">
          {focusedHospital && focusedObs && (
            <div className="bg-[#FAF9F5] border border-[#DAD6CC] rounded-sm p-5 space-y-4">
              <div className="flex items-start justify-between gap-2 pb-3 border-b border-[#E6E2D8]">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#C64B37] block">
                    Centro Seleccionado en el Mapa
                  </span>
                  <h3 className="font-serif text-lg text-[#202321] mt-0.5">{focusedHospital.fullName}</h3>
                  <p className="text-[11px] text-[#77766F]">
                    {focusedHospital.complexityGroup} • {focusedHospital.managementModel} • Área {focusedHospital.area} ({focusedHospital.municipality})
                  </p>
                </div>
                <button
                  onClick={() => onSelectHospital(focusedHospital)}
                  className="text-xs font-semibold text-[#426C79] hover:text-[#C64B37] inline-flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <span>Expediente</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>

              {/* Official values vs Calculated YoY */}
              <div className="grid grid-cols-2 border border-[#DAD6CC] divide-x divide-[#DAD6CC] bg-[#F3F0E8]">
                <div className="p-3 space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <span className="text-[10px] text-[#77766F] font-mono font-semibold">Demora ({selectedYear})</span>
                    <CategoryBadge category="OFICIAL" />
                  </div>
                  <div className="text-xl font-bold font-mono text-[#202321]">
                    {focusedObs.delay !== null ? `${formatEsDec(focusedObs.delay, 1)} d` : 'N/D'}
                  </div>
                  <div className="text-[10px] text-[#77766F] flex items-center justify-between">
                    <span>Var. vs {focusedObs.prevYear || 'prev.'}:</span>
                    <strong className="font-mono text-[#202321]">
                      {focusedObs.yoyDelayDiff !== null
                        ? `${formatEsDec(focusedObs.yoyDelayDiff, 1, { signed: true })} d`
                        : 'N/D'}
                    </strong>
                  </div>
                </div>

                <div className="p-3 space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <span className="text-[10px] text-[#77766F] font-mono font-semibold">Pacientes ({selectedYear})</span>
                    <CategoryBadge category="OFICIAL" />
                  </div>
                  <div className="text-xl font-bold font-mono text-[#202321]">
                    {focusedObs.patients !== null ? formatEsInt(focusedObs.patients) : 'N/D'}
                  </div>
                  <div className="text-[10px] text-[#77766F] flex items-center justify-between">
                    <span>Var. interanual:</span>
                    <strong className="font-mono text-[#202321]">
                      {focusedObs.yoyPatientsPct !== null
                        ? `${formatEsDec(focusedObs.yoyPatientsPct, 1, { signed: true })}%`
                        : 'N/D'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Nearby Same-Complexity Hospitals */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono font-bold text-[#202321] uppercase">
                    Centros cercanos de igual complejidad ({focusedHospital.complexityGroup})
                  </span>
                  <CategoryBadge category="CALCULADO" />
                </div>
                {neighborsInfo.sameComplexityNearest.length > 0 ? (
                  <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                    {neighborsInfo.sameComplexityNearest.slice(0, 5).map(n => {
                      const isSelectedPeer = peerHospital?.id === n.hospital.id;
                      return (
                        <button
                          key={n.hospital.id}
                          onClick={() => setPeerId(n.hospital.id)}
                          className={`w-full text-left px-2.5 py-1.5 rounded-xs border text-[11px] flex items-center justify-between cursor-pointer transition-colors ${
                            isSelectedPeer
                              ? 'bg-[#EDF3F5] border-[#426C79] text-[#202321] font-semibold'
                              : 'bg-[#F3F0E8] border-[#DAD6CC] text-[#4A4D48] hover:border-[#A6A18F]'
                          }`}
                        >
                          <span className="truncate pr-2">
                            {n.hospital.shortName}{' '}
                            <span className="text-[10px] text-[#77766F] font-mono">
                              ({formatEsDec(n.distanceKm, 1)} km)
                            </span>
                          </span>
                          <span className="font-mono shrink-0 text-[#202321]">
                            {n.obs.delay !== null ? `${formatEsDec(n.obs.delay, 1)} d` : 'N/D'} •{' '}
                            {n.obs.patients !== null ? formatEsInt(n.obs.patients) : 'N/D'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[11px] text-[#77766F] italic">
                    Centro único en la red dentro de {focusedHospital.complexityGroup}; selecciona cualquier hospital cercano abajo para comparar.
                  </p>
                )}
              </div>

              {/* Nearest overall hospitals */}
              <div className="space-y-1.5 pt-2 border-t border-[#E6E2D8]">
                <span className="text-[10px] font-mono font-bold text-[#77766F] uppercase block">
                  Hospitales más cercanos geográficamente (cualquier complejidad)
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {neighborsInfo.allNearest.slice(0, 4).map(n => (
                    <button
                      key={n.hospital.id}
                      onClick={() => setPeerId(n.hospital.id)}
                      className="px-2 py-1 rounded-xs bg-[#F3F0E8] hover:bg-[#ECE8DD] border border-[#DAD6CC] text-[10px] text-[#202321] font-medium cursor-pointer"
                    >
                      {n.hospital.shortName} ({formatEsDec(n.distanceKm, 1)} km)
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Direct Side-by-Side Comparison Card */}
          {focusedHospital && peerHospital && focusedObs && peerObs && (
            <div className="bg-[#FAF9F5] border border-[#426C79]/50 rounded-sm p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#E6E2D8]">
                <h4 className="font-serif text-base text-[#202321] flex items-center gap-1.5">
                  <ArrowLeftRight className="w-4 h-4 text-[#426C79]" />
                  <span>Comparación Directa entre Centros ({selectedYear})</span>
                </h4>
                <select
                  value={peerHospital.id}
                  onChange={e => setPeerId(e.target.value)}
                  className="bg-[#F3F0E8] border border-[#DAD6CC] rounded-xs px-2 py-1 text-[11px] text-[#202321] max-w-[200px]"
                >
                  {allHospitals
                    .filter(h => h.id !== focusedHospital.id)
                    .map(h => (
                      <option key={h.id} value={h.id}>
                        vs {h.shortName} ({h.complexityGroup})
                      </option>
                    ))}
                </select>
              </div>

              {/* Side-by-Side Numeric Table */}
              <div className="overflow-x-auto border border-[#DAD6CC]">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="bg-[#ECE8DD] border-b border-[#DAD6CC] text-[#202321] font-mono text-[10px] uppercase">
                      <th className="py-1.5 px-2">Magnitud</th>
                      <th className="py-1.5 px-2 text-right text-[#C64B37]">{focusedHospital.shortName}</th>
                      <th className="py-1.5 px-2 text-right text-[#426C79]">{peerHospital.shortName}</th>
                      <th className="py-1.5 px-2 text-right">Brecha (A − B)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6E2D8] font-mono">
                    <tr>
                      <td className="py-1.5 px-2 font-sans text-[#77766F]">Complejidad</td>
                      <td className="py-1.5 px-2 text-right font-sans text-[#202321]">{focusedHospital.complexityGroup}</td>
                      <td className="py-1.5 px-2 text-right font-sans text-[#202321]">{peerHospital.complexityGroup}</td>
                      <td className="py-1.5 px-2 text-right font-sans text-[#77766F]">
                        {focusedHospital.complexityGroup === peerHospital.complexityGroup ? 'Igual' : 'Distinta'}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-2 font-sans text-[#77766F]">Distancia lineal</td>
                      <td colSpan={3} className="py-1.5 px-2 text-right font-bold text-[#202321]">
                        {focusedToPeerKm !== null ? `${formatEsDec(focusedToPeerKm, 1)} km` : 'N/D'}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-2 font-sans text-[#77766F]">Demora media</td>
                      <td className="py-1.5 px-2 text-right font-bold text-[#202321]">
                        {focusedObs.delay !== null ? `${formatEsDec(focusedObs.delay, 1)} d` : 'N/D'}
                      </td>
                      <td className="py-1.5 px-2 text-right font-bold text-[#202321]">
                        {peerObs.delay !== null ? `${formatEsDec(peerObs.delay, 1)} d` : 'N/D'}
                      </td>
                      <td className="py-1.5 px-2 text-right font-bold text-[#202321]">
                        {focusedObs.delay !== null && peerObs.delay !== null
                          ? `${formatEsDec(focusedObs.delay - peerObs.delay, 1, { signed: true })} d`
                          : 'N/D'}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-2 font-sans text-[#77766F]">Pacientes pendientes</td>
                      <td className="py-1.5 px-2 text-right font-bold text-[#202321]">
                        {focusedObs.patients !== null ? formatEsInt(focusedObs.patients) : 'N/D'}
                      </td>
                      <td className="py-1.5 px-2 text-right font-bold text-[#202321]">
                        {peerObs.patients !== null ? formatEsInt(peerObs.patients) : 'N/D'}
                      </td>
                      <td className="py-1.5 px-2 text-right font-bold text-[#202321]">
                        {focusedObs.patients !== null && peerObs.patients !== null
                          ? formatEsInt(focusedObs.patients - peerObs.patients, { signed: true })
                          : 'N/D'}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-2 font-sans text-[#77766F]">Var. demora YoY</td>
                      <td className="py-1.5 px-2 text-right text-[#4A4D48]">
                        {focusedObs.yoyDelayDiff !== null
                          ? `${formatEsDec(focusedObs.yoyDelayDiff, 1, { signed: true })} d`
                          : 'N/D'}
                      </td>
                      <td className="py-1.5 px-2 text-right text-[#4A4D48]">
                        {peerObs.yoyDelayDiff !== null
                          ? `${formatEsDec(peerObs.yoyDelayDiff, 1, { signed: true })} d`
                          : 'N/D'}
                      </td>
                      <td className="py-1.5 px-2 text-right text-[#A6A18F]">—</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Historical Comparison Chart */}
              <div>
                <span className="text-[10px] font-mono font-bold text-[#77766F] uppercase block mb-1.5">
                  Evolución Histórica Comparada ({availableYears[0]}–{availableYears[availableYears.length - 1]})
                </span>
                <InteractiveLineChart
                  series={comparisonChartSeries}
                  unit={indicator === 'demora' ? 'días' : 'pac.'}
                  height={210}
                />
              </div>

              {/* Honest Verification Caveat */}
              <div className="p-3 bg-[#FBF3E8] border border-[#B4691E]/35 rounded-xs text-[11px] text-[#7D4710] space-y-1.5">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5 text-[#B4691E] shrink-0" />
                  <span>Verificaciones reales requeridas antes de plantear cooperación o derivación</span>
                </div>
                <p className="leading-relaxed">
                  Una menor demora publicada <strong>no implica capacidad libre ociosa</strong> ni autoriza derivaciones automáticas. Para valorar cualquier cooperación real entre centros deben contrastarse:
                </p>
                <ul className="list-disc pl-4 space-y-0.5 text-[10px]">
                  <li>Desglose por especialidad y procedimiento (los CSV hospitalarios solo publican totales globales).</li>
                  <li>Disponibilidad efectiva de quirófanos, agendas de consulta, equipamiento diagnóstico y plantilla.</li>
                  <li>Cartera de servicios acreditada, complejidad clínica (case-mix) y preferencia del paciente.</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Concise Territorial Summary Below Map */}
      <div className="bg-[#FAF9F5] border border-[#DAD6CC] rounded-sm p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-3 border-b border-[#DAD6CC]">
          <div>
            <h3 className="font-serif text-xl text-[#202321]">
              Resumen Territorial — {activeListMeta.shortLabel} ({selectedYear})
            </h3>
            <p className="text-xs text-[#77766F] mt-0.5">
              Extremos observados en la selección actual y parejas cercanas de igual complejidad ordenadas por distancia lineal.
            </p>
          </div>
          <CategoryBadge category="CALCULADO" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-[#FBECE9]/65 border border-[#C64B37]/30 rounded-xs space-y-1">
            <span className="text-[10px] font-mono font-bold uppercase text-[#9A3323] block">
              Centro con mayor demora media ({selectedYear})
            </span>
            {territorialSummary.maxDelayEntry ? (
              <>
                <div className="flex items-baseline justify-between gap-2">
                  <button
                    onClick={() => setFocusedId(territorialSummary.maxDelayEntry!.hospital.id)}
                    className="text-sm font-bold text-[#202321] hover:text-[#C64B37] text-left cursor-pointer"
                  >
                    {territorialSummary.maxDelayEntry.hospital.fullName}
                  </button>
                  <span className="text-lg font-bold font-mono text-[#C64B37] shrink-0">
                    {formatEsDec(territorialSummary.maxDelayEntry.obs.delay, 1)} d
                  </span>
                </div>
                <div className="text-[11px] text-[#4A4D48]">
                  {territorialSummary.maxDelayEntry.hospital.complexityGroup} •{' '}
                  {formatEsInt(territorialSummary.maxDelayEntry.obs.patients)} pacientes pendientes
                </div>
              </>
            ) : (
              <span className="text-xs text-[#77766F]">Sin registros válidos con los filtros actuales.</span>
            )}
          </div>

          <div className="p-4 bg-[#EDF3F5]/80 border border-[#426C79]/35 rounded-xs space-y-1">
            <span className="text-[10px] font-mono font-bold uppercase text-[#2D4F5A] block">
              Centro con mayor volumen de pacientes ({selectedYear})
            </span>
            {territorialSummary.maxVolumeEntry ? (
              <>
                <div className="flex items-baseline justify-between gap-2">
                  <button
                    onClick={() => setFocusedId(territorialSummary.maxVolumeEntry!.hospital.id)}
                    className="text-sm font-bold text-[#202321] hover:text-[#426C79] text-left cursor-pointer"
                  >
                    {territorialSummary.maxVolumeEntry.hospital.fullName}
                  </button>
                  <span className="text-lg font-bold font-mono text-[#426C79] shrink-0">
                    {formatEsInt(territorialSummary.maxVolumeEntry.obs.patients)} pac.
                  </span>
                </div>
                <div className="text-[11px] text-[#4A4D48]">
                  {territorialSummary.maxVolumeEntry.hospital.complexityGroup} • Demora media:{' '}
                  {territorialSummary.maxVolumeEntry.obs.delay !== null
                    ? `${formatEsDec(territorialSummary.maxVolumeEntry.obs.delay, 1)} d`
                    : 'N/D'}
                </div>
              </>
            ) : (
              <span className="text-xs text-[#77766F]">Sin registros válidos con los filtros actuales.</span>
            )}
          </div>
        </div>

        {/* Nearby Same-Complexity Pairs Ordered by Distance */}
        <div>
          <h4 className="text-[11px] font-mono font-bold text-[#202321] uppercase tracking-wider mb-2">
            Parejas cercanas de igual complejidad ordenadas por distancia (haz clic para comparar)
          </h4>
          {territorialSummary.nearestSameComplexityPairs.length > 0 ? (
            <div className="overflow-x-auto border border-[#DAD6CC]">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#ECE8DD] border-b border-[#DAD6CC] text-[#202321] font-mono text-[10px] uppercase tracking-wider">
                    <th className="py-2 px-3">Distancia</th>
                    <th className="py-2 px-3">Complejidad</th>
                    <th className="py-2 px-3">Hospital A</th>
                    <th className="py-2 px-3">Hospital B</th>
                    <th className="py-2 px-3 text-right">Diferencia demora</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E2D8] font-mono">
                  {territorialSummary.nearestSameComplexityPairs.map((pair, idx) => (
                    <tr
                      key={`${pair.a.id}-${pair.b.id}-${idx}`}
                      onClick={() => {
                        setFocusedId(pair.a.id);
                        setPeerId(pair.b.id);
                      }}
                      className="hover:bg-[#EDF3F5]/65 cursor-pointer transition-colors"
                    >
                      <td className="py-2 px-3 font-bold text-[#426C79]">
                        {formatEsDec(pair.distanceKm, 1)} km
                      </td>
                      <td className="py-2 px-3 font-sans text-[#4A4D48]">
                        {pair.a.complexityGroup}
                      </td>
                      <td className="py-2 px-3 font-sans text-[#202321]">
                        <strong>{pair.a.shortName}</strong>{' '}
                        <span className="font-mono text-[11px] text-[#77766F]">
                          ({formatEsDec(pair.delayA, 1)} d)
                        </span>
                      </td>
                      <td className="py-2 px-3 font-sans text-[#202321]">
                        <strong>{pair.b.shortName}</strong>{' '}
                        <span className="font-mono text-[11px] text-[#77766F]">
                          ({formatEsDec(pair.delayB, 1)} d)
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-[#202321]">
                        {formatEsDec(pair.delayDiff, 1)} d
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-3 bg-[#F3F0E8] border border-[#DAD6CC] rounded-xs text-xs text-[#4A4D48] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#77766F]" />
              <span>No hay al menos dos hospitales válidos de la misma complejidad bajo los filtros actuales.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
