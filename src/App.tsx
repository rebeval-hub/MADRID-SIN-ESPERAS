import React, { useState, useEffect } from 'react';
import healthDataRaw from './data/officialHealthData.json';
import { FullHealthData, HospitalMetadata } from './types';
import { ProfileSelectionPage } from './components/landing/ProfileSelectionPage';
import { PatientExperience } from './components/patient/PatientExperience';
import { AnalystApp } from './components/analyst/AnalystApp';
import { CopilotWidget } from './components/common/CopilotWidget';
import { HospitalModal } from './components/common/HospitalModal';

export type UserProfile = 'landing' | 'patient' | 'analyst';

export default function App() {
  const data: FullHealthData = healthDataRaw as unknown as FullHealthData;

  const [profile, setProfile] = useState<UserProfile>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const perfilParam = urlParams.get('perfil') || urlParams.get('profile');
      if (perfilParam === 'paciente' || perfilParam === 'patient') return 'patient';
      if (perfilParam === 'analista' || perfilParam === 'analyst') return 'analyst';
      if (perfilParam === 'inicio' || perfilParam === 'landing') return 'landing';

      const saved = localStorage.getItem('madrid_sin_esperas_profile');
      if (saved === 'patient' || saved === 'analyst') return saved;
    }
    return 'landing';
  });

  const [selectedHospital, setSelectedHospital] = useState<HospitalMetadata | null>(null);

  const handleSelectProfile = (selected: 'patient' | 'analyst') => {
    setProfile(selected);
    if (typeof window !== 'undefined') {
      localStorage.setItem('madrid_sin_esperas_profile', selected);
      const url = new URL(window.location.href);
      url.searchParams.set('perfil', selected);
      window.history.pushState({}, '', url.toString());
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleReturnToLanding = () => {
    setProfile('landing');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('madrid_sin_esperas_profile');
      const url = new URL(window.location.href);
      url.searchParams.delete('perfil');
      url.searchParams.delete('profile');
      window.history.pushState({}, '', url.toString());
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleGoToAnalyst = () => {
    handleSelectProfile('analyst');
  };

  const handleGoToPatient = () => {
    handleSelectProfile('patient');
  };

  return (
    <div className="relative min-h-screen">
      {profile === 'landing' && (
        <ProfileSelectionPage
          onSelectProfile={handleSelectProfile}
          data={data}
          onSelectHospital={setSelectedHospital}
        />
      )}

      {profile === 'patient' && (
        <PatientExperience
          data={data}
          onSwitchProfile={handleReturnToLanding}
          onGoToAnalyst={handleGoToAnalyst}
        />
      )}

      {profile === 'analyst' && (
        <AnalystApp
          data={data}
          onSwitchProfile={handleReturnToLanding}
          onGoToPatient={handleGoToPatient}
        />
      )}

      {selectedHospital && (
        <HospitalModal
          hospital={selectedHospital}
          onClose={() => setSelectedHospital(null)}
          radarAlerts={data.radarAlerts}
        />
      )}

      {/* Copiloto Sanitario accesible en cualquier perfil */}
      <CopilotWidget
        data={data}
        onSelectHospital={setSelectedHospital}
        onNavigateTab={() => {
          if (profile !== 'analyst') {
            handleSelectProfile('analyst');
          }
        }}
      />
    </div>
  );
}
