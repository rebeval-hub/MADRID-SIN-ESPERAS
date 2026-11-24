import React from 'react';
import {
  Compass,
  BarChart3,
  MapPin,
  HeartPulse,
  LineChart,
  ArrowRight,
  ShieldCheck,
  Building2,
  Database,
  Users
} from 'lucide-react';
import { FullHealthData, HospitalMetadata } from '../../types';

interface ProfileSelectionPageProps {
  onSelectProfile: (profile: 'patient' | 'analyst') => void;
  data?: FullHealthData;
  onSelectHospital?: (hospital: HospitalMetadata) => void;
}

export const ProfileSelectionPage: React.FC<ProfileSelectionPageProps> = ({
  onSelectProfile
}) => {
  return (
    <div className="min-h-screen bg-[#F3F0E8] text-[#202321] flex flex-col justify-between font-sans antialiased selection:bg-[#C64B37] selection:text-[#FAF9F5]">
      {/* Top micro-bar */}
      <div className="bg-[#FAF9F5] border-b border-[#DAD6CC] px-4 sm:px-8 py-2.5">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between text-xs text-[#77766F] font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#C64B37] inline-block animate-pulse" />
            <span className="text-[#202321] font-semibold">DATAMAD 2026</span>
            <span className="hidden sm:inline">· Comunidad de Madrid</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Datos Oficiales Abiertos</span>
            <span>·</span>
            <span className="text-[#426C79] font-medium">Red Hospitalaria SERMAS</span>
          </div>
        </div>
      </div>

      {/* Main hero & selection */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-10 sm:py-16 max-w-[1240px] mx-auto w-full">
        {/* Masthead Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-10 sm:mb-14">
          <div className="inline-flex items-center justify-center gap-3 mb-2">
            <img
              src="/assets/aistudio/1958ecc3-383f-4604-95d1-fa7bdd5612c2_62eeedc1.png"
              alt="MADRID SIN ESPERAS"
              className="h-12 sm:h-14 w-auto object-contain select-none"
            />
          </div>

          <div className="space-y-2">
            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl tracking-tight text-[#202321] leading-none">
              MADRID SIN ESPERAS
            </h1>
            <p className="font-mono text-xs sm:text-sm uppercase tracking-[0.2em] text-[#C64B37] font-semibold">
              INTELIGENCIA SANITARIA AL SERVICIO DE LAS PERSONAS
            </p>
          </div>

          <p className="text-sm sm:text-base text-[#77766F] max-w-2xl mx-auto leading-relaxed pt-1">
            Una plataforma para comprender las listas de espera sanitarias y explorar la información hospitalaria de la Comunidad de Madrid.
          </p>

          <div className="pt-4">
            <span className="inline-block text-xs font-mono font-semibold tracking-wider text-[#202321] uppercase bg-[#FAF9F5] border border-[#DAD6CC] px-4 py-1.5 rounded-full shadow-xs">
              ¿CÓMO QUIERES ACCEDER?
            </span>
          </div>
        </div>

        {/* 2 Big Profile Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 w-full max-w-4xl mx-auto">
          {/* Card 1: SOY PACIENTE */}
          <div
            onClick={() => onSelectProfile('patient')}
            className="group relative bg-[#FAF9F5] rounded-sm border-2 border-[#DAD6CC] hover:border-[#426C79] p-6 sm:p-8 flex flex-col justify-between transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer text-left"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[#426C79] tracking-wider uppercase bg-[#426C79]/10 px-2.5 py-1 rounded-xs">
                  Experiencia Ciudadana
                </span>
                <div className="flex items-center gap-1.5 text-[#426C79]">
                  <HeartPulse className="w-5 h-5" />
                  <MapPin className="w-5 h-5" />
                </div>
              </div>

              <div>
                <h2 className="font-serif text-2xl sm:text-3xl text-[#202321] group-hover:text-[#426C79] transition-colors">
                  SOY PACIENTE
                </h2>
                <p className="text-xs font-mono text-[#77766F] mt-0.5">
                  MI RUTA SANITARIA · ASISTENTE INTERACTIVO
                </p>
              </div>

              <p className="text-sm text-[#202321]/80 leading-relaxed">
                Encuentra y compara información sobre los hospitales de tu entorno. Explora las alternativas disponibles y conoce los indicadores de espera publicados.
              </p>

              <div className="pt-2 border-t border-[#DAD6CC]/70 space-y-1.5 text-xs text-[#77766F]">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#426C79] rounded-full" />
                  <span>Explora hospitales por cercanía a tu municipio</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#426C79] rounded-full" />
                  <span>Mapa geográfico interactivo real de Madrid</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#426C79] rounded-full" />
                  <span>Comparador transparente con demoras oficiales</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4">
              <button
                type="button"
                className="w-full inline-flex items-center justify-center gap-2.5 px-5 py-3.5 bg-[#426C79] group-hover:bg-[#345661] text-[#FAF9F5] font-semibold text-sm rounded-sm transition-colors shadow-xs cursor-pointer"
              >
                <span>ACCEDER COMO PACIENTE</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>

          {/* Card 2: SOY ANALISTA */}
          <div
            onClick={() => onSelectProfile('analyst')}
            className="group relative bg-[#FAF9F5] rounded-sm border-2 border-[#DAD6CC] hover:border-[#C64B37] p-6 sm:p-8 flex flex-col justify-between transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer text-left"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[#C64B37] tracking-wider uppercase bg-[#C64B37]/10 px-2.5 py-1 rounded-xs">
                  Plataforma Especializada
                </span>
                <div className="flex items-center gap-1.5 text-[#C64B37]">
                  <BarChart3 className="w-5 h-5" />
                  <LineChart className="w-5 h-5" />
                </div>
              </div>

              <div>
                <h2 className="font-serif text-2xl sm:text-3xl text-[#202321] group-hover:text-[#C64B37] transition-colors">
                  SOY ANALISTA
                </h2>
                <p className="text-xs font-mono text-[#77766F] mt-0.5">
                  PANEL CUANTITATIVO, TERRITORIAL Y PREDICTIVO
                </p>
              </div>

              <p className="text-sm text-[#202321]/80 leading-relaxed">
                Accede al análisis estadístico, territorial y predictivo de las listas de espera de la Comunidad de Madrid.
              </p>

              <div className="pt-2 border-t border-[#DAD6CC]/70 space-y-1.5 text-xs text-[#77766F]">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#C64B37] rounded-full" />
                  <span>8 módulos analíticos completos con 31 hospitales</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#C64B37] rounded-full" />
                  <span>Radar Sanitario SPC y Radar Territorial</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#C64B37] rounded-full" />
                  <span>Modelos predictivos Holt y exportación oficial CSV</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4">
              <button
                type="button"
                className="w-full inline-flex items-center justify-center gap-2.5 px-5 py-3.5 bg-[#C64B37] group-hover:bg-[#AE3E2C] text-[#FAF9F5] font-semibold text-sm rounded-sm transition-colors shadow-xs cursor-pointer"
              >
                <span>ACCEDER COMO ANALISTA</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#DAD6CC] bg-[#FAF9F5] py-5 px-4 text-center text-[#77766F] space-y-1">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em]">
          UN PROYECTO DESARROLLADO PARA DATAMAD 2026
        </p>
        <p className="text-xs font-medium text-[#202321]">
          Rebeca del Val · Emir Jiménez
        </p>
        <p className="font-mono text-[10.5px] text-[#77766F]">
          Ciencia de Datos · Universidad Complutense de Madrid
        </p>
      </footer>
    </div>
  );
};
