import React, { useState, useMemo } from 'react';
import {
  MapPin,
  Compass,
  Building2,
  Calendar,
  Layers,
  ArrowRight,
  Sparkles,
  HelpCircle,
  SlidersHorizontal,
  ChevronDown,
  Navigation,
  Clock,
  Scale
} from 'lucide-react';
import { FullHealthData, HospitalMetadata, WaitListType } from '../../types';
import {
  MadridMunicipality,
  MADRID_MUNICIPALITIES,
  calculateDistanceKm
} from '../../data/madridMunicipalities';
import { PatientHeader } from './PatientHeader';
import { PatientWizardSteps, PatientPreference } from './PatientWizardSteps';
import { MadridRealMap } from './MadridRealMap';
import { HospitalPatientCard } from './HospitalPatientCard';
import { HospitalComparator } from './HospitalComparator';
import { PatientNoticeBanner } from './PatientNoticeBanner';
import { formatEsDec, formatEsInt } from '../../utils/format';

interface PatientExperienceProps {
  data: FullHealthData;
  onSwitchProfile: () => void;
  onGoToAnalyst: () => void;
}

export const PatientExperience: React.FC<PatientExperienceProps> = ({
  data,
  onSwitchProfile,
  onGoToAnalyst
}) => {
  // Wizard & view states
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedMunicipality, setSelectedMunicipality] = useState<MadridMunicipality>(
    MADRID_MUNICIPALITIES[0] // Defaults to Madrid capital
  );
  const [selectedCareType, setSelectedCareType] = useState<WaitListType>('quirurgica');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');
  const [selectedPreference, setSelectedPreference] = useState<PatientPreference>('equilibrio');
  const [selectedHospital, setSelectedHospital] = useState<HospitalMetadata | null>(null);
  const [patientViewSubTab, setPatientViewSubTab] = useState<'explorar' | 'comparador'>('explorar');

  const hospitalList = useMemo(() => {
    return Object.values(data.hospitals);
  }, [data.hospitals]);

  // Distance computation from user municipality to each hospital
  const hospitalsWithDistance = useMemo(() => {
    return hospitalList.map(h => {
      const distanceKm = calculateDistanceKm(
        selectedMunicipality.lat,
        selectedMunicipality.lng,
        h.lat,
        h.lng
      );
      return {
        hospital: h,
        distanceKm
      };
    }).sort((a, b) => a.distanceKm - b.distanceKm);
  }, [hospitalList, selectedMunicipality]);

  // Identify Level 1 (closest environment: within 15 km or top 6 closest)
  const closestHospitalIds = useMemo(() => {
    const topClosest = hospitalsWithDistance.slice(0, 6).map(item => item.hospital.id);
    return new Set(topClosest);
  }, [hospitalsWithDistance]);

  const level1Hospitals = useMemo(() => {
    return hospitalsWithDistance.filter(item => closestHospitalIds.has(item.hospital.id));
  }, [hospitalsWithDistance, closestHospitalIds]);

  const level2Hospitals = useMemo(() => {
    return hospitalsWithDistance.filter(item => !closestHospitalIds.has(item.hospital.id));
  }, [hospitalsWithDistance, closestHospitalIds]);

  const delayYear = selectedCareType === 'quirurgica' ? '2025' : '2024';

  const careTypeTitle =
    selectedCareType === 'quirurgica'
      ? 'Intervención Quirúrgica (LEQ · 2025)'
      : selectedCareType === 'consultas'
      ? 'Consulta Externa (LECE · 2024)'
      : 'Prueba Diagnóstica (LEPD · 2024)';

  return (
    <div className="min-h-screen bg-[#F3F0E8] text-[#202321] flex flex-col font-sans antialiased selection:bg-[#426C79] selection:text-[#FAF9F5]">
      {/* Patient Mode Navigation Bar */}
      <PatientHeader
        currentStep={currentStep}
        totalSteps={5}
        onGoToStep={step => setCurrentStep(step)}
        onSwitchProfile={onSwitchProfile}
        onGoToAnalyst={onGoToAnalyst}
        onResetRoute={() => {
          setCurrentStep(1);
          setSelectedHospital(null);
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1440px] mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Prominent Legal & Methodological Advisory Banner */}
        <PatientNoticeBanner />

        {/* Wizard Steps (1, 2, 3, 4) */}
        {currentStep < 5 && (
          <PatientWizardSteps
            data={data}
            currentStep={currentStep}
            selectedMunicipality={selectedMunicipality}
            onSelectMunicipality={muni => setSelectedMunicipality(muni)}
            selectedCareType={selectedCareType}
            onSelectCareType={care => setSelectedCareType(care)}
            selectedSpecialty={selectedSpecialty}
            onSelectSpecialty={spec => setSelectedSpecialty(spec)}
            selectedPreference={selectedPreference}
            onSelectPreference={pref => setSelectedPreference(pref)}
            onNextStep={() => setCurrentStep(prev => Math.min(prev + 1, 5))}
            onPrevStep={() => setCurrentStep(prev => Math.max(prev - 1, 1))}
            onCompleteWizard={() => setCurrentStep(5)}
          />
        )}

        {/* Step 5: Full Experience (Map + Prioritized Lists + Comparator) */}
        {currentStep === 5 && (
          <div className="space-y-6 obs-enter">
            {/* Context Summary Bar */}
            <div className="bg-[#FAF9F5] border border-[#DAD6CC] rounded-sm p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs uppercase font-bold text-[#426C79] bg-[#426C79]/10 px-2 py-0.5 rounded-xs">
                    Tu Ruta Sanitaria Personalizada
                  </span>
                  <span className="font-mono text-xs text-[#77766F]">
                    Corte oficial: 31-dic-{delayYear}
                  </span>
                </div>
                <h2 className="font-serif text-xl sm:text-2xl text-[#202321]">
                  Exploración de Hospitales desde <span className="text-[#426C79]">{selectedMunicipality.name}</span>
                </h2>
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#77766F] pt-0.5">
                  <span>Atención: <strong className="text-[#202321]">{careTypeTitle}</strong></span>
                  <span>·</span>
                  <span>
                    Especialidad:{' '}
                    <strong className="text-[#202321]">
                      {selectedSpecialty || 'General hospitalaria'}
                    </strong>
                  </span>
                  <span>·</span>
                  <span>
                    Prioridad:{' '}
                    <strong className="text-[#202321]">
                      {selectedPreference === 'distancia'
                        ? 'Menor distancia'
                        : selectedPreference === 'demora'
                        ? 'Menor demora'
                        : 'Equilibrio 50/50'}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Quick Actions to edit preferences or switch view */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs text-[#426C79] hover:bg-[#EAF0F2] border border-[#426C79]/40 rounded-sm font-semibold transition-colors cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Modificar preferencias</span>
                </button>

                <div className="flex items-center bg-[#F3F0E8] p-1 rounded-sm border border-[#DAD6CC]">
                  <button
                    type="button"
                    onClick={() => setPatientViewSubTab('explorar')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-xs transition-colors cursor-pointer ${
                      patientViewSubTab === 'explorar'
                        ? 'bg-[#FAF9F5] text-[#202321] shadow-xs border border-[#DAD6CC]'
                        : 'text-[#77766F] hover:text-[#202321]'
                    }`}
                  >
                    Mapa y Centros
                  </button>
                  <button
                    type="button"
                    onClick={() => setPatientViewSubTab('comparador')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-xs transition-colors cursor-pointer ${
                      patientViewSubTab === 'comparador'
                        ? 'bg-[#426C79] text-[#FAF9F5] shadow-xs'
                        : 'text-[#77766F] hover:text-[#202321]'
                    }`}
                  >
                    Comparador
                  </button>
                </div>
              </div>
            </div>

            {/* Sub-view: MAPA Y CENTROS */}
            {patientViewSubTab === 'explorar' && (
              <div className="space-y-6">
                {/* 1. Real Interactive Map Component */}
                <MadridRealMap
                  hospitals={hospitalList}
                  selectedMunicipality={selectedMunicipality}
                  selectedCareType={selectedCareType}
                  selectedHospitalId={selectedHospital?.id || null}
                  onSelectHospital={h => setSelectedHospital(h)}
                  closestHospitalIds={closestHospitalIds}
                  height="480px"
                />

                {/* 2. Territorial Prioritization: Level 1 (Closest) vs Level 2 (Alternatives) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* LEVEL 1: Centros del entorno cercano */}
                  <div className="bg-[#FAF9F5] border-2 border-[#426C79] rounded-sm p-5 space-y-4 shadow-xs">
                    <div className="border-b border-[#DAD6CC] pb-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#426C79] bg-[#426C79]/10 px-2.5 py-0.5 rounded-xs">
                          PRIMER NIVEL · ENTORNO CERCANO
                        </span>
                        <span className="text-xs font-mono text-[#77766F]">
                          {level1Hospitals.length} centros
                        </span>
                      </div>
                      <h3 className="font-serif text-lg font-bold text-[#202321] mt-1">
                        Hospitales más próximos a {selectedMunicipality.name}
                      </h3>
                      <p className="text-xs text-[#77766F]">
                        Prioridad territorial por proximidad geográfica directa (km).
                      </p>
                    </div>

                    <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                      {level1Hospitals.map(item => {
                        const h = item.hospital;
                        const delayVal = h.series[selectedCareType]?.demora[delayYear];
                        const isSelected = h.id === selectedHospital?.id;

                        return (
                          <div
                            key={h.id}
                            onClick={() => setSelectedHospital(h)}
                            className={`p-3.5 rounded-sm border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                              isSelected
                                ? 'bg-[#EAF0F2] border-[#426C79] ring-1 ring-[#426C79]'
                                : 'bg-[#FAF9F5] border-[#DAD6CC] hover:border-[#426C79] hover:bg-[#F3F0E8]'
                            }`}
                          >
                            <div className="min-w-0 space-y-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-serif font-bold text-sm text-[#202321] truncate">
                                  {h.shortName}
                                </span>
                                <span className="text-[10px] font-mono text-[#77766F]">
                                  ({h.complexityGroup})
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-[#77766F]">
                                <span>{h.municipality}</span>
                                <span>·</span>
                                <span className="font-mono font-semibold text-[#426C79]">
                                  {item.distanceKm} km
                                </span>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="text-[10px] text-[#77766F] block font-mono">Demora {delayYear}:</span>
                              {delayVal !== null && delayVal !== undefined ? (
                                <span className="text-base font-bold font-mono text-[#202321]">
                                  {formatEsDec(delayVal, 1)} <span className="text-[11px] font-normal text-[#77766F]">días</span>
                                </span>
                              ) : (
                                <span className="text-[10px] font-mono text-[#77766F]">N/D</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* LEVEL 2: Otras alternativas en la Comunidad de Madrid */}
                  <div className="bg-[#FAF9F5] border border-[#DAD6CC] rounded-sm p-5 space-y-4">
                    <div className="border-b border-[#DAD6CC] pb-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#77766F] bg-[#F3F0E8] px-2.5 py-0.5 rounded-xs">
                          SEGUNDO NIVEL · RED REGIONAL
                        </span>
                        <span className="text-xs font-mono text-[#77766F]">
                          {level2Hospitals.length} centros
                        </span>
                      </div>
                      <h3 className="font-serif text-lg font-bold text-[#202321] mt-1">
                        Otros Hospitales de la Comunidad de Madrid
                      </h3>
                      <p className="text-xs text-[#77766F]">
                        Alternativas informativas disponibles en la red hospitalaria pública.
                      </p>
                    </div>

                    <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                      {level2Hospitals.map(item => {
                        const h = item.hospital;
                        const delayVal = h.series[selectedCareType]?.demora[delayYear];
                        const isSelected = h.id === selectedHospital?.id;

                        return (
                          <div
                            key={h.id}
                            onClick={() => setSelectedHospital(h)}
                            className={`p-3 rounded-sm border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                              isSelected
                                ? 'bg-[#EAF0F2] border-[#202321] ring-1 ring-[#202321]'
                                : 'bg-[#FAF9F5] border-[#DAD6CC] hover:border-[#A6A18F] hover:bg-[#F3F0E8]'
                            }`}
                          >
                            <div className="min-w-0 space-y-0.5">
                              <span className="font-medium text-xs text-[#202321] truncate block">
                                {h.shortName}
                              </span>
                              <div className="flex items-center gap-2 text-[11px] text-[#77766F]">
                                <span>{h.municipality}</span>
                                <span>·</span>
                                <span className="font-mono">{item.distanceKm} km</span>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              {delayVal !== null && delayVal !== undefined ? (
                                <span className="text-xs font-bold font-mono text-[#426C79]">
                                  {formatEsDec(delayVal, 1)} d
                                </span>
                              ) : (
                                <span className="text-[10px] font-mono text-[#77766F]">N/D</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-view: COMPARADOR MULTICRITERIO */}
            {patientViewSubTab === 'comparador' && (
              <HospitalComparator
                hospitals={hospitalList}
                selectedMunicipality={selectedMunicipality}
                selectedCareType={selectedCareType}
                onSelectHospital={h => setSelectedHospital(h)}
                selectedHospitalId={selectedHospital?.id}
              />
            )}
          </div>
        )}

        {/* Selected Hospital Detail Drawer/Modal */}
        <HospitalPatientCard
          hospital={selectedHospital}
          selectedMunicipality={selectedMunicipality}
          onClose={() => setSelectedHospital(null)}
          onCompare={h => {
            setSelectedHospital(h);
            setPatientViewSubTab('comparador');
            setCurrentStep(5);
          }}
          isCompared={selectedHospital !== null}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-[#DAD6CC] bg-[#FAF9F5] py-5 px-4 text-center text-[#77766F] space-y-1">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em]">
          MADRID SIN ESPERAS · DATAMAD 2026
        </p>
        <p className="text-xs font-medium text-[#202321]">
          Rebeca del Val · Emir Jiménez
        </p>
        <p className="font-mono text-[10px] text-[#77766F]">
          Ciencia de Datos · Universidad Complutense de Madrid
        </p>
      </footer>
    </div>
  );
};
