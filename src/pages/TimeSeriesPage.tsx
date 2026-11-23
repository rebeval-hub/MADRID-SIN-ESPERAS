import React, { useState } from 'react';
import { TrendingUp, X, Info } from 'lucide-react';
import { FullHealthData, WaitListType } from '../types';
import { CategoryBadge } from '../components/common/Badge';
import { InteractiveLineChart, LineSeries } from '../components/charts/InteractiveLineChart';

interface TimeSeriesPageProps {
  data: FullHealthData;
}

const PALETTE = ['#426C79', '#C64B37', '#2D6A4F', '#D47528', '#6E4D7B'];

export const TimeSeriesPage: React.FC<TimeSeriesPageProps> = ({ data }) => {
  const { regional, hospitals } = data;
  const [listType, setListType] = useState<WaitListType>('quirurgica');
  const [metricType, setMetricType] = useState<'demora' | 'pacientes'>('demora');
  const [selectedHospIds, setSelectedHospIds] = useState<string[]>([
    'la_paz',
    'gregorio_maranon',
    '12_de_octubre',
    'clinico_san_carlos'
  ]);

  const hospitalList = Object.values(hospitals);

  const toggleHospital = (id: string) => {
    if (selectedHospIds.includes(id)) {
      if (selectedHospIds.length > 1) {
        setSelectedHospIds(selectedHospIds.filter(h => h !== id));
      }
    } else if (selectedHospIds.length < 5) {
      setSelectedHospIds([...selectedHospIds, id]);
    }
  };

  const chartSeries: LineSeries[] = selectedHospIds.map((hId, idx) => {
    const h = hospitals[hId];
    const s = h.series[listType];
    return {
      id: h.id,
      name: h.shortName,
      color: PALETTE[idx % PALETTE.length],
      firstPeriod: s.firstYear,
      lastPeriod: s.lastYear,
      missingPeriods: s.missingYears,
      data: s.years.map(y => ({
        x: y,
        y: metricType === 'demora' ? (s.demora[y] ?? null) : (s.pacientes[y] ?? null)
      }))
    };
  });

  // Regional reference series (only when metricType === 'demora', with explicit scope disclosure for LEQ)
  const regSeries = regional[listType].series;
  if (metricType === 'demora') {
    chartSeries.push({
      id: 'regional_ref',
      name:
        listType === 'quirurgica'
          ? 'Ref. Regional Oficial (solo espera estructural)'
          : 'Media Regional Oficial (espera estructural)',
      color: '#202321',
      dashed: true,
      firstPeriod: regSeries[0]?.year,
      lastPeriod: regSeries[regSeries.length - 1]?.year,
      data: regSeries.map(s => ({
        x: s.year,
        y: s.demoraMedia ?? null
      }))
    });
  }

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-[#FAF9F5] border border-[#DAD6CC] rounded-sm p-5 flex flex-col gap-3.5">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="font-serif text-2xl tracking-tight text-[#202321]">
              Evolución Temporal y Comparador Longitudinal
            </h2>
            <CategoryBadge category="OFICIAL" />
          </div>
          <p className="text-xs text-[#77766F] mt-1">
            {listType === 'quirurgica'
              ? 'Lista Quirúrgica (LEQ): datos anuales a 31-dic de 2015 a 2025.'
              : listType === 'consultas'
              ? 'Consultas Externas (LECE): datos a 31-dic de 2017 a 2024 por centro (2015–2024 agregado regional).'
              : 'Pruebas Diagnósticas (LEPD): datos a 31-dic de 2017 a 2024 por centro (2015–2024 agregado regional).'}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center bg-[#ECE8DD] p-1 rounded-xs text-xs font-medium gap-0.5">
            {(['quirurgica', 'consultas', 'pruebas'] as WaitListType[]).map(cat => (
              <button
                key={cat}
                onClick={() => setListType(cat)}
                className={`px-3 py-1.5 rounded-xs transition-colors cursor-pointer ${
                  listType === cat
                    ? 'bg-[#C64B37] text-[#FAF9F5] font-semibold'
                    : 'text-[#4A4D48] hover:text-[#202321]'
                }`}
              >
                {cat === 'quirurgica' ? 'Quirúrgica (2015–2025)' : cat === 'consultas' ? 'Consultas (2017–2024)' : 'Pruebas (2017–2024)'}
              </button>
            ))}
          </div>

          <div className="flex items-center bg-[#ECE8DD] p-1 rounded-xs text-xs font-medium">
            <button
              onClick={() => setMetricType('demora')}
              className={`px-3 py-1.5 rounded-xs transition-colors cursor-pointer ${
                metricType === 'demora' ? 'bg-[#FAF9F5] text-[#202321] font-semibold' : 'text-[#4A4D48] hover:text-[#202321]'
              }`}
            >
              Demora Media (días)
            </button>
            <button
              onClick={() => setMetricType('pacientes')}
              className={`px-3 py-1.5 rounded-xs transition-colors cursor-pointer ${
                metricType === 'pacientes' ? 'bg-[#FAF9F5] text-[#202321] font-semibold' : 'text-[#4A4D48] hover:text-[#202321]'
              }`}
            >
              Pacientes Activos
            </button>
          </div>
        </div>
      </div>

      {/* Hospital Selector Index */}
      <div className="bg-[#FAF9F5] border border-[#DAD6CC] rounded-sm p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-[#E6E2D8]">
          <span className="text-[11px] font-mono font-bold text-[#202321] uppercase tracking-wider">
            Hospitales Seleccionados ({selectedHospIds.length}/5):
          </span>
          <span className="text-[11px] text-[#77766F]">Haz clic para añadir o quitar centros</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {hospitalList.map(h => {
            const isSelected = selectedHospIds.includes(h.id);
            const colorIdx = selectedHospIds.indexOf(h.id);
            const color = isSelected ? PALETTE[colorIdx % PALETTE.length] : '#A6A18F';
            const hasSeries = h.series[listType].firstYear !== null;

            return (
              <button
                key={h.id}
                onClick={() => toggleHospital(h.id)}
                disabled={!hasSeries}
                title={hasSeries ? `Serie disponible: ${h.series[listType].firstYear}–${h.series[listType].lastYear}` : 'No aplicable en esta lista'}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xs text-xs font-medium border transition-colors ${
                  !hasSeries
                    ? 'bg-[#ECE8DD] text-[#A6A18F] border-[#DAD6CC] cursor-not-allowed opacity-65'
                    : isSelected
                    ? 'bg-[#202321] text-[#FAF9F5] border-[#202321] cursor-pointer'
                    : 'bg-[#F3F0E8] text-[#202321] border-[#DAD6CC] hover:border-[#A6A18F] cursor-pointer'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 shrink-0"
                  style={{ backgroundColor: isSelected ? color : '#C4BFB1' }}
                />
                <span>{h.shortName}</span>
                {!hasSeries && <span className="text-[9px] font-mono">(N/A)</span>}
                {isSelected && <X className="w-3 h-3 text-[#A6A18F] hover:text-[#FAF9F5]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Multi-Series Chart */}
      <div className="bg-[#FAF9F5] border border-[#DAD6CC] rounded-sm p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#E6E2D8]">
          <h3 className="font-serif text-lg text-[#202321] flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#426C79]" />
            <span>Comparativa Longitudinal Multihospitalaria (Cortes a 31 de diciembre)</span>
          </h3>
          <span className="text-xs font-mono text-[#77766F]">
            Métrica: {metricType === 'demora' ? 'Días naturales' : 'Pacientes en lista'}
          </span>
        </div>

        <InteractiveLineChart
          series={chartSeries}
          unit={metricType === 'demora' ? 'días' : 'pacientes'}
          height={400}
        />

        {listType === 'quirurgica' && metricType === 'demora' && (
          <div className="p-3 bg-[#F3F0E8] border border-[#DAD6CC] rounded-xs text-[11px] text-[#4A4D48] flex items-start gap-2.5">
            <Info className="w-4 h-4 text-[#426C79] shrink-0 mt-0.5" />
            <span>
              <strong className="text-[#202321]">Nota metodológica:</strong> Las series individuales por hospital (<em>LEQ_Hosp</em>) incluyen el conjunto total de pacientes del centro, mientras que la línea discontinua regional (<em>LEQ_Global</em>) mide la demora media exclusivamente en espera estructural. Los huecos oficiales (p. ej. 2022 en Clínico San Carlos o 2023 en Gómez Ulla para LECE/LEPD) se muestran con punto hueco y línea discontinua sin interpolar valores.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
