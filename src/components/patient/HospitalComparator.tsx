import React, { useState, useMemo } from 'react';
import {
  Scale,
  Navigation,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Building2,
  MapPin,
  ChevronRight,
  Info
} from 'lucide-react';
import { HospitalMetadata, WaitListType } from '../../types';
import { MadridMunicipality, calculateDistanceKm } from '../../data/madridMunicipalities';
import { formatEsDec, formatEsInt } from '../../utils/format';

interface HospitalComparatorProps {
  hospitals: HospitalMetadata[];
  selectedMunicipality: MadridMunicipality;
  selectedCareType: WaitListType;
  onSelectHospital: (h: HospitalMetadata) => void;
  selectedHospitalId?: string | null;
}

export type ComparatorViewMode = 'cercano' | 'demora' | 'equilibrio';

interface ScoredHospital {
  hospital: HospitalMetadata;
  distanceKm: number;
  delayDays: number | null;
  patients: number | null;
  distScore: number;
  delayScore: number;
  totalScore: number;
  isClosestToMuni: boolean;
}

export const HospitalComparator: React.FC<HospitalComparatorProps> = ({
  hospitals,
  selectedMunicipality,
  selectedCareType,
  onSelectHospital,
  selectedHospitalId
}) => {
  const [viewMode, setViewMode] = useState<ComparatorViewMode>('equilibrio');
  const [showFormulaDetails, setShowFormulaDetails] = useState(false);

  const delayYear = selectedCareType === 'quirurgica' ? '2025' : '2024';
  const careTypeLabel =
    selectedCareType === 'quirurgica'
      ? 'Lista Quirúrgica (LEQ)'
      : selectedCareType === 'consultas'
      ? 'Consultas Externas (LECE)'
      : 'Pruebas Diagnósticas (LEPD)';

  // Calculate distances and delays
  const scoredList: ScoredHospital[] = useMemo(() => {
    // 1. Compute raw distances and extract official delays
    const list = hospitals.map(h => {
      const distanceKm = calculateDistanceKm(
        selectedMunicipality.lat,
        selectedMunicipality.lng,
        h.lat,
        h.lng
      );
      const delay = h.series[selectedCareType]?.demora[delayYear] ?? null;
      const patients = h.series[selectedCareType]?.pacientes[delayYear] ?? null;

      return {
        hospital: h,
        distanceKm,
        delayDays: delay,
        patients,
        distScore: 0,
        delayScore: 0,
        totalScore: 0,
        isClosestToMuni: false
      };
    });

    // 2. Identify min/max for normalization among centers with valid delays
    const validDelays = list.filter(item => item.delayDays !== null && !isNaN(item.delayDays!));
    const delays = validDelays.map(v => v.delayDays as number);
    const distances = list.map(v => v.distanceKm);

    const minDelay = delays.length > 0 ? Math.min(...delays) : 0;
    const maxDelay = delays.length > 0 ? Math.max(...delays) : 1;
    const minDist = Math.min(...distances);
    const maxDist = Math.max(...distances);

    const delayRange = maxDelay - minDelay || 1;
    const distRange = maxDist - minDist || 1;

    // 3. Compute normalized scores (0 to 100, where 100 is best)
    return list.map(item => {
      let distScore = (1 - (item.distanceKm - minDist) / distRange) * 50;
      let delayScore = 0;
      let totalScore = 0;

      if (item.delayDays !== null && !isNaN(item.delayDays)) {
        delayScore = (1 - (item.delayDays - minDelay) / delayRange) * 50;
        totalScore = Math.round((distScore + delayScore) * 10) / 10;
      } else {
        totalScore = Math.round(distScore * 10) / 10;
      }

      return {
        ...item,
        distScore: Math.round(distScore * 10) / 10,
        delayScore: Math.round(delayScore * 10) / 10,
        totalScore
      };
    });
  }, [hospitals, selectedMunicipality, selectedCareType, delayYear]);

  // Sort list based on active view mode
  const sortedList = useMemo(() => {
    const copy = [...scoredList];
    if (viewMode === 'cercano') {
      return copy.sort((a, b) => a.distanceKm - b.distanceKm);
    } else if (viewMode === 'demora') {
      return copy.sort((a, b) => {
        if (a.delayDays === null) return 1;
        if (b.delayDays === null) return -1;
        return a.delayDays - b.delayDays;
      });
    } else {
      // 'equilibrio'
      return copy.sort((a, b) => {
        if (a.delayDays === null) return 1;
        if (b.delayDays === null) return -1;
        return b.totalScore - a.totalScore;
      });
    }
  }, [scoredList, viewMode]);

  // Top 3 spotlight
  const topHospitals = sortedList.slice(0, 3);
  const remainingHospitals = sortedList.slice(3);

  return (
    <div className="bg-[#FAF9F5] border border-[#DAD6CC] rounded-sm p-5 sm:p-6 space-y-6">
      {/* Title & Perspective Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#DAD6CC] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-[#426C79]" />
            <h3 className="font-serif text-xl sm:text-2xl text-[#202321]">
              Comparador Multicriterio de Hospitales
            </h3>
          </div>
          <p className="text-xs text-[#77766F] mt-1">
            Evaluando <strong className="text-[#202321]">{careTypeLabel}</strong> desde <strong className="text-[#426C79]">{selectedMunicipality.name}</strong> · Corte oficial a 31-dic-{delayYear}
          </p>
        </div>

        {/* 3 Perspectives Switcher Buttons */}
        <div className="flex items-center gap-1.5 bg-[#F3F0E8] p-1 rounded-sm border border-[#DAD6CC] self-start md:self-auto">
          <button
            onClick={() => setViewMode('cercano')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'cercano'
                ? 'bg-[#FAF9F5] text-[#202321] shadow-xs border border-[#DAD6CC]'
                : 'text-[#77766F] hover:text-[#202321]'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>MÁS CERCANO</span>
          </button>

          <button
            onClick={() => setViewMode('demora')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'demora'
                ? 'bg-[#FAF9F5] text-[#202321] shadow-xs border border-[#DAD6CC]'
                : 'text-[#77766F] hover:text-[#202321]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>MENOR DEMORA</span>
          </button>

          <button
            onClick={() => setViewMode('equilibrio')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'equilibrio'
                ? 'bg-[#426C79] text-[#FAF9F5] shadow-xs font-bold'
                : 'text-[#77766F] hover:text-[#202321]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>MEJOR EQUILIBRIO</span>
          </button>
        </div>
      </div>

      {/* Transparent Formula & Methodology Details Panel */}
      <div className="bg-[#F3F0E8] border border-[#DAD6CC] rounded-sm p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#202321]">
            <Info className="w-4 h-4 text-[#426C79]" />
            <span>
              Criterio de ordenación actual:{' '}
              {viewMode === 'cercano'
                ? 'Proximidad geográfica directa (km en línea recta)'
                : viewMode === 'demora'
                ? `Menor tiempo de espera publicado (${careTypeLabel})`
                : 'Índice de equilibrio compuesto (50% distancia + 50% demora)'}
            </span>
          </div>

          <button
            onClick={() => setShowFormulaDetails(!showFormulaDetails)}
            className="text-xs text-[#426C79] hover:underline font-mono cursor-pointer"
          >
            {showFormulaDetails ? 'Ocultar fórmula [-]' : 'Ver fórmula y metodología [+]'}
          </button>
        </div>

        {showFormulaDetails && (
          <div className="pt-3 border-t border-[#DAD6CC] text-xs text-[#202321]/90 space-y-2 obs-enter">
            <p>
              <strong>1. Variables utilizadas:</strong> Distancia geográfica calculada (fórmula Haversine en km entre el centroide de {selectedMunicipality.name} y las coordenadas oficiales del hospital) y Demora media estructural publicada por el SERMAS a 31-dic-{delayYear}.
            </p>
            <p>
              <strong>2. Normalización Min-Max:</strong> Ambas variables se escalan en el intervalo [0, 1] respecto a los valores mínimos y máximos registrados en la red hospitalaria de la Comunidad de Madrid:
              <br />
              <code className="bg-[#FAF9F5] px-2 py-0.5 rounded-xs border border-[#DAD6CC] font-mono text-[11px] inline-block mt-1">
                Score = 50 × (1 - (dist - dist_min)/(dist_max - dist_min)) + 50 × (1 - (demora - demora_min)/(demora_max - demora_min))
              </code>
            </p>
            <p>
              <strong>3. Ponderación:</strong> 50% peso para la proximidad territorial y 50% peso para la agilidad de lista de espera. Un centro con 100 puntos representaría la coincidencia ideal de menor distancia y menor demora absoluta de toda la Comunidad de Madrid.
            </p>
            <p>
              <strong>4. Limitaciones:</strong> No evalúa rutas específicas de transporte público ni tiempos de conducción en horas punta. No evalúa criterios de indicación clínica individual. No se mezclan categorías de atención diferentes.
            </p>
          </div>
        )}
      </div>

      {/* Top 3 Recommendation Cards */}
      <div className="space-y-3">
        <h4 className="text-xs font-mono font-bold text-[#77766F] uppercase tracking-wider">
          Centros destacados según el criterio {viewMode.toUpperCase()}:
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {topHospitals.map((item, idx) => {
            const h = item.hospital;
            const isSelected = h.id === selectedHospitalId;

            return (
              <div
                key={h.id}
                onClick={() => onSelectHospital(h)}
                className={`bg-[#FAF9F5] rounded-sm border-2 p-4 cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-[#C64B37] shadow-md ring-1 ring-[#C64B37]'
                    : 'border-[#DAD6CC] hover:border-[#426C79] hover:shadow-xs'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="w-5 h-5 rounded-full bg-[#426C79] text-[#FAF9F5] text-xs font-bold font-mono flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <span className="font-mono text-[10px] text-[#77766F] bg-[#F3F0E8] px-1.5 py-0.5 rounded-xs">
                      {h.complexityGroup}
                    </span>
                  </div>

                  <div>
                    <h5 className="font-serif text-base font-bold text-[#202321] leading-snug">
                      {h.shortName}
                    </h5>
                    <span className="text-[11px] text-[#77766F] block">
                      {h.municipality} · Área {h.area}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#DAD6CC]/70 text-xs">
                    <div>
                      <span className="text-[10px] text-[#77766F] block font-mono">Distancia:</span>
                      <strong className="text-sm font-mono text-[#202321]">{item.distanceKm} km</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#77766F] block font-mono">Demora ({delayYear}):</span>
                      {item.delayDays !== null && item.delayDays !== undefined ? (
                        <strong className="text-sm font-mono text-[#426C79]">
                          {formatEsDec(item.delayDays, 1)} d
                        </strong>
                      ) : (
                        <span className="text-[11px] font-mono text-[#77766F]">N/D</span>
                      )}
                    </div>
                  </div>

                  {viewMode === 'equilibrio' && (
                    <div className="pt-2 border-t border-[#DAD6CC]/70 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-[#77766F]">Puntuación equilibrio:</span>
                      <strong className="font-mono text-sm text-[#426C79] bg-[#EAF0F2] px-2 py-0.5 rounded-xs">
                        {item.totalScore} / 100
                      </strong>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-[#DAD6CC]/70">
                  <button
                    type="button"
                    className="w-full text-xs font-semibold text-[#426C79] hover:text-[#345661] flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>Ver ficha y detalles</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Comparison Table for all remaining hospitals */}
      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-mono font-bold text-[#77766F] uppercase tracking-wider">
          Tabla completa de la Red Hospitalaria de Madrid ({sortedList.length} centros):
        </h4>

        <div className="overflow-x-auto border border-[#DAD6CC] rounded-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#202321] text-[#FAF9F5] border-b border-[#202321] font-mono text-[11px]">
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Hospital</th>
                <th className="py-2.5 px-3">Municipio</th>
                <th className="py-2.5 px-3 text-right">Distancia (km)</th>
                <th className="py-2.5 px-3 text-right">Demora Oficial (días)</th>
                <th className="py-2.5 px-3 text-right">Pacientes en Espera</th>
                {viewMode === 'equilibrio' && (
                  <th className="py-2.5 px-3 text-right">Score Equilibrio</th>
                )}
                <th className="py-2.5 px-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DAD6CC] bg-[#FAF9F5]">
              {sortedList.map((item, idx) => {
                const h = item.hospital;
                const isSelected = h.id === selectedHospitalId;

                return (
                  <tr
                    key={h.id}
                    className={`hover:bg-[#EAF0F2] transition-colors cursor-pointer ${
                      isSelected ? 'bg-[#EAF0F2] font-semibold' : ''
                    }`}
                    onClick={() => onSelectHospital(h)}
                  >
                    <td className="py-2 px-3 font-mono text-[11px] text-[#77766F]">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-3">
                      <strong className="text-[#202321] block leading-snug">{h.fullName}</strong>
                      <span className="font-mono text-[10px] text-[#77766F]">
                        {h.complexityGroup} · {h.managementModel}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-[#77766F]">{h.municipality}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-[#202321]">
                      {item.distanceKm} km
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-[#426C79]">
                      {item.delayDays !== null && item.delayDays !== undefined
                        ? `${formatEsDec(item.delayDays, 1)} d`
                        : 'N/D'}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-[#77766F]">
                      {item.patients !== null && item.patients !== undefined
                        ? formatEsInt(item.patients)
                        : 'N/D'}
                    </td>
                    {viewMode === 'equilibrio' && (
                      <td className="py-2 px-3 text-right font-mono font-bold text-[#202321]">
                        {item.totalScore}
                      </td>
                    )}
                    <td className="py-2 px-3 text-center">
                      <button
                        type="button"
                        className="px-2 py-1 bg-[#426C79] text-[#FAF9F5] rounded-xs text-[10px] font-semibold hover:bg-[#345661] transition-colors cursor-pointer"
                      >
                        Ver Ficha
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
