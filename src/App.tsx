import React, { useState, useEffect } from 'react';
import healthDataRaw from './data/officialHealthData.json';
import { FullHealthData } from './types';
import { ProfileSelectionPage } from './components/landing/ProfileSelectionPage';
import { PatientExperience } from './components/patient/PatientExperience';
import { AnalystApp } from './components/analyst/AnalystApp';

export type UserProfile = 'landing' | 'patient' | 'analyst';

export default function App() {
  const data: FullHealthData = healthDataRaw as unknown as FullHealthData;

  // Determine initial profile from URL params or localStorage
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

  const handleSelectProfile = (selected: 'patient' | 'analyst') => {
    setProfile(selected);
    if (typeof window !== 'undefined') {
      localStorage.setItem('madrid_sin_esperas_profile', selected);
      // Clean query parameter if user changes view
      const url = new URL(window.location.href);
      url.searchParams.set('perfil', selected === 'patient' ? 'paciente' : 'analista');
      window.history.pushState({}, '', url.toString());
    }
  };

  const handleReturnToLanding = () => {
    setProfile('landing');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('madrid_sin_esperas_profile');
      const url = new URL(window.location.href);
      url.searchParams.delete('perfil');
      url.searchParams.delete('profile');
      window.history.pushState({}, '', url.pathname);
    }
  };

  const handleGoToAnalyst = () => {
    handleSelectProfile('analyst');
  };

  const handleGoToPatient = () => {
    handleSelectProfile('patient');
  };

  if (profile === 'landing') {
    return <ProfileSelectionPage onSelectProfile={handleSelectProfile} />;
  }

  if (profile === 'patient') {
    return (
      <PatientExperience
        data={data}
        onSwitchProfile={handleReturnToLanding}
        onGoToAnalyst={handleGoToAnalyst}
      />
    );
  }

  // Profile === 'analyst': EXACT original application preserved intact
  return (
    <AnalystApp
      data={data}
      onSwitchProfile={handleReturnToLanding}
      onGoToPatient={handleGoToPatient}
    />
  );
}
