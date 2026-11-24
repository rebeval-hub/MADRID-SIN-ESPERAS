import React, { useState, useMemo } from 'react';
import {
  Sliders,
  Activity,
  GitBranch,
  UserCheck,
  RotateCcw,
  Info,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Building2
} from 'lucide-react';
import { FullHealthData, HospitalMetadata } from '../types';
import {
  runCapacitySimulation,
  runRedistributionSimulation,
  runRejectionSimulation,
  AreaScope
} from '../utils/simulationEngine';

interface SimulatorsPageProps {
  data: FullHealthData;
  onSelectHospital?: (hospital: HospitalMetadata) => void;
}

const fmtInt = (n: number) => n.toLocaleString('es-ES');

export const SimulatorsPage: React.FC<SimulatorsPageProps> = ({ data, onSelectHospital }) => {
  // Estado Simulador 1: Capacidad y Quirófanos
  const [extraOR, setExtraOR] = useState<number>(10);
  const [shiftBoostPct, setShiftBoostPct] = useState<number>(10);
  const [horizonMonths, setHorizonMonths] = useState<number>(12);

  // Estado Simulador 2: Redistribución Territorial
  const [redistributionPct, setRedistributionPct] = useState<number>(15);
  const [areaScope, setAreaScope] = useState<AreaScope>('Todas');

  // Estado Simulador 3: Gestión de Rechazos
  const [rejectionReductionPct, setRejectionReductionPct] = useState<number>(30);

  // Resultados en tiempo real
  const capRes = useMemo(
    () =>
      runCapacitySimulation(data, {
        extraOperatingRooms: extraOR,
        afternoonShiftBoostPct: shiftBoostPct,
        horizonMonths
      }),
    [data, extraOR, shiftBoostPct, horizonMonths]
  );

  const redRes = useMemo(
    () =>
      runRedistributionSimulation(data, {
        redistributionPct,
        areaScope
      }),
    [data, redistributionPct, areaScope]
  );

  const rejRes = useMemo(
    () =>
      runRejectionSimulation(data, {
        rejectionReductionPct
      }),
    [data, rejectionReductionPct]
  );

  return (
    <div className="space-y-8 pb-6">
      {/* Cabecera editorial del módulo */}
      <header className="border-b border-[#DAD6CC] pb-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#C64B37] font-semibold">
                MÓDULO 08 · LABORATORIO DE ESCENARIOS
              </span>
              <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-medium tracking-wide rounded-xs border border-[#6E4D7B]/35 bg-[#F4EFF7] text-[#4F3559] px-2 py-0.5">
                <span className="w-1.5 h-1.5 bg-[#6E4D7B]" />
                Simulación What-If
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl text-[#202321] tracking-tight">
              Simuladores del Futuro del Sistema Sanitario
            </h1>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-[#77766F] bg-[#FAF9F5] border border-[#DAD6CC] px-3 py-1.5 rounded-sm">
            <Sliders className="w-3.5 h-3.5 text-[#426C79]" />
            <span>Base calibrada: SERMAS 2025 ({capRes.totalBaseOR} quirófanos · 31 hospitales)</span>
          </div>
        </div>

        <p className="text-sm text-[#77766F] max-w-4xl leading-relaxed">
          Explora cómo responderían las listas de espera de la Comunidad de Madrid ante tres intervenciones concretas: ampliación de capacidad quirúrgica, redistribución territorial por Libre Elección y reducción de rechazos a derivación. Todos los cálculos parten de los datos oficiales auditados y muestran explícitamente sus supuestos.
        </p>
      </header>

      {/* ===================================================================== */}
      {/* SIMULADOR 1: CAPACIDAD QUIRÚRGICA Y QUIRÓFANOS */}
      {/* ===================================================================== */}
      <section className="bg-[#FAF9F5] border border-[#DAD6CC] rounded-sm shadow-2xs overflow-hidden">
        <div className="border-b border-[#DAD6CC] px-5 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3 bg-[#F3F0E8]/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#426C79]/10 text-[#426C79] rounded-sm">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#426C79] font-semibold">
                Simulador 01 · Oferta y Rendimiento
              </span>
              <h2 className="font-serif text-xl text-[#202321]">
                Capacidad Quirúrgica y Quirófanos (Ley de Little)
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setExtraOR(0);
              setShiftBoostPct(0);
              setHorizonMonths(12);
            }}
            className="inline-flex items-center gap-1.5 text-xs font-mono text-[#77766F] hover:text-[#202321] border border-[#DAD6CC] bg-[#FAF9F5] px-2.5 py-1.5 rounded-sm transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Escenario base (0%)</span>
          </button>
        </div>

        <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controles */}
          <div className="lg:col-span-5 space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="sim1-or" className="font-medium text-[#202321]">
                  Nuevos quirófanos en la red SERMAS
                </label>
                <span className="font-mono font-bold text-[#426C79]">
                  +{extraOR} quirófanos ({capRes.effectiveOR} totales)
                </span>
              </div>
              <input
                id="sim1-or"
                type="range"
                min={0}
                max={40}
                step={2}
                value={extraOR}
                onChange={e => setExtraOR(Number(e.target.value))}
                className="w-full accent-[#426C79] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-[#77766F]">
                <span>0 (actual: {capRes.totalBaseOR})</span>
                <span>+20</span>
                <span>+40</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="sim1-shift" className="font-medium text-[#202321]">
                  Ampliación de actividad (turnos de tarde / sábados)
                </label>
                <span className="font-mono font-bold text-[#426C79]">+{shiftBoostPct}%</span>
              </div>
              <input
                id="sim1-shift"
                type="range"
                min={0}
                max={35}
                step={1}
                value={shiftBoostPct}
                onChange={e => setShiftBoostPct(Number(e.target.value))}
                className="w-full accent-[#426C79] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-[#77766F]">
                <span>0% (actual)</span>
                <span>+15%</span>
                <span>+35%</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="block text-xs font-medium text-[#202321]">
                Horizonte de evaluación
              </span>
              <div className="grid grid-cols-4 gap-2">
                {[6, 12, 18, 24].map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setHorizonMonths(m)}
                    className={`py-1.5 text-xs font-mono rounded-sm border transition-colors cursor-pointer ${
                      horizonMonths === m
                        ? 'bg-[#426C79] text-[#FAF9F5] border-[#426C79] font-semibold'
                        : 'bg-white text-[#202321] border-[#DAD6CC] hover:border-[#426C79]'
                    }`}
                  >
                    {m} meses
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Resultados */}
          <div className="lg:col-span-7 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-[#F3F0E8] border border-[#DAD6CC] p-3.5 rounded-sm">
                <p className="font-mono text-[10px] uppercase text-[#77766F]">
                  Espera media simulada ({horizonMonths}m)
                </p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="font-mono text-2xl font-bold text-[#202321]">
                    {capRes.simulatedWaitDays} d
                  </span>
                  <span
                    className={`inline-flex items-center text-xs font-mono font-semibold ${
                      capRes.daysSavedVsInertial >= 0 ? 'text-[#1F513B]' : 'text-[#C64B37]'
                    }`}
                  >
                    {capRes.daysSavedVsInertial >= 0 ? (
                      <>
                        <ArrowDownRight className="w-3.5 h-3.5" />-{capRes.daysSavedVsInertial} d
                      </>
                    ) : (
                      <>
                        <ArrowUpRight className="w-3.5 h-3.5" />+{Math.abs(capRes.daysSavedVsInertial)} d
                      </>
                    )}
                  </span>
                </div>
                <p className="text-[11px] text-[#77766F] mt-1">
                  Sin cambios: {capRes.inertialWaitDays} d (base 2025: {capRes.baseWaitDays} d)
                </p>
              </div>

              <div className="bg-[#F3F0E8] border border-[#DAD6CC] p-3.5 rounded-sm">
                <p className="font-mono text-[10px] uppercase text-[#77766F]">
                  Cola estructural proyectada
                </p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="font-mono text-2xl font-bold text-[#202321]">
                    {fmtInt(capRes.simulatedQueue)}
                  </span>
                </div>
                <p className="text-[11px] text-[#77766F] mt-1">
                  {capRes.patientsReducedVsInertial >= 0
                    ? `${fmtInt(capRes.patientsReducedVsInertial)} pac. menos vs. inercia`
                    : `${fmtInt(Math.abs(capRes.patientsReducedVsInertial))} pac. más vs. inercia`}
                </p>
              </div>

              <div className="bg-[#F3F0E8] border border-[#DAD6CC] p-3.5 rounded-sm">
                <p className="font-mono text-[10px] uppercase text-[#77766F]">
                  Balance neto mensual
                </p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span
                    className={`font-mono text-2xl font-bold ${
                      capRes.monthlyNetBalance <= 0 ? 'text-[#1F513B]' : 'text-[#C64B37]'
                    }`}
                  >
                    {capRes.monthlyNetBalance > 0 ? `+${fmtInt(capRes.monthlyNetBalance)}` : fmtInt(capRes.monthlyNetBalance)}
                  </span>
                  <span className="text-xs font-mono text-[#77766F]">pac/mes</span>
                </div>
                <p className="text-[11px] text-[#77766F] mt-1">
                  Salidas: {fmtInt(capRes.simulatedMonthlyExits)}/mes (base: {fmtInt(capRes.baseMonthlyExits)})
                </p>
              </div>
            </div>

            {/* Comparativa visual en barras */}
            <div className="bg-white border border-[#DAD6CC] p-4 rounded-sm space-y-3">
              <p className="font-mono text-[10px] uppercase tracking-wider text-[#77766F] font-semibold">
                Comparativa de demora media quirúrgica (días)
              </p>
              {[
                { label: 'Oficial dic-2025', val: capRes.baseWaitDays, color: 'bg-[#77766F]' },
                { label: `Inercial (${horizonMonths}m sin cambios)`, val: capRes.inertialWaitDays, color: 'bg-[#C64B37]' },
                { label: `Simulado (${horizonMonths}m con refuerzo)`, val: capRes.simulatedWaitDays, color: 'bg-[#426C79]' }
              ].map(bar => (
                <div key={bar.label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#202321]">{bar.label}</span>
                    <span className="font-mono font-semibold text-[#202321]">{bar.val} días</span>
                  </div>
                  <div className="w-full h-2.5 bg-[#F3F0E8] rounded-xs overflow-hidden">
                    <div
                      className={`h-full ${bar.color} transition-all duration-300`}
                      style={{ width: `${Math.min(100, (bar.val / 80) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Explicación breve obligatoria debajo del simulador */}
        <div className="border-t border-[#DAD6CC] bg-[#F3F0E8]/50 px-5 sm:px-6 py-3.5 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-[#426C79] shrink-0 mt-0.5" />
          <p className="text-xs text-[#77766F] leading-relaxed">
            <strong className="text-[#202321]">Cómo funciona:</strong> Parte de la cola estructural oficial (80.883 pacientes) y las salidas mensuales de dic-2025 (30.448/mes), estimando las entradas mensuales con la deriva observada entre 2024 y 2025 (+584 pac/mes). Al añadir quirófanos o turnos de tarde (con un factor de aprovechamiento operativo del 85%), recalcula el balance neto de cola y aplica la proporcionalidad de la Ley de Little para estimar la demora media resultante, respetando un suelo mínimo estructural de 15 días por preparación preoperatoria.
          </p>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* SIMULADOR 2: REDISTRIBUCIÓN TERRITORIAL (LIBRE ELECCIÓN EN RED) */}
      {/* ===================================================================== */}
      <section className="bg-[#FAF9F5] border border-[#DAD6CC] rounded-sm shadow-2xs overflow-hidden">
        <div className="border-b border-[#DAD6CC] px-5 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3 bg-[#F3F0E8]/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#2D6A4F]/10 text-[#1F513B] rounded-sm">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#1F513B] font-semibold">
                Simulador 02 · Equilibrio en Red
              </span>
              <h2 className="font-serif text-xl text-[#202321]">
                Redistribución Territorial por Libre Elección
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setRedistributionPct(0);
              setAreaScope('Todas');
            }}
            className="inline-flex items-center gap-1.5 text-xs font-mono text-[#77766F] hover:text-[#202321] border border-[#DAD6CC] bg-[#FAF9F5] px-2.5 py-1.5 rounded-sm transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Sin derivaciones</span>
          </button>
        </div>

        <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controles */}
          <div className="lg:col-span-5 space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="sim2-pct" className="font-medium text-[#202321]">
                  Porcentaje de pacientes derivados desde centros saturados
                </label>
                <span className="font-mono font-bold text-[#1F513B]">{redistributionPct}%</span>
              </div>
              <input
                id="sim2-pct"
                type="range"
                min={0}
                max={40}
                step={2}
                value={redistributionPct}
                onChange={e => setRedistributionPct(Number(e.target.value))}
                className="w-full accent-[#2D6A4F] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-[#77766F]">
                <span>0%</span>
                <span>20%</span>
                <span>40%</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="block text-xs font-medium text-[#202321]">
                Ámbito de hospitales a aliviar
              </span>
              <div className="grid grid-cols-3 gap-2">
                {(['Todas', 'Sur', 'Norte', 'Centro', 'Este', 'Oeste'] as AreaScope[]).map(area => (
                  <button
                    key={area}
                    type="button"
                    onClick={() => setAreaScope(area)}
                    className={`py-1.5 text-xs font-mono rounded-sm border transition-colors cursor-pointer ${
                      areaScope === area
                        ? 'bg-[#2D6A4F] text-[#FAF9F5] border-[#2D6A4F] font-semibold'
                        : 'bg-white text-[#202321] border-[#DAD6CC] hover:border-[#2D6A4F]'
                    }`}
                  >
                    {area}
                  </button>
                ))}
              </div>
            </div>

            {/* KPIs resumen */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-[#F3F0E8] border border-[#DAD6CC] p-3 rounded-sm">
                <p className="font-mono text-[10px] uppercase text-[#77766F]">Demora ponderada</p>
                <p className="font-mono text-xl font-bold text-[#202321] mt-0.5">
                  {redRes.simWeightedWait} d
                </p>
                <p className="text-[11px] text-[#1F513B] font-mono">
                  {redRes.daysSavedWeighted >= 0 ? `-${redRes.daysSavedWeighted} d` : `+${Math.abs(redRes.daysSavedWeighted)} d`} vs. {redRes.baseWeightedWait} d
                </p>
              </div>
              <div className="bg-[#F3F0E8] border border-[#DAD6CC] p-3 rounded-sm">
                <p className="font-mono text-[10px] uppercase text-[#77766F]">Brecha máx–mín</p>
                <p className="font-mono text-xl font-bold text-[#202321] mt-0.5">
                  {redRes.simGapDays} d
                </p>
                <p className="text-[11px] text-[#77766F] font-mono">
                  Antes: {redRes.baseGapDays} d ({fmtInt(redRes.patientsMoved)} deriv.)
                </p>
              </div>
            </div>
          </div>

          {/* Listas de impacto */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white border border-[#DAD6CC] p-4 rounded-sm space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-[#1F513B] font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Hospitales más aliviados</span>
              </div>
              {redRes.topRelieved.length === 0 ? (
                <p className="text-xs text-[#77766F] py-4">
                  Mueve el deslizador por encima de 0% para ver el alivio estimado en centros por encima de la mediana.
                </p>
              ) : (
                <div className="space-y-2">
                  {redRes.topRelieved.map(row => (
                    <div
                      key={row.hospital.id}
                      onClick={() => onSelectHospital?.(row.hospital)}
                      className="flex items-center justify-between text-xs p-2 bg-[#F3F0E8]/60 hover:bg-[#EBF3EE] rounded-xs transition-colors cursor-pointer"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-medium text-[#202321] truncate">{row.hospital.shortName}</p>
                        <p className="text-[10px] font-mono text-[#77766F]">
                          {row.baseWait} d → {row.simWait} d
                        </p>
                      </div>
                      <span className="font-mono font-bold text-[#1F513B] shrink-0">
                        {row.deltaDays} d
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white border border-[#DAD6CC] p-4 rounded-sm space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-[#426C79] font-bold">
                <Building2 className="w-3.5 h-3.5" />
                <span>Centros receptores (efecto carga)</span>
              </div>
              {redRes.topReceivers.length === 0 ? (
                <p className="text-xs text-[#77766F] py-4">
                  Sin carga adicional asignada a los centros ágiles de la red.
                </p>
              ) : (
                <div className="space-y-2">
                  {redRes.topReceivers.map(row => (
                    <div
                      key={row.hospital.id}
                      onClick={() => onSelectHospital?.(row.hospital)}
                      className="flex items-center justify-between text-xs p-2 bg-[#F3F0E8]/60 hover:bg-[#EDF3F5] rounded-xs transition-colors cursor-pointer"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-medium text-[#202321] truncate">{row.hospital.shortName}</p>
                        <p className="text-[10px] font-mono text-[#77766F]">
                          {row.baseWait} d → {row.simWait} d
                        </p>
                      </div>
                      <span className="font-mono font-semibold text-[#B4691E] shrink-0">
                        +{row.deltaDays} d
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Explicación breve obligatoria debajo del simulador */}
        <div className="border-t border-[#DAD6CC] bg-[#F3F0E8]/50 px-5 sm:px-6 py-3.5 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-[#1F513B] shrink-0 mt-0.5" />
          <p className="text-xs text-[#77766F] leading-relaxed">
            <strong className="text-[#202321]">Cómo funciona:</strong> Identifica los hospitales del ámbito elegido cuya demora supera la mediana regional y deriva el porcentaje seleccionado hacia los 8 centros más ágiles de la red pública, repartiendo la carga de forma proporcional a sus quirófanos instalados. Muestra tanto el alivio en los hospitales saturados como el incremento realista de carga en los centros receptores (elasticidad de demora de 0,78).
          </p>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* SIMULADOR 3: IMPACTO DEL RECHAZO A DERIVACIÓN */}
      {/* ===================================================================== */}
      <section className="bg-[#FAF9F5] border border-[#DAD6CC] rounded-sm shadow-2xs overflow-hidden">
        <div className="border-b border-[#DAD6CC] px-5 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3 bg-[#F3F0E8]/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#6E4D7B]/10 text-[#4F3559] rounded-sm">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#4F3559] font-semibold">
                Simulador 03 · Gestión del Paciente
              </span>
              <h2 className="font-serif text-xl text-[#202321]">
                Impacto de Reducir el Rechazo a Derivación
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setRejectionReductionPct(0)}
            className="inline-flex items-center gap-1.5 text-xs font-mono text-[#77766F] hover:text-[#202321] border border-[#DAD6CC] bg-[#FAF9F5] px-2.5 py-1.5 rounded-sm transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Situación actual (0%)</span>
          </button>
        </div>

        <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Control */}
          <div className="lg:col-span-5 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="sim4-rej" className="font-medium text-[#202321]">
                  Reducción del rechazo mediante información y apoyo logístico
                </label>
                <span className="font-mono font-bold text-[#4F3559]">-{rejectionReductionPct}%</span>
              </div>
              <input
                id="sim4-rej"
                type="range"
                min={0}
                max={70}
                step={5}
                value={rejectionReductionPct}
                onChange={e => setRejectionReductionPct(Number(e.target.value))}
                className="w-full accent-[#6E4D7B] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-[#77766F]">
                <span>0% (actual: {fmtInt(rejRes.baseRejectionPatients)} pac.)</span>
                <span>-35%</span>
                <span>-70%</span>
              </div>
            </div>

            <div className="bg-white border border-[#DAD6CC] p-3.5 rounded-sm text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#77766F]">Demora estructural oficial:</span>
                <span className="font-mono font-semibold text-[#202321]">{rejRes.baseStructuralWait} días</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#77766F]">Demora tras rechazo oficial:</span>
                <span className="font-mono font-semibold text-[#C64B37]">{rejRes.baseRejectionWait} días</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#77766F]">Demora media en destino ágil (top 5):</span>
                <span className="font-mono font-semibold text-[#1F513B]">{rejRes.targetDerivationWait} días</span>
              </div>
            </div>
          </div>

          {/* Resultados */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-[#F3F0E8] border border-[#DAD6CC] p-4 rounded-sm">
              <p className="font-mono text-[10px] uppercase text-[#77766F]">
                Demora global combinada
              </p>
              <p className="font-mono text-2xl font-bold text-[#202321] mt-1">
                {rejRes.simCombinedWait} d
              </p>
              <p className="text-[11px] font-mono text-[#1F513B] mt-1">
                -{rejRes.combinedDaysSaved} d vs. {rejRes.baseCombinedWait} d actual
              </p>
            </div>

            <div className="bg-[#F3F0E8] border border-[#DAD6CC] p-4 rounded-sm">
              <p className="font-mono text-[10px] uppercase text-[#77766F]">
                Pacientes rescatados de larga espera
              </p>
              <p className="font-mono text-2xl font-bold text-[#4F3559] mt-1">
                {fmtInt(rejRes.patientsRecovered)}
              </p>
              <p className="text-[11px] font-mono text-[#77766F] mt-1">
                Quedan en rechazo: {fmtInt(rejRes.simRejectionPatients)}
              </p>
            </div>

            <div className="bg-[#F3F0E8] border border-[#DAD6CC] p-4 rounded-sm">
              <p className="font-mono text-[10px] uppercase text-[#77766F]">
                Días-paciente ahorrados
              </p>
              <p className="font-mono text-2xl font-bold text-[#1F513B] mt-1">
                {fmtInt(rejRes.totalPatientDaysSaved)}
              </p>
              <p className="text-[11px] text-[#77766F] mt-1">
                Ahorro acumulado en toda la CAM
              </p>
            </div>
          </div>
        </div>

        {/* Explicación breve obligatoria debajo del simulador */}
        <div className="border-t border-[#DAD6CC] bg-[#F3F0E8]/50 px-5 sm:px-6 py-3.5 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-[#4F3559] shrink-0 mt-0.5" />
          <p className="text-xs text-[#77766F] leading-relaxed">
            <strong className="text-[#202321]">Cómo funciona:</strong> En dic-2025 había 11.584 pacientes que rechazaron una derivación a otro hospital, acumulando una espera media de 130,2 días frente a los 49,8 días de la lista estructural. El simulador calcula el ahorro en días-paciente y la bajada de la demora media global cuando una fracción de esos pacientes acepta ser intervenida en los 5 hospitales públicos más ágiles de la red ({rejRes.targetDerivationWait} días de espera media).
          </p>
        </div>
      </section>
    </div>
  );
};
