import React from 'react';
import { BadgeCategory, AlertLevel } from '../../types';

interface BadgeProps {
  category: BadgeCategory;
  className?: string;
  size?: 'sm' | 'md';
}

export const CategoryBadge: React.FC<BadgeProps> = ({ category, className = '', size = 'sm' }) => {
  const sizeClasses = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-[11px] px-2.5 py-1';

  switch (category) {
    case 'OFICIAL':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-mono font-medium tracking-wide rounded-xs border border-[#2D6A4F]/30 bg-[#EBF3EE] text-[#1F513B] whitespace-nowrap shrink-0 ${sizeClasses} ${className}`}
          title="Dato extraído directamente del portal oficial de la Comunidad de Madrid sin manipulación."
        >
          <span className="w-1.5 h-1.5 bg-[#2D6A4F] shrink-0" aria-hidden="true" />
          Dato Oficial
        </span>
      );
    case 'CALCULADO':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-mono font-medium tracking-wide rounded-xs border border-[#426C79]/35 bg-[#EDF3F5] text-[#2D4F5A] whitespace-nowrap shrink-0 ${sizeClasses} ${className}`}
          title="Indicador calculado mediante fórmula matemática sobre datos oficiales."
        >
          <span className="w-1.5 h-1.5 bg-[#426C79] shrink-0" aria-hidden="true" />
          Indicador Calculado
        </span>
      );
    case 'ESTADISTICO':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-mono font-medium tracking-wide rounded-xs border border-[#A6A18F]/60 bg-[#F3F0E8] text-[#202321] whitespace-nowrap shrink-0 ${sizeClasses} ${className}`}
          title="Resultado de una metodología estadística aplicada (SPC, Modified Z-Score o contraste no paramétrico)."
        >
          <span className="w-1.5 h-1.5 bg-[#202321] shrink-0" aria-hidden="true" />
          Análisis Estadístico
        </span>
      );
    case 'PREDICCION':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-mono font-medium tracking-wide rounded-xs border border-[#6E4D7B]/35 bg-[#F4EFF7] text-[#4F3559] whitespace-nowrap shrink-0 ${sizeClasses} ${className}`}
          title="Resultado experimental de modelo predictivo sobre series temporales oficiales."
        >
          <span className="w-1.5 h-1.5 bg-[#6E4D7B] shrink-0" aria-hidden="true" />
          Predicción Experimental
        </span>
      );
    case 'NO_VERIFICADO':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-mono font-medium tracking-wide rounded-xs border border-[#B4691E]/40 bg-[#FBF3E8] text-[#7D4710] whitespace-nowrap shrink-0 ${sizeClasses} ${className}`}
          title="Dato de catálogo estático cuya procedencia no proviene de los CSV abiertos descargados."
        >
          <span className="w-1.5 h-1.5 bg-[#B4691E] shrink-0" aria-hidden="true" />
          Dato No Verificado
        </span>
      );
  }
};

export const AlertBadge: React.FC<{ level: AlertLevel; className?: string }> = ({ level, className = '' }) => {
  switch (level) {
    case 'ALERTA_PERSISTENTE':
      return (
        <span className={`inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold px-2 py-0.5 rounded-xs bg-[#FBECE9] text-[#9A3323] border border-[#C64B37]/45 whitespace-nowrap shrink-0 ${className}`}>
          <span className="w-2 h-2 bg-[#C64B37] shrink-0" aria-hidden="true" />
          Alerta Persistente
        </span>
      );
    case 'ALERTA':
      return (
        <span className={`inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold px-2 py-0.5 rounded-xs bg-[#FDF1E6] text-[#9A4D10] border border-[#D47528]/45 whitespace-nowrap shrink-0 ${className}`}>
          <span className="w-2 h-2 bg-[#D47528] rotate-45 shrink-0" aria-hidden="true" />
          Alerta Severa
        </span>
      );
    case 'ATENCION':
      return (
        <span className={`inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold px-2 py-0.5 rounded-xs bg-[#FBF6E6] text-[#7F6013] border border-[#C59B27]/45 whitespace-nowrap shrink-0 ${className}`}>
          <span className="w-2 h-2 rounded-full bg-[#C59B27] shrink-0" aria-hidden="true" />
          Atención Estadística
        </span>
      );
  }
};
