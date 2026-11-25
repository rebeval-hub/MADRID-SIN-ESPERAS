import React, { useState } from 'react';
import {
  Users,
  Clock,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Building,
  CheckCircle2,
  Layers,
  ArrowRight,
  Info
} from 'lucide-react';
import { FullHealthData, WaitListType, HospitalMetadata } from '../types';
import { CategoryBadge } from '../components/common/Badge';
import { InteractiveLineChart, LineSeries } from '../components/charts/InteractiveLineChart';
import { InteractiveBarChart, BarItem } from '../components/charts/InteractiveBarChart';
import { formatEsDec, formatEsInt } from '../utils/format';

interface OverviewPageProps {
  data: FullHealthData;
  onNavigateToRadar: () => void;
  onSelectHospital: (hospital: HospitalMetadata) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  data,
  onNavigateToRadar,
  onSelectHospital
}) => {
  const [activeCategory, setActiveCategory] = useState<WaitListType>('quirurgica');
  const [surgicalThreshold, setSurgicalThreshold] = useState<'180' | '90'>('180');

  const { regional, hospitals, radarAlerts, auditReport } = data;

  const regCategory = regional[activeCategory];
  const series = regCategory.series;
  const latestEntry = series[series.length - 1];
  const previousEntry = series.length >= 2 ? series[series.length - 2] : null;
  const latestYearStr = latestEntry?.year || '2024';

  const currentPatients = latestEntry?.totalPacientes ?? 0;
  const prevPatients = previousEntry?.totalPacientes ?? 0;
  const patientVarPct = prevPatients > 0 ? ((currentPatients - prevPatients) / prevPatients) * 100 : 0;

  const currentDelay = latestEntry?.demoraMedia ?? 0;
  const prevDelay = previousEntry?.demoraMedia ?? 0;
  const delayVar = currentDelay - prevDelay;

  // Global Time Series Chart (no unmotivated 50-day reference line)
  const evolutionSeries: LineSeries[] = [
    {
      id: 'demora_media',
      name:
        activeCategory === 'quirurgica'
          ? 'Demora media en espera estructural (días)'
          : activeCategory === 'consultas'
          ? 'Demora media en primera consulta externa (días)'
          : 'Demora media en pruebas diagnósticas (días)',
      color: '#426C79',
      firstPeriod: series[0]?.year,
      lastPeriod: latestYearStr,
      data: series.map(s => ({
        x: s.year,
        y: s.demoraMedia ?? null
      }))
    }
  ];

  if (activeCategory === 'quirurgica') {
    evolutionSeries.push({
      id: 'rechazo_demora',
      name: 'Demora tras rechazo a centro alternativo (días)',
      color: '#C64B37',
      dashed: true,
      firstPeriod: series[0]?.year,
      lastPeriod: latestYearStr,
      data: series.map(s => ({
        x: s.year,
        y: s.rechazoDemora ?? null
      }))
    });
  }

  // Delay Buckets (Tramos de Espera exact from official CSV)
  const tramos = latestEntry?.tramos || {};
  const tramoItems: BarItem[] = [];

  if (activeCategory === 'quirurgica') {
    if (tramos.d0_30 !== undefined) tramoItems.push({ id: '0_30', label: '0 a 30 días', value: tramos.d0_30, color: '#10b981' });
    if (tramos.d30_60 !== undefined) tramoItems.push({ id: '30_60', label: '30 a 60 días', value: tramos.d30_60, color: '#0284c7' });
    if (tramos.d60_90 !== undefined) tramoItems.push({ id: '60_90', label: '60 a 90 días', value: tramos.d60_90, color: '#38bdf8' });
    if (tramos.d90_180 !== undefined) tramoItems.push({ id: '90_180', label: '90 a 180 días', value: tramos.d90_180, color: '#f59e0b' });
    if (tramos.d180_plus !== undefined) tramoItems.push({ id: '180_plus', label: '180 días y más', value: tramos.d180_plus, color: '#e11d48' });
  } else {
    if (tramos.d0_30 !== undefined) tramoItems.push({ id: '0_30', label: '0 a 30 días', value: tramos.d0_30, color: '#10b981' });
    if (tramos.d31_60 !== undefined) tramoItems.push({ id: '31_60', label: '31 a 60 días', value: tramos.d31_60, color: '#0284c7' });
    if (tramos.d61_90 !== undefined) tramoItems.push({ id: '61_90', label: '61 a 90 días', value: tramos.d61_90, color: '#f59e0b' });
    if (tramos.d90_plus !== undefined) tramoItems.push({ id: '90_plus', label: '90 días y más', value: tramos.d90_plus, color: '#e11d48' });
  }

  const tramosSum =
    latestEntry?.tramosSum ?? tramoItems.reduce((acc, item) => acc + item.value, 0);

  // Threshold card rigorous denominator & metadata
  const structuralCensus =
    activeCategory === 'quirurgica'
      ? latestEntry?.estructuralPacientes ?? 0
      : currentPatients;

  const tramosDiff =
    latestEntry?.tramosDiff ?? (structuralCensus - tramosSum);

  const thresholdPatients =
    activeCategory === 'quirurgica'
      ? surgicalThreshold === '180'
        ? tramos.d180_plus ?? 0
        : (tramos.d90_180 ?? 0) + (tramos.d180_plus ?? 0)
      : tramos.d90_plus ?? 0;

  const thresholdPct = structuralCensus > 0 ? (thresholdPatients / structuralCensus) * 100 : 0;

  // Hospital Rankings (only centers with valid numeric non-null observations)
  const hospitalRankings = Object.values(hospitals)
    .map(h => ({
      hospital: h,
      delay: h.series[activeCategory]?.demora[latestYearStr] ?? null,
      patients: h.series[activeCategory]?.pacientes[latestYearStr] ?? null
    }))
    .filter(h => h.delay !== null && h.patients !== null)
    .sort((a, b) => (b.delay || 0) - (a.delay || 0));

  const topDemoraHospitals = hospitalRankings.slice(0, 5);
  const lowestDemoraHospitals = [...hospitalRankings].reverse().slice(0, 5);

  const compAlerts = radarAlerts.filter(a => a.radarType === 'comparativo');
  const tempAlerts = radarAlerts.filter(a => a.radarType === 'temporal');

  const sourceDatasetKey =
    activeCategory === 'quirurgica'
      ? 'LEQ_Global'
      : activeCategory === 'consultas'
      ? 'LECE_Global'
      : 'LEPD_Global';
  const sourceDetail = auditReport.details[sourceDatasetKey];

  return (
    <div className="space-y-6">
      {/* Editorial Front-Page Lead Banner */}
      <section className="bg-[#202321] text-[#FAF9F5] border border-[#202321] border-t-[3px] border-t-[#C64B37] rounded-sm p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
          <div className="flex items-start gap-4 max-w-2xl">
            <img
              src="/assets/aistudio/1958ecc3-383f-4604-95d1-fa7bdd5612c2_62eeedc1.png"
              alt=""
              aria-hidden="true"
              className="hidden sm:block h-14 w-auto object-contain shrink-0 mt-1 select-none"
            />
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.14em] text-[#D7D2C5]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#5FA886]" />
                <span>Fuentes Oficiales Verificadas (datos.comunidad.madrid)</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-[30px] leading-[1.12] tracking-tight text-[#FAF9F5]">
                Plataforma de Inteligencia Sanitaria de Madrid
              </h2>
              <p className="text-[13px] text-[#D7D2C5] leading-relaxed">
                Análisis de las listas de espera del Servicio Madrileño de Salud.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 border border-[#3B3F3C] bg-[#282B29] divide-x divide-[#3B3F3C] shrink-0">
            <div className="px-4 py-3 text-left sm:text-right">
              <span className="text-[10px] text-[#A6A18F] block uppercase tracking-wider font-mono">
                Registros Auditados
              </span>
              <span className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-[#FAF9F5] mt-0.5 block">
                {formatEsInt(auditReport.totalRecordsProcessed)}
              </span>
            </div>
            <div className="px-4 py-3 text-left sm:text-right">
              <span className="text-[10px] text-[#A6A18F] block uppercase tracking-wider font-mono">
                Centros SERMAS
              </span>
              <span className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-[#E88C7D] mt-0.5 block">
                {formatEsInt(Object.keys(hospitals).length)}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Queue Selector Bar + Reference Date */}
      <div className="bg-[#FAF9F5] border border-[#DAD6CC] rounded-sm p-3.5 flex flex-col gap-2.5 2xl:flex-row 2xl:items-center 2xl:justify-between">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-[11px] font-mono font-semibold text-[#77766F] uppercase tracking-wider px-1">
            Tipo de Lista:
          </span>
          <div className="flex flex-wrap items-center gap-1 bg-[#ECE8DD] p-1 rounded-xs text-xs font-medium">
            <button
              onClick={() => setActiveCategory('quirurgica')}
              className={`px-3 py-1.5 rounded-xs transition-colors cursor-pointer ${
                activeCategory === 'quirurgica'
                  ? 'bg-[#C64B37] text-[#FAF9F5] font-semibold'
                  : 'text-[#4A4D48] hover:text-[#202321]'
              }`}
            >
              Quirúrgica (LEQ • dic-2025)
            </button>
            <button
              onClick={() => setActiveCategory('consultas')}
              className={`px-3 py-1.5 rounded-xs transition-colors cursor-pointer ${
                activeCategory === 'consultas'
                  ? 'bg-[#426C79] text-[#FAF9F5] font-semibold'
                  : 'text-[#4A4D48] hover:text-[#202321]'
              }`}
            >
              Consultas Externas (LECE • dic-2024)
            </button>
            <button
              onClick={() => setActiveCategory('pruebas')}
              className={`px-3 py-1.5 rounded-xs transition-colors cursor-pointer ${
                activeCategory === 'pruebas'
                  ? 'bg-[#202321] text-[#FAF9F5] font-semibold'
                  : 'text-[#4A4D48] hover:text-[#202321]'
              }`}
            >
              Pruebas Diagnósticas (LEPD • dic-2024)
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <CategoryBadge category="OFICIAL" />
          <span className="text-xs text-[#77766F] font-mono">
            Fecha de referencia: <strong className="text-[#202321]">31-dic-{latestYearStr}</strong>
            {activeCategory !== 'quirurgica' && (
              <span className="text-[10px] text-[#9A4D10] ml-1.5">(último año publicado en portal)</span>
            )}
          </span>
        </div>
      </div>

      {/* Broadsheet KPI Strip: 4 Ledger Columns Separated by Hairlines */}
      <div className="bg-[#FAF9F5] border border-[#DAD6CC] rounded-sm grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#DAD6CC]">
        {/* KPI 1: Total Pacientes */}
        <div className="p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[11px] text-[#77766F] mb-2">
              <span className="font-mono font-semibold uppercase tracking-wider">
                {activeCategory === 'quirurgica' ? 'Total Pacientes LEQ' : 'Pacientes Espera Estructural'}
              </span>
              <Users className="w-3.5 h-3.5 text-[#426C79]" />
            </div>
            <div className="text-3xl font-bold text-[#202321] font-mono tabular-nums tracking-tight">
              {formatEsInt(currentPatients)}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs">
              {patientVarPct >= 0 ? (
                <span className="inline-flex items-center font-bold text-[#C64B37] font-mono">
                  <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> {formatEsDec(patientVarPct, 1, { signed: true })}%
                </span>
              ) : (
                <span className="inline-flex items-center font-bold text-[#2D6A4F] font-mono">
                  <TrendingDown className="w-3.5 h-3.5 mr-0.5" /> {formatEsDec(patientVarPct, 1)}%
                </span>
              )}
              <span className="text-[#77766F] font-mono text-[11px]">
                vs {previousEntry?.year} ({formatEsInt(prevPatients)})
              </span>
            </div>
            {activeCategory === 'quirurgica' && (
              <div className="mt-2.5 pt-2.5 border-t border-[#E6E2D8] text-[10px] text-[#4A4D48] font-mono space-y-0.5">
                <div>Estructural: <strong className="text-[#202321]">{formatEsInt(latestEntry?.estructuralPacientes ?? 0)}</strong></div>
                <div>TNP: {formatEsInt(latestEntry?.tnpPacientes ?? 0)} • Rechazo: {formatEsInt(latestEntry?.rechazoPacientes ?? 0)}</div>
              </div>
            )}
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#E6E2D8] flex flex-wrap items-center justify-between gap-1.5 text-[10px] text-[#77766F]">
            <span className="font-mono">Censo 31-dic-{latestYearStr} ({sourceDatasetKey})</span>
            <CategoryBadge category="OFICIAL" />
          </div>
        </div>

        {/* KPI 2: Demora Media */}
        <div className="p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[11px] text-[#77766F] mb-2">
              <span className="font-mono font-semibold uppercase tracking-wider">Demora Media Regional</span>
              <Clock className="w-3.5 h-3.5 text-[#B4691E]" />
            </div>
            <div className="text-3xl font-bold text-[#202321] font-mono tabular-nums tracking-tight">
              {formatEsDec(currentDelay, 2)} <span className="text-sm font-normal text-[#77766F]">días</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs">
              {delayVar >= 0 ? (
                <span className="inline-flex items-center font-bold text-[#C64B37] font-mono">
                  <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> {formatEsDec(delayVar, 2, { signed: true })} d
                </span>
              ) : (
                <span className="inline-flex items-center font-bold text-[#2D6A4F] font-mono">
                  <TrendingDown className="w-3.5 h-3.5 mr-0.5" /> {formatEsDec(delayVar, 2)} d
                </span>
              )}
              <span className="text-[#77766F] font-mono text-[11px]">
                vs {previousEntry?.year} ({formatEsDec(prevDelay, 2)} d)
              </span>
            </div>
            <p className="mt-2.5 text-[11px] text-[#77766F] leading-snug">
              {activeCategory === 'quirurgica'
                ? 'Población: espera estructural (n = 80.883 en dic-2025). No incluye TNP ni rechazo.'
                : 'Tiempo promedio oficial de demora en espera estructural (días naturales).'}
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#E6E2D8] flex flex-wrap items-center justify-between gap-1.5 text-[10px] text-[#77766F]">
            <span className="font-mono">Serie oficial {sourceDetail?.dateRange}</span>
            <CategoryBadge category="OFICIAL" />
          </div>
        </div>

        {/* KPI 3: Demora Superior al Umbral */}
        <div className="p-5 lg:border-t lg:border-[#DAD6CC] lg:border-l-0 xl:border-t-0 xl:border-l flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[11px] text-[#77766F] mb-2">
              <span className="font-mono font-semibold uppercase tracking-wider">Demora Superior al Umbral</span>
              <Layers className="w-3.5 h-3.5 text-[#6E4D7B]" />
            </div>

            {activeCategory === 'quirurgica' && (
              <div className="flex flex-wrap items-center gap-1 mb-2">
                <button
                  onClick={() => setSurgicalThreshold('90')}
                  className={`px-2 py-0.5 text-[10px] font-mono rounded-xs cursor-pointer border transition-colors whitespace-nowrap ${
                    surgicalThreshold === '90'
                      ? 'bg-[#202321] text-[#FAF9F5] border-[#202321]'
                      : 'bg-[#F3F0E8] text-[#4A4D48] border-[#DAD6CC] hover:border-[#A6A18F]'
                  }`}
                >
                  &gt; 90 días (analítico)
                </button>
                <button
                  onClick={() => setSurgicalThreshold('180')}
                  className={`px-2 py-0.5 text-[10px] font-mono rounded-xs cursor-pointer border transition-colors whitespace-nowrap ${
                    surgicalThreshold === '180'
                      ? 'bg-[#202321] text-[#FAF9F5] border-[#202321]'
                      : 'bg-[#F3F0E8] text-[#4A4D48] border-[#DAD6CC] hover:border-[#A6A18F]'
                  }`}
                >
                  &gt; 180 días
                </button>
              </div>
            )}

            <div className="text-3xl font-bold text-[#202321] font-mono tabular-nums tracking-tight">
              {formatEsInt(thresholdPatients)}
            </div>
            <div className="mt-1.5 text-xs text-[#202321] space-y-0.5">
              <div className="text-[11px] font-mono text-[#77766F]">
                {formatEsDec(thresholdPct, 2)}% sobre {formatEsInt(structuralCensus)} pac. estructurales ({sourceDatasetKey})
              </div>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#E6E2D8] flex flex-wrap items-center justify-between gap-1.5 text-[10px] text-[#77766F]">
            <span className="font-mono">
              31-dic-{latestYearStr} • {activeCategory === 'quirurgica' && surgicalThreshold === '90' ? 'Suma de tramos' : 'Tramo directo'}
            </span>
            <CategoryBadge category={activeCategory === 'quirurgica' && surgicalThreshold === '90' ? 'CALCULADO' : 'OFICIAL'} />
          </div>
        </div>

        {/* KPI 4: Radar Alert Snapshot */}
        <div
          onClick={onNavigateToRadar}
          className="p-5 lg:border-t lg:border-[#DAD6CC] xl:border-t-0 flex flex-col justify-between cursor-pointer bg-[#FBECE9]/35 hover:bg-[#FBECE9]/70 transition-colors group"
        >
          <div>
            <div className="flex items-center justify-between text-[11px] text-[#9A3323] mb-2">
              <span className="font-mono font-bold uppercase tracking-wider">Radar Sanitario</span>
              <AlertTriangle className="w-3.5 h-3.5 text-[#C64B37]" />
            </div>
            <div className="text-3xl font-bold text-[#C64B37] font-mono tabular-nums tracking-tight">
              {formatEsInt(compAlerts.length)}{' '}
              <span className="text-sm font-sans font-normal text-[#4A4D48]">comparativas</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-[#4A4D48]">
              <span>
                +{formatEsInt(tempAlerts.length)} señales temporales individuales
              </span>
              <ArrowRight className="w-4 h-4 text-[#C64B37] group-hover:translate-x-1 transition-transform shrink-0" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#C64B37]/20 flex flex-wrap items-center justify-between gap-1.5 text-[10px] text-[#9A3323]">
            <span className="font-mono">Modified Z-Score + SPC + Tendencia</span>
            <CategoryBadge category="ESTADISTICO" />
          </div>
        </div>
      </div>

      {/* Legal vs Analytical Threshold Clarification */}
      <div className="bg-[#FAF9F5] border border-[#DAD6CC] rounded-sm p-4 text-xs text-[#4A4D48] flex items-start gap-3">
        <Info className="w-4 h-4 text-[#C64B37] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="text-[#202321]">
            Criterios de espera (31/12/{latestYearStr}):
          </strong>
          {activeCategory === 'quirurgica' ? (
            <p className="text-[11px] leading-relaxed">
              Calculados sobre {formatEsInt(structuralCensus)} pacientes, excluyendo TNP y rechazos. El límite legal de 180 días solo afecta a 5 procedimientos específicos de la lista quirúrgica; por tanto, los {formatEsInt(tramos.d180_plus ?? 0)} pacientes que superan ese plazo no implican necesariamente incumplimiento legal. El umbral de 90 días es analítico.
            </p>
          ) : (
            <p className="text-[11px] leading-relaxed">
              Calculados sobre {formatEsInt(structuralCensus)} pacientes en espera estructural (<span className="font-mono">{sourceDatasetKey}</span>). El tramo ≥ 90 días es la categoría oficial superior publicada y se emplea como referencia analítica, no como límite legal único.
            </p>
          )}
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-[#DAD6CC]">
            <h3 className="font-serif text-lg text-[#202321] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#426C79]" />
              <span>Evolución Temporal de la Demora Media ({series[0]?.year} – {latestYearStr})</span>
            </h3>
            <CategoryBadge category="OFICIAL" />
          </div>

          <InteractiveLineChart
            series={evolutionSeries}
            unit="días"
            height={330}
          />

          <div className="bg-[#FAF9F5] border border-[#DAD6CC] rounded-sm p-3 text-[11px] text-[#4A4D48] space-y-1">
            <div>
              <strong className="text-[#202321]">Fuente:</strong>{' '}
              {activeCategory === 'quirurgica'
                ? 'SERMAS, lista de espera quirúrgica.'
                : activeCategory === 'consultas'
                ? 'SERMAS, lista de espera de consultas externas.'
                : 'SERMAS, lista de espera de pruebas diagnósticas.'}{' '}
              <strong className="text-[#202321]">Corte:</strong> 31 de diciembre.{' '}
              <strong className="text-[#202321]">Unidad:</strong> días naturales.
            </div>
            {activeCategory === 'quirurgica' ? (
              <div className="space-y-0.5 text-[#77766F]">
                <div>
                  Serie azul: espera estructural ({formatEsInt(latestEntry?.estructuralPacientes ?? 0)} pacientes en {latestYearStr}), excluyendo TNP y rechazos.
                </div>
                <div>
                  Serie roja: pacientes que rechazaron la derivación a un centro alternativo ({formatEsInt(latestEntry?.rechazoPacientes ?? 0)}).
                </div>
              </div>
            ) : (
              <div className="text-[#77766F]">
                <strong className="text-[#202321]">Metodología:</strong> Serie longitudinal oficial completa sin valores reconstruidos ni referencias normativas ficticias.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-2 pb-1 border-b border-[#DAD6CC]">
            <h3 className="font-serif text-lg text-[#202321] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#C64B37]" />
              <span>Distribución por Tramos de Espera (31-dic-{latestYearStr})</span>
            </h3>
            <CategoryBadge category="OFICIAL" />
          </div>

          <InteractiveBarChart
            items={tramoItems}
            unit="pacientes"
            height={330}
            horizontal={true}
          />

          <div className="bg-[#FAF9F5] border border-[#DAD6CC] rounded-sm p-3 text-[11px] text-[#4A4D48] space-y-1">
            {activeCategory === 'quirurgica' ? (
              <div>
                <strong className="text-[#202321]">Nota de auditoría:</strong> El censo oficial ({formatEsInt(structuralCensus)}) difiere en {formatEsInt(Math.abs(tramosDiff))} paciente ({formatEsDec((Math.abs(tramosDiff) / structuralCensus) * 100, 4)}%) de la suma de tramos ({formatEsInt(tramosSum)}); en 2024, en 6. Conservamos datos originales sin ajustes.
              </div>
            ) : (
              <div>
                <strong className="text-[#202321]">Auditoría de censo y tramos ({sourceDatasetKey}, 31-dic-{latestYearStr}):</strong> Censo estructural oficial ={' '}
                <span className="font-mono font-semibold text-[#202321]">
                  {formatEsInt(structuralCensus)}
                </span>{' '}
                pac. • Suma exacta de los tramos publicados ={' '}
                <span className="font-mono font-semibold text-[#202321]">
                  {formatEsInt(tramosSum)}
                </span>{' '}
                pac. Intervalos publicados: &quot;0 a 30&quot;, &quot;31 a 60&quot;, &quot;61 a 90&quot; y &quot;90 días y más&quot;.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hospital Rankings Ledger: Highest vs Lowest Delay */}
      <section className="bg-[#FAF9F5] border border-[#DAD6CC] rounded-sm p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-3.5 mb-5 border-b border-[#DAD6CC] gap-2">
          <div>
            <h3 className="font-serif text-xl text-[#202321] flex items-center gap-2">
              <Building className="w-4 h-4 text-[#426C79]" />
              <span>Comparativa Hospitalaria de Demora (31-dic-{latestYearStr})</span>
            </h3>
            <p className="text-xs text-[#77766F] mt-0.5">
              Centros con dato oficial publicado en {latestYearStr} ({hospitalRankings.length} centros válidos en{' '}
              <span className="font-mono">{activeCategory === 'quirurgica' ? 'LEQ_Hosp' : activeCategory === 'consultas' ? 'LECE_Hosp' : 'LEPD_Hosp'}</span>).
            </p>
          </div>
          <CategoryBadge category="OFICIAL" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-[11px] font-mono font-bold text-[#9A3323] uppercase tracking-wider mb-2.5 flex items-center gap-2 pb-1.5 border-b border-[#DAD6CC]">
              <span className="w-2 h-2 bg-[#C64B37]" />
              5 Centros con Mayor Demora Media ({latestYearStr})
            </div>
            <div className="divide-y divide-[#E6E2D8] border border-[#DAD6CC] bg-[#FAF9F5]">
              {topDemoraHospitals.map(({ hospital: h, delay, patients }, idx) => (
                <div
                  key={h.id}
                  onClick={() => onSelectHospital(h)}
                  className="flex items-center justify-between px-3.5 py-2.5 hover:bg-[#FBECE9]/55 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 bg-[#FBECE9] text-[#9A3323] border border-[#C64B37]/30 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <span className="font-semibold text-xs text-[#202321] block truncate">{h.shortName}</span>
                      <span className="text-[10px] text-[#77766F] block truncate">
                        {h.complexityGroup} • {h.managementModel} • {h.area}
                      </span>
                    </div>
                  </div>
                  <div className="text-right font-mono shrink-0 pl-3">
                    <span className="font-bold text-[#C64B37] text-sm block">{formatEsDec(delay, 1)} d</span>
                    <span className="text-[10px] text-[#77766F]">{formatEsInt(patients)} pac.</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-mono font-bold text-[#1F513B] uppercase tracking-wider mb-2.5 flex items-center gap-2 pb-1.5 border-b border-[#DAD6CC]">
              <span className="w-2 h-2 bg-[#2D6A4F]" />
              5 Centros con Menor Demora Media ({latestYearStr})
            </div>
            <div className="divide-y divide-[#E6E2D8] border border-[#DAD6CC] bg-[#FAF9F5]">
              {lowestDemoraHospitals.map(({ hospital: h, delay, patients }, idx) => (
                <div
                  key={h.id}
                  onClick={() => onSelectHospital(h)}
                  className="flex items-center justify-between px-3.5 py-2.5 hover:bg-[#EBF3EE]/60 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 bg-[#EBF3EE] text-[#1F513B] border border-[#2D6A4F]/30 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <span className="font-semibold text-xs text-[#202321] block truncate">{h.shortName}</span>
                      <span className="text-[10px] text-[#77766F] block truncate">
                        {h.complexityGroup} • {h.managementModel} • {h.area}
                      </span>
                    </div>
                  </div>
                  <div className="text-right font-mono shrink-0 pl-3">
                    <span className="font-bold text-[#2D6A4F] text-sm block">{formatEsDec(delay, 1)} d</span>
                    <span className="text-[10px] text-[#77766F]">{formatEsInt(patients)} pac.</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
