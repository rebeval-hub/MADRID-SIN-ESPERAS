import React from 'react';
import { Download, Search, X, Users, Compass } from 'lucide-react';
import { formatEsInt } from '../../utils/format';

interface HeaderProps {
  lastUpdated: string;
  totalRecords: number;
  onExportCsv: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSwitchProfile?: () => void;
  onGoToPatient?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  lastUpdated,
  totalRecords,
  onExportCsv,
  searchQuery,
  onSearchChange,
  onSwitchProfile,
  onGoToPatient
}) => {
  const compiledDate = lastUpdated ? lastUpdated.slice(0, 10) : 'N/D';

  return (
    <header className="sticky top-0 z-30 bg-[#FAF9F5]/95 backdrop-blur-xs border-b border-[#DAD6CC] border-t-[3px] border-t-[#C64B37] text-[#202321] px-4 lg:px-8 py-3">
      <div className="max-w-[1680px] mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-3 lg:gap-6">
        {/* Masthead Identity */}
        <div className="flex flex-col min-w-0 shrink-0">
          <div className="flex items-center gap-2.5 shrink-0">
            <img
              src="/assets/aistudio/1958ecc3-383f-4604-95d1-fa7bdd5612c2_62eeedc1.png"
              alt="MADRID SIN ESPERAS"
              className="h-8 sm:h-9 w-auto object-contain shrink-0 select-none"
            />
            <div className="flex items-baseline gap-2.5 shrink-0">
              <h1 className="font-serif text-xl sm:text-2xl tracking-tight text-[#202321] leading-none whitespace-nowrap">
                MADRID SIN ESPERAS
              </h1>
              <span className="font-mono text-[11px] font-semibold text-[#C64B37] tracking-tight whitespace-nowrap">
                5.0 · Auditada
              </span>
            </div>
          </div>
          <p className="hidden lg:block text-[11.5px] text-[#77766F] mt-1 pl-[46px] leading-snug whitespace-nowrap">
            Observatorio de listas de espera sanitarias de la Comunidad de Madrid
          </p>
        </div>

        {/* Right Controls: Provenance Date, Search, CSV Export */}
        <div className="flex flex-wrap lg:flex-col lg:items-end xl:flex-row xl:items-center gap-3 sm:gap-4 lg:gap-2 xl:gap-4 shrink-0">
          <div
            className="hidden md:flex items-center gap-2 text-[11px] font-mono text-[#77766F] border-r border-[#DAD6CC] pr-4 lg:border-r-0 lg:pr-0 xl:border-r xl:pr-4 whitespace-nowrap"
            title={`Compilación de la aplicación: ${compiledDate}. Cada módulo muestra el periodo oficial exacto de sus datos.`}
          >
            <span className="text-[#202321] font-medium">datos.comunidad.madrid</span>
            <span aria-hidden="true">·</span>
            <span>{formatEsInt(totalRecords)} reg.</span>
            <span aria-hidden="true">·</span>
            <span>Noviembre 2026</span>
          </div>

          <div className="contents lg:flex lg:items-center lg:gap-4">
            <div className="relative flex-1 sm:flex-initial sm:w-[230px] lg:w-[220px] xl:w-[230px]">
              <Search className="w-3.5 h-3.5 text-[#77766F] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar hospital..."
                value={searchQuery}
                onChange={e => onSearchChange(e.target.value)}
                aria-label="Buscar hospital"
                className="w-full bg-[#F3F0E8] text-[#202321] placeholder-[#77766F] text-xs rounded-sm pl-8 pr-7 py-1.5 border border-[#DAD6CC] focus:outline-none focus:border-[#426C79] focus:bg-[#FAF9F5] transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  aria-label="Limpiar búsqueda"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#77766F] hover:text-[#202321] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              onClick={onExportCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-sm bg-[#C64B37] hover:bg-[#AE3E2C] text-[#FAF9F5] font-semibold text-xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
              title="Descargar matriz de datos oficiales en CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar CSV</span>
            </button>

            {onSwitchProfile && (
              <button
                onClick={onSwitchProfile}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-[#FAF9F5] hover:bg-[#F3F0E8] text-[#202321] border border-[#DAD6CC] hover:border-[#A6A18F] font-medium text-xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
                title="Volver a la selección de perfil (Paciente / Analista)"
              >
                <Compass className="w-3.5 h-3.5 text-[#426C79]" />
                <span className="hidden sm:inline">Cambiar perfil</span>
                <span className="sm:hidden">Perfil</span>
              </button>
            )}
          </div>
        </div>
      </div>
      <p className="lg:hidden text-[11px] text-[#77766F] mt-1.5 max-w-[1440px] mx-auto">
        Observatorio de listas de espera sanitarias de la Comunidad de Madrid
        <span className="md:hidden font-mono"> · Act. {compiledDate}</span>
      </p>
    </header>
  );
};
