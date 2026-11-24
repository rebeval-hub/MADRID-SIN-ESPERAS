import React, { useState, useMemo } from 'react';
import {
  MapPin,
  Search,
  Check,
  Scissors,
  Stethoscope,
  Activity,
  ArrowRight,
  ArrowLeft,
  Navigation,
  Clock,
  Scale,
  Sparkles,
  Info,
  CheckCircle2,
  Building
} from 'lucide-react';
import {
  MadridMunicipality,
  MADRID_MUNICIPALITIES,
  searchMunicipalities,
  findMunicipalityByNameOrCp
} from '../../data/madridMunicipalities';
import { FullHealthData, WaitListType } from '../../types';

export type PatientPreference = 'distancia' | 'demora' | 'equilibrio';

interface PatientWizardStepsProps {
  data: FullHealthData;
  currentStep: number;
  selectedMunicipality: MadridMunicipality;
  onSelectMunicipality: (muni: MadridMunicipality) => void;
  selectedCareType: WaitListType;
  onSelectCareType: (care: WaitListType) => void;
  selectedSpecialty: string;
  onSelectSpecialty: (spec: string) => void;
  selectedPreference: PatientPreference;
  onSelectPreference: (pref: PatientPreference) => void;
  onNextStep: () => void;
  onPrevStep: () => void;
  onCompleteWizard: () => void;
}

export const PatientWizardSteps: React.FC<PatientWizardStepsProps> = ({
  data,
  currentStep,
  selectedMunicipality,
  onSelectMunicipality,
  selectedCareType,
  onSelectCareType,
  selectedSpecialty,
  onSelectSpecialty,
  selectedPreference,
  onSelectPreference,
  onNextStep,
  onPrevStep,
  onCompleteWizard
}) => {
  // Step 1: Municipality search state
  const [muniSearchTerm, setMuniSearchTerm] = useState('');
  const [showManualDropdown, setShowManualDropdown] = useState(false);

  const filteredMunicipalities = useMemo(() => {
    return searchMunicipalities(muniSearchTerm);
  }, [muniSearchTerm]);

  // Care types descriptors
  const CARE_OPTIONS: {
    id: WaitListType;
    title: string;
    subtitle: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    officialDataset: string;
    cutoff: string;
  }[] = [
    {
      id: 'quirurgica',
      title: 'INTERVENCIÓN QUIRÚRGICA',
      subtitle: 'Lista de Espera Quirúrgica (LEQ)',
      description:
        'Operaciones quirúrgicas programadas no urgentes. Evaluadas con el indicador oficial de demora estructural en días naturales.',
      icon: Scissors,
      officialDataset: 'LEQ_Hosp (SERMAS)',
      cutoff: 'Datos oficiales a 31-dic-2025'
    },
    {
      id: 'consultas',
      title: 'CONSULTA EXTERNA',
      subtitle: 'Lista de Espera para Consultas Externas (LECE)',
      description:
        'Primeras citas médicas presenciales con médicos especialistas en hospital o centro de especialidades periférico.',
      icon: Stethoscope,
      officialDataset: 'LECE_Hosp (SERMAS)',
      cutoff: 'Datos oficiales a 31-dic-2024'
    },
    {
      id: 'pruebas',
      title: 'PRUEBA DIAGNÓSTICA',
      subtitle: 'Lista de Espera para Pruebas Diagnósticas (LEPD)',
      description:
        'Exploraciones complementarias y de imagen diagnóstica: resonancias, TAC, ecografías, mamografías y radiología.',
      icon: Activity,
      officialDataset: 'LEPD_Hosp (SERMAS)',
      cutoff: 'Datos oficiales a 31-dic-2024'
    }
  ];

  // Official specialties depending on care type
  const availableSpecialties = useMemo(() => {
    if (selectedCareType === 'quirurgica') {
      return [
        'Todas las cirugías (demora hospitalaria general)',
        'Cirugía general y digestiva',
        'Traumatología',
        'Ginecología y obstetricia',
        'Oftalmología',
        'Otorrinolaringología (ORL)',
        'Urología',
        'Otras especialidades quirúrgicas'
      ];
    } else if (selectedCareType === 'consultas') {
      return [
        'Todas las consultas (demora hospitalaria general)',
        'Traumatología',
        'Oftalmología',
        'Dermatología',
        'Ginecología y obstetricia',
        'Consultas del aparato digestivo',
        'Cardiología',
        'Neurología',
        'Pediatría',
        'Psiquiatría',
        'Urología',
        'Otorrinolaringología (ORL)',
        'Cirugía general y digestiva',
        'Rehabilitación',
        'Preanestesia',
        'Otras especialidades médicas'
      ];
    } else {
      return [
        'Todas las pruebas (demora hospitalaria general)',
        'Resonancias magnéticas (RM)',
        'TAC',
        'Mamografías',
        'Rayos X  (RX) convencionales',
        'Densiometrías',
        'Gammagrafías',
        'PET y PET-TC',
        'Angiografías digitales',
        'SPECT'
      ];
    }
  }, [selectedCareType]);

  return (
    <div className="w-full max-w-4xl mx-auto py-4">
      {/* ================= STEP 1: RESIDENCIA ================= */}
      {currentStep === 1 && (
        <div className="bg-[#FAF9F5] border border-[#DAD6CC] rounded-sm p-6 sm:p-8 space-y-6 obs-enter">
          <div className="space-y-2 border-b border-[#DAD6CC] pb-4">
            <span className="font-mono text-xs uppercase font-bold text-[#426C79] tracking-wider">
              PASO 1 DE 4 · UBICACIÓN CIUDADANA
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl text-[#202321]">
              ¿EN QUÉ MUNICIPIO RESIDES?
            </h2>
            <p className="text-xs sm:text-sm text-[#77766F] leading-relaxed">
              Introduce el nombre de tu municipio o tu código postal en la Comunidad de Madrid para ordenar los hospitales por distancia geográfica. No solicitamos DNI, dirección particular ni datos personales.
            </p>
          </div>

          {/* Search bar & CP input */}
          <div className="space-y-4">
            <label className="block text-xs font-semibold text-[#202321] uppercase tracking-wider">
              Buscador de municipio o código postal (ej. 28001, Móstoles, Alcalá, Majadahonda)
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-[#77766F] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Escribe tu municipio o código postal..."
                value={muniSearchTerm}
                onChange={e => setMuniSearchTerm(e.target.value)}
                className="w-full bg-[#F3F0E8] text-[#202321] placeholder-[#77766F] text-sm rounded-sm pl-10 pr-4 py-3 border border-[#DAD6CC] focus:outline-none focus:border-[#426C79] focus:bg-[#FAF9F5] transition-colors"
              />
            </div>

            {/* Quick Suggestions / Filter Results */}
            <div className="space-y-2">
              <span className="text-[11px] text-[#77766F] font-mono uppercase">
                {muniSearchTerm ? `Resultados encontrados (${filteredMunicipalities.length}):` : 'Municipios frecuentes de Madrid:'}
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1 border border-[#DAD6CC]/60 rounded-xs bg-[#F3F0E8]/40">
                {filteredMunicipalities.map(m => {
                  const isSelected = selectedMunicipality.name === m.name;
                  return (
                    <button
                      key={m.name}
                      type="button"
                      onClick={() => {
                        onSelectMunicipality(m);
                        setMuniSearchTerm('');
                      }}
                      className={`text-left p-2 rounded-xs text-xs transition-colors cursor-pointer border flex flex-col justify-between ${
                        isSelected
                          ? 'bg-[#426C79] text-[#FAF9F5] border-[#426C79] font-semibold'
                          : 'bg-[#FAF9F5] text-[#202321] border-[#DAD6CC] hover:border-[#426C79] hover:bg-[#EAF0F2]'
                      }`}
                    >
                      <span className="truncate">{m.name}</span>
                      <span className={`text-[10px] font-mono ${isSelected ? 'text-[#FAF9F5]/80' : 'text-[#77766F]'}`}>
                        CP: {m.postalCodes[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Manual Dropdown Fallback */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowManualDropdown(!showManualDropdown)}
                className="text-xs text-[#426C79] hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
              >
                <span>{showManualDropdown ? 'Ocultar selector alfabético' : '¿No encuentras tu municipio? Desplegar lista completa'}</span>
              </button>

              {showManualDropdown && (
                <div className="mt-2">
                  <select
                    value={selectedMunicipality.name}
                    onChange={e => {
                      const found = MADRID_MUNICIPALITIES.find(m => m.name === e.target.value);
                      if (found) onSelectMunicipality(found);
                    }}
                    className="w-full bg-[#FAF9F5] text-[#202321] text-xs p-2.5 border border-[#DAD6CC] rounded-sm focus:outline-none focus:border-[#426C79]"
                  >
                    {MADRID_MUNICIPALITIES.map(m => (
                      <option key={m.name} value={m.name}>
                        {m.name} (CP principal: {m.postalCodes[0]})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Selected municipality summary box & territorial clarification */}
          <div className="bg-[#EAF0F2] border border-[#B7D1D9] rounded-sm p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#426C79]">
                <MapPin className="w-5 h-5 shrink-0" />
                <span className="font-semibold text-sm text-[#202321]">
                  Municipio seleccionado: <strong className="font-bold text-[#426C79]">{selectedMunicipality.name}</strong>
                </span>
              </div>
              <span className="font-mono text-xs text-[#77766F]">
                Coord: {selectedMunicipality.lat.toFixed(2)}, {selectedMunicipality.lng.toFixed(2)}
              </span>
            </div>

            <p className="text-xs text-[#202321]/80 leading-relaxed border-t border-[#B7D1D9]/70 pt-2">
              <strong className="text-[#202321]">Aviso de correspondencia territorial:</strong> Los hospitales se ordenan por proximidad física (distancia geográfica en km en línea recta) respecto al centroide de tu municipio. En la Comunidad de Madrid rige la libre elección de hospital para atención especializada; el área geográfica registrada en cada centro responde a su demarcación de gestión y no restringe la información comparativa.
            </p>
          </div>

          {/* Navigation Action */}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={onNextStep}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#426C79] hover:bg-[#345661] text-[#FAF9F5] font-semibold text-sm rounded-sm transition-colors cursor-pointer shadow-xs"
            >
              <span>CONTINUAR AL PASO 2</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 2: TIPO DE ATENCIÓN ================= */}
      {currentStep === 2 && (
        <div className="bg-[#FAF9F5] border border-[#DAD6CC] rounded-sm p-6 sm:p-8 space-y-6 obs-enter">
          <div className="space-y-2 border-b border-[#DAD6CC] pb-4">
            <span className="font-mono text-xs uppercase font-bold text-[#426C79] tracking-wider">
              PASO 2 DE 4 · PROCESO ASISTENCIAL
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl text-[#202321]">
              ¿QUÉ TIPO DE ATENCIÓN NECESITAS?
            </h2>
            <p className="text-xs sm:text-sm text-[#77766F] leading-relaxed">
              Selecciona la categoría asistencial sobre la que deseas explorar los indicadores oficiales de lista de espera.
            </p>
          </div>

          {/* 3 Large Option Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {CARE_OPTIONS.map(opt => {
              const Icon = opt.icon;
              const isSelected = selectedCareType === opt.id;

              return (
                <div
                  key={opt.id}
                  onClick={() => onSelectCareType(opt.id)}
                  className={`p-5 rounded-sm border-2 cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#FAF9F5] border-[#426C79] shadow-sm ring-1 ring-[#426C79]'
                      : 'bg-[#F3F0E8]/70 border-[#DAD6CC] hover:border-[#A6A18F] hover:bg-[#FAF9F5]'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div
                        className={`w-10 h-10 rounded-sm flex items-center justify-center ${
                          isSelected ? 'bg-[#426C79] text-[#FAF9F5]' : 'bg-[#DAD6CC] text-[#202321]'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-[#426C79] text-[#FAF9F5] flex items-center justify-center text-xs font-bold">
                          ✓
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="font-bold text-sm sm:text-base text-[#202321] leading-snug">
                        {opt.title}
                      </h3>
                      <span className="text-[11px] font-mono text-[#77766F] block mt-0.5">
                        {opt.subtitle}
                      </span>
                    </div>

                    <p className="text-xs text-[#202321]/80 leading-relaxed">
                      {opt.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#DAD6CC]/70 flex items-center justify-between text-[10.5px] font-mono text-[#77766F]">
                    <span>{opt.officialDataset}</span>
                    <span className="font-semibold text-[#426C79]">{opt.cutoff.slice(-4)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Explanatory note */}
          <div className="bg-[#FAF9F5] border border-[#DAD6CC] p-3.5 rounded-sm text-xs text-[#77766F] space-y-1">
            <p>
              <strong className="text-[#202321]">Transparencia de indicadores:</strong> Cada lista responde a un marco normativo y a un sistema de medición diferente según los decretos oficiales de garantías del Sistema Nacional de Salud. No se mezclan tiempos de espera de consultas con cirugías ni pruebas.
            </p>
          </div>

          {/* Navigation Actions */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={onPrevStep}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs text-[#77766F] hover:text-[#202321] border border-[#DAD6CC] rounded-sm transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Anterior</span>
            </button>
            <button
              type="button"
              onClick={onNextStep}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#426C79] hover:bg-[#345661] text-[#FAF9F5] font-semibold text-sm rounded-sm transition-colors cursor-pointer shadow-xs"
            >
              <span>CONTINUAR AL PASO 3</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 3: ESPECIALIDAD ================= */}
      {currentStep === 3 && (
        <div className="bg-[#FAF9F5] border border-[#DAD6CC] rounded-sm p-6 sm:p-8 space-y-6 obs-enter">
          <div className="space-y-2 border-b border-[#DAD6CC] pb-4">
            <span className="font-mono text-xs uppercase font-bold text-[#426C79] tracking-wider">
              PASO 3 DE 4 · ESPECIALIDAD CLÍNICA
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl text-[#202321]">
              ¿QUÉ ESPECIALIDAD O PRUEBA NECESITAS?
            </h2>
            <p className="text-xs sm:text-sm text-[#77766F] leading-relaxed">
              Selecciona la especialidad de consulta, área quirúrgica o tipo de exploración que buscas.
            </p>
          </div>

          {/* Critical Rigor Box regarding official datasets */}
          <div className="bg-[#FAF9F5] border-l-4 border-l-[#C64B37] border-y border-r border-[#DAD6CC] p-4 text-xs space-y-1.5">
            <div className="flex items-center gap-2 text-[#C64B37] font-semibold">
              <Info className="w-4 h-4" />
              <span>Criterio de Rigor e Integridad de Datos Públicos</span>
            </div>
            <p className="text-[#202321]/80 leading-relaxed">
              En las publicaciones oficiales del SERMAS (datasets <em>LEQ_Hosp</em>, <em>LECE_Hosp</em> y <em>LEPD_Hosp</em>), los indicadores de demora se publican de forma global para cada hospital. Las especialidades individuales se publican como actividad agregada regional de la estadística ESCRI.
            </p>
            <p className="text-[#77766F] font-mono text-[11px]">
              Al seleccionar una especialidad, te mostramos los hospitales con servicio asistencial disponible y su indicador oficial publicado en esta modalidad.
            </p>
          </div>

          {/* Selector Grid */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-[#202321] uppercase tracking-wider">
              Especialidades oficiales registradas en el catálogo SERMAS / ESCRI:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto p-1 border border-[#DAD6CC]/60 rounded-xs bg-[#F3F0E8]/40">
              {availableSpecialties.map(spec => {
                const isSelected = selectedSpecialty === spec || (!selectedSpecialty && spec.startsWith('Todas'));
                return (
                  <button
                    key={spec}
                    type="button"
                    onClick={() => onSelectSpecialty(spec)}
                    className={`text-left p-3 rounded-xs text-xs transition-colors cursor-pointer border flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#426C79] text-[#FAF9F5] border-[#426C79] font-semibold shadow-xs'
                        : 'bg-[#FAF9F5] text-[#202321] border-[#DAD6CC] hover:border-[#426C79] hover:bg-[#EAF0F2]'
                    }`}
                  >
                    <span className="truncate pr-2">{spec}</span>
                    {isSelected && <span className="font-bold text-xs shrink-0">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Current Selection Pill */}
          <div className="bg-[#EAF0F2] border border-[#B7D1D9] p-3 rounded-sm flex items-center justify-between text-xs">
            <span className="text-[#202321]">
              Especialidad seleccionada: <strong className="text-[#426C79] font-bold">{selectedSpecialty || availableSpecialties[0]}</strong>
            </span>
            <span className="font-mono text-[#77766F]">
              {selectedCareType === 'quirurgica' ? 'LEQ' : selectedCareType === 'consultas' ? 'LECE' : 'LEPD'}
            </span>
          </div>

          {/* Navigation Actions */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={onPrevStep}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs text-[#77766F] hover:text-[#202321] border border-[#DAD6CC] rounded-sm transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Anterior</span>
            </button>
            <button
              type="button"
              onClick={onNextStep}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#426C79] hover:bg-[#345661] text-[#FAF9F5] font-semibold text-sm rounded-sm transition-colors cursor-pointer shadow-xs"
            >
              <span>CONTINUAR AL PASO 4</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 4: PREFERENCIAS ================= */}
      {currentStep === 4 && (
        <div className="bg-[#FAF9F5] border border-[#DAD6CC] rounded-sm p-6 sm:p-8 space-y-6 obs-enter">
          <div className="space-y-2 border-b border-[#DAD6CC] pb-4">
            <span className="font-mono text-xs uppercase font-bold text-[#426C79] tracking-wider">
              PASO 4 DE 4 · CRITERIO DE ORDENACIÓN
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl text-[#202321]">
              ¿QUÉ ES LO MÁS IMPORTANTE PARA TI?
            </h2>
            <p className="text-xs sm:text-sm text-[#77766F] leading-relaxed">
              Elige cómo deseas priorizar los hospitales en la visualización y en el comparador. Podrás cambiar este criterio en cualquier momento.
            </p>
          </div>

          {/* 3 Preference Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {/* Preference: DISTANCIA */}
            <div
              onClick={() => onSelectPreference('distancia')}
              className={`p-5 rounded-sm border-2 cursor-pointer transition-all flex flex-col justify-between ${
                selectedPreference === 'distancia'
                  ? 'bg-[#FAF9F5] border-[#426C79] shadow-sm ring-1 ring-[#426C79]'
                  : 'bg-[#F3F0E8]/70 border-[#DAD6CC] hover:border-[#A6A18F] hover:bg-[#FAF9F5]'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div
                    className={`w-10 h-10 rounded-sm flex items-center justify-center ${
                      selectedPreference === 'distancia' ? 'bg-[#426C79] text-[#FAF9F5]' : 'bg-[#DAD6CC] text-[#202321]'
                    }`}
                  >
                    <Navigation className="w-5 h-5" />
                  </div>
                  {selectedPreference === 'distancia' && (
                    <span className="w-5 h-5 rounded-full bg-[#426C79] text-[#FAF9F5] flex items-center justify-center text-xs font-bold">
                      ✓
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-bold text-sm sm:text-base text-[#202321]">
                    MENOR DISTANCIA
                  </h3>
                  <span className="text-[11px] font-mono text-[#77766F] block mt-0.5">
                    Proximidad geográfica
                  </span>
                </div>

                <p className="text-xs text-[#202321]/80 leading-relaxed">
                  Prioriza los hospitales más cercanos a tu municipio para minimizar los desplazamientos y la distancia en kilómetros.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#DAD6CC]/70 text-[11px] font-mono text-[#77766F]">
                Criterio: Distancia (km) ascendente
              </div>
            </div>

            {/* Preference: DEMORA */}
            <div
              onClick={() => onSelectPreference('demora')}
              className={`p-5 rounded-sm border-2 cursor-pointer transition-all flex flex-col justify-between ${
                selectedPreference === 'demora'
                  ? 'bg-[#FAF9F5] border-[#426C79] shadow-sm ring-1 ring-[#426C79]'
                  : 'bg-[#F3F0E8]/70 border-[#DAD6CC] hover:border-[#A6A18F] hover:bg-[#FAF9F5]'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div
                    className={`w-10 h-10 rounded-sm flex items-center justify-center ${
                      selectedPreference === 'demora' ? 'bg-[#426C79] text-[#FAF9F5]' : 'bg-[#DAD6CC] text-[#202321]'
                    }`}
                  >
                    <Clock className="w-5 h-5" />
                  </div>
                  {selectedPreference === 'demora' && (
                    <span className="w-5 h-5 rounded-full bg-[#426C79] text-[#FAF9F5] flex items-center justify-center text-xs font-bold">
                      ✓
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-bold text-sm sm:text-base text-[#202321]">
                    MENOR DEMORA PUBLICADA
                  </h3>
                  <span className="text-[11px] font-mono text-[#77766F] block mt-0.5">
                    Tiempo de espera oficial
                  </span>
                </div>

                <p className="text-xs text-[#202321]/80 leading-relaxed">
                  Prioriza los hospitales que registran menor número de días de demora media en el último corte oficial publicado.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#DAD6CC]/70 text-[11px] font-mono text-[#77766F]">
                Criterio: Días oficiales ascendente
              </div>
            </div>

            {/* Preference: EQUILIBRIO */}
            <div
              onClick={() => onSelectPreference('equilibrio')}
              className={`p-5 rounded-sm border-2 cursor-pointer transition-all flex flex-col justify-between ${
                selectedPreference === 'equilibrio'
                  ? 'bg-[#FAF9F5] border-[#426C79] shadow-sm ring-1 ring-[#426C79]'
                  : 'bg-[#F3F0E8]/70 border-[#DAD6CC] hover:border-[#A6A18F] hover:bg-[#FAF9F5]'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div
                    className={`w-10 h-10 rounded-sm flex items-center justify-center ${
                      selectedPreference === 'equilibrio' ? 'bg-[#426C79] text-[#FAF9F5]' : 'bg-[#DAD6CC] text-[#202321]'
                    }`}
                  >
                    <Scale className="w-5 h-5" />
                  </div>
                  {selectedPreference === 'equilibrio' && (
                    <span className="w-5 h-5 rounded-full bg-[#426C79] text-[#FAF9F5] flex items-center justify-center text-xs font-bold">
                      ✓
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-bold text-sm sm:text-base text-[#202321]">
                    EQUILIBRIO
                  </h3>
                  <span className="text-[11px] font-mono text-[#77766F] block mt-0.5">
                    Distancia y demora combinadas
                  </span>
                </div>

                <p className="text-xs text-[#202321]/80 leading-relaxed">
                  Combina ambos factores mediante una puntuación normalizada 50/50: busca centros cercanos que además ofrezcan tiempos reducidos.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#DAD6CC]/70 text-[11px] font-mono text-[#77766F]">
                Criterio: Score multicriterio 0-100
              </div>
            </div>
          </div>

          {/* Legal Non-Medical Advisory */}
          <div className="bg-[#FAF9F5] border border-[#DAD6CC] p-4 rounded-sm text-xs text-[#77766F] space-y-1">
            <p>
              <strong className="text-[#202321]">Aviso importante:</strong> La preferencia seleccionada es exclusivamente una ayuda para ordenar la información pública disponible. No representa una recomendación médica ni sustituye el criterio del médico de atención primaria o especialista.
            </p>
          </div>

          {/* Navigation Actions */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={onPrevStep}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs text-[#77766F] hover:text-[#202321] border border-[#DAD6CC] rounded-sm transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Anterior</span>
            </button>
            <button
              type="button"
              onClick={onCompleteWizard}
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#426C79] hover:bg-[#345661] text-[#FAF9F5] font-semibold text-sm rounded-sm transition-colors cursor-pointer shadow-md"
            >
              <span>EXPLORAR MAPA Y HOSPITALES</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
