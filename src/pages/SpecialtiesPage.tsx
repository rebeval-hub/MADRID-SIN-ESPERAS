import React, { useState } from 'react';
import { Stethoscope, Activity, BarChart3, TrendingUp, Scissors, Info, BedDouble } from 'lucide-react';
import { FullHealthData } from '../types';
import { CategoryBadge } from '../components/common/Badge';
import { InteractiveBarChart, BarItem } from '../components/charts/InteractiveBarChart';
import { InteractiveLineChart, LineSeries } from '../components/charts/InteractiveLineChart';
import { formatEsAuto, formatEsDec, formatEsInt } from '../utils/format';

interface SpecialtiesPageProps {
  data: FullHealthData;
}

export const SpecialtiesPage: React.FC<SpecialtiesPageProps> = ({ data }) => {
  const { specialties, diagnosticActivity, frecuentacion, auditReport } = data;
  const [activeTab, setActiveTab] = useState<'consultas' | 'pruebas' | 'cma' | 'frecuentacion'>('consultas');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>(specialties[0]?.specialty || '');
  const [selectedFrecIndex, setSelectedFrecIndex] = useState<number>(0);

  const latestSpecYear = specialties[0]?.latestYear || '2023';
  const latestActYear = diagnosticActivity[0]?.latestYear || '2023';
  const latestFrecYear = frecuentacion[0]?.latestYear || '2023';

  const specialtyBarItems: BarItem[] = specialties.map(s => ({
    id: s.specialty,
    label: s.specialty,
    value: s.latestValue,
    color: '#426C79'
  }));

  const activeSpecObj = specialties.find(s => s.specialty === selectedSpecialty) || specialties[0];
  const specialtyLineSeries: LineSeries[] = activeSpecObj
    ? [
        {
          id: activeSpecObj.specialty,
          name: activeSpecObj.specialty,
          color: '#426C79',
          firstPeriod: activeSpecObj.series[0]?.year,
          lastPeriod: activeSpecObj.series[activeSpecObj.series.length - 1]?.year,
          data: activeSpecObj.series.map(pt => ({
            x: pt.year,
            y: pt.value
          }))
        }
      ]
    : [];

  // Separate surgical volume items from diagnostic imaging items so units don't mix
  const diagnosticBarItems: BarItem[] = diagnosticActivity
    .filter(d => !d.procedure.toLowerCase().includes('ambulatorización'))
    .map(d => ({
      id: d.procedure,
      label: d.procedure,
      value: d.latestValue,
      color: '#6E4D7B'
    }));

  const cmaItem = diagnosticActivity.find(d => d.procedure.includes('Cirugía mayor ambulatoria'));
  const hospItem = diagnosticActivity.find(d => d.procedure.includes('Intervenciones con hospitalización'));
  const tasaCmaItem = diagnosticActivity.find(d => d.procedure.includes('Tasa de ambulatorización'));

  const cmaComparisonSeries: LineSeries[] = [];
  if (cmaItem) {
    cmaComparisonSeries.push({
      id: 'cma',
      name: 'Cirugía Mayor Ambulatoria (CMA)',
      color: '#2D6A4F',
      data: cmaItem.series.map(pt => ({ x: pt.year, y: pt.value }))
    });
  }
  if (hospItem) {
    cmaComparisonSeries.push({
      id: 'hosp',
      name: 'Intervenciones con Hospitalización',
      color: '#C64B37',
      data: hospItem.series.map(pt => ({ x: pt.year, y: pt.value }))
    });
  }

  // Exact computed sums from dataset
  const traumaVal = specialties.find(s => s.specialty.includes('Traumatología'))?.latestValue ?? 0;
  const gineVal = specialties.find(s => s.specialty.includes('Ginecología'))?.latestValue ?? 0;
  const oftalVal = specialties.find(s => s.specialty.includes('Oftalmología'))?.latestValue ?? 0;
  const dermaVal = specialties.find(s => s.specialty.includes('Dermatología'))?.latestValue ?? 0;
  const top3SpecificSum = traumaVal + gineVal + oftalVal;

  const rmVal = diagnosticActivity.find(d => d.procedure.includes('Resonancia'))?.latestValue ?? 0;
  const tacVal = diagnosticActivity.find(d => d.procedure.includes('TAC'))?.latestValue ?? 0;
  const latestCmaRate = tasaCmaItem?.series[tasaCmaItem.series.length - 1];

  // Frecuentación (9th dataset) series
  const activeFrecObj = frecuentacion[selectedFrecIndex] || frecuentacion[0];
  const frecLineSeries: LineSeries[] = activeFrecObj
    ? [
        {
          id: activeFrecObj.indicator,
          name: `${activeFrecObj.indicator} (${activeFrecObj.unit})`,
          color: '#426C79',
          firstPeriod: activeFrecObj.series[0]?.year,
          lastPeriod: activeFrecObj.series[activeFrecObj.series.length - 1]?.year,
          data: activeFrecObj.series.map(pt => ({
            x: pt.year,
            y: pt.value
          }))
        }
      ]
    : [];

  const occPublic = frecuentacion.find(
    f => f.indicator.toLowerCase().includes('ocupación') && f.indicator.toLowerCase().includes('públicos')
  );
  const occPrivate = frecuentacion.find(
    f => f.indicator.toLowerCase().includes('ocupación') && f.indicator.toLowerCase().includes('privados')
  );

  const occupancyComparisonSeries: LineSeries[] = [];
  if (occPublic) {
    occupancyComparisonSeries.push({
      id: 'occ_pub',
      name: 'Ocupación Hospitales Públicos-SNS (%)',
      color: '#426C79',
      firstPeriod: occPublic.series[0]?.year,
      lastPeriod: occPublic.latestYear,
      data: occPublic.series.map(pt => ({ x: pt.year, y: pt.value }))
    });
  }
  if (occPrivate) {
    occupancyComparisonSeries.push({
      id: 'occ_priv',
      name: 'Ocupación Hospitales Privados (%)',
      color: '#D47528',
      dashed: true,
      firstPeriod: occPrivate.series[0]?.year,
      lastPeriod: occPrivate.latestYear,
      data: occPrivate.series.map(pt => ({ x: pt.year, y: pt.value }))
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#FAF9F5] border border-[#DAD6CC] rounded-sm p-5 flex flex-col gap-3.5">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="font-serif text-2xl tracking-tight text-[#202321]">
              Especialidades Médicas, Diagnóstico y Frecuentación (ESCRI)
            </h2>
            <CategoryBadge category="OFICIAL" />
          </div>
          <p className="text-xs text-[#77766F] mt-1">
            Actividad asistencial anual acumulada en establecimientos con régimen de internado • Último ejercicio disponible:{' '}
            <strong className="text-[#202321] font-mono">{latestSpecYear}</strong> (Ministerio de Sanidad / Comunidad de Madrid).
          </p>
        </div>

        <div className="flex flex-wrap items-center bg-[#ECE8DD] p-1 rounded-xs text-xs font-medium gap-0.5 w-fit">
          <button
            onClick={() => setActiveTab('consultas')}
            className={`px-3 py-1.5 rounded-xs transition-colors cursor-pointer ${
              activeTab === 'consultas' ? 'bg-[#C64B37] text-[#FAF9F5] font-semibold' : 'text-[#4A4D48] hover:text-[#202321]'
            }`}
          >
            Consultas por Especialidad
          </button>
          <button
            onClick={() => setActiveTab('pruebas')}
            className={`px-3 py-1.5 rounded-xs transition-colors cursor-pointer ${
              activeTab === 'pruebas' ? 'bg-[#6E4D7B] text-[#FAF9F5] font-semibold' : 'text-[#4A4D48] hover:text-[#202321]'
            }`}
          >
            Actividad Diagnóstica
          </button>
          <button
            onClick={() => setActiveTab('cma')}
            className={`px-3 py-1.5 rounded-xs transition-colors cursor-pointer ${
              activeTab === 'cma' ? 'bg-[#2D6A4F] text-[#FAF9F5] font-semibold' : 'text-[#4A4D48] hover:text-[#202321]'
            }`}
          >
            Ambulatorización (CMA)
          </button>
          <button
            onClick={() => setActiveTab('frecuentacion')}
            className={`px-3 py-1.5 rounded-xs transition-colors cursor-pointer ${
              activeTab === 'frecuentacion' ? 'bg-[#426C79] text-[#FAF9F5] font-semibold' : 'text-[#4A4D48] hover:text-[#202321]'
            }`}
          >
            Frecuentación y Ocupación
          </button>
        </div>
      </div>

      {/* Scope Clarification Banner */}
      <div className="bg-[#EDF3F5] border border-[#426C79]/35 rounded-sm p-3.5 text-xs text-[#202321] flex items-start gap-2.5">
        <Info className="w-4 h-4 text-[#426C79] shrink-0 mt-0.5" />
        <p className="text-[11px] leading-relaxed">
          <strong>Nota de procedencia y periodo ({activeTab === 'frecuentacion' ? auditReport.details.Frecuentacion?.dateRange || '2007–2023' : auditReport.details.Consultas_Especialidad?.dateRange || '2010–2023'}):</strong> Estos indicadores proceden de los 3 ficheros oficiales ESCRI del portal de datos abiertos (<em>Consultas por especialidad</em>, <em>Actividad diagnóstica y quirúrgica</em> y <em>Frecuentación hospitalaria</em>). Miden{' '}
          <strong>actividad asistencial realizada y tasas de uso</strong> en establecimientos con internado de la Comunidad de Madrid (no son listas de espera del SERMAS ni tienen corte 2024–2025).
        </p>
      </div>

      {activeTab === 'consultas' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between pb-1 border-b border-[#DAD6CC]">
                <h3 className="font-serif text-lg text-[#202321] flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#426C79]" />
                  <span>Volumen de Consultas por Especialidad ({latestSpecYear})</span>
                </h3>
                <CategoryBadge category="OFICIAL" />
              </div>
              <InteractiveBarChart
                items={specialtyBarItems}
                unit="consultas"
                height={400}
                horizontal={true}
                maxItems={17}
              />
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between pb-1 border-b border-[#DAD6CC]">
                <h3 className="font-serif text-lg text-[#202321] flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#426C79]" />
                  <span>Evolución Histórica: {activeSpecObj?.specialty}</span>
                </h3>
                <CategoryBadge category="OFICIAL" />
              </div>

              <div className="bg-[#FAF9F5] border border-[#DAD6CC] rounded-sm p-3">
                <label className="text-[11px] font-mono uppercase tracking-wider font-semibold text-[#77766F] block mb-1.5">
                  Seleccionar especialidad médica ({activeSpecObj?.series[0]?.year}–{latestSpecYear}):
                </label>
                <select
                  value={selectedSpecialty}
                  onChange={e => setSelectedSpecialty(e.target.value)}
                  className="w-full bg-[#F3F0E8] border border-[#DAD6CC] text-xs rounded-xs p-2 font-medium text-[#202321] focus:outline-none focus:border-[#426C79]"
                >
                  {specialties.map(s => (
                    <option key={s.specialty} value={s.specialty}>
                      {s.specialty} ({formatEsInt(s.latestValue)} consultas en {s.latestYear})
                    </option>
                  ))}
                </select>
              </div>

              <InteractiveLineChart
                series={specialtyLineSeries}
                unit="consultas"
                height={330}
              />
            </div>
          </div>

          <div className="bg-[#FAF9F5] border border-[#DAD6CC] rounded-sm p-4">
            <h4 className="text-[11px] font-mono font-bold text-[#202321] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5 text-[#C64B37]" />
              <span>Concentración de la Actividad de Consultas ({latestSpecYear})</span>
            </h4>
            <p className="text-xs text-[#4A4D48] leading-relaxed">
              Excluyendo las categorías residuales agrupadas (<em>Otras especialidades médicas</em> y <em>Otras especialidades quirúrgicas</em>), las tres especialidades individuales con mayor volumen en {latestSpecYear} son{' '}
              <strong className="text-[#202321]">Traumatología</strong> ({formatEsInt(traumaVal)}),{' '}
              <strong className="text-[#202321]">Ginecología y obstetricia</strong> ({formatEsInt(gineVal)}) y{' '}
              <strong className="text-[#202321]">Oftalmología</strong> ({formatEsInt(oftalVal)}), sumando conjuntamente{' '}
              <strong className="font-mono text-[#202321]">{formatEsInt(top3SpecificSum)} consultas</strong> anuales, seguidas por{' '}
              <strong className="text-[#202321]">Dermatología</strong> ({formatEsInt(dermaVal)}).
            </p>
          </div>
        </div>
      )}

      {activeTab === 'pruebas' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between pb-1 border-b border-[#DAD6CC]">
                <h3 className="font-serif text-lg text-[#202321] flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#6E4D7B]" />
                  <span>Indicadores de Actividad Diagnóstica y Quirúrgica ({latestActYear})</span>
                </h3>
                <CategoryBadge category="OFICIAL" />
              </div>
              <InteractiveBarChart
                items={diagnosticBarItems}
                unit="actos"
                height={380}
                horizontal={true}
                maxItems={15}
              />
            </div>

            <div className="space-y-4">
              <div className="bg-[#FAF9F5] border border-[#DAD6CC] rounded-sm p-5">
                <h4 className="font-serif text-base text-[#202321] mb-2">
                  Resonancias Magnéticas (RM) y TAC ({latestActYear})
                </h4>
                <p className="text-xs text-[#4A4D48] leading-relaxed">
                  En el ejercicio {latestActYear} (último publicado en ESCRI), los centros con régimen de internado de la Comunidad de Madrid registraron{' '}
                  <strong className="text-[#202321] font-mono">{formatEsInt(rmVal)}</strong> resonancias magnéticas y{' '}
                  <strong className="text-[#202321] font-mono">{formatEsInt(tacVal)}</strong> exploraciones de TAC.
                </p>
              </div>

              <div className="bg-[#FAF9F5] border border-[#DAD6CC] rounded-sm p-5">
                <h4 className="font-serif text-base text-[#202321] mb-2">
                  Cobertura y Diferencia frente a LEPD
                </h4>
                <p className="text-xs text-[#4A4D48] leading-relaxed">
                  Estos recuentos reflejan <strong className="text-[#202321]">pruebas efectuadas</strong> durante todo el año {latestActYear} en hospitales públicos y privados (ESCRI), por lo que no deben sumarse ni confundirse con los pacientes pendientes en espera estructural del SERMAS (LEPD, dic-2024).
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'cma' && (
        <div className="space-y-6">
          <div className="bg-[#FAF9F5] border border-[#DAD6CC] rounded-sm p-5">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-3 mb-4 border-b border-[#E6E2D8]">
              <div>
                <h3 className="font-serif text-xl text-[#202321] flex items-center gap-2">
                  <Scissors className="w-4 h-4 text-[#2D6A4F]" />
                  <span>Cirugía Mayor Ambulatoria (CMA) vs Hospitalización ({cmaItem?.series[0]?.year}–{latestActYear})</span>
                </h3>
                <p className="text-xs text-[#77766F] mt-1">
                  Tasa oficial de ambulatorización públicos-SNS en {latestCmaRate?.year ?? latestActYear}:{' '}
                  <strong className="font-mono text-[#2D6A4F]">{formatEsDec(latestCmaRate?.value, 2)}%</strong> (ESCRI).
                </p>
              </div>
              <CategoryBadge category="OFICIAL" />
            </div>

            <InteractiveLineChart
              series={cmaComparisonSeries}
              unit="intervenciones"
              height={320}
            />

            <div className="mt-4 p-3.5 bg-[#EBF3EE] border border-[#2D6A4F]/30 rounded-xs text-xs text-[#1F513B] flex items-start gap-2">
              <span className="font-bold shrink-0">Definición oficial (ESCRI):</span>
              <p className="text-[11px] leading-relaxed">
                Tasa de ambulatorización = (Total intervenciones CMA / (Intervenciones CMA + Intervenciones con hospitalización)) × 100. En {latestActYear}, se realizaron{' '}
                <strong className="font-mono">{formatEsInt(cmaItem?.latestValue)}</strong> intervenciones CMA frente a{' '}
                <strong className="font-mono">{formatEsInt(hospItem?.latestValue)}</strong> con hospitalización.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'frecuentacion' && (
        <div className="space-y-6">
          {/* Summary Ledger Strip for 2023 Frecuentacion indicators */}
          <div className="bg-[#FAF9F5] border border-[#DAD6CC] rounded-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#DAD6CC]">
            {frecuentacion.slice(0, 6).map((item, idx) => (
              <div
                key={item.indicator}
                className={`p-4 flex flex-col justify-between ${idx >= 3 ? 'sm:border-t sm:border-[#DAD6CC]' : ''}`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-mono text-[#2D4F5A] bg-[#EDF3F5] border border-[#426C79]/30 px-1.5 py-0.5 rounded-xs">
                      {item.unit} • {item.latestYear}
                    </span>
                    <CategoryBadge category="OFICIAL" />
                  </div>
                  <h4 className="text-xs font-semibold text-[#202321] leading-snug">{item.indicator}</h4>
                </div>
                <div className="mt-3 pt-2 border-t border-[#E6E2D8] flex items-baseline justify-between font-mono">
                  <span className="text-2xl font-bold text-[#202321] tabular-nums">
                    {formatEsAuto(item.latestValue, 2)}
                  </span>
                  <span className="text-[10px] text-[#77766F]">
                    Serie {item.series[0]?.year}–{item.latestYear}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Selector + Line chart for any of the 14 Frecuentacion indicators */}
            <div className="bg-[#FAF9F5] border border-[#DAD6CC] rounded-sm p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#E6E2D8]">
                <h3 className="font-serif text-lg text-[#202321] flex items-center gap-2">
                  <BedDouble className="w-4 h-4 text-[#426C79]" />
                  <span>Serie Histórica ESCRI ({activeFrecObj?.series[0]?.year}–{latestFrecYear})</span>
                </h3>
                <CategoryBadge category="OFICIAL" />
              </div>

              <select
                value={selectedFrecIndex}
                onChange={e => setSelectedFrecIndex(Number(e.target.value))}
                className="w-full bg-[#F3F0E8] border border-[#DAD6CC] text-xs rounded-xs p-2 font-medium text-[#202321] focus:outline-none focus:border-[#426C79]"
              >
                {frecuentacion.map((f, idx) => (
                  <option key={f.indicator} value={idx}>
                    {f.indicator} ({formatEsAuto(f.latestValue, 2)} {f.unit} en {f.latestYear})
                  </option>
                ))}
              </select>

              <InteractiveLineChart
                series={frecLineSeries}
                unit={activeFrecObj?.unit || ''}
                height={300}
              />
            </div>

            {/* Occupancy Comparison Públicos-SNS vs Privados */}
            <div className="bg-[#FAF9F5] border border-[#DAD6CC] rounded-sm p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#E6E2D8]">
                <h3 className="font-serif text-lg text-[#202321] flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#426C79]" />
                  <span>Índice de Ocupación: Públicos-SNS vs Privados (%)</span>
                </h3>
                <CategoryBadge category="OFICIAL" />
              </div>
              <p className="text-[11px] text-[#77766F]">
                Comparativa oficial del grado de ocupación de camas en hospitales generales de la Comunidad de Madrid (2007–{occPublic?.latestYear || '2023'}).
              </p>
              <InteractiveLineChart
                series={occupancyComparisonSeries}
                unit="%"
                height={300}
              />
            </div>
          </div>

          {/* Complete Table of Frecuentacion indicators */}
          <div className="bg-[#FAF9F5] border border-[#DAD6CC] rounded-sm p-5 space-y-3">
            <h3 className="font-serif text-lg text-[#202321]">
              Catálogo Completo de Indicadores de Frecuentación Hospitalaria (Dataset oficial nº 9 • 2007–{latestFrecYear})
            </h3>
            <div className="overflow-x-auto border border-[#DAD6CC]">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#ECE8DD] border-b border-[#DAD6CC] text-[#202321] font-mono text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 px-3">Indicador Oficial (ESCRI)</th>
                    <th className="py-2.5 px-3">Unidad</th>
                    <th className="py-2.5 px-3">Periodo</th>
                    <th className="py-2.5 px-3 text-right">Último Valor ({latestFrecYear})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E2D8]">
                  {frecuentacion.map(item => (
                    <tr key={item.indicator} className="hover:bg-[#F3F0E8]/70">
                      <td className="py-2 px-3 font-medium text-[#202321]">{item.indicator}</td>
                      <td className="py-2 px-3 text-[#77766F] font-mono text-[11px]">{item.unit}</td>
                      <td className="py-2 px-3 text-[#77766F] font-mono text-[11px]">
                        {item.series[0]?.year}–{item.latestYear}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-[#426C79]">
                        {formatEsAuto(item.latestValue, 2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
