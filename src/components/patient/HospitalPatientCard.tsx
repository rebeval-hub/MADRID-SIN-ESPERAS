import React from 'react';
import {
  X,
  MapPin,
  Building2,
  Calendar,
  Bed,
  Scissors,
  Stethoscope,
  Activity,
  Layers,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { HospitalMetadata } from '../../types';
import { MadridMunicipality, calculateDistanceKm } from '../../data/madridMunicipalities';
import { formatEsDec, formatEsInt } from '../../utils/format';

interface HospitalPatientCardProps {
  hospital: HospitalMetadata | null;
  selectedMunicipality: MadridMunicipality;
  onClose: () => void;
  onCompare?: (h: HospitalMetadata) => void;
  isCompared?: boolean;
}

export const HospitalPatientCard: React.FC<HospitalPatientCardProps> = ({
  hospital,
  selectedMunicipality,
  onClose,
  onCompare,
  isCompared = false
}) => {
  if (!hospital) return null;

  const distanceKm = calculateDistanceKm(
    selectedMunicipality.lat,
    selectedMunicipality.lng,
    hospital.lat,
    hospital.lng
  );

  const qSeries = hospital.series.quirurgica;
  const cSeries = hospital.series.consultas;
  const pSeries = hospital.series.pruebas;

  const qDelay2025 = qSeries.demora['2025'] ?? null;
  const qPacientes2025 = qSeries.pacientes['2025'] ?? null;

  const cDelay2024 = cSeries.demora['2024'] ?? null;
  const cPacientes2024 = cSeries.pacientes['2024'] ?? null;

  const pDelay2024 = pSeries.demora['2024'] ?? null;
  const pPacientes2024 = pSeries.pacientes['2024'] ?? null;

  const bedsInst = hospital.beds;
  const bedsFunc = hospital.operatingBeds;
  const quirofanos = hospital.quirofanos;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#202321]/60 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-[#FAF9F5] rounded-sm shadow-2xl border border-[#A6A18F] overflow-hidden my-4 max-h-[92vh] flex flex-col obs-enter"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-5 sm:p-6 bg-[#202321] text-[#FAF9F5] border-b-[3px] border-b-[#426C79] shrink-0">
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider bg-[#426C79] text-[#FAF9F5] px-2 py-0.5 rounded-xs">
                {hospital.complexityGroup}
              </span>
              <span className="font-mono text-[10px] text-[#A6A18F]">
                Área {hospital.area} · {hospital.managementModel}
              </span>
            </div>
            <h3 className="font-serif text-xl sm:text-2xl text-[#FAF9F5] leading-snug">
              {hospital.fullName}
            </h3>
            <div className="flex items-center gap-3 text-xs text-[#A6A18F] pt-1">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#C64B37]" />
                {hospital.municipality} {hospital.address ? `· ${hospital.address}` : ''}
              </span>
              <span>·</span>
              <span className="text-[#FAF9F5] font-semibold">
                A {distanceKm} km de {selectedMunicipality.name}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#A6A18F] hover:text-[#FAF9F5] hover:bg-white/10 rounded-sm transition-colors cursor-pointer shrink-0"
            aria-label="Cerrar ficha"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-[#202321]">
          {/* Section 1: Indicators of wait times */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#DAD6CC] pb-2">
              <h4 className="font-bold text-sm text-[#202321] uppercase tracking-wide flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#426C79]" />
                <span>Indicadores Oficiales de Lista de Espera</span>
              </h4>
              <span className="font-mono text-[10px] text-[#77766F]">
                Fuentes: LEQ, LECE, LEPD (SERMAS)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Surgical Box */}
              <div className="bg-[#FAF9F5] border border-[#DAD6CC] rounded-sm p-3.5 flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#426C79] flex items-center gap-1">
                      <Scissors className="w-3.5 h-3.5" />
                      <span>Quirúrgica</span>
                    </span>
                    <span className="font-mono text-[10px] text-[#77766F] bg-[#F3F0E8] px-1.5 py-0.5 rounded-xs">
                      31-dic-2025
                    </span>
                  </div>
                  <div className="pt-2">
                    <span className="text-[11px] text-[#77766F] block">Demora media:</span>
                    {qDelay2025 !== null && qDelay2025 !== undefined ? (
                      <span className="text-xl font-bold font-mono text-[#202321]">
                        {formatEsDec(qDelay2025, 1)} <span className="text-xs font-normal text-[#77766F]">días</span>
                      </span>
                    ) : (
                      <span className="text-xs font-mono text-[#77766F]">
                        NO DISPONIBLE EN LAS FUENTES CONSULTADAS
                      </span>
                    )}
                  </div>
                </div>
                <div className="pt-3 border-t border-[#DAD6CC]/70 mt-2 text-[11px] font-mono text-[#77766F]">
                  Pacientes:{' '}
                  <strong className="text-[#202321]">
                    {qPacientes2025 !== null && qPacientes2025 !== undefined ? formatEsInt(qPacientes2025) : 'N/D'}
                  </strong>
                </div>
              </div>

              {/* Consultations Box */}
              <div className="bg-[#FAF9F5] border border-[#DAD6CC] rounded-sm p-3.5 flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#8b5cf6] flex items-center gap-1">
                      <Stethoscope className="w-3.5 h-3.5" />
                      <span>Consultas</span>
                    </span>
                    <span className="font-mono text-[10px] text-[#77766F] bg-[#F3F0E8] px-1.5 py-0.5 rounded-xs">
                      31-dic-2024
                    </span>
                  </div>
                  <div className="pt-2">
                    <span className="text-[11px] text-[#77766F] block">Demora media:</span>
                    {cDelay2024 !== null && cDelay2024 !== undefined ? (
                      <span className="text-xl font-bold font-mono text-[#202321]">
                        {formatEsDec(cDelay2024, 1)} <span className="text-xs font-normal text-[#77766F]">días</span>
                      </span>
                    ) : (
                      <span className="text-xs font-mono text-[#77766F]">
                        NO DISPONIBLE EN LAS FUENTES CONSULTADAS
                      </span>
                    )}
                  </div>
                </div>
                <div className="pt-3 border-t border-[#DAD6CC]/70 mt-2 text-[11px] font-mono text-[#77766F]">
                  Pacientes:{' '}
                  <strong className="text-[#202321]">
                    {cPacientes2024 !== null && cPacientes2024 !== undefined ? formatEsInt(cPacientes2024) : 'N/D'}
                  </strong>
                </div>
              </div>

              {/* Diagnostic Box */}
              <div className="bg-[#FAF9F5] border border-[#DAD6CC] rounded-sm p-3.5 flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#10b981] flex items-center gap-1">
                      <Activity className="w-3.5 h-3.5" />
                      <span>Pruebas</span>
                    </span>
                    <span className="font-mono text-[10px] text-[#77766F] bg-[#F3F0E8] px-1.5 py-0.5 rounded-xs">
                      31-dic-2024
                    </span>
                  </div>
                  <div className="pt-2">
                    <span className="text-[11px] text-[#77766F] block">Demora media:</span>
                    {pDelay2024 !== null && pDelay2024 !== undefined ? (
                      <span className="text-xl font-bold font-mono text-[#202321]">
                        {formatEsDec(pDelay2024, 1)} <span className="text-xs font-normal text-[#77766F]">días</span>
                      </span>
                    ) : (
                      <span className="text-xs font-mono text-[#77766F]">
                        NO DISPONIBLE EN LAS FUENTES CONSULTADAS
                      </span>
                    )}
                  </div>
                </div>
                <div className="pt-3 border-t border-[#DAD6CC]/70 mt-2 text-[11px] font-mono text-[#77766F]">
                  Pacientes:{' '}
                  <strong className="text-[#202321]">
                    {pPacientes2024 !== null && pPacientes2024 !== undefined ? formatEsInt(pPacientes2024) : 'N/D'}
                  </strong>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-[#77766F] italic">
              * Nota temporal: La lista quirúrgica refleja el corte oficial a 31 de diciembre de 2025; consultas y pruebas reflejan el corte a 31 de diciembre de 2024. Cada dato se conserva en su periodo de referencia oficial sin mezclas.
            </p>
          </div>

          {/* Section 2: Structural Capacity (Beds & Operating Rooms) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#DAD6CC] pb-2">
              <h4 className="font-bold text-sm text-[#202321] uppercase tracking-wide flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#426C79]" />
                <span>Dotación Estructural y Recursos (SERMAS 2024 & CNH 2025)</span>
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-[#F3F0E8] p-3 rounded-sm space-y-1">
                <span className="text-[#77766F] block font-mono text-[10.5px]">Camas Instaladas:</span>
                <span className="text-base font-bold text-[#202321] font-mono">
                  {bedsInst !== null && bedsInst !== undefined ? formatEsInt(bedsInst) : 'NO DISPONIBLE EN LAS FUENTES CONSULTADAS'}
                </span>
                <span className="text-[10px] text-[#77766F] block">Dotación fija del centro</span>
              </div>

              <div className="bg-[#F3F0E8] p-3 rounded-sm space-y-1">
                <span className="text-[#77766F] block font-mono text-[10.5px]">Camas Funcionantes:</span>
                <span className="text-base font-bold text-[#202321] font-mono">
                  {bedsFunc !== null && bedsFunc !== undefined ? formatEsInt(bedsFunc) : 'NO DISPONIBLE EN LAS FUENTES CONSULTADAS'}
                </span>
                <span className="text-[10px] text-[#77766F] block">Promedio en servicio 2024</span>
              </div>

              <div className="bg-[#F3F0E8] p-3 rounded-sm space-y-1">
                <span className="text-[#77766F] block font-mono text-[10.5px]">Quirófanos Instalados:</span>
                <span className="text-base font-bold text-[#202321] font-mono">
                  {quirofanos !== null && quirofanos !== undefined ? formatEsInt(quirofanos) : 'NO DISPONIBLE EN LAS FUENTES CONSULTADAS'}
                </span>
                <span className="text-[10px] text-[#77766F] block">Dotación quirúrgica</span>
              </div>
            </div>
          </div>

          {/* Section 3: Legal Guarantee notice */}
          <div className="bg-[#EAF0F2] border border-[#B7D1D9] p-3.5 rounded-sm text-xs text-[#202321]/90 space-y-1">
            <strong className="block text-[#426C79] font-semibold">
              Libre elección y procedimiento sanitario en la Comunidad de Madrid:
            </strong>
            <p className="leading-relaxed">
              La aparición de este centro y sus indicadores responde a la publicación de datos abiertos oficiales. No implica una garantía automática de cita inmediata ni sustituye la indicación de tu médico.
            </p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 sm:p-5 bg-[#FAF9F5] border-t border-[#DAD6CC] flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-[#DAD6CC] text-[#77766F] hover:text-[#202321] hover:bg-[#F3F0E8] text-xs font-semibold rounded-sm transition-colors cursor-pointer"
          >
            Cerrar Ficha
          </button>

          {onCompare && (
            <button
              onClick={() => onCompare(hospital)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-sm transition-colors cursor-pointer ${
                isCompared
                  ? 'bg-[#202321] text-[#FAF9F5]'
                  : 'bg-[#426C79] hover:bg-[#345661] text-[#FAF9F5]'
              }`}
            >
              <span>{isCompared ? 'En la Comparativa ✓' : 'Añadir a la Comparativa'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
