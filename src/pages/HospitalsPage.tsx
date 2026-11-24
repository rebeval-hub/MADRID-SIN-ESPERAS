import React, { useState, useMemo } from 'react';
import {
  Building2,
  Search,
  ArrowUpDown,
  ExternalLink,
  Scale,
  Layers,
  Sigma,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { formatEsInt, formatEsDec } from '../utils/format';
import {
  FullHealthData,
  WaitListType,
  HospitalViewCategory,
  HospitalMetadata,
  ComplexityGroup,
  ManagementModel
} from '../types';
import { CategoryBadge } from '../components/common/Badge';
import { ScatterPlot, ScatterPoint } from '../components/charts/ScatterPlot';
import { MadridHealthMap } from '../components/charts/MadridHealthMap';
import {
  computeHospitalDispersion,
  exactMean,
  exactMedian,
  sampleStdDev,
  kruskalWallisTest
} from '../utils/statistics';

interface HospitalsPageProps {
  data: FullHealthData;
  onSelectHospital: (hospital: HospitalMetadata) => void;
  selectedHospitalId?: string | null;
}

interface GroupDescriptor {
  group: ComplexityGroup;
  title: string;
  subtitle: string;
  description: string;
  management: string;
  criteria: string;
}

const COMPLEXITY_DESCRIPTORS: GroupDescriptor[] = [
  {
    group: 'Grupo 3',
    title: 'Grupo 3 — Alta complejidad',
    subtitle: 'Nivel terciario y de referencia',
    description:
      'Hospitales de máxima especialización, con amplia cartera médica y quirúrgica, UCI, neurocirugía, cirugía cardíaca, oncología avanzada y trasplantes. Centros de referencia regional y nacional (CSUR), reciben derivaciones de otros hospitales.',
    management: 'Pública directa, infraestructura PFI y concierto singular.',
    criteria:
      'Tecnología, cartera terciaria, acreditación docente, volumen asistencial y complejidad de los pacientes (GRD).'
  },
  {
    group: 'Grupo 2',
    title: 'Grupo 2 — Complejidad media',
    subtitle: 'Nivel secundario y hospital de área',
    description:
      'Hospitales generales. Atienden la mayor parte de la demanda especializada y quirúrgica de su zona. Disponen de especialidades troncales, UCI, urgencias y diagnóstico avanzado. Derivan procedimientos más especializados al Grupo 3.',
    management: 'Pública directa, infraestructura PFI, concesión privada y convenio Defensa.',
    criteria: 'Cartera de segundo nivel, volumen de ingresos y complejidad de los procesos atendidos.'
  },
  {
    group: 'Grupo 1',
    title: 'Grupo 1 — Baja-media complejidad',
    subtitle: 'Nivel comarcal y de proximidad',
    description:
      'Orientados a procesos frecuentes, cirugía de baja-media complejidad y atención ambulatoria. Descentralizan la asistencia y reducen desplazamientos a grandes hospitales.',
    management: 'Pública directa, infraestructura PFI y concesión privada.',
    criteria: 'Población asignada, cartera básica y ausencia de unidades terciarias.'
  },
  {
    group: 'Apoyo / Especialidades',
    title: 'Apoyo / Especialidades',
    subtitle: 'Complejidad específica',
    description:
      'Centros especializados en cirugía programada, oftalmología, traumatología, obstetricia y hospitalización de apoyo. Contribuyen a descargar las listas de espera de los grandes hospitales.',
    management: 'Pública directa.',
    criteria: 'Función de apoyo o especialización sin cartera terciaria general.'
  },
  {
    group: 'Media y Larga Estancia',
    title: 'Media y larga estancia',
    subtitle: 'Atención a subagudos y recuperación',
    description:
      'Centro dedicado a rehabilitación, geriatría, cuidados paliativos y recuperación funcional. No dispone de lista quirúrgica LEQ ni de pruebas LEPD.',
    management: 'Pública directa.',
    criteria: 'Tipología funcional de media y larga estancia.'
  },
  {
    group: 'Salud Mental Monográfico',
    title: 'Salud Mental Monográfico',
    subtitle: 'Atención especializada en salud mental',
    description:
      'Centro dedicado a psiquiatría, hospitalización y rehabilitación psicosocial. No dispone de cartera médico-quirúrgica ni de listas LEQ y LEPD.',
    management: 'Pública directa.',
    criteria: 'Clasificación funcional como centro monográfico de salud mental.'
  }
];

const ALL_COMPLEXITY_GROUPS: ComplexityGroup[] = [
  'Grupo 3',
  'Grupo 2',
  'Grupo 1',
  'Apoyo / Especialidades',
  'Media y Larga Estancia',
  'Salud Mental Monográfico'
];

const ALL_MANAGEMENT_MODELS: ManagementModel[] = [
  'Gestión pública directa',
  'Gestión pública directa (infraestructura PFI)',
  'Concesión privada',
  'Concierto singular',
  'Convenio Defensa'
];

export const HospitalsPage: React.FC<HospitalsPageProps> = ({
  data,
  onSelectHospital,
  selectedHospitalId
}) => {
  const [activeCategory, setActiveCategory] = useState<HospitalViewCategory>('general');
  const [viewMode, setViewMode] = useState<'scatter' | 'map' | 'both'>('both');
  const [complexityFilter, setComplexityFilter] = useState<string>('ALL');
  const [managementFilter, setManagementFilter] = useState<string>('ALL');
  const [ownershipFilter, setOwnershipFilter] = useState<string>('ALL');
  const [areaFilter, setAreaFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<'name' | 'patients' | 'delay' | 'diff' | 'beds'>('delay');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showKruskalExtended, setShowKruskalExtended] = useState<boolean>(false);
  const [showComplexityDetails, setShowComplexityDetails] = useState<boolean>(false);

  const { hospitals, regional } = data;

  const selectedYear = activeCategory === 'quirurgica' ? '2025' : '2024';

  const regionalOfficialDelay = useMemo(() => {
    if (activeCategory === 'general') return null;
    const regSeries = regional[activeCategory].series;
    const latestRegional =
      regSeries.find(s => s.year === selectedYear) || regSeries[regSeries.length - 1];
    return latestRegional?.demoraMedia ?? null;
  }, [activeCategory, regional, selectedYear]);

  // 1. Unified filtering driving ALL KPIs, Scatter, Map, and Table
  const filteredHospitals = useMemo(() => {
    return Object.values(hospitals).filter(h => {
      if (complexityFilter !== 'ALL' && h.complexityGroup !== complexityFilter) return false;
      if (managementFilter !== 'ALL' && h.managementModel !== managementFilter) return false;
      if (ownershipFilter !== 'ALL' && h.ownership !== ownershipFilter) return false;
      if (areaFilter !== 'ALL' && h.area !== areaFilter) return false;
      if (
        searchTerm &&
        !h.fullName.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !h.shortName.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !h.municipality.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [hospitals, complexityFilter, managementFilter, ownershipFilter, areaFilter, searchTerm]);

  const filteredIds = useMemo(() => new Set(filteredHospitals.map(h => h.id)), [filteredHospitals]);

  // Helper to extract unified metric row for either 'general' (cutoff 31-dic-2024) or specific queue
  const extractHospitalObservation = (h: HospitalMetadata, category: HospitalViewCategory, year: string) => {
    if (category === 'general') {
      const qP = h.series.quirurgica?.pacientes['2024'] ?? null;
      const cP = h.series.consultas?.pacientes['2024'] ?? null;
      const pP = h.series.pruebas?.pacientes['2024'] ?? null;

      const qD = h.series.quirurgica?.demora['2024'] ?? null;
      const cD = h.series.consultas?.demora['2024'] ?? null;
      const pD = h.series.pruebas?.demora['2024'] ?? null;

      const validP = [qP, cP, pP].filter((v): v is number => v !== null && v !== undefined && !isNaN(v));
      const patients = validP.length > 0 ? validP.reduce((a, b) => a + b, 0) : null;

      const queues: { name: string; delay: number }[] = [];
      if (qD !== null && !isNaN(qD)) queues.push({ name: 'Quirúrgica', delay: qD });
      if (cD !== null && !isNaN(cD)) queues.push({ name: 'Consultas', delay: cD });
      if (pD !== null && !isNaN(pD)) queues.push({ name: 'Pruebas', delay: pD });

      let delay: number | null = null;
      let bottleneckQueue: string | undefined;
      if (queues.length > 0) {
        const worst = queues.reduce((a, b) => (b.delay > a.delay ? b : a));
        delay = worst.delay;
        bottleneckQueue = worst.name;
      }

      return {
        patients,
        delay,
        bottleneckQueue,
        activeQueuesCount: queues.length
      };
    }

    const patients = h.series[category]?.pacientes[year] ?? null;
    const delay = h.series[category]?.demora[year] ?? null;
    return {
      patients: patients !== null && !isNaN(patients) ? patients : null,
      delay: delay !== null && !isNaN(delay) ? delay : null,
      bottleneckQueue: undefined,
      activeQueuesCount: undefined
    };
  };

  // 2. Valid observations only (no null-to-zero coercion!)
  const scatterPoints: ScatterPoint[] = useMemo(() => {
    const list: ScatterPoint[] = [];
    filteredHospitals.forEach(h => {
      const obs = extractHospitalObservation(h, activeCategory, selectedYear);
      if (obs.patients !== null && obs.delay !== null) {
        list.push({
          id: h.id,
          name: h.fullName,
          shortName: h.shortName,
          tier: h.complexityLabel,
          complexityGroup: h.complexityGroup,
          managementModel: h.managementModel,
          area: h.area,
          patients: obs.patients,
          delay: obs.delay,
          beds: h.beds,
          quirofanos: h.quirofanos,
          hospital: h,
          bottleneckQueue: obs.bottleneckQueue,
          activeQueuesCount: obs.activeQueuesCount
        });
      }
    });
    return list;
  }, [filteredHospitals, activeCategory, selectedYear]);

  // Centers excluded due to N/A or missing in this activeCategory/year
  const excludedHospitals = useMemo(() => {
    return filteredHospitals.filter(h => {
      const obs = extractHospitalObservation(h, activeCategory, selectedYear);
      return obs.delay === null || obs.patients === null;
    });
  }, [filteredHospitals, activeCategory, selectedYear]);

  // 3. Exact unrounded Dispersion Metrics
  const dispersion = useMemo(
    () =>
      computeHospitalDispersion(
        scatterPoints.map(p => ({ name: p.shortName, delay: p.delay, patients: p.patients }))
      ),
    [scatterPoints]
  );

  const isRegionalComparable = activeCategory === 'consultas' || activeCategory === 'pruebas';

  const regionalComparisonNote = useMemo(() => {
    if (activeCategory === 'general') {
      return 'Se usa el corte común de 31/12/2024 para comparar los 31 centros. La carga suma los pacientes pendientes de las tres listas y la demora representa el máximo entre ellas, sin promediar esperas de distinta naturaleza.';
    }
    if (activeCategory === 'quirurgica') {
      return `La referencia regional (${formatEsDec(regionalOfficialDelay, 2)} días) incluye solo pacientes en espera estructural (80.883), mientras que los datos LEQ_Hosp incluyen también TNP y rechazos (103.967). Por ello, las medias (${dispersion.mean !== null ? formatEsDec(dispersion.mean, 1) : 'N/D'} y ${dispersion.weightedMean !== null ? formatEsDec(dispersion.weightedMean, 1) : 'N/D'} días) no son directamente comparables con la referencia regional.`;
    }
    if (activeCategory === 'consultas') {
      return `La referencia regional (${formatEsDec(regionalOfficialDelay, 2)} días) y los datos corresponden a la espera estructural de primera consulta (LECE) y al mismo periodo (31/12/2024). La media simple (${formatEsDec(dispersion.mean, 1)} d) da el mismo peso a cada hospital, mientras que la ponderada (${formatEsDec(dispersion.weightedMean, 2)} d) tiene en cuenta el volumen de pacientes y se aproxima a la referencia oficial.`;
    }
    return `La referencia regional (${formatEsDec(regionalOfficialDelay, 2)} d) y los datos hospitalarios corresponden a la espera estructural para pruebas diagnósticas (LEPD) y al mismo periodo (31/12/2024). La media ponderada hospitalaria (${formatEsDec(dispersion.weightedMean, 2)} d) prácticamente coincide con la oficial.`;
  }, [activeCategory, regionalOfficialDelay, dispersion.mean, dispersion.weightedMean]);

  // 4. Stratified analysis by Complexity Group and Management Model
  const stratBaseHospitals = useMemo(() => {
    return Object.values(hospitals)
      .filter(h => {
        if (areaFilter !== 'ALL' && h.area !== areaFilter) return false;
        const obs = extractHospitalObservation(h, activeCategory, selectedYear);
        return obs.delay !== null && obs.patients !== null;
      })
      .map(h => {
        const obs = extractHospitalObservation(h, activeCategory, selectedYear);
        return {
          h,
          delay: obs.delay as number,
          patients: obs.patients as number
        };
      });
  }, [hospitals, areaFilter, activeCategory, selectedYear]);

  const byComplexity = useMemo(() => {
    return ALL_COMPLEXITY_GROUPS.map(grp => {
      const rows = stratBaseHospitals.filter(r => r.h.complexityGroup === grp);
      if (rows.length === 0) return null;
      const delays = rows.map(r => r.delay);
      const m = exactMean(delays)!;
      return {
        label: grp,
        n: rows.length,
        mean: m,
        median: exactMedian(delays)!,
        sd: sampleStdDev(delays, m),
        min: Math.min(...delays),
        max: Math.max(...delays),
        totalPatients: rows.reduce((s, r) => s + r.patients, 0),
        delays
      };
    }).filter((x): x is NonNullable<typeof x> => x !== null);
  }, [stratBaseHospitals]);

  const byManagement = useMemo(() => {
    return ALL_MANAGEMENT_MODELS.map(mod => {
      const rows = stratBaseHospitals.filter(r => r.h.managementModel === mod);
      if (rows.length === 0) return null;
      const delays = rows.map(r => r.delay);
      const m = exactMean(delays)!;
      return {
        label: mod,
        ownership: rows[0].h.ownership,
        n: rows.length,
        mean: m,
        median: exactMedian(delays)!,
        sd: sampleStdDev(delays, m),
        min: Math.min(...delays),
        max: Math.max(...delays),
        totalPatients: rows.reduce((s, r) => s + r.patients, 0),
        delays
      };
    }).filter((x): x is NonNullable<typeof x> => x !== null);
  }, [stratBaseHospitals]);

  // Kruskal-Wallis test across Complexity Groups with N >= 2
  const kwComplexity = useMemo(() => {
    const eligible = byComplexity.filter(g => g.n >= 2);
    const excludedSingletonGroups = byComplexity
      .filter(g => g.n < 2)
      .map(g => `${g.label} (n=${g.n})`);
    const result = kruskalWallisTest(eligible.map(g => g.delays));
    return {
      result,
      evaluatedNames: eligible.map(g => `${g.label} (n=${g.n})`),
      excludedSingletonGroups
    };
  }, [byComplexity]);

  // Kruskal-Wallis test across Management / Concession Groups with N >= 2
  const kwManagement = useMemo(() => {
    const eligible = byManagement.filter(g => g.n >= 2);
    const excludedSingletonGroups = byManagement
      .filter(g => g.n < 2)
      .map(g => `${g.label} (n=${g.n})`);
    const result = kruskalWallisTest(eligible.map(g => g.delays));
    return {
      result,
      evaluatedNames: eligible.map(g => `${g.label} (n=${g.n})`),
      excludedSingletonGroups
    };
  }, [byManagement]);

  // Cross-tabulation: Management Model x Complexity Group across full network (31 centers)
  const crossTabMatrix = useMemo(() => {
    const allH = Object.values(hospitals);
    return ALL_COMPLEXITY_GROUPS.map(grp => {
      const inGroup = allH.filter(h => h.complexityGroup === grp);
      const counts = ALL_MANAGEMENT_MODELS.map(mod => inGroup.filter(h => h.managementModel === mod).length);
      return {
        group: grp,
        counts,
        total: inGroup.length,
        hospitals: inGroup
      };
    });
  }, [hospitals]);

  // 5. Sorted Table rows
  const comparisonRefDelay =
    isRegionalComparable && regionalOfficialDelay !== null ? regionalOfficialDelay : dispersion.mean;

  const sortedTableData = useMemo(() => {
    return [...scatterPoints].sort((a, b) => {
      if (sortField === 'name') {
        return sortAsc ? a.shortName.localeCompare(b.shortName) : b.shortName.localeCompare(a.shortName);
      }
      if (sortField === 'diff') {
        const diffA = comparisonRefDelay !== null ? a.delay - comparisonRefDelay : 0;
        const diffB = comparisonRefDelay !== null ? b.delay - comparisonRefDelay : 0;
        return sortAsc ? diffA - diffB : diffB - diffA;
      }
      if (sortField === 'beds') {
        const valA = a.beds ?? -1;
        const valB = b.beds ?? -1;
        return sortAsc ? valA - valB : valB - valA;
      }
      const valA = a[sortField];
      const valB = b[sortField];
      return sortAsc ? valA - valB : valB - valA;
    });
  }, [scatterPoints, sortField, sortAsc, comparisonRefDelay]);

  const toggleSort = (field: 'name' | 'patients' | 'delay' | 'diff' | 'beds') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const categoryLabels: Record<HospitalViewCategory, string> = {
    general: 'Visión General (LEQ+LECE+LEPD • 2024)',
    quirurgica: 'Lista Quirúrgica (LEQ_Hosp)',
    consultas: 'Consultas Externas (LECE_Hosp)',
    pruebas: 'Pruebas Diagnósticas (LEPD_Hosp)'
  };

  const queueShortTitles: Record<WaitListType, string> = {
    quirurgica: 'Quirúrgica (2025)',
    consultas: 'Consultas (2024)',
    pruebas: 'Pruebas (2024)'
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Controls */}
      <div className="bg-[#FAF9F5] border border-[#DAD6CC] rounded-sm p-5 flex flex-col gap-3.5">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="font-serif text-2xl tracking-tight text-[#202321]">
              Análisis Hospitalario, Complejidad, Gestión y Desigualdad Territorial
            </h2>
            <CategoryBadge category="CALCULADO" />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center bg-[#ECE8DD] p-1 rounded-xs text-xs font-medium gap-0.5">
            {(['general', 'quirurgica', 'consultas', 'pruebas'] as HospitalViewCategory[]).map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-2.5 py-1.5 rounded-xs transition-colors cursor-pointer ${
                  cat === 'general' ? 'flex flex-col items-center leading-tight py-1' : ''
                } ${
                  activeCategory === cat ? 'bg-[#C64B37] text-[#FAF9F5] font-semibold' : 'text-[#4A4D48] hover:text-[#202321]'
                }`}
              >
                {cat === 'general' ? (
                  <>
                    <span>Visión General (2024)</span>
                    <span
                      className={`text-[9px] font-normal ${
                        activeCategory === 'general' ? 'text-[#FAF9F5]/80' : 'text-[#77766F]'
                      }`}
                    >
                      (LEQ+LECE+LEPD)
                    </span>
                  </>
                ) : (
                  queueShortTitles[cat]
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center bg-[#ECE8DD] p-1 rounded-xs text-xs font-medium shrink-0">
            <button
              onClick={() => setViewMode('scatter')}
              className={`px-2.5 py-1.5 rounded-xs transition-colors cursor-pointer ${
                viewMode === 'scatter' ? 'bg-[#FAF9F5] text-[#202321] font-semibold' : 'text-[#4A4D48] hover:text-[#202321]'
              }`}
            >
              Matriz
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-2.5 py-1.5 rounded-xs transition-colors cursor-pointer ${
                viewMode === 'map' ? 'bg-[#FAF9F5] text-[#202321] font-semibold' : 'text-[#4A4D48] hover:text-[#202321]'
              }`}
            >
              Mapa
            </button>
            <button
              onClick={() => setViewMode('both')}
              className={`px-2.5 py-1.5 rounded-xs transition-colors cursor-pointer ${
                viewMode === 'both' ? 'bg-[#FAF9F5] text-[#202321] font-semibold' : 'text-[#4A4D48] hover:text-[#202321]'
              }`}
            >
              Vista Dual
            </button>
          </div>
        </div>
      </div>

      {/* Unified Filter Bar */}
      <div className="bg-[#FAF9F5] border border-[#DAD6CC] rounded-sm p-3.5 flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-mono font-bold text-[#77766F] uppercase tracking-wider shrink-0">
          Filtros
        </span>

        <select
          value={complexityFilter}
          onChange={e => setComplexityFilter(e.target.value)}
          className="bg-[#F3F0E8] border border-[#DAD6CC] text-xs rounded-xs px-2 py-1.5 text-[#202321] focus:outline-none focus:border-[#426C79] flex-1 min-w-0 lg:min-w-[165px]"
        >
          <option value="ALL">Complejidad: Todas</option>
          {ALL_COMPLEXITY_GROUPS.map(g => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>

        <select
          value={managementFilter}
          onChange={e => setManagementFilter(e.target.value)}
          className="bg-[#F3F0E8] border border-[#DAD6CC] text-xs rounded-xs px-2 py-1.5 text-[#202321] focus:outline-none focus:border-[#426C79] flex-1 min-w-0 lg:min-w-[185px]"
        >
          <option value="ALL">Modelo Gestión: Todos</option>
          {ALL_MANAGEMENT_MODELS.map(m => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        <select
          value={ownershipFilter}
          onChange={e => setOwnershipFilter(e.target.value)}
          className="bg-[#F3F0E8] border border-[#DAD6CC] text-xs rounded-xs px-2 py-1.5 text-[#202321] focus:outline-none focus:border-[#426C79] flex-1 min-w-0 lg:min-w-[145px]"
        >
          <option value="ALL">Titularidad: Todas</option>
          <option value="Pública">Pública</option>
          <option value="Privada">Privada</option>
        </select>

        <select
          value={areaFilter}
          onChange={e => setAreaFilter(e.target.value)}
          className="bg-[#F3F0E8] border border-[#DAD6CC] text-xs rounded-xs px-2 py-1.5 text-[#202321] focus:outline-none focus:border-[#426C79] flex-1 min-w-0 lg:min-w-[155px]"
        >
          <option value="ALL">Área: Toda la región</option>
          <option value="Centro">Área Centro</option>
          <option value="Norte">Área Norte</option>
          <option value="Sur">Área Sur</option>
          <option value="Este">Área Este</option>
          <option value="Oeste">Área Oeste</option>
        </select>

        <div className="relative flex-1 min-w-[140px] lg:min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-[#77766F] absolute left-2.5 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filtrar centro o municipio..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-[#F3F0E8] border border-[#DAD6CC] text-xs rounded-xs pl-8 pr-2.5 py-1.5 text-[#202321] placeholder:text-[#77766F] focus:outline-none focus:border-[#426C79]"
          />
        </div>

        {(complexityFilter !== 'ALL' ||
          managementFilter !== 'ALL' ||
          ownershipFilter !== 'ALL' ||
          areaFilter !== 'ALL' ||
          searchTerm) && (
          <button
            onClick={() => {
              setComplexityFilter('ALL');
              setManagementFilter('ALL');
              setOwnershipFilter('ALL');
              setAreaFilter('ALL');
              setSearchTerm('');
            }}
            className="text-xs text-[#C64B37] hover:text-[#9A3323] font-semibold cursor-pointer shrink-0 whitespace-nowrap px-2"
          >
            Restablecer
          </button>
        )}
      </div>

      {/* Territorial Inequality & Dispersion Metrics Ledger Strip */}
      <div className="bg-[#FAF9F5] border border-[#DAD6CC] rounded-sm grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x lg:divide-x-0 lg:gap-px lg:bg-[#DAD6CC] divide-[#DAD6CC]">
        <div className="p-4 lg:p-5 lg:bg-[#FAF9F5]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-mono font-bold text-[#77766F] uppercase tracking-wide">
              {activeCategory === 'general' ? 'Media Máx. por Centro' : 'Media Simple Hospitalaria'}
            </span>
            <CategoryBadge category="CALCULADO" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-[#202321] font-mono tabular-nums">
              {dispersion.mean !== null ? `${formatEsDec(dispersion.mean, 1)} d` : 'No calculable'}
            </span>
            <span className="text-xs text-[#426C79] font-mono">
              Mediana: {dispersion.median !== null ? `${formatEsDec(dispersion.median, 1)} d` : 'N/D'}
            </span>
          </div>
          <span className="text-[10px] text-[#77766F] mt-1.5 block leading-snug">
            N = {formatEsInt(dispersion.n)} centros • Pond. pac.:{' '}
            <strong className="text-[#202321]">{dispersion.weightedMean !== null ? `${formatEsDec(dispersion.weightedMean, 1)} d` : 'N/D'}</strong>
            {regionalOfficialDelay !== null && (
              <>
                {' '}• Ref. oficial:{' '}
                <strong className="text-[#202321]">{formatEsDec(regionalOfficialDelay, 2)} d</strong>
                {!isRegionalComparable && ' (solo estruc.)'}
              </>
            )}
          </span>
        </div>

        <div className="p-4 lg:p-5 lg:bg-[#FAF9F5]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-mono font-bold text-[#77766F] uppercase tracking-wide">
              Dispersión Muestral (s) y CV
            </span>
            <CategoryBadge category="CALCULADO" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-[#426C79] font-mono tabular-nums">
              {dispersion.sd !== null ? `±${formatEsDec(dispersion.sd, 1)} d` : 'No calculable'}
            </span>
            <span className="text-xs font-mono text-[#426C79] font-semibold">
              CV: {dispersion.cv !== null ? `${formatEsDec(dispersion.cv, 1)}%` : 'No calculable'}
            </span>
          </div>
          <span className="text-[10px] text-[#77766F] mt-1.5 block">
            DE muestral (denominador n−1={formatEsInt(Math.max(0, dispersion.n - 1))})
          </span>
        </div>

        <div className="p-4 lg:p-5 lg:bg-[#FAF9F5]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-mono font-bold text-[#77766F] uppercase tracking-wide">
              Rango Extremo (Máx − Mín)
            </span>
            <CategoryBadge category="CALCULADO" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-bold text-[#202321] font-mono tabular-nums">
              {dispersion.min !== null && dispersion.max !== null
                ? `${formatEsDec(dispersion.min, 1)} – ${formatEsDec(dispersion.max, 1)} d`
                : 'No calculable'}
            </span>
            <span className="text-xs font-mono text-[#6E4D7B] font-bold">
              {dispersion.range !== null ? `Δ ${formatEsDec(dispersion.range, 1)} d` : ''}
            </span>
          </div>
          <span className="text-[10px] text-[#77766F] mt-1.5 block">
            {dispersion.min !== null && dispersion.max !== null && dispersion.range !== null
              ? `Exacto: ${formatEsDec(dispersion.max, 2)} − ${formatEsDec(dispersion.min, 2)} = ${formatEsDec(dispersion.range, 2)} d`
              : 'Datos insuficientes'}
          </span>
        </div>

        <div className="p-4 lg:p-5 lg:bg-[#FAF9F5]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-mono font-bold text-[#77766F] uppercase tracking-wide">
              Cociente de Desigualdad (R)
            </span>
            <CategoryBadge category="CALCULADO" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span
              className={`text-2xl font-bold font-mono tabular-nums ${
                dispersion.ratioCalculable ? 'text-[#C64B37]' : 'text-[#B4691E] text-lg'
              }`}
            >
              {dispersion.ratioCalculable && dispersion.ratio !== null
                ? `${formatEsDec(dispersion.ratio, 2)}x`
                : 'No calculable'}
            </span>
            <span className="text-xs text-[#77766F] font-mono">
              {dispersion.usedPositiveMinFallback ? 'Máx / Mín > 0' : 'Máx / Mín'}
            </span>
          </div>
          <span className="text-[10px] text-[#77766F] mt-1.5 block leading-snug">
            {dispersion.ratioCalculable && dispersion.usedPositiveMinFallback
              ? `Mín. original = 0,0 d (${dispersion.zeroHospitalNames.join(', ')}) → mín. positivo usado: ${formatEsDec(dispersion.effectiveMin, 1)} d (${dispersion.effectiveMinHospitalNames[0]}) • Máx: ${dispersion.maxHospitalNames[0]}`
              : dispersion.ratioCalculable
              ? `${dispersion.maxHospitalNames[0]} / ${dispersion.minHospitalNames[0]}`
              : 'Se requieren al menos 2 centros con demora positiva'}
          </span>
        </div>
      </div>

      {/* Visualizations: Scatter Matrix & Interactive Map */}
      <div className={`grid gap-6 ${viewMode === 'both' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
        {(viewMode === 'scatter' || viewMode === 'both') && (
          <ScatterPlot
            data={scatterPoints}
            selectedHospitalId={selectedHospitalId}
            onSelectHospital={onSelectHospital}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            year={selectedYear}
            listLabel={categoryLabels[activeCategory]}
            regionalOfficialDelay={regionalOfficialDelay}
            regionalComparable={isRegionalComparable}
            regionalComparisonNote={regionalComparisonNote}
            weightedMeanDelay={dispersion.weightedMean}
          />
        )}

        {(viewMode === 'map' || viewMode === 'both') && (
          <MadridHealthMap
            hospitals={hospitals}
            filteredIds={filteredIds}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            selectedYear={selectedYear}
            selectedHospitalId={selectedHospitalId}
            onSelectHospital={onSelectHospital}
          />
        )}
      </div>

      {/* Stratified Analysis: Complexity Group & Management Model */}
      <div className="bg-[#FAF9F5] border border-[#DAD6CC] rounded-sm p-5 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-3 border-b border-[#DAD6CC]">
          <div className="min-w-0">
            <h3 className="font-serif text-xl text-[#202321] flex items-center gap-2">
              <Scale className="w-4 h-4 text-[#426C79] shrink-0" />
              <span>Análisis Estratificado por Complejidad Asistencial y Modelo de Gestión ({selectedYear})</span>
            </h3>
            <p className="text-xs text-[#77766F] mt-1">
              {activeCategory === 'general'
                ? 'Evaluado sobre la demora máxima (cuello de botella) y carga total de cada centro en el corte común 31-dic-2024.'
                : `Evaluado sobre ${categoryLabels[activeCategory]} (corte 31-dic-${selectedYear}).`}{' '}
              Se separan estrictamente <strong className="text-[#202321]">grupo de complejidad</strong>,{' '}
              <strong className="text-[#202321]">modelo de gestión</strong> y <strong className="text-[#202321]">titularidad</strong>.
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <CategoryBadge category="ESTADISTICO" />
            <CategoryBadge category="OFICIAL" />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Table A: By Complexity */}
          <div>
            <h4 className="text-[11px] font-mono font-bold text-[#202321] uppercase tracking-wider mb-2">
              A. Desglose Cuantitativo por Grupo de Complejidad (SERMAS)
            </h4>
            <div className="overflow-x-auto border border-[#DAD6CC]">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#ECE8DD] border-b border-[#DAD6CC] text-[#202321] font-mono text-[10px] uppercase tracking-wider">
                    <th className="py-2 px-3">Grupo</th>
                    <th className="py-2 px-2 text-right">N</th>
                    <th className="py-2 px-2 text-right">Media (d)</th>
                    <th className="py-2 px-2 text-right">Mediana (d)</th>
                    <th className="py-2 px-2 text-right">DE s (d)</th>
                    <th className="py-2 px-2 text-right">Mín–Máx</th>
                    <th className="py-2 px-3 text-right">Pacientes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E2D8] font-mono">
                  {byComplexity.map(row => (
                    <tr key={row.label} className="hover:bg-[#F3F0E8]/70">
                      <td className="py-2 px-3 font-sans font-semibold text-[#202321]">{row.label}</td>
                      <td className="py-2 px-2 text-right text-[#77766F]">{formatEsInt(row.n)}</td>
                      <td className="py-2 px-2 text-right font-bold text-[#426C79]">{formatEsDec(row.mean, 1)}</td>
                      <td className="py-2 px-2 text-right text-[#202321]">{formatEsDec(row.median, 1)}</td>
                      <td className="py-2 px-2 text-right text-[#4A4D48]">
                        {row.sd !== null ? formatEsDec(row.sd, 1) : 'N/A (n=1)'}
                      </td>
                      <td className="py-2 px-2 text-right text-[#77766F] text-[11px]">
                        {formatEsDec(row.min, 1)}–{formatEsDec(row.max, 1)}
                      </td>
                      <td className="py-2 px-3 text-right text-[#202321]">
                        {formatEsInt(row.totalPatients)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table B: By Management Model */}
          <div>
            <h4 className="text-[11px] font-mono font-bold text-[#202321] uppercase tracking-wider mb-2">
              B. Desglose por Modelo de Gestión (sin confundir PFI con Concesión)
            </h4>
            <div className="overflow-x-auto border border-[#DAD6CC]">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#ECE8DD] border-b border-[#DAD6CC] text-[#202321] font-mono text-[10px] uppercase tracking-wider">
                    <th className="py-2 px-3">Modelo de Gestión</th>
                    <th className="py-2 px-2 text-right">N</th>
                    <th className="py-2 px-2 text-right">Media (d)</th>
                    <th className="py-2 px-2 text-right">Mediana (d)</th>
                    <th className="py-2 px-2 text-right">DE s (d)</th>
                    <th className="py-2 px-2 text-right">Mín–Máx</th>
                    <th className="py-2 px-3 text-right">Pacientes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E2D8] font-mono">
                  {byManagement.map(row => (
                    <tr key={row.label} className="hover:bg-[#F3F0E8]/70">
                      <td className="py-2 px-3 font-sans">
                        <span className="font-semibold text-[#202321] block">{row.label}</span>
                        <span className="text-[10px] text-[#77766F]">Titularidad {row.ownership}</span>
                      </td>
                      <td className="py-2 px-2 text-right text-[#77766F]">{formatEsInt(row.n)}</td>
                      <td className="py-2 px-2 text-right font-bold text-[#426C79]">{formatEsDec(row.mean, 1)}</td>
                      <td className="py-2 px-2 text-right text-[#202321]">{formatEsDec(row.median, 1)}</td>
                      <td className="py-2 px-2 text-right text-[#4A4D48]">
                        {row.sd !== null ? formatEsDec(row.sd, 1) : 'N/A (n=1)'}
                      </td>
                      <td className="py-2 px-2 text-right text-[#77766F] text-[11px]">
                        {formatEsDec(row.min, 1)}–{formatEsDec(row.max, 1)}
                      </td>
                      <td className="py-2 px-3 text-right text-[#202321]">
                        {formatEsInt(row.totalPatients)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Non-parametric Kruskal-Wallis Permutation Statistical Tests */}
        <div className="bg-[#FAF9F5] border border-[#DAD6CC] rounded-xs p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E6E2D8] pb-2.5">
            <h4 className="text-[11px] font-mono font-bold text-[#202321] flex items-center gap-1.5 uppercase tracking-wider">
              <Sigma className="w-3.5 h-3.5 text-[#426C79]" />
              <span>Contraste Kruskal-Wallis ({selectedYear})</span>
            </h4>
            <div className="flex items-center gap-2">
              <CategoryBadge category="ESTADISTICO" />
              <button
                type="button"
                onClick={() => setShowKruskalExtended(!showKruskalExtended)}
                className="px-2.5 py-1 bg-[#ECE8DD] hover:bg-[#DAD6CC] text-[#202321] rounded-xs text-[11px] font-mono font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer border border-[#DAD6CC]"
              >
                <span>KRUSKAL-WALLIS: INFORMACIÓN EXTENDIDA</span>
                {showKruskalExtended ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <p className="text-xs text-[#202321] leading-relaxed font-sans">
            Todos los resultados de Kruskal-Wallis para la complejidad del hospital dicen que no se detectan diferencias estadísticamente significativas, pero para el de gestión o concesión sí que existen diferencias significativas.
          </p>

          {showKruskalExtended && (
            <div className="pt-2 border-t border-[#E6E2D8] grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-[#F3F0E8] border border-[#DAD6CC] rounded-xs p-4 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-[11px] font-mono font-bold text-[#202321] flex items-center gap-1.5 uppercase tracking-wider">
                    <Sigma className="w-3.5 h-3.5 text-[#426C79]" />
                    <span>Kruskal-Wallis por Permutaciones — Complejidad ({selectedYear})</span>
                  </h4>
                  <CategoryBadge category="ESTADISTICO" />
                </div>
                {kwComplexity.result ? (
                  <div className="space-y-1.5 text-xs text-[#4A4D48]">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono">
                      <span>
                        H = <strong className="text-[#202321]">{formatEsDec(kwComplexity.result.hStatistic, 3)}</strong>
                      </span>
                      <span>
                        p-perm ={' '}
                        <strong className={kwComplexity.result.significant05 ? 'text-[#C64B37]' : 'text-[#202321]'}>
                          {kwComplexity.result.pValue < 0.001
                            ? '< 0,001'
                            : formatEsDec(kwComplexity.result.pValue, 4)}
                        </strong>
                      </span>
                      <span>
                        {kwComplexity.result.method === 'exact' ? 'Exacta' : 'B'} ={' '}
                        <strong className="text-[#202321]">{formatEsInt(kwComplexity.result.permutations)}</strong> perm.
                      </span>
                      <span>
                        N = <strong className="text-[#202321]">{formatEsInt(kwComplexity.result.totalN)}</strong> centros
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-[#4A4D48]">
                      <strong className="text-[#202321]">Decisión por permutaciones (α = 0,05):</strong>{' '}
                      {kwComplexity.result.significant05
                        ? `Se rechaza la hipótesis nula (H₀): existen diferencias estadísticamente significativas (p-perm < 0,05) en las distribuciones de demora entre los grupos de complejidad evaluados (${kwComplexity.evaluatedNames.join(', ')}).`
                        : `No se rechaza la hipótesis nula (H₀): no se detectan diferencias estadísticamente significativas al nivel α = 0,05 entre los grupos evaluados (${kwComplexity.evaluatedNames.join(', ')}).`}
                      {kwComplexity.excludedSingletonGroups.length > 0 &&
                        ` Se excluyen del contraste los estratos sin observaciones suficientes (${kwComplexity.excludedSingletonGroups.join(', ')}).`}{' '}
                      Al tratarse de tamaños muestrales pequeños por estrato, el p-valor se estima mediante{' '}
                      {kwComplexity.result.method === 'exact'
                        ? `enumeración exacta de las ${formatEsInt(kwComplexity.result.permutations)} permutaciones posibles`
                        : `${formatEsInt(kwComplexity.result.permutations)} permutaciones Monte Carlo deterministas (p = (1 + #{H_b ≥ H_obs}) / (B + 1))`}{' '}
                      en lugar de depender de la aproximación asintótica χ² (ref. asintótica:{' '}
                      <span className="font-mono">
                        {kwComplexity.result.asymptoticPValue < 0.001
                          ? '< 0,001'
                          : formatEsDec(kwComplexity.result.asymptoticPValue, 4)}
                      </span>
                      ). Un resultado significativo señala diferencias entre distribuciones, pero{' '}
                      <strong className="text-[#202321]">no demuestra relación causal</strong>.
                    </p>
                  </div>
                ) : (
                  <p className="text-[11px] text-[#77766F]">
                    Se requieren al menos dos grupos con N ≥ 2 centros válidos para ejecutar el contraste de Kruskal-Wallis por permutaciones bajo los filtros actuales.
                  </p>
                )}
              </div>

              <div className="bg-[#EDF3F5] border border-[#426C79]/35 rounded-xs p-4 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-[11px] font-mono font-bold text-[#2D4F5A] flex items-center gap-1.5 uppercase tracking-wider">
                    <Sigma className="w-3.5 h-3.5 text-[#426C79]" />
                    <span>Kruskal-Wallis por Permutaciones — Gestión / Concesión ({selectedYear})</span>
                  </h4>
                  <CategoryBadge category="ESTADISTICO" />
                </div>
                {kwManagement.result ? (
                  <div className="space-y-1.5 text-xs text-[#4A4D48]">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono">
                      <span>
                        H = <strong className="text-[#202321]">{formatEsDec(kwManagement.result.hStatistic, 3)}</strong>
                      </span>
                      <span>
                        p-perm ={' '}
                        <strong className={kwManagement.result.significant05 ? 'text-[#C64B37]' : 'text-[#202321]'}>
                          {kwManagement.result.pValue < 0.001
                            ? '< 0,001'
                            : formatEsDec(kwManagement.result.pValue, 4)}
                        </strong>
                      </span>
                      <span>
                        {kwManagement.result.method === 'exact' ? 'Exacta' : 'B'} ={' '}
                        <strong className="text-[#202321]">{formatEsInt(kwManagement.result.permutations)}</strong> perm.
                      </span>
                      <span>
                        N = <strong className="text-[#202321]">{formatEsInt(kwManagement.result.totalN)}</strong> centros
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-[#4A4D48]">
                      <strong className="text-[#202321]">Decisión por permutaciones (α = 0,05):</strong>{' '}
                      {kwManagement.result.significant05
                        ? `Se rechaza la hipótesis nula (H₀): existen diferencias estadísticamente significativas (p-perm < 0,05) en la distribución de demoras entre los grupos de gestión/concesión comparables (${kwManagement.evaluatedNames.join(', ')}).`
                        : `No se rechaza la hipótesis nula (H₀): no se detectan diferencias estadísticamente significativas al nivel α = 0,05 entre los grupos de gestión/concesión comparables (${kwManagement.evaluatedNames.join(', ')}).`}
                      {kwManagement.excludedSingletonGroups.length > 0 &&
                        ` Se excluyen grupos con observaciones insuficientes (${kwManagement.excludedSingletonGroups.join(', ')}).`}{' '}
                      Evaluado mediante{' '}
                      {kwManagement.result.method === 'exact'
                        ? `enumeración exacta (${formatEsInt(kwManagement.result.permutations)} permutaciones)`
                        : `${formatEsInt(kwManagement.result.permutations)} permutaciones Monte Carlo deterministas`}{' '}
                      por tamaño muestral reducido (ref. χ² asintótica:{' '}
                      <span className="font-mono">
                        {kwManagement.result.asymptoticPValue < 0.001
                          ? '< 0,001'
                          : formatEsDec(kwManagement.result.asymptoticPValue, 4)}
                      </span>
                      ). Un resultado significativo indica diferencias en las distribuciones entre grupos, pero{' '}
                      <strong className="text-[#202321]">no demuestra causalidad</strong> (pueden mediar diferencias de cartera de servicios, complejidad o población asignada).
                    </p>
                  </div>
                ) : (
                  <p className="text-[11px] text-[#77766F]">
                    Se requieren al menos dos grupos de gestión/concesión con N ≥ 2 centros válidos para ejecutar el contraste de Kruskal-Wallis por permutaciones bajo los filtros actuales.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Cross-Tabulation: Complexity Group x Management Model */}
        <div>
          <h4 className="text-[11px] font-mono font-bold text-[#202321] uppercase tracking-wider mb-2">
            C. Tabla Cruzada: Modelo de Gestión por Grupo de Complejidad (31 centros de la red)
          </h4>
          <div className="overflow-x-auto border border-[#DAD6CC]">
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="bg-[#ECE8DD] border-b border-[#DAD6CC] text-[#202321] font-mono text-[10px] uppercase tracking-wider">
                  <th className="py-2 px-3">Grupo de Complejidad</th>
                  <th className="py-2 px-2 text-center">Pública directa</th>
                  <th className="py-2 px-2 text-center">Pública directa (PFI)</th>
                  <th className="py-2 px-2 text-center">Concesión privada</th>
                  <th className="py-2 px-2 text-center">Concierto singular</th>
                  <th className="py-2 px-2 text-center">Convenio Defensa</th>
                  <th className="py-2 px-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E2D8] font-mono">
                {crossTabMatrix.map(row => (
                  <tr key={row.group} className="hover:bg-[#F3F0E8]/70">
                    <td className="py-2 px-3 font-sans font-semibold text-[#202321]">{row.group}</td>
                    {row.counts.map((c, idx) => (
                      <td
                        key={idx}
                        className={`py-2 px-2 text-center ${c > 0 ? 'font-bold text-[#202321]' : 'text-[#C4BFB1]'}`}
                      >
                        {c}
                      </td>
                    ))}
                    <td className="py-2 px-3 text-right font-bold text-[#426C79]">{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section D: Collapsible Descriptors per Group */}
        <div className="pt-2">
          <div className="bg-[#FAF9F5] border border-[#DAD6CC] rounded-xs overflow-hidden">
            <button
              type="button"
              onClick={() => setShowComplexityDetails(!showComplexityDetails)}
              className="w-full flex items-center justify-between p-3.5 bg-[#FAF9F5] hover:bg-[#F3F0E8] transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#426C79]" />
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#202321]">
                  INFORMACIÓN DE CADA GRUPO DE COMPLEJIDAD
                </span>
                <span className="text-[11px] font-sans text-[#77766F] hidden sm:inline">
                  (Catálogo SERMAS y Centros Asignados)
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-[#426C79]">
                <span>{showComplexityDetails ? 'Ocultar' : 'Ver detalle'}</span>
                {showComplexityDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {showComplexityDetails && (
              <div className="p-4 pt-1 border-t border-[#E6E2D8] space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                  <h4 className="text-[11px] font-mono font-bold text-[#202321] uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#426C79]" />
                    <span>D. Desglose Detallado por Grupo de Complejidad (Catálogo SERMAS y Centros Asignados)</span>
                  </h4>
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                    <span className="text-[#1F513B] bg-[#EBF3EE] border border-[#2D6A4F]/30 px-2 py-0.5 rounded-xs font-medium">
                      Verificado: Memoria SERMAS 2024 (SIAE) + CNH 2025
                    </span>
                    <a
                      href="https://www.comunidad.madrid/servicios/salud/memorias-e-informes-servicio-madrileno-salud"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#426C79] hover:text-[#C64B37] bg-[#F3F0E8] border border-[#DAD6CC] px-2 py-0.5 rounded-xs inline-flex items-center gap-1 font-semibold"
                    >
                      <span>Memorias SERMAS 2024</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                    <a
                      href="https://www.sanidad.gob.es/estadEstudios/estadisticas/sisInfSanSNS/ofertaRecursos/hospitales/docs/CNH_2025.xlsx"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#4A4D48] hover:text-[#202321] bg-[#F3F0E8] border border-[#DAD6CC] px-2 py-0.5 rounded-xs inline-flex items-center gap-1 font-semibold"
                    >
                      <span>CNH 2025 (Camas/Tipo)</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                    <a
                      href="https://observatorioresultados.sanidadmadrid.org/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#4A4D48] hover:text-[#202321] bg-[#F3F0E8] border border-[#DAD6CC] px-2 py-0.5 rounded-xs inline-flex items-center gap-1 font-semibold"
                    >
                      <span>SERMAS Grupos</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {COMPLEXITY_DESCRIPTORS.map(desc => {
                    const members = Object.values(hospitals).filter(h => h.complexityGroup === desc.group);
                    return (
                      <div
                        key={desc.group}
                        className="bg-[#F3F0E8] border border-[#DAD6CC] rounded-xs p-4 space-y-2.5 text-xs"
                      >
                        <div className="flex items-start justify-between gap-2 border-b border-[#DAD6CC] pb-2">
                          <div>
                            <h5 className="font-serif text-base text-[#202321]">{desc.title}</h5>
                            <span className="text-[11px] font-mono font-semibold text-[#426C79]">{desc.subtitle}</span>
                          </div>
                          <span className="font-mono text-[11px] font-bold bg-[#FAF9F5] border border-[#DAD6CC] px-2 py-0.5 rounded-xs text-[#202321] shrink-0">
                            {members.length} {members.length === 1 ? 'centro' : 'centros'}
                          </span>
                        </div>

                        <div className="space-y-1.5 text-[11px] text-[#4A4D48] leading-relaxed">
                          <p>{desc.description}</p>
                          <div>
                            <strong className="text-[#202321]">Gestión:</strong> {desc.management}
                          </div>
                          <div>
                            <strong className="text-[#202321]">Criterios:</strong> {desc.criteria}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-[#DAD6CC]">
                          <span className="text-[10px] font-mono font-bold text-[#77766F] uppercase block mb-1.5">
                            {members.length === 1 ? 'Hospital:' : 'Hospitales:'}
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {members.map(m => (
                              <button
                                key={m.id}
                                onClick={() => onSelectHospital(m)}
                                className="px-2 py-0.5 bg-[#FAF9F5] hover:bg-[#C64B37] text-[#202321] hover:text-[#FAF9F5] border border-[#DAD6CC] hover:border-[#C64B37] rounded-xs text-[10px] leading-tight font-medium transition-colors cursor-pointer"
                              >
                                {m.shortName}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hospital Ranking & Comparison Matrix Table */}
      <div className="bg-[#FAF9F5] border border-[#DAD6CC] rounded-sm p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-3.5 mb-4 border-b border-[#DAD6CC] gap-3">
          <div>
            <h3 className="font-serif text-xl text-[#202321] flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#426C79]" />
              <span>Matriz Comparativa y Desglose por Hospital (31-dic-{selectedYear})</span>
            </h3>
            <p className="text-xs text-[#77766F] mt-0.5">
              Haz clic en cualquier centro para abrir su expediente histórico individual.
            </p>
          </div>
          <span className="text-[11px] font-mono text-[#77766F]">
            Referencia D_h,t:{' '}
            <strong className="text-[#202321]">
              {comparisonRefDelay !== null ? `${formatEsDec(comparisonRefDelay, 1)} d` : 'N/D'}
            </strong>{' '}
            ({isRegionalComparable ? 'Oficial regional' : 'Promedio simple filtrado'})
          </span>
        </div>

        <div className="overflow-x-auto border border-[#DAD6CC]">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#ECE8DD] border-b border-[#DAD6CC] text-[#202321] font-mono text-[10px] uppercase tracking-wider select-none">
                <th className="py-2.5 px-3 cursor-pointer hover:text-[#C64B37]" onClick={() => toggleSort('name')}>
                  <div className="flex items-center gap-1">
                    <span>Hospital</span>
                    <ArrowUpDown className="w-3 h-3 text-[#77766F]" />
                  </div>
                </th>
                <th className="py-2.5 px-3">Complejidad (SERMAS)</th>
                <th className="py-2.5 px-3">Gestión y Titularidad</th>
                <th className="py-2.5 px-3 text-right cursor-pointer hover:text-[#C64B37]" onClick={() => toggleSort('patients')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>{activeCategory === 'general' ? 'Carga Total (2024)' : 'Pacientes'}</span>
                    <ArrowUpDown className="w-3 h-3 text-[#77766F]" />
                  </div>
                </th>
                <th className="py-2.5 px-3 text-right cursor-pointer hover:text-[#C64B37]" onClick={() => toggleSort('delay')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>{activeCategory === 'general' ? 'Máx. Cola (2024)' : 'Demora Media'}</span>
                    <ArrowUpDown className="w-3 h-3 text-[#77766F]" />
                  </div>
                </th>
                <th className="py-2.5 px-3 text-right cursor-pointer hover:text-[#C64B37]" onClick={() => toggleSort('diff')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>Diferencia (D_h,t)</span>
                    <ArrowUpDown className="w-3 h-3 text-[#77766F]" />
                  </div>
                </th>
                <th className="py-2.5 px-3 text-right cursor-pointer hover:text-[#C64B37]" onClick={() => toggleSort('beds')}>
                  <div className="flex items-center justify-end gap-1" title="Camas instaladas según Memoria Anual SERMAS 2024 (SIAE)">
                    <span>Camas inst. (2024)</span>
                    <ArrowUpDown className="w-3 h-3 text-[#77766F]" />
                  </div>
                </th>
                <th className="py-2.5 px-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E2D8] font-mono">
              {sortedTableData.map(pt => {
                const diffRef = comparisonRefDelay !== null ? pt.delay - comparisonRefDelay : 0;

                return (
                  <tr
                    key={pt.id}
                    className="hover:bg-[#F3F0E8]/75 transition-colors cursor-pointer group"
                    onClick={() => onSelectHospital(pt.hospital)}
                  >
                    <td className="py-2.5 px-3 font-sans">
                      <span className="font-semibold text-[#202321] group-hover:text-[#C64B37] block">
                        {pt.shortName}
                      </span>
                      <span className="text-[10px] text-[#77766F]">
                        Área {pt.area} • {pt.hospital.municipality}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-sans text-[#4A4D48]">
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-xs bg-[#F3F0E8] border border-[#DAD6CC] text-[#202321]">
                        {pt.complexityGroup}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-sans text-[#4A4D48]">
                      <span className="text-[11px] block text-[#202321]">{pt.managementModel}</span>
                      <span className="text-[10px] text-[#77766F]">Titularidad {pt.hospital.ownership}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#202321] font-semibold">
                      <div>{formatEsInt(pt.patients)}</div>
                      {activeCategory === 'general' && pt.activeQueuesCount && (
                        <div className="text-[9px] text-[#77766F] font-normal">
                          {pt.activeQueuesCount}/3 listas
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-[#202321]">
                      <span
                        className={`px-2 py-0.5 rounded-xs text-xs ${
                          pt.delay > 70
                            ? 'bg-[#FBECE9] text-[#9A3323] border border-[#C64B37]/30'
                            : pt.delay < 45
                            ? 'bg-[#EBF3EE] text-[#1F513B] border border-[#2D6A4F]/30'
                            : 'bg-[#F3F0E8] text-[#202321] border border-[#DAD6CC]'
                        }`}
                      >
                        {formatEsDec(pt.delay, 1)} d
                      </span>
                      {activeCategory === 'general' && pt.bottleneckQueue && (
                        <span className="block text-[9px] font-sans font-normal text-[#77766F] mt-0.5">
                          ({pt.bottleneckQueue})
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className={`text-xs font-semibold ${diffRef > 0 ? 'text-[#C64B37]' : 'text-[#2D6A4F]'}`}>
                        {formatEsDec(diffRef, 1, { signed: true })} d
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#77766F] text-xs">
                      {pt.beds !== null ? formatEsInt(pt.beds) : 'No disponible'}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onSelectHospital(pt.hospital);
                        }}
                        className="text-xs font-sans text-[#426C79] hover:text-[#C64B37] font-semibold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>Ver</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {excludedHospitals.length > 0 && (
          <div className="mt-3 p-3 bg-[#F3F0E8] border border-[#DAD6CC] rounded-xs text-[11px] text-[#4A4D48]">
            <strong className="text-[#202321]">Centros sin registro en {categoryLabels[activeCategory]} ({selectedYear}): </strong>
            {excludedHospitals.map(h => h.shortName).join(', ')} (no aplicables o ausentes según el catálogo oficial; excluidos de los cálculos sin imputar ceros).
          </div>
        )}
      </div>
    </div>
  );
};
