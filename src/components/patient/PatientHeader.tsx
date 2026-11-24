import React from 'react';
import { Compass, RotateCcw, BarChart3, HelpCircle, ArrowLeft } from 'lucide-react';

interface PatientHeaderProps {
  currentStep: number;
  totalSteps: number;
  onGoToStep: (step: number) => void;
  onSwitchProfile: () => void;
  onGoToAnalyst: () => void;
  onResetRoute?: () => void;
}

export const PatientHeader: React.FC<PatientHeaderProps> = ({
  currentStep,
  totalSteps,
  onGoToStep,
  onSwitchProfile,
  onGoToAnalyst,
  onResetRoute
}) => {
  const stepsTitles = [
    { num: 1, label: 'Municipio' },
    { num: 2, label: 'Atención' },
    { num: 3, label: 'Especialidad' },
    { num: 4, label: 'Criterio' },
    { num: 5, label: 'Mapa y Hospitales' }
  ];

  return (
    <header className="sticky top-0 z-30 bg-[#FAF9F5]/95 backdrop-blur-xs border-b border-[#DAD6CC] border-t-[3px] border-t-[#426C79] text-[#202321] px-4 lg:px-8 py-2.5">
      <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Identity */}
        <div className="flex items-center justify-between sm:justify-start gap-3 sm:gap-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <img
              src="/assets/aistudio/1958ecc3-383f-4604-95d1-fa7bdd5612c2_62eeedc1.png"
              alt="MADRID SIN ESPERAS"
              className="h-8 w-auto object-contain select-none"
            />
            <div className="flex flex-col">
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-lg sm:text-xl font-bold tracking-tight text-[#202321] leading-none">
                  MI RUTA SANITARIA
                </span>
                <span className="font-mono text-[10px] uppercase font-semibold text-[#426C79] bg-[#426C79]/10 px-1.5 py-0.5 rounded-xs">
                  Modo Paciente
                </span>
              </div>
              <span className="text-[11px] text-[#77766F] hidden sm:inline">
                Asistente ciudadano de exploración hospitalaria en la Comunidad de Madrid
              </span>
            </div>
          </div>

          {/* Mobile Back to Landing Button */}
          <button
            onClick={onSwitchProfile}
            className="md:hidden inline-flex items-center gap-1 text-xs text-[#77766F] hover:text-[#202321] px-2 py-1 border border-[#DAD6CC] rounded-xs bg-[#F3F0E8]"
            title="Cambiar perfil"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Perfil</span>
          </button>
        </div>

        {/* Center: Stepper tracker */}
        <nav aria-label="Progreso del asistente" className="flex items-center justify-center gap-1 sm:gap-2 overflow-x-auto py-1">
          {stepsTitles.map(s => {
            const isActive = currentStep === s.num;
            const isCompleted = currentStep > s.num;

            return (
              <button
                key={s.num}
                type="button"
                onClick={() => onGoToStep(s.num)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer border ${
                  isActive
                    ? 'bg-[#426C79] text-[#FAF9F5] border-[#426C79] shadow-xs'
                    : isCompleted
                    ? 'bg-[#EAF0F2] text-[#426C79] border-[#B7D1D9] hover:bg-[#D5E3E7]'
                    : 'bg-[#F3F0E8] text-[#77766F] border-[#DAD6CC] hover:border-[#A6A18F]'
                }`}
                title={`Ir al paso ${s.num}: ${s.label}`}
              >
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                    isActive
                      ? 'bg-[#FAF9F5] text-[#426C79]'
                      : isCompleted
                      ? 'bg-[#426C79] text-[#FAF9F5]'
                      : 'bg-[#DAD6CC] text-[#202321]'
                  }`}
                >
                  {isCompleted ? '✓' : s.num}
                </span>
                <span className="whitespace-nowrap hidden sm:inline">{s.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: Actions and Profile Switcher */}
        <div className="hidden md:flex items-center gap-2.5 shrink-0">
          {onResetRoute && currentStep > 1 && (
            <button
              onClick={onResetRoute}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-[#77766F] hover:text-[#202321] hover:bg-[#F3F0E8] rounded-sm transition-colors border border-transparent hover:border-[#DAD6CC] cursor-pointer"
              title="Reiniciar asistente"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reiniciar</span>
            </button>
          )}

          <div className="h-4 w-px bg-[#DAD6CC]" />

          <button
            onClick={onSwitchProfile}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#202321] hover:bg-[#F3F0E8] rounded-sm border border-[#DAD6CC] hover:border-[#A6A18F] transition-colors cursor-pointer font-medium"
            title="Volver a la pantalla de selección de perfil"
          >
            <span>Cambiar perfil</span>
          </button>

          <button
            onClick={onGoToAnalyst}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#202321] hover:bg-[#343835] text-[#FAF9F5] rounded-sm font-semibold transition-colors cursor-pointer"
            title="Ir a la plataforma analítica completa"
          >
            <BarChart3 className="w-3.5 h-3.5 text-[#C64B37]" />
            <span>Modo Analista</span>
          </button>
        </div>
      </div>
    </header>
  );
};
