import React, { useState, useMemo } from 'react';
import { Users, UserCheck } from 'lucide-react';
import { AgePyramidBracket } from '../../types';
import { formatEsDec, formatEsInt } from '../../utils/format';

interface PopulationPyramidChartProps {
  data: AgePyramidBracket[];
  totalPopulation?: number | null;
  hospitalName?: string;
  sourceNote?: string;
}

export const PopulationPyramidChart: React.FC<PopulationPyramidChartProps> = ({
  data,
  totalPopulation,
  hospitalName,
  sourceNote
}) => {
  const [mode, setMode] = useState<'abs' | 'pct'>('abs');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Totals and metrics
  const { totalHombres, totalMujeres, totalGral, maxVal, reversedData } = useMemo(() => {
    let sumH = 0;
    let sumM = 0;
    let max = 0;

    data.forEach(d => {
      sumH += d.hombres;
      sumM += d.mujeres;
      if (d.hombres > max) max = d.hombres;
      if (d.mujeres > max) max = d.mujeres;
    });

    const tot = sumH + sumM || totalPopulation || 1;
    // Data sorted from oldest to youngest for standard pyramid view
    const rev = [...data].reverse();

    return {
      totalHombres: sumH,
      totalMujeres: sumM,
      totalGral: tot,
      maxVal: max || 1,
      reversedData: rev
    };
  }, [data, totalPopulation]);

  if (!data || data.length === 0) {
    return (
      <div className="bg-[#FAF9F5] border border-[#DAD6CC] rounded-sm p-6 text-center text-xs text-[#77766F]">
        <Users className="w-8 h-8 text-[#A6A18F] mx-auto mb-2 opacity-60" />
        <p className="font-semibold text-[#202321]">Pirámide poblacional no asignada</p>
        <p className="mt-1 text-[11px]">
          Este centro opera como hospital monográfico o de apoyo regional sin área territorial exclusiva de atención primaria (SIP-CIBELES).
        </p>
      </div>
    );
  }

  const pctMujeres = totalGral > 0 ? (totalMujeres / totalGral) * 100 : 50;
  const pctHombres = totalGral > 0 ? (totalHombres / totalGral) * 100 : 50;
  const seniorCount = data
    .filter(d => anySenior(d.rango))
    .reduce((s, d) => s + d.hombres + d.mujeres, 0);
  const pctSenior = totalGral > 0 ? (seniorCount / totalGral) * 100 : 0;

  return (
    <div className="bg-[#FAF9F5] border border-[#DAD6CC] rounded-sm p-4 sm:p-5 space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DAD6CC]">
        <div>
          <h4 className="font-serif text-base sm:text-lg text-[#202321] flex items-center gap-2">
            <Users className="w-4 h-4 text-[#426C79]" />
            <span>Pirámide Demográfica de Población Asignada</span>
          </h4>
          <p className="text-[11px] text-[#77766F] mt-0.5">
            Distribución por sexo y cohortes quinquenales de edad (Fuente oficial: SIP-CIBELES / Memoria SERMAS 2024).
          </p>
        </div>

        {/* Mode selector */}
        <div className="flex items-center gap-1 bg-[#ECE8DD] p-1 rounded-xs text-xs font-mono shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setMode('abs')}
            className={`px-2.5 py-1 rounded-xs transition-colors cursor-pointer text-[11px] font-semibold ${
              mode === 'abs'
                ? 'bg-[#202321] text-[#FAF9F5]'
                : 'text-[#4A4D48] hover:text-[#202321]'
            }`}
          >
            Nº Pacientes
          </button>
          <button
            onClick={() => setMode('pct')}
            className={`px-2.5 py-1 rounded-xs transition-colors cursor-pointer text-[11px] font-semibold ${
              mode === 'pct'
                ? 'bg-[#202321] text-[#FAF9F5]'
                : 'text-[#4A4D48] hover:text-[#202321]'
            }`}
          >
            % Sobre Total
          </button>
        </div>
      </div>

      {/* KPI Highlights Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
        <div className="bg-[#F3F0E8] p-2.5 rounded-xs border border-[#DAD6CC]">
          <span className="text-[10px] text-[#77766F] uppercase block font-sans font-semibold">Población Total</span>
          <span className="text-base font-bold text-[#202321] tabular-nums">{formatEsInt(totalGral)}</span>
          <span className="text-[10px] text-[#77766F] block">habitantes</span>
        </div>
        <div className="bg-[#EDF3F5] p-2.5 rounded-xs border border-[#426C79]/30">
          <span className="text-[10px] text-[#426C79] uppercase block font-sans font-semibold">Hombres</span>
          <span className="text-base font-bold text-[#2D4F5A] tabular-nums">
            {formatEsInt(totalHombres)}
          </span>
          <span className="text-[10px] text-[#426C79] block">({formatEsDec(pctHombres, 1)}%)</span>
        </div>
        <div className="bg-[#F4EFF7] p-2.5 rounded-xs border border-[#6E4D7B]/30">
          <span className="text-[10px] text-[#6E4D7B] uppercase block font-sans font-semibold">Mujeres</span>
          <span className="text-base font-bold text-[#4F3559] tabular-nums">
            {formatEsInt(totalMujeres)}
          </span>
          <span className="text-[10px] text-[#6E4D7B] block">({formatEsDec(pctMujeres, 1)}%)</span>
        </div>
        <div className="bg-[#FAF3EB] p-2.5 rounded-xs border border-[#D47528]/30">
          <span className="text-[10px] text-[#9A4D10] uppercase block font-sans font-semibold">Mayores 65 Años</span>
          <span className="text-base font-bold text-[#9A4D10] tabular-nums">
            {formatEsInt(seniorCount)}
          </span>
          <span className="text-[10px] text-[#9A4D10] block">({formatEsDec(pctSenior, 1)}% sobreenvejec.)</span>
        </div>
      </div>

      {/* Column Headers */}
      <div className="grid grid-cols-12 text-[11px] font-mono font-bold text-[#202321] pt-1 border-b border-[#DAD6CC] pb-1.5 text-center">
        <div className="col-span-5 text-right pr-3 text-[#426C79]">
          ← HOMBRES ({formatEsDec(pctHombres, 1)}%)
        </div>
        <div className="col-span-2 text-center text-[#77766F] text-[10px] uppercase">
          Cohorte
        </div>
        <div className="col-span-5 text-left pl-3 text-[#6E4D7B]">
          MUJERES ({formatEsDec(pctMujeres, 1)}%) →
        </div>
      </div>

      {/* Pyramid Rows */}
      <div className="space-y-1 relative">
        {reversedData.map((row, idx) => {
          const isHovered = hoveredIdx === idx;
          const pctBarH = (row.hombres / maxVal) * 100;
          const pctBarM = (row.mujeres / maxVal) * 100;

          const pctHOfTotal = (row.hombres / totalGral) * 100;
          const pctMOfTotal = (row.mujeres / totalGral) * 100;

          const valTextH = mode === 'abs' ? formatEsInt(row.hombres) : `${formatEsDec(pctHOfTotal, 2)}%`;
          const valTextM = mode === 'abs' ? formatEsInt(row.mujeres) : `${formatEsDec(pctMOfTotal, 2)}%`;

          const cleanAgeLabel = row.rango
            .replace('años', '')
            .replace('y más', '+')
            .trim();

          return (
            <div
              key={row.rango}
              className={`grid grid-cols-12 items-center text-[10px] font-mono py-0.5 rounded-xs transition-colors cursor-pointer ${
                isHovered ? 'bg-[#ECE8DD]' : 'hover:bg-[#F3F0E8]/70'
              }`}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Left Bar: Hombres */}
              <div className="col-span-5 flex items-center justify-end gap-1.5 pr-2">
                <span className={`text-[10px] tabular-nums font-semibold transition-colors ${
                  isHovered ? 'text-[#202321] font-bold' : 'text-[#426C79]'
                }`}>
                  {valTextH}
                </span>
                <div className="w-full max-w-[170px] h-3.5 bg-[#ECE8DD] rounded-xs flex justify-end overflow-hidden">
                  <div
                    className="h-full bg-[#426C79] rounded-xs transition-all duration-200"
                    style={{
                      width: `${Math.max(1, pctBarH)}%`,
                      backgroundColor: isHovered ? '#2D4F5A' : '#426C79'
                    }}
                  />
                </div>
              </div>

              {/* Center Label: Age Bracket */}
              <div className="col-span-2 text-center font-bold text-[#202321] bg-[#FAF9F5] border border-[#DAD6CC] py-0.5 rounded-xs text-[10px]">
                {cleanAgeLabel}
              </div>

              {/* Right Bar: Mujeres */}
              <div className="col-span-5 flex items-center justify-start gap-1.5 pl-2">
                <div className="w-full max-w-[170px] h-3.5 bg-[#ECE8DD] rounded-xs flex justify-start overflow-hidden">
                  <div
                    className="h-full bg-[#6E4D7B] rounded-xs transition-all duration-200"
                    style={{
                      width: `${Math.max(1, pctBarM)}%`,
                      backgroundColor: isHovered ? '#4F3559' : '#6E4D7B'
                    }}
                  />
                </div>
                <span className={`text-[10px] tabular-nums font-semibold transition-colors ${
                  isHovered ? 'text-[#202321] font-bold' : 'text-[#6E4D7B]'
                }`}>
                  {valTextM}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Hover Details Card */}
      {hoveredIdx !== null && reversedData[hoveredIdx] && (
        <div className="bg-[#202321] text-[#FAF9F5] p-3 rounded-xs text-xs font-mono flex flex-wrap items-center justify-between gap-3 shadow-lg">
          <div>
            <span className="text-[#DAD6CC] font-sans text-[11px] block">
              Cohorte: <strong className="text-[#FAF9F5]">{reversedData[hoveredIdx].rango}</strong>
            </span>
            <span className="text-[#7BA7B5]">
              Hombres: {formatEsInt(reversedData[hoveredIdx].hombres)} ({formatEsDec((reversedData[hoveredIdx].hombres / totalGral) * 100, 2)}%)
            </span>
            <span className="text-[#DAD6CC] mx-2">·</span>
            <span className="text-[#D8A8D8]">
              Mujeres: {formatEsInt(reversedData[hoveredIdx].mujeres)} ({formatEsDec((reversedData[hoveredIdx].mujeres / totalGral) * 100, 2)}%)
            </span>
          </div>
          <div className="text-right text-[11px] text-[#DAD6CC]">
            Total grupo:{' '}
            <strong className="text-[#FAF9F5]">
              {formatEsInt(reversedData[hoveredIdx].hombres + reversedData[hoveredIdx].mujeres)}
            </strong>{' '}
            ({formatEsDec(((reversedData[hoveredIdx].hombres + reversedData[hoveredIdx].mujeres) / totalGral) * 100, 2)}% del centro)
          </div>
        </div>
      )}

      {/* Footer Note */}
      <div className="pt-2 border-t border-[#DAD6CC] text-[10px] text-[#77766F] flex flex-wrap items-center justify-between gap-2">
        <span>{sourceNote || 'Fuente: Memoria Anual SERMAS 2024 — Hoja Pirámide Población (Fuente original: SIP-CIBELES)'}</span>
        <span className="font-mono text-[#202321] font-semibold">{hospitalName}</span>
      </div>
    </div>
  );
};

function anySenior(label: string): boolean {
  return ['65-', '70-', '75-', '80-', '85', '90-', '95', '65 y', '65 o'].some(x => label.includes(x));
}
