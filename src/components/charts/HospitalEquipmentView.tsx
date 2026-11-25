import React, { useState } from 'react';
import { Cpu, Activity, Bed, Scissors, ArrowUpRight, ArrowDownRight, Minus, ExternalLink } from 'lucide-react';
import { HospitalEquipmentItem } from '../../types';
import { formatEsInt } from '../../utils/format';

interface HospitalEquipmentViewProps {
  altaTecnologia: HospitalEquipmentItem[];
  otrosEquipos: HospitalEquipmentItem[];
  beds: number | null;
  operatingBeds?: number | null;
  quirofanos: number | null;
  sermasMemoriaUrl?: string;
  hospitalName?: string;
}

export const HospitalEquipmentView: React.FC<HospitalEquipmentViewProps> = ({
  altaTecnologia,
  otrosEquipos,
  beds,
  operatingBeds,
  quirofanos,
  sermasMemoriaUrl,
  hospitalName
}) => {
  const [filter, setFilter] = useState<'all' | 'altaTec' | 'diagnostico'>('all');

  const totalAltaTec2024 = altaTecnologia.reduce((s, e) => s + e.u2024, 0);
  const totalAltaTec2023 = altaTecnologia.reduce((s, e) => s + e.u2023, 0);
  const totalOtros2024 = otrosEquipos.reduce((s, e) => s + e.u2024, 0);

  const maxTecUnits = Math.max(...altaTecnologia.map(e => Math.max(e.u2023, e.u2024)), 1);
  const maxOtrosUnits = Math.max(...otrosEquipos.map(e => Math.max(e.u2023, e.u2024)), 1);

  return (
    <div className="bg-[#FAF9F5] border border-[#DAD6CC] rounded-sm p-4 sm:p-5 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DAD6CC]">
        <div>
          <h4 className="font-serif text-base sm:text-lg text-[#202321] flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#C64B37]" />
            <span>Instalaciones, Recursos Materiales y Alta Tecnología</span>
          </h4>
          <p className="text-[11px] text-[#77766F] mt-0.5">
            Censo oficial de equipamiento tecnológico e instalaciones diagnósticas (Fuente: Memoria Anual SERMAS 2024 / SIAE).
          </p>
        </div>

        {sermasMemoriaUrl && (
          <a
            href={sermasMemoriaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#426C79] hover:text-[#C64B37] shrink-0"
          >
            <span>Memoria Oficial ZIP</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      {/* Structural Bed & OR Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="bg-[#EDF3F5] p-3 rounded-xs border border-[#426C79]/30 flex items-start gap-2.5">
          <Bed className="w-4 h-4 text-[#426C79] shrink-0 mt-0.5" />
          <div>
            <span className="text-[10px] text-[#426C79] font-semibold uppercase block">Dotación de Camas</span>
            <div className="text-base font-bold text-[#202321] font-mono tabular-nums">
              {beds !== null ? `${formatEsInt(beds)} instaladas` : 'N/D'}
            </div>
            {operatingBeds !== null && operatingBeds !== undefined && (
              <span className="text-[11px] text-[#77766F] block font-mono">
                {formatEsInt(operatingBeds)} en funcionamiento medio
              </span>
            )}
          </div>
        </div>

        <div className="bg-[#FAF3EB] p-3 rounded-xs border border-[#D47528]/30 flex items-start gap-2.5">
          <Scissors className="w-4 h-4 text-[#D47528] shrink-0 mt-0.5" />
          <div>
            <span className="text-[10px] text-[#9A4D10] font-semibold uppercase block">Quirófanos Instalados</span>
            <div className="text-base font-bold text-[#202321] font-mono tabular-nums">
              {quirofanos !== null ? `${formatEsInt(quirofanos)} salas de quirófano` : 'N/D'}
            </div>
            <span className="text-[11px] text-[#77766F] block font-mono">
              Dotación quirúrgica fija activa
            </span>
          </div>
        </div>

        <div className="bg-[#F4EFF7] p-3 rounded-xs border border-[#6E4D7B]/30 flex items-start gap-2.5">
          <Activity className="w-4 h-4 text-[#6E4D7B] shrink-0 mt-0.5" />
          <div>
            <span className="text-[10px] text-[#6E4D7B] font-semibold uppercase block">Equipos de Alta Tecnología</span>
            <div className="text-base font-bold text-[#202321] font-mono tabular-nums">
              {formatEsInt(totalAltaTec2024)} unidades
            </div>
            <span className="text-[11px] text-[#77766F] block font-mono">
              {totalAltaTec2024 >= totalAltaTec2023 ? `+${totalAltaTec2024 - totalAltaTec2023}` : `${totalAltaTec2024 - totalAltaTec2023}`} vs 2023 ({totalAltaTec2023} u.)
            </span>
          </div>
        </div>
      </div>

      {/* Tab Filter */}
      <div className="flex items-center gap-1 bg-[#ECE8DD] p-1 rounded-xs text-xs font-mono w-fit">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded-xs transition-colors cursor-pointer text-[11px] font-semibold ${
            filter === 'all'
              ? 'bg-[#202321] text-[#FAF9F5]'
              : 'text-[#4A4D48] hover:text-[#202321]'
          }`}
        >
          Todo el Equipamiento
        </button>
        <button
          onClick={() => setFilter('altaTec')}
          className={`px-3 py-1 rounded-xs transition-colors cursor-pointer text-[11px] font-semibold ${
            filter === 'altaTec'
              ? 'bg-[#202321] text-[#FAF9F5]'
              : 'text-[#4A4D48] hover:text-[#202321]'
          }`}
        >
          Alta Tecnología ({altaTecnologia.length})
        </button>
        <button
          onClick={() => setFilter('diagnostico')}
          className={`px-3 py-1 rounded-xs transition-colors cursor-pointer text-[11px] font-semibold ${
            filter === 'diagnostico'
              ? 'bg-[#202321] text-[#FAF9F5]'
              : 'text-[#4A4D48] hover:text-[#202321]'
          }`}
        >
          Equipos Diagnósticos y Quirúrgicos ({otrosEquipos.length})
        </button>
      </div>

      {/* Grid of Equipment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Section 1: Alta Tecnologia */}
        {(filter === 'all' || filter === 'altaTec') && (
          <div className="bg-[#FAF9F5] border border-[#DAD6CC] rounded-xs p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#DAD6CC]">
              <span className="text-xs font-bold text-[#202321] flex items-center gap-1.5 uppercase font-mono tracking-wider">
                <Cpu className="w-3.5 h-3.5 text-[#C64B37]" />
                Alta Tecnología
              </span>
              <span className="text-[10px] font-mono font-bold text-[#6E4D7B]">
                {totalAltaTec2024} u. en 2024
              </span>
            </div>

            {altaTecnologia.length === 0 ? (
              <p className="text-xs text-[#77766F] py-4 text-center">
                Sin dotación de alta tecnología registrada en la memoria anual de este centro.
              </p>
            ) : (
              <div className="space-y-2.5">
                {altaTecnologia.map(item => {
                  const diff = item.u2024 - item.u2023;
                  const pct = (item.u2024 / maxTecUnits) * 100;

                  return (
                    <div key={item.nombre} className="text-xs font-mono">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[#202321] font-sans font-medium truncate max-w-[70%]" title={item.nombre}>
                          {item.nombre}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-bold text-[#202321]">{item.u2024} u.</span>
                          {diff > 0 ? (
                            <span className="inline-flex items-center text-[10px] text-[#2D6A4F] font-bold">
                              <ArrowUpRight className="w-3 h-3" /> +{diff}
                            </span>
                          ) : diff < 0 ? (
                            <span className="inline-flex items-center text-[10px] text-[#C64B37] font-bold">
                              <ArrowDownRight className="w-3 h-3" /> {diff}
                            </span>
                          ) : (
                            <span className="text-[10px] text-[#77766F]">
                              <Minus className="w-3 h-3 inline" /> 2023
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="w-full h-2 bg-[#ECE8DD] rounded-xs overflow-hidden">
                        <div
                          className="h-full bg-[#C64B37] rounded-xs transition-all duration-200"
                          style={{ width: `${Math.max(4, pct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Section 2: Otros Equipos */}
        {(filter === 'all' || filter === 'diagnostico') && (
          <div className="bg-[#FAF9F5] border border-[#DAD6CC] rounded-xs p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#DAD6CC]">
              <span className="text-xs font-bold text-[#202321] flex items-center gap-1.5 uppercase font-mono tracking-wider">
                <Activity className="w-3.5 h-3.5 text-[#426C79]" />
                Diagnóstico y Quirúrgico
              </span>
              <span className="text-[10px] font-mono font-bold text-[#426C79]">
                {totalOtros2024} u. en 2024
              </span>
            </div>

            {otrosEquipos.length === 0 ? (
              <p className="text-xs text-[#77766F] py-4 text-center">
                Sin registros adicionales en el epígrafe de otros equipos.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {otrosEquipos.map(item => {
                  const diff = item.u2024 - item.u2023;
                  const pct = (item.u2024 / maxOtrosUnits) * 100;

                  return (
                    <div key={item.nombre} className="text-xs font-mono">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[#202321] font-sans font-medium truncate max-w-[70%]" title={item.nombre}>
                          {item.nombre}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-bold text-[#202321]">{item.u2024} u.</span>
                          {diff > 0 ? (
                            <span className="inline-flex items-center text-[10px] text-[#2D6A4F] font-bold">
                              <ArrowUpRight className="w-3 h-3" /> +{diff}
                            </span>
                          ) : diff < 0 ? (
                            <span className="inline-flex items-center text-[10px] text-[#C64B37] font-bold">
                              <ArrowDownRight className="w-3 h-3" /> {diff}
                            </span>
                          ) : (
                            <span className="text-[10px] text-[#77766F]">
                              <Minus className="w-3 h-3 inline" /> 2023
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="w-full h-2 bg-[#ECE8DD] rounded-xs overflow-hidden">
                        <div
                          className="h-full bg-[#426C79] rounded-xs transition-all duration-200"
                          style={{ width: `${Math.max(4, pct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-[#DAD6CC] text-[10px] text-[#77766F] flex flex-wrap items-center justify-between gap-2">
        <span>Fuente oficial: Memoria de Actividad SERMAS 2024 — Hoja Recursos Materiales, Alta Tecnología y Otros Equipos (SIAE).</span>
        <span className="font-mono text-[#202321] font-semibold">{hospitalName}</span>
      </div>
    </div>
  );
};
