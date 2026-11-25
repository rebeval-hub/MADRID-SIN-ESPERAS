import React, { useState, useMemo, useEffect } from 'react';
import {
  LineChart as LineChartIcon,
  ShieldCheck,
  Award,
  GitBranch,
  AlertTriangle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { FullHealthData } from '../types';
import { CategoryBadge } from '../components/common/Badge';
import { InteractiveLineChart, LineSeries } from '../components/charts/InteractiveLineChart';
import { formatEsDec, formatEsInt } from '../utils/format';
import {
  buildAllForecastAudits,
  ForecastIndicatorKey,
  ForecastModelId,
  IndicatorForecastAudit
} from '../utils/forecasting';

interface PredictivePageProps {
  data: FullHealthData;
}

const INDICATOR_ORDER: ForecastIndicatorKey[] = [
  'quirurgica_pacientes',
  'quirurgica_demora',
  'consultas_demora',
  'pruebas_demora'
];

const KEY_LABELS: Record<ForecastIndicatorKey, string> = {
  quirurgica_pacientes: 'Pacientes Quirúrgicos',
  quirurgica_demora: 'Demora Quirúrgica',
  consultas_demora: 'Demora Consultas',
  pruebas_demora: 'Demora Pruebas'
};

export const PredictivePage: React.FC<PredictivePageProps> = ({ data }) => {
  const audits = useMemo(() => buildAllForecastAudits(data), [data]);

  const [selectedKey, setSelectedKey] = useState<ForecastIndicatorKey>('quirurgica_pacientes');
  const activeAudit: IndicatorForecastAudit = audits[selectedKey];

  const [selectedModelId, setSelectedModelId] = useState<ForecastModelId>(
    activeAudit.winner.modelId
  );
  const [showFoldDetails, setShowFoldDetails] = useState<boolean>(false);

  useEffect(() => {
    setSelectedModelId(audits[selectedKey].winner.modelId);
  }, [selectedKey, audits]);

  const activeModel =
    activeAudit.models.find(m => m.modelId === selectedModelId) || activeAudit.winner;

  const isCountUnit = activeAudit.unit === 'pacientes';
  const formatVal = (v: number | null | undefined) =>
    isCountUnit ? formatEsInt(v) : formatEsDec(v, 2);

  // Prepare InteractiveLineChart series
  const lastHist = activeAudit.historical[activeAudit.historical.length - 1];
  const combinedYears = [
    ...activeAudit.historical.map(h => h.year),
    ...activeModel.projections.map(p => p.year)
  ];

  const fullHistoricalData = combinedYears.map(y => {
    const found = activeAudit.historical.find(h => h.year === y);
    return { x: y, y: found ? found.value : null };
  });

  const fullProjectionData = combinedYears.map(y => {
    if (y === lastHist.year) {
      return { x: y, y: lastHist.value };
    }
    const found = activeModel.projections.find(p => p.year === y);
    return found
      ? {
          x: y,
          y: found.point,
          lower80: found.lower80,
          upper80: found.upper80,
          lower95: found.lower95,
          upper95: found.upper95
        }
      : { x: y, y: null };
  });

  const chartSeriesList: LineSeries[] = [
    {
      id: 'historical',
      name: `Serie Oficial Observada (${activeAudit.seriesAudit.startYear}–${activeAudit.seriesAudit.endYear})`,
      color: '#426C79',
      firstPeriod: activeAudit.seriesAudit.startYear,
      lastPeriod: activeAudit.seriesAudit.endYear,
      data: fullHistoricalData
    },
    {
      id: 'projection',
      name: `Proyección ${activeModel.shortName} (${activeModel.projections[0]?.year}–${activeModel.projections[activeModel.projections.length - 1]?.year})`,
      color: '#6E4D7B',
      dashed: true,
      showConfidence: true,
      firstPeriod: activeModel.projections[0]?.year,
      lastPeriod: activeModel.projections[activeModel.projections.length - 1]?.year,
      data: fullProjectionData
    }
  ];

  const winnerIsNaive = activeAudit.winner.modelId === 'naive';
  const winnerBeatsNaiveConvincingly =
    !winnerIsNaive && activeAudit.winner.improvementVsNaiveMaePct > 2;

  return (
    <div className="space-y-6">
      {/* Header & Indicator Selector */}
      <div className="bg-[#FAF9F5] border border-[#DAD6CC] rounded-sm p-5 flex flex-col gap-3.5 2xl:flex-row 2xl:items-center 2xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="font-serif text-2xl tracking-tight text-[#202321]">
              Modelos predictivos de Series Temporales
            </h2>
            <CategoryBadge category="PREDICCION" />
          </div>
          <p className="text-xs text-[#77766F] mt-1">
            Fuente observada: <strong className="text-[#202321]">{activeAudit.sourceDataset}</strong> • {activeAudit.cutoffNote}
          </p>
        </div>

        <div className="flex flex-wrap items-center bg-[#ECE8DD] p-1 rounded-xs text-xs font-medium gap-1 w-fit shrink-0">
          {INDICATOR_ORDER.map(key => (
            <button
              key={key}
              onClick={() => setSelectedKey(key)}
              className={`px-3 py-1.5 rounded-xs transition-colors cursor-pointer whitespace-nowrap ${
                selectedKey === key
                  ? 'bg-[#6E4D7B] text-[#FAF9F5] font-semibold'
                  : 'text-[#4A4D48] hover:text-[#202321]'
              }`}
            >
              {KEY_LABELS[key]}
            </button>
          ))}
        </div>
      </div>

      {/* Section A: Strict Series Audit Ledger Strip */}
      <div className="bg-[#FAF9F5] border border-[#DAD6CC] rounded-sm grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x lg:divide-x-0 lg:gap-px lg:bg-[#DAD6CC] divide-[#DAD6CC] text-[11px]">
        <div className="p-4 lg:p-5 lg:bg-[#FAF9F5]">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
            <span className="font-mono font-bold text-[#1F513B] uppercase">1. Auditoría de Serie</span>
            <CategoryBadge category="OFICIAL" />
          </div>
          <p className="text-[#4A4D48] leading-relaxed">
            <strong className="text-[#202321] font-mono">N = {formatEsInt(activeAudit.seriesAudit.n)}</strong> cortes anuales exactos (
            {activeAudit.seriesAudit.startYear}–{activeAudit.seriesAudit.endYear}). Huecos temporales:{' '}
            <strong className="text-[#202321] font-mono">{formatEsInt(activeAudit.seriesAudit.missingGaps)}</strong>. Sin datos sintéticos ni interpolados.
          </p>
        </div>

        <div className="p-4 lg:p-5 lg:bg-[#FAF9F5]">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
            <span className="font-mono font-bold text-[#2D4F5A] uppercase">2. VALIDACIÓN TEMPORAL</span>
            <CategoryBadge category="ESTADISTICO" />
          </div>
          <p className="text-[#4A4D48] leading-relaxed">
            <strong className="text-[#202321]">5 modelos</strong> evaluados sobre idénticas ventanas rodantes expansivas ({activeAudit.cvYearsRange}, entreno mín. {formatEsInt(activeAudit.minTrainWindow)} años) sin fuga futura.
          </p>
        </div>

        <div className="p-4 lg:p-5 lg:bg-[#FAF9F5]">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
            <span className="font-mono font-bold text-[#4F3559] uppercase">3. Ganador por CV</span>
            <CategoryBadge category="ESTADISTICO" />
          </div>
          <p className="text-[#4A4D48] leading-relaxed">
            <strong className="text-[#202321]">{activeAudit.winner.shortName}</strong> (RMSE {formatVal(activeAudit.winner.cvRmse)}{' '}
            {activeAudit.unit}, MASE {formatEsDec(activeAudit.winner.cvMase, 2)}).{' '}
            {winnerIsNaive ? 'Ningún modelo paramétrico supera al baseline Naive en RMSE: se conserva Naive por parsimonia.' : 'Seleccionado estrictamente por menor error fuera de muestra.'}
          </p>
        </div>

        <div className="p-4 lg:p-5 lg:bg-[#FAF9F5]">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
            <span className="font-mono font-bold text-[#202321] uppercase">4. Holdout 2 Años</span>
            <CategoryBadge category="ESTADISTICO" />
          </div>
          <p className="text-[#4A4D48] leading-relaxed">
            Prueba estática multi-paso sobre <strong className="text-[#202321]">{activeAudit.holdoutYearsRange}</strong>: MAE de {activeAudit.winner.shortName} ={' '}
            <strong className="text-[#202321] font-mono">{formatVal(activeAudit.winner.holdout2Mae)} {activeAudit.unit}</strong>.
          </p>
        </div>
      </div>

      {/* Warning Banner when Naive wins or no model clearly outperforms Naive */}
      {(winnerIsNaive || !winnerBeatsNaiveConvincingly) && (
        <div className="bg-[#FBF3E8] border border-[#B4691E]/45 rounded-sm p-4 text-xs text-[#7D4710] flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-[#B4691E] shrink-0 mt-0.5" />
          <div className="space-y-1 leading-relaxed">
            <strong className="text-[#202321]">
              {winnerIsNaive
                ? `Advertencia de predictibilidad: ningún modelo paramétrico supera al baseline Naive en validación cruzada (${activeAudit.cvYearsRange}).`
                : `Advertencia de estabilidad: ${activeAudit.winner.shortName} obtiene una ventaja marginal frente a Naive (${formatEsDec(activeAudit.winner.improvementVsNaiveMaePct, 1, { signed: true })}% MAE; MASE ${formatEsDec(activeAudit.winner.cvMase, 2)}).`}
            </strong>
            <p className="text-[11px]">
              Con solo N={formatEsInt(activeAudit.seriesAudit.n)} cortes anuales y un choque exógeno severo en 2020–2021, las tendencias complejas tienden a sobreajustar.{' '}
              {winnerIsNaive
                ? 'El criterio de parsimonia selecciona automáticamente el modelo Naive como proyección más prudente.'
                : 'Las proyecciones deben interpretarse exclusivamente como referencia estadística exploratoria y no como garantía futura.'}
            </p>
          </div>
        </div>
      )}

      {/* Section B: 6-Model Rolling-Origin CV Ranking Table */}
      <div className="bg-[#FAF9F5] border border-[#DAD6CC] rounded-sm p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-3 border-b border-[#DAD6CC]">
          <div>
            <h3 className="font-serif text-xl text-[#202321] flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-[#426C79]" />
              <span>Comparativa predictiva de 5 modelos ({activeAudit.cvYearsRange})</span>
            </h3>
            <p className="text-xs text-[#77766F] mt-0.5">
              Todos los modelos ajustan sus parámetros exclusivamente sobre el pasado disponible en cada ventana. Haz clic en una fila para visualizar su proyección e intervalos compatibles.
            </p>
          </div>
          <CategoryBadge category="ESTADISTICO" />
        </div>

        <div className="overflow-x-auto border border-[#DAD6CC]">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#ECE8DD] border-b border-[#DAD6CC] text-[#202321] font-mono text-[10px] uppercase tracking-wider">
                <th className="py-2.5 px-3">Rank</th>
                <th className="py-2.5 px-3">Modelo (Familia)</th>
                <th className="py-2.5 px-3 text-right">MAE CV</th>
                <th className="py-2.5 px-3 text-right">RMSE CV</th>
                <th className="py-2.5 px-3 text-right">MASE</th>
                <th className="py-2.5 px-3 text-right">Δ MAE vs Naive</th>
                <th className="py-2.5 px-3 text-right">Ventanas ganadas</th>
                <th className="py-2.5 px-3 text-right">DE errores CV</th>
                <th className="py-2.5 px-3 text-right">MAE Holdout 2a</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E2D8] font-mono">
              {activeAudit.models.map(m => {
                const isSelected = m.modelId === activeModel.modelId;
                const isWinner = m.rank === 1;
                return (
                  <tr
                    key={m.modelId}
                    onClick={() => setSelectedModelId(m.modelId)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-[#F4EFF7]' : 'hover:bg-[#F3F0E8]/75'
                    }`}
                  >
                    <td className="py-2.5 px-3 font-bold text-[#202321]">
                      #{formatEsInt(m.rank)}
                    </td>
                    <td className="py-2.5 px-3 font-sans">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-bold text-[#202321]">{m.modelName}</span>
                        {isWinner && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-xs bg-[#EBF3EE] text-[#1F513B] border border-[#2D6A4F]/35">
                            <Award className="w-2.5 h-2.5" /> Mejor CV
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-[#77766F] block mt-0.5">
                        {m.family} • {m.fittedDescription}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-[#202321]">
                      {formatVal(m.cvMae)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-[#202321]">
                      {formatVal(m.cvRmse)}
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right font-semibold ${
                        m.cvMase < 1 ? 'text-[#2D6A4F]' : 'text-[#B4691E]'
                      }`}
                    >
                      {formatEsDec(m.cvMase, 3)}
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right font-bold ${
                        m.modelId === 'naive'
                          ? 'text-[#77766F]'
                          : m.improvementVsNaiveMaePct > 0
                          ? 'text-[#2D6A4F]'
                          : 'text-[#C64B37]'
                      }`}
                    >
                      {m.modelId === 'naive'
                        ? '0,0% (ref.)'
                        : `${formatEsDec(m.improvementVsNaiveMaePct, 1, { signed: true })}%`}
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#4A4D48]">
                      {m.modelId === 'naive'
                        ? 'Ref.'
                        : `${formatEsInt(m.foldsBeatingNaive)} / ${formatEsInt(m.foldsTotal)}`}
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#4A4D48]">
                      {formatVal(m.foldMaeSd)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#4A4D48]">
                      {formatVal(m.holdout2Mae)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Toggle for year-by-year CV fold errors */}
        <div className="pt-1">
          <button
            onClick={() => setShowFoldDetails(s => !s)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#426C79] hover:text-[#C64B37] cursor-pointer"
          >
            {showFoldDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>
              {showFoldDetails
                ? `Ocultar errores año a año de ${activeModel.shortName}`
                : `Ver errores fuera de muestra año a año para ${activeModel.shortName} (${activeAudit.cvYearsRange})`}
            </span>
          </button>

          {showFoldDetails && (
            <div className="mt-3 overflow-x-auto border border-[#DAD6CC]">
              <table className="w-full text-left text-[11px] font-mono">
                <thead>
                  <tr className="bg-[#ECE8DD] border-b border-[#DAD6CC] text-[#202321] font-sans font-semibold">
                    <th className="py-2 px-3">Año prueba</th>
                    <th className="py-2 px-3 text-right">Observado</th>
                    <th className="py-2 px-3 text-right">Predicho ({activeModel.shortName})</th>
                    <th className="py-2 px-3 text-right">Error (Real − Pred)</th>
                    <th className="py-2 px-3 text-right">|Error|</th>
                    <th className="py-2 px-3 text-right">|Error Naive|</th>
                    <th className="py-2 px-3 text-center">¿Mejora a Naive?</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E2D8]">
                  {activeModel.foldErrors.map(f => (
                    <tr key={f.year} className="hover:bg-[#F3F0E8]/70">
                      <td className="py-1.5 px-3 font-bold text-[#202321]">{f.year}</td>
                      <td className="py-1.5 px-3 text-right text-[#202321]">{formatVal(f.actual)}</td>
                      <td className="py-1.5 px-3 text-right text-[#6E4D7B] font-semibold">{formatVal(f.predicted)}</td>
                      <td className="py-1.5 px-3 text-right text-[#4A4D48]">
                        {isCountUnit
                          ? formatEsInt(f.error, { signed: true })
                          : formatEsDec(f.error, 2, { signed: true })}
                      </td>
                      <td className="py-1.5 px-3 text-right font-semibold text-[#202321]">
                        {formatVal(f.absError)}
                      </td>
                      <td className="py-1.5 px-3 text-right text-[#77766F]">
                        {formatVal(f.naiveAbsError)}
                      </td>
                      <td className="py-1.5 px-3 text-center font-sans">
                        {activeModel.modelId === 'naive' ? (
                          <span className="text-[#A6A18F]">—</span>
                        ) : f.beatsNaive ? (
                          <span className="text-[#2D6A4F] font-semibold">Sí</span>
                        ) : (
                          <span className="text-[#C64B37]">No</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Section C: Interactive Chart & Model-Compatible Prediction Intervals */}
      <div className="bg-[#FAF9F5] border border-[#DAD6CC] rounded-sm p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-3 border-b border-[#DAD6CC] gap-2">
          <div>
            <h3 className="font-serif text-xl text-[#202321] flex items-center gap-2">
              <LineChartIcon className="w-4 h-4 text-[#6E4D7B]" />
              <span>{activeAudit.label} — Modelo seleccionado: {activeModel.modelName}</span>
            </h3>
            <p className="text-xs text-[#77766F] mt-0.5">
              Proyección experimental h=1..3 ({activeModel.projections.map(p => p.year).join(', ')}) con fórmula de incertidumbre propia del modelo:{' '}
              <span className="font-mono text-[#202321]">{activeModel.intervalFormula}</span> (σ = {formatVal(activeModel.residualSigma)} {activeAudit.unit}).
            </p>
          </div>
          <CategoryBadge category="PREDICCION" />
        </div>

        <InteractiveLineChart
          series={chartSeriesList}
          unit={activeAudit.unit}
          height={360}
        />

        <div className="overflow-x-auto border border-[#DAD6CC]">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="text-[#202321] bg-[#ECE8DD] border-b border-[#DAD6CC]">
                <th className="py-2 px-3 font-sans font-semibold">Horizonte Anual (31-dic)</th>
                <th className="py-2 px-3 text-right">Proyección Puntual ({activeModel.shortName})</th>
                <th className="py-2 px-3 text-right">Intervalo 80%</th>
                <th className="py-2 px-3 text-right">Intervalo 95%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E2D8]">
              {activeModel.projections.map(p => (
                <tr key={p.year} className="hover:bg-[#F4EFF7]/60">
                  <td className="py-2 px-3 font-bold text-[#202321]">
                    {p.year} <span className="text-[10px] font-normal text-[#77766F]">(h={formatEsInt(p.horizon)})</span>
                  </td>
                  <td className="py-2 px-3 text-right font-bold text-[#6E4D7B]">
                    {formatVal(p.point)} {activeAudit.unit}
                  </td>
                  <td className="py-2 px-3 text-right text-[#4A4D48]">
                    [{formatVal(p.lower80)} – {formatVal(p.upper80)}]
                  </td>
                  <td className="py-2 px-3 text-right text-[#77766F]">
                    [{formatVal(p.lower95)} – {formatVal(p.upper95)}]
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-[#77766F] leading-relaxed">
          Nota sobre incertidumbre: las proyecciones no representan certezas ni predicciones deterministas de la gestión sanitaria futura. Constituyen escenarios cuantitativos sujetos a bandas de incertidumbre empíricas (80% y 95%) condicionadas a la inercia histórica observada, las cuales no anticipan cambios organizativos, presupuestarios o reformas estructurales.
        </p>
      </div>

      {/* Transparency Footer */}
      <div className="p-4 bg-[#F4EFF7] border border-[#6E4D7B]/35 rounded-sm text-xs text-[#4F3559] space-y-1">
        <div className="font-bold flex items-center gap-1.5 text-[#202321]">
          <ShieldCheck className="w-4 h-4 text-[#6E4D7B]" />
          <span>Rigor estadístico en series anuales cortas (N={formatEsInt(activeAudit.seriesAudit.n)})</span>
        </div>
        <p className="text-[11px] text-[#4A4D48] leading-relaxed">
          Todos los modelos estadísticos comparados (Naive, Drift, Holt ETS(A,A,N), Holt Amortiguado ETS(A,Ad,N) y ARIMA parsimonioso) se entrenan sin fuga de datos futuros y compiten sobre idénticas ventanas de validación cruzada rodante. Cuando ningún modelo supera al baseline Naive en error fuera de muestra, se conserva Naive como modelo seleccionado por el principio de parsimonia para evitar proyecciones de tendencia sobreajustadas.
        </p>
      </div>
    </div>
  );
};
