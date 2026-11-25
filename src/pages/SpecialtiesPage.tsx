import React, { useState } from 'react';
import { Stethoscope, Activity, BarChart3, TrendingUp, Info } from 'lucide-react';
import { FullHealthData } from '../types';
import { CategoryBadge } from '../components/common/Badge';
import { InteractiveBarChart, BarItem } from '../components/charts/InteractiveBarChart';
import { InteractiveLineChart, LineSeries } from '../components/charts/InteractiveLineChart';
import { formatEsInt } from '../utils/format';

interface SpecialtiesPageProps {
  data: FullHealthData;
}

export const SpecialtiesPage: React.FC<SpecialtiesPageProps> = ({ data }) => {
  const { specialties, diagnosticActivity, auditReport } = data;
  const [activeTab, setActiveTab] = useState<'consultas' | 'pruebas'>('consultas');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>(specialties[0]?.specialty || '');

  const latestSpecYear = specialties[0]?.latestYear || '2023';
  const latestActYear = diagnosticActivity[0]?.latestYear || '2023';

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

  // Exact computed sums from dataset
  const traumaVal = specialties.find(s => s.specialty.includes('Traumatología'))?.latestValue ?? 0;
  const gineVal = specialties.find(s => s.specialty.includes('Ginecología'))?.latestValue ?? 0;
  const oftalVal = specialties.find(s => s.specialty.includes('Oftalmología'))?.latestValue ?? 0;
  const dermaVal = specialties.find(s => s.specialty.includes('Dermatología'))?.latestValue ?? 0;
  const top3SpecificSum = traumaVal + gineVal + oftalVal;

  const rmVal = diagnosticActivity.find(d => d.procedure.includes('Resonancia'))?.latestValue ?? 0;
  const tacVal = diagnosticActivity.find(d => d.procedure.includes('TAC'))?.latestValue ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#FAF9F5] border border-[#DAD6CC] rounded-sm p-5 flex flex-col gap-3.5">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="font-serif text-2xl tracking-tight text-[#202321]">
              Especialidades Médicas y Actividad Diagnóstica (ESCRI)
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
        </div>
      </div>

      {/* Scope Clarification Banner */}
      <div className="bg-[#EDF3F5] border border-[#426C79]/35 rounded-sm p-3.5 text-xs text-[#202321] flex items-start gap-2.5">
        <Info className="w-4 h-4 text-[#426C79] shrink-0 mt-0.5" />
        <p className="text-[11px] leading-relaxed">
          <strong>Nota de procedencia y periodo ({auditReport.details.Consultas_Especialidad?.dateRange || '2010–2023'}):</strong> Estos indicadores proceden de los ficheros oficiales ESCRI del portal de datos abiertos (<em>Consultas por especialidad</em> y <em>Actividad diagnóstica y quirúrgica</em>). Miden{' '}
          <strong>actividad asistencial realizada</strong> en establecimientos con internado de la Comunidad de Madrid (no son listas de espera del SERMAS ni tienen corte 2024–2025).
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
    </div>
  );
};
