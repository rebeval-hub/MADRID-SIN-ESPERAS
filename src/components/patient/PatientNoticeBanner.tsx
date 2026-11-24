import React from 'react';
import { AlertCircle, ShieldAlert } from 'lucide-react';

interface PatientNoticeBannerProps {
  compact?: boolean;
}

export const PatientNoticeBanner: React.FC<PatientNoticeBannerProps> = ({ compact = false }) => {
  return (
    <div
      role="note"
      aria-label="Aviso informativo y limitaciones legales"
      className={`bg-[#FAF9F5] border-l-4 border-l-[#426C79] border-y border-r border-[#DAD6CC] rounded-xs text-[#202321] ${
        compact ? 'p-3 text-xs' : 'p-4 sm:p-5 text-xs sm:text-sm'
      }`}
    >
      <div className="flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-[#426C79] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-[#202321] tracking-tight">
            Aviso de uso informativo y limitaciones de los datos públicos
          </p>
          <p className="text-[#202321]/80 leading-relaxed">
            &ldquo;Esta herramienta ofrece información comparativa basada en datos públicos disponibles. No asigna citas, no garantiza disponibilidad ni sustituye la información oficial del servicio sanitario. Las posibilidades de elección o derivación dependen de las normas y procedimientos aplicables.&rdquo;
          </p>
          <p className="text-[11px] font-mono text-[#77766F] pt-0.5">
            Fuente: Servicio Madrileño de Salud (SERMAS) y Portal de Datos Abiertos de la Comunidad de Madrid. No constituye consejo médico.
          </p>
        </div>
      </div>
    </div>
  );
};
