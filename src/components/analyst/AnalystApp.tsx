import React, { useState, useMemo } from 'react';
import { FullHealthData, HospitalMetadata } from '../../types';
import { Header } from '../common/Header';
import { Sidebar, ActiveTab } from '../common/Sidebar';
import { HospitalModal } from '../common/HospitalModal';
import { OverviewPage } from '../../pages/OverviewPage';
import { HospitalsPage } from '../../pages/HospitalsPage';
import { SpecialtiesPage } from '../../pages/SpecialtiesPage';
import { TimeSeriesPage } from '../../pages/TimeSeriesPage';
import { RadarPage } from '../../pages/RadarPage';
import { TerritorialRadarPage } from '../../pages/TerritorialRadarPage';
import { PredictivePage } from '../../pages/PredictivePage';
import { DataQualityPage } from '../../pages/DataQualityPage';

interface AnalystAppProps {
  data: FullHealthData;
  onSwitchProfile?: () => void;
  onGoToPatient?: () => void;
}

export const AnalystApp: React.FC<AnalystAppProps> = ({
  data,
  onSwitchProfile,
  onGoToPatient
}) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [selectedHospital, setSelectedHospital] = useState<HospitalMetadata | null>(null);
  const [searchQuery, setSearchTerm] = useState<string>('');

  const handleExportCsv = () => {
    const rows = [
      [
        'Hospital',
        'Grupo Complejidad (SERMAS)',
        'Modelo de Gestión',
        'Titularidad',
        'Área',
        'Municipio',
        'Latitud',
        'Longitud',
        'Camas Instaladas (SERMAS 2024)',
        'Camas Funcionantes (SERMAS 2024)',
        'Camas CNH 2025',
        'Quirófanos Instalados (SERMAS 2024)',
        'Demora Quirúrgica dic-2025 (d)',
        'Pacientes Quirúrgicos dic-2025',
        'Demora Consultas dic-2024 (d)',
        'Pacientes Consultas dic-2024',
        'Demora Pruebas dic-2024 (d)',
        'Pacientes Pruebas dic-2024'
      ]
    ];

    const fmt = (v: number | null | undefined) => (v === null || v === undefined ? 'No disponible' : v.toString());

    Object.values(data.hospitals).forEach(h => {
      rows.push([
        `"${h.fullName}"`,
        `"${h.complexityGroup}"`,
        `"${h.managementModel}"`,
        `"${h.ownership}"`,
        `"${h.area}"`,
        `"${h.municipality}"`,
        h.lat.toString(),
        h.lng.toString(),
        fmt(h.beds),
        fmt(h.operatingBeds),
        fmt(h.cnhBeds),
        fmt(h.quirofanos),
        fmt(h.series.quirurgica.demora['2025']),
        fmt(h.series.quirurgica.pacientes['2025']),
        fmt(h.series.consultas.demora['2024']),
        fmt(h.series.consultas.pacientes['2024']),
        fmt(h.series.pruebas.demora['2024']),
        fmt(h.series.pruebas.pacientes['2024'])
      ]);
    });

    const csvContent = '\uFEFF' + rows.map(r => r.join(';')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `madrid_sin_esperas_matriz_oficial_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSelectHospital = (hosp: HospitalMetadata) => {
    setSelectedHospital(hosp);
  };

  const matchingHospital = useMemo(() => {
    if (!searchQuery || searchQuery.trim().length < 3) return null;
    const term = searchQuery.toLowerCase();
    return Object.values(data.hospitals).find(
      h => h.fullName.toLowerCase().includes(term) || h.shortName.toLowerCase().includes(term)
    );
  }, [searchQuery, data.hospitals]);

  const comparativeSignalsCount = useMemo(
    () => data.radarAlerts.filter(a => a.radarType === 'comparativo').length,
    [data.radarAlerts]
  );

  return (
    <div className="min-h-screen bg-[#F3F0E8] flex flex-col text-[#202321] font-sans antialiased">
      <Header
        lastUpdated={data.metadata.generatedAt}
        totalRecords={data.auditReport.totalRecordsProcessed}
        onExportCsv={handleExportCsv}
        searchQuery={searchQuery}
        onSearchChange={q => setSearchTerm(q)}
        onSwitchProfile={onSwitchProfile}
        onGoToPatient={onGoToPatient}
      />

      {matchingHospital && (
        <div className="bg-[#202321] text-[#FAF9F5] px-4 lg:px-8 py-2 flex items-center justify-between gap-3 text-xs border-b border-[#C64B37]">
          <span className="truncate">
            Resultado de búsqueda: <strong className="font-semibold">{matchingHospital.fullName}</strong>{' '}
            <span className="text-[#A6A18F] font-mono">
              ({matchingHospital.complexityGroup} · {matchingHospital.managementModel})
            </span>
          </span>
          <button
            onClick={() => handleSelectHospital(matchingHospital)}
            className="px-3 py-1 bg-[#C64B37] hover:bg-[#AE3E2C] text-[#FAF9F5] rounded-sm font-semibold cursor-pointer whitespace-nowrap shrink-0 transition-colors"
          >
            Ver Ficha Completa
          </button>
        </div>
      )}

      <div className="flex-1 flex flex-col lg:flex-row">
        <Sidebar
          activeTab={activeTab}
          onTabChange={t => setActiveTab(t)}
          radarAlertsCount={comparativeSignalsCount}
        />

        <main className="flex-1 flex flex-col p-4 sm:p-6 lg:px-6 lg:py-7 xl:px-8 xl:py-8 2xl:px-10 max-w-[1440px] mx-auto w-full min-w-0">
          <div key={activeTab} className="obs-enter flex-1">
            {activeTab === 'overview' && (
              <OverviewPage
                data={data}
                onNavigateToRadar={() => setActiveTab('radar')}
                onSelectHospital={handleSelectHospital}
              />
            )}

            {activeTab === 'hospitals' && (
              <HospitalsPage
                data={data}
                onSelectHospital={handleSelectHospital}
                selectedHospitalId={selectedHospital?.id}
              />
            )}

            {activeTab === 'specialties' && <SpecialtiesPage data={data} />}

            {activeTab === 'timeseries' && <TimeSeriesPage data={data} />}

            {activeTab === 'radar' && (
              <RadarPage
                data={data}
                onSelectHospital={handleSelectHospital}
              />
            )}

            {activeTab === 'opportunities' && (
              <TerritorialRadarPage
                data={data}
                selectedHospitalId={selectedHospital?.id}
                onSelectHospital={handleSelectHospital}
              />
            )}

            {activeTab === 'predictive' && <PredictivePage data={data} />}

            {activeTab === 'audit' && (
              <DataQualityPage
                data={data}
                onExportCsv={handleExportCsv}
              />
            )}
          </div>

          <footer className="mt-10 pt-5 border-t border-[#DAD6CC]/70 text-center space-y-0.5 select-none">
            <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-[#77766F]">
              UN PROYECTO DESARROLLADO POR
            </p>
            <p className="text-[11px] font-medium text-[#202321]/80">
              Rebeca del Val · Emir Jiménez
            </p>
            <p className="font-mono text-[10px] text-[#77766F]">
              DATAMAD 2026 · Ciencia de Datos (UCM)
            </p>
          </footer>
        </main>
      </div>

      <HospitalModal
        hospital={selectedHospital}
        onClose={() => setSelectedHospital(null)}
        radarAlerts={data.radarAlerts}
      />
    </div>
  );
};
