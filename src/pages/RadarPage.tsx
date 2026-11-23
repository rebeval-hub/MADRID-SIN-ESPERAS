import React, { useState, useMemo } from 'react';
import {
  Radar,
  AlertTriangle,
  ChevronRight,
  Search,
  Info,
  Activity,
  GitCompare
} from 'lucide-react';
import { FullHealthData, RadarAlert, HospitalMetadata, WaitListType } from '../types';
import { CategoryBadge, AlertBadge } from '../components/common/Badge';
import { ControlChart, SpcPoint } from '../components/charts/ControlChart';
import { exactMean, exactMedian, sampleStdDev } from '../utils/statistics';
import { formatEsAuto, formatEsDec, formatEsInt } from '../utils/format';

interface RadarPageProps {
  data: FullHealthData;
  onSelectHospital: (hospital: HospitalMetadata) => void;
}

const LIST_CONFIG: Record<WaitListType, { label: string; latestYear: string; cutoff: string }> = {
  quirurgica: { label: 'Lista Quirúrgica (LEQ)', latestYear: '2025', cutoff: '31-dic-2025' },
  consultas: { label: 'Consultas Externas (LECE)', latestYear: '2024', cutoff: '31-dic-2024' },
  pruebas: { label: 'Pruebas Diagnósticas (LEPD)', latestYear: '2024', cutoff: '31-dic-2024' }
};

export const RadarPage: React.FC<RadarPageProps> = ({ data, onSelectHospital }) => {
  const { radarAlerts, hospitals } = data;
  const [radarMode, setRadarMode] = useState<'ALL' | 'comparativo' | 'temporal'>('ALL');
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [listFilter, setListFilter] = useState<'ALL' | WaitListType>('ALL');
  const [spcListType, setSpcListType] = useState<WaitListType>(radarAlerts[0]?.listType || 'pruebas');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedAlert, setSelectedAlert] = useState<RadarAlert | null>(radarAlerts[0] || null);

  const comparativeCount = useMemo(
    () => radarAlerts.filter(a => a.radarType === 'comparativo').length,
    [radarAlerts]
  );
  const temporalCount = useMemo(
    () => radarAlerts.filter(a => a.radarType === 'temporal').length,
    [radarAlerts]
  );

  // Filter alerts
  const filteredAlerts = useMemo(() => {
    return radarAlerts.filter(a => {
      if (radarMode !== 'ALL' && a.radarType !== radarMode) return false;
      if (levelFilter !== 'ALL' && a.level !== levelFilter) return false;
      if (listFilter !== 'ALL' && a.listType !== listFilter) return false;
      if (
        searchTerm &&
        !a.hospitalName.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !a.hospitalShort.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [radarAlerts, radarMode, levelFilter, listFilter, searchTerm]);

  const handleSelectAlert = (alert: RadarAlert) => {
    setSelectedAlert(alert);
    setSpcListType(alert.listType);
  };

  const activeYear = LIST_CONFIG[spcListType].latestYear;

  // Compute true cross-sectional SPC + Modified Z-Score across all hospitals with valid official values
  const { spcPoints, centerLine, medianLine, ucl, uwl, lcl, lwl, madVal, sdVal } = useMemo(() => {
    const raw: { h: HospitalMetadata; delay: number }[] = [];
    for (const h of Object.values(hospitals)) {
      const delay = h.series[spcListType]?.demora[activeYear];
      if (delay !== undefined && delay !== null && !isNaN(delay)) {
        raw.push({ h, delay });
      }
    }

    const vals = raw.map(r => r.delay);
    const meanVal = exactMean(vals) ?? 0;
    const medVal = exactMedian(vals) ?? 0;
    const sd = sampleStdDev(vals, meanVal) ?? 0;
    const mad = exactMedian(vals.map(v => Math.abs(v - medVal))) ?? 0;

    const uclVal = meanVal + 3 * sd;
    const uwlVal = meanVal + 2 * sd;
    const lclVal = Math.max(0, meanVal - 3 * sd);
    const lwlVal = Math.max(0, meanVal - 2 * sd);

    const points: SpcPoint[] = raw
      .map(({ h, delay }) => {
        const zScore = sd > 0 ? (delay - meanVal) / sd : 0;
        const modifiedZ = mad > 0 ? (0.6745 * (delay - medVal)) / mad : 0;

        // Strict upper-tail comparative anomaly classification
        const isAnomaly = zScore >= 3.0 || modifiedZ >= 3.5;
        const isWarning = !isAnomaly && (zScore >= 2.0 || modifiedZ >= 2.0);

        let statusLabel = 'Valor habitual dentro de límites comparativos (azul)';
        if (isAnomaly) {
          statusLabel = 'Anomalía comparativa superior (≥ +3σ o Mod Z ≥ 3,5)';
        } else if (isWarning) {
          statusLabel = 'Vigilancia comparativa superior (+2σ a +3σ o Mod Z 2,0–3,5)';
        } else if (modifiedZ <= -2.0) {
          statusLabel = 'Cola baja comparativa (por debajo de −2 MAD; azul)';
        } else if (delay < medVal) {
          statusLabel = 'Valor habitual por debajo de la mediana (azul)';
        }

        return {
          id: h.id,
          label: h.shortName,
          value: delay,
          isAnomaly,
          isWarning,
          zScore,
          modifiedZ,
          statusLabel,
          metadata: `${h.complexityLabel} • ${h.managementModel} • Área ${h.area}`
        };
      })
      .sort((a, b) => a.value - b.value);

    return {
      spcPoints: points,
      centerLine: meanVal,
      medianLine: medVal,
      ucl: uclVal,
      uwl: uwlVal,
      lcl: lclVal,
      lwl: lwlVal,
      madVal: mad,
      sdVal: sd
    };
  }, [hospitals, spcListType, activeYear]);

  const isSelectedBelowMedianTemporal =
    selectedAlert &&
    selectedAlert.radarType === 'temporal' &&
    selectedAlert.observedValue < selectedAlert.referenceValue;

  return (
    <div className="space-y-6">
      {/* Radar Sanitario Editorial Masthead */}
      <div className="bg-[#202321] text-[#FAF9F5] border border-[#202321] border-t-[3px] border-t-[#C64B37] rounded-sm p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xs bg-[#C64B37]/20 text-[#F1A397] border border-[#C64B37]/45 text-[11px] font-mono font-bold uppercase tracking-wider">
                <Radar className="w-3.5 h-3.5 text-[#E88C7D]" />
                <span>Detección Comparativa y Longitudinal</span>
              </span>
              <CategoryBadge category="ESTADISTICO" />
            </div>
            <h2 className="font-serif text-2xl sm:text-[28px] leading-tight tracking-tight text-[#FAF9F5]">
              RADAR SANITARIO: Control Estadístico (SPC) y Trayectorias Individuales
            </h2>
            <p className="text-xs text-[#D7D2C5] leading-relaxed">
              Separación metodológica estricta entre el <strong className="text-[#FAF9F5]">Radar Comparativo entre Hospitales</strong> (desviaciones respecto a la red mediante Modified Z-Score Mediana/MAD y límites SPC +2σ/+3σ) y el <strong className="text-[#FAF9F5]">Radar Temporal Individual</strong> (Z-Score propio y rachas consecutivas respecto al histórico del mismo centro).
            </p>
          </div>

          <div className="grid grid-cols-2 border border-[#3B3F3C] bg-[#282B29] divide-x divide-[#3B3F3C] shrink-0">
            <div className="px-4 py-3 text-center">
              <span className="text-[10px] text-[#E88C7D] block uppercase font-mono">Radar Comparativo</span>
              <span className="text-2xl font-bold font-mono tabular-nums text-[#FAF9F5] mt-0.5 block">
                {comparativeCount}
              </span>
              <span className="text-[10px] text-[#A6A18F] block">Cola superior de red</span>
            </div>
            <div className="px-4 py-3 text-center">
              <span className="text-[10px] text-[#E7BE73] block uppercase font-mono">Radar Temporal</span>
              <span className="text-2xl font-bold font-mono tabular-nums text-[#E7BE73] mt-0.5 block">
                {temporalCount}
              </span>
              <span className="text-[10px] text-[#A6A18F] block">Rachas interanuales</span>
            </div>
          </div>
        </div>
      </div>

      {/* SPC Selector + Chart */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAF9F5] border border-[#DAD6CC] rounded-sm px-4 py-3">
          <div className="text-xs text-[#4A4D48]">
            <strong className="text-[#202321]">Gráfico SPC transversal ({LIST_CONFIG[spcListType].cutoff}):</strong>{' '}
            Mediana <span className="font-mono font-bold text-[#202321]">{formatEsDec(medianLine, 1)} d</span> • MAD{' '}
            <span className="font-mono font-bold text-[#202321]">{formatEsDec(madVal, 2)} d</span> • Media{' '}
            <span className="font-mono font-bold text-[#202321]">{formatEsDec(centerLine, 1)} d</span> • DE{' '}
            <span className="font-mono font-bold text-[#202321]">{formatEsDec(sdVal, 2)} d</span> • N = {formatEsInt(spcPoints.length)} centros
          </div>
          <div className="flex items-center bg-[#ECE8DD] p-1 rounded-xs text-xs font-medium shrink-0">
            {(['quirurgica', 'consultas', 'pruebas'] as WaitListType[]).map(lt => (
              <button
                key={lt}
                onClick={() => setSpcListType(lt)}
                className={`px-2.5 py-1 rounded-xs transition-colors cursor-pointer ${
                  spcListType === lt ? 'bg-[#202321] text-[#FAF9F5] font-semibold' : 'text-[#4A4D48] hover:text-[#202321]'
                }`}
              >
                {lt === 'quirurgica' ? 'Quirúrgica (2025)' : lt === 'consultas' ? 'Consultas (2024)' : 'Pruebas (2024)'}
              </button>
            ))}
          </div>
        </div>

        <ControlChart
          data={spcPoints}
          centerLine={centerLine}
          medianLine={medianLine}
          ucl={ucl}
          lcl={lcl}
          uwl={uwl}
          lwl={lwl}
          title={`Control Estadístico de Procesos (SPC) - ${LIST_CONFIG[spcListType].label} (${activeYear})`}
          unit="días"
        />
      </div>

      {/* Main Alert Exploration Dossier: Master/Detail Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Filterable Alerts List (5 cols) */}
        <div className="lg:col-span-5 bg-[#FAF9F5] border border-[#DAD6CC] rounded-sm p-4 flex flex-col h-[700px]">
          <div className="pb-3 border-b border-[#DAD6CC] space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg text-[#202321] flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-[#C64B37]" />
                <span>Catálogo de Señales ({filteredAlerts.length})</span>
              </h3>
              <CategoryBadge category="ESTADISTICO" />
            </div>

            {/* Engine Mode Selector */}
            <div className="grid grid-cols-3 gap-1 bg-[#ECE8DD] p-1 rounded-xs text-[11px] font-medium">
              <button
                onClick={() => setRadarMode('ALL')}
                className={`py-1 rounded-xs cursor-pointer transition-colors ${
                  radarMode === 'ALL' ? 'bg-[#202321] text-[#FAF9F5] font-semibold' : 'text-[#4A4D48] hover:text-[#202321]'
                }`}
              >
                Todos ({radarAlerts.length})
              </button>
              <button
                onClick={() => setRadarMode('comparativo')}
                className={`py-1 rounded-xs cursor-pointer transition-colors ${
                  radarMode === 'comparativo' ? 'bg-[#C64B37] text-[#FAF9F5] font-semibold' : 'text-[#4A4D48] hover:text-[#202321]'
                }`}
              >
                Comparativo ({comparativeCount})
              </button>
              <button
                onClick={() => setRadarMode('temporal')}
                className={`py-1 rounded-xs cursor-pointer transition-colors ${
                  radarMode === 'temporal' ? 'bg-[#B4691E] text-[#FAF9F5] font-semibold' : 'text-[#4A4D48] hover:text-[#202321]'
                }`}
              >
                Temporal ({temporalCount})
              </button>
            </div>

            {/* Level & List filters */}
            <div className="flex flex-wrap gap-1.5 text-[11px]">
              {[
                { key: 'ALL', label: 'Todos niveles' },
                { key: 'ALERTA_PERSISTENTE', label: 'Persistentes' },
                { key: 'ALERTA', label: 'Severas' },
                { key: 'ATENCION', label: 'Atención' }
              ].map(btn => (
                <button
                  key={btn.key}
                  onClick={() => setLevelFilter(btn.key)}
                  className={`px-2 py-1 rounded-xs font-medium transition-colors cursor-pointer ${
                    levelFilter === btn.key
                      ? 'bg-[#202321] text-[#FAF9F5]'
                      : 'bg-[#ECE8DD] text-[#4A4D48] hover:text-[#202321]'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-1.5 text-[11px]">
              {(['ALL', 'quirurgica', 'consultas', 'pruebas'] as const).map(lk => (
                <button
                  key={lk}
                  onClick={() => setListFilter(lk)}
                  className={`px-2 py-0.5 rounded-xs font-mono font-medium cursor-pointer border transition-colors ${
                    listFilter === lk
                      ? 'bg-[#EDF3F5] border-[#426C79] text-[#2D4F5A]'
                      : 'bg-[#F3F0E8] border-[#DAD6CC] text-[#77766F] hover:text-[#202321]'
                  }`}
                >
                  {lk === 'ALL' ? 'Todas las listas' : lk === 'quirurgica' ? 'LEQ 2025' : lk === 'consultas' ? 'LECE 2024' : 'LEPD 2024'}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#77766F] absolute left-2.5 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por hospital..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-[#F3F0E8] border border-[#DAD6CC] text-xs rounded-xs pl-8 pr-3 py-1.5 text-[#202321] placeholder:text-[#77766F] focus:outline-none focus:border-[#426C79]"
              />
            </div>
          </div>

          {/* Scrollable list */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#E6E2D8] pr-1 mt-2">
            {filteredAlerts.map(alert => {
              const isSelected = selectedAlert?.id === alert.id;
              return (
                <div
                  key={alert.id}
                  onClick={() => handleSelectAlert(alert)}
                  className={`p-3 rounded-xs my-1 transition-colors cursor-pointer border ${
                    isSelected
                      ? alert.radarType === 'comparativo'
                        ? 'bg-[#FBECE9]/75 border-[#C64B37]/45'
                        : 'bg-[#FBF3E8]/85 border-[#B4691E]/45'
                      : 'hover:bg-[#F3F0E8] border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-bold text-xs text-[#202321] truncate">
                      {alert.hospitalShort}
                    </span>
                    <AlertBadge level={alert.level} />
                  </div>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span
                      className={`px-1.5 py-0.5 rounded-xs font-mono font-semibold uppercase tracking-wide text-[9px] ${
                        alert.radarType === 'comparativo'
                          ? 'bg-[#FBECE9] text-[#9A3323] border border-[#C64B37]/30'
                          : 'bg-[#FBF3E8] text-[#7D4710] border border-[#B4691E]/30'
                      }`}
                    >
                      {alert.radarType === 'comparativo' ? 'Radar Comparativo' : 'Radar Temporal'}
                    </span>
                    <span className="font-mono font-bold text-[#202321]">{formatEsAuto(alert.observedValue, 1)} d</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-[#77766F] font-mono">
                    <span>{alert.listLabel} ({alert.period})</span>
                    <span>
                      {alert.radarType === 'temporal' && alert.selfZ !== null && alert.selfZ !== undefined
                        ? `Z-propio: ${formatEsDec(alert.selfZ, 2, { signed: true })}σ | Mod Z: ${formatEsDec(alert.modifiedZScore, 2, { signed: true })}`
                        : `Mod Z: ${formatEsDec(alert.modifiedZScore, 2, { signed: true })} | Racha: ${alert.consecutiveWorseningYears}a`}
                    </span>
                  </div>
                </div>
              );
            })}
            {filteredAlerts.length === 0 && (
              <div className="py-10 text-center text-xs text-[#77766F]">
                No hay señales para la combinación de filtros actual.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Ficha Explicativa Detallada (7 cols) */}
        <div className="lg:col-span-7 bg-[#FAF9F5] border border-[#DAD6CC] rounded-sm p-6 h-[700px] overflow-y-auto">
          {selectedAlert ? (
            <div className="space-y-5">
              {/* Alert Header */}
              <div className="border-b border-[#DAD6CC] pb-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <AlertBadge level={selectedAlert.level} />
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-xs border ${
                        selectedAlert.radarType === 'comparativo'
                          ? 'bg-[#FBECE9] text-[#9A3323] border-[#C64B37]/40'
                          : 'bg-[#FBF3E8] text-[#7D4710] border-[#B4691E]/40'
                      }`}
                    >
                      {selectedAlert.radarType === 'comparativo' ? (
                        <GitCompare className="w-3 h-3" />
                      ) : (
                        <Activity className="w-3 h-3" />
                      )}
                      {selectedAlert.persistenceCategory}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-[#4A4D48] bg-[#ECE8DD] border border-[#DAD6CC] px-2.5 py-1 rounded-xs">
                    Corte: {selectedAlert.period}
                  </span>
                </div>
                <h3 className="font-serif text-2xl text-[#202321] tracking-tight">
                  {selectedAlert.hospitalName}
                </h3>
                <p className="text-xs text-[#77766F] mt-1">
                  {selectedAlert.tier} • {selectedAlert.managementModel} • Área {selectedAlert.area} • {selectedAlert.listLabel}
                </p>
              </div>

              {/* Explicit Warning if Temporal below median */}
              {isSelectedBelowMedianTemporal && (
                <div className="bg-[#EDF3F5] border border-[#426C79]/35 rounded-xs p-3.5 text-xs text-[#202321]">
                  <strong>Aviso de lectura correcta (Radar Temporal bajo mediana):</strong>{' '}
                  Este hospital se sitúa <strong>por debajo de la mediana de la red</strong> ({formatEsAuto(selectedAlert.observedValue, 1)} d frente a {formatEsAuto(selectedAlert.referenceValue, 1)} d;{' '}
                  <span className="font-mono">Modified Z = {formatEsDec(selectedAlert.modifiedZScore, 2)}</span>, representado en <strong>azul</strong> en el gráfico SPC). La señal responde exclusivamente a su desviación respecto a su <strong>propia media histórica</strong> ({formatEsAuto(selectedAlert.selfMean, 2)} d,{' '}
                  <span className="font-mono">Z-propio = {selectedAlert.selfZ !== null && selectedAlert.selfZ !== undefined ? `${formatEsDec(selectedAlert.selfZ, 2, { signed: true })}σ` : 'N/D'}</span>) y por rigor metodológico no se clasifica como Alerta Severa.
                </div>
              )}

              {/* Quantitative Metrics Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 border border-[#DAD6CC] divide-y sm:divide-y-0 sm:divide-x divide-[#DAD6CC] font-mono bg-[#F3F0E8]">
                <div
                  className={`p-3 text-center ${
                    isSelectedBelowMedianTemporal
                      ? 'bg-[#EDF3F5]'
                      : 'bg-[#FBECE9]/75'
                  }`}
                >
                  <span
                    className={`text-[10px] block uppercase font-sans font-semibold ${
                      isSelectedBelowMedianTemporal ? 'text-[#2D4F5A]' : 'text-[#9A3323]'
                    }`}
                  >
                    Demora Observada
                  </span>
                  <span
                    className={`text-lg font-bold ${
                      isSelectedBelowMedianTemporal ? 'text-[#2D4F5A]' : 'text-[#C64B37]'
                    }`}
                  >
                    {formatEsAuto(selectedAlert.observedValue, 1)} d
                  </span>
                </div>
                <div className="p-3 text-center">
                  <span className="text-[10px] text-[#77766F] block uppercase font-sans font-semibold">Mediana Red</span>
                  <span className="text-lg font-bold text-[#202321]">{formatEsAuto(selectedAlert.referenceValue, 1)} d</span>
                </div>
                <div className="p-3 text-center lg:border-t lg:border-[#DAD6CC] lg:border-l-0 xl:border-t-0 xl:border-l">
                  <span className="text-[10px] text-[#77766F] block uppercase font-sans font-semibold">
                    {selectedAlert.radarType === 'temporal' ? 'Z-Propio (Histórico)' : 'Modified Z / Z-SPC'}
                  </span>
                  {selectedAlert.radarType === 'temporal' ? (
                    <span className="text-sm font-bold text-[#B4691E] block mt-0.5">
                      {selectedAlert.selfZ !== null && selectedAlert.selfZ !== undefined
                        ? `${formatEsDec(selectedAlert.selfZ, 2, { signed: true })}σ`
                        : 'N/D'}
                      <span className="block text-[10px] text-[#77766F] font-normal">
                        Mod Z red: {formatEsDec(selectedAlert.modifiedZScore, 2, { signed: true })}
                      </span>
                    </span>
                  ) : (
                    <span className="text-sm font-bold text-[#6E4D7B] block mt-0.5">
                      {formatEsDec(selectedAlert.modifiedZScore, 2, { signed: true })} / {formatEsDec(selectedAlert.standardZScore, 2, { signed: true })}σ
                    </span>
                  )}
                </div>
                <div className="p-3 text-center lg:border-t lg:border-[#DAD6CC] xl:border-t-0">
                  <span className="text-[10px] text-[#77766F] block uppercase font-sans font-semibold">Racha / Δ Previo</span>
                  <span className="text-sm font-bold text-[#B4691E] block mt-0.5">
                    {selectedAlert.consecutiveWorseningYears} años
                    {selectedAlert.selfDeltaFromPrev !== null &&
                      ` (${formatEsAuto(selectedAlert.selfDeltaFromPrev, 1, { signed: true })} d)`}
                  </span>
                </div>
              </div>

              {/* Mathematical Methodology Explanation */}
              <div className="bg-[#F3F0E8] border border-[#DAD6CC] rounded-xs p-4 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-[11px] font-mono font-bold text-[#202321] uppercase tracking-wider flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-[#426C79]" />
                    <span>Fundamentación Estadística ({selectedAlert.radarType === 'comparativo' ? 'Comparativo' : 'Temporal'})</span>
                  </h4>
                  <CategoryBadge category="ESTADISTICO" />
                </div>
                <p className="text-xs text-[#4A4D48] leading-relaxed">{selectedAlert.rationale}</p>
                <div className="mt-2 pt-2 border-t border-[#DAD6CC] text-[11px] font-mono text-[#4A4D48] grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  <div>• Método: {selectedAlert.method}</div>
                  <div>• N evaluado: {formatEsInt(selectedAlert.sampleSize)} {selectedAlert.radarType === 'comparativo' ? 'hospitales' : 'años del centro'}</div>
                  <div>• Media / DE red: {formatEsAuto(selectedAlert.regionalMean, 2)} d / {formatEsAuto(selectedAlert.regionalSd, 2)} d</div>
                  <div>• Mediana / MAD red: {formatEsAuto(selectedAlert.referenceValue, 2)} d / {formatEsAuto(selectedAlert.regionalMad, 2)} d</div>
                  <div>• Límite Aviso (+2σ) / Control (+3σ): {formatEsAuto(selectedAlert.regionalUwl, 2)} d / {formatEsAuto(selectedAlert.regionalUcl, 2)} d</div>
                  <div>
                    • Mod Z / Z-SPC red: {formatEsDec(selectedAlert.modifiedZScore, 2, { signed: true })} / {formatEsDec(selectedAlert.standardZScore, 2, { signed: true })}σ
                  </div>
                  {selectedAlert.selfMean !== null && (
                    <div className="sm:col-span-2 text-[#7D4710] font-semibold">
                      • Histórico propio previo del centro: Media = {formatEsAuto(selectedAlert.selfMean, 2)} d
                      {selectedAlert.selfSd !== null && selectedAlert.selfSd !== undefined && ` | DE = ${formatEsAuto(selectedAlert.selfSd, 2)} d`}
                      {selectedAlert.selfZ !== null && selectedAlert.selfZ !== undefined && ` | Z-propio = ${formatEsDec(selectedAlert.selfZ, 2, { signed: true })}σ`}
                    </div>
                  )}
                </div>
              </div>

              {/* Neutrality and Non-Blame Disclosure */}
              <div className="bg-[#EDF3F5] border border-[#426C79]/35 rounded-xs p-4 space-y-1.5 text-xs text-[#202321]">
                <span className="font-bold block">Principio de Imparcialidad y Rigor Sanitario:</span>
                <p className="text-[11px] text-[#4A4D48] leading-relaxed">
                  Un deterioro temporal propio (<em>Z-propio</em> positivo respecto al pasado del centro) no implica saturación comparativa frente a la red (un centro puede empeorar respecto a su propio mínimo histórico y seguir claramente por debajo de la mediana regional con <em>Modified Z &lt; 0</em>). Las señales estadísticas orientan la auditoría de gestión, pero no prueban por sí solas ineficiencia ni causalidad sin ajustar por cartera de servicios y complejidad nosológica.
                </p>
              </div>

              {/* Action Button */}
              <div className="pt-1">
                <button
                  onClick={() => {
                    const hosp = hospitals[selectedAlert.hospitalId];
                    if (hosp) onSelectHospital(hosp);
                  }}
                  className="w-full py-2.5 px-4 bg-[#202321] hover:bg-[#C64B37] text-[#FAF9F5] font-semibold text-xs rounded-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Abrir Expediente Completo de {selectedAlert.hospitalShort}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-[#77766F] text-xs">
              <Radar className="w-10 h-10 mb-2 stroke-1" />
              <span>Selecciona una señal del catálogo para examinar su ficha estadística.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
