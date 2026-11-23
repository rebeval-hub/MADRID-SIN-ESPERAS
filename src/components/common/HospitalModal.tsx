import React from 'react';
import { X, Bed, Scissors, MapPin, AlertCircle, TrendingUp, Shield, FileCheck2, ExternalLink } from 'lucide-react';
import { HospitalMetadata, RadarAlert } from '../../types';
import { CategoryBadge, AlertBadge } from './Badge';
import { InteractiveLineChart, LineSeries } from '../charts/InteractiveLineChart';
import { formatEsDec, formatEsInt } from '../../utils/format';

interface HospitalModalProps {
  hospital: HospitalMetadata | null;
  onClose: () => void;
  radarAlerts: RadarAlert[];
}

export const HospitalModal: React.FC<HospitalModalProps> = ({
  hospital,
  onClose,
  radarAlerts
}) => {
  if (!hospital) return null;

  const hospAlerts = radarAlerts.filter(a => a.hospitalId === hospital.id);

  const qSeries = hospital.series.quirurgica;
  const cSeries = hospital.series.consultas;
  const pSeries = hospital.series.pruebas;

  const lineSeriesList: LineSeries[] = [];

  if (qSeries.years.length > 0 && qSeries.firstYear) {
    lineSeriesList.push({
      id: 'quirurgica_demora',
      name: 'Demora Quirúrgica (días)',
      color: '#0284c7',
      firstPeriod: qSeries.firstYear,
      lastPeriod: qSeries.lastYear,
      missingPeriods: qSeries.missingYears,
      data: qSeries.years.map(y => ({
        x: y,
        y: qSeries.demora[y] ?? null
      }))
    });
  }

  if (cSeries.years.length > 0 && cSeries.firstYear) {
    lineSeriesList.push({
      id: 'consultas_demora',
      name: 'Demora Consultas Externas (días)',
      color: '#8b5cf6',
      firstPeriod: cSeries.firstYear,
      lastPeriod: cSeries.lastYear,
      missingPeriods: cSeries.missingYears,
      data: cSeries.years.map(y => ({
        x: y,
        y: cSeries.demora[y] ?? null
      }))
    });
  }

  if (pSeries.years.length > 0 && pSeries.firstYear) {
    lineSeriesList.push({
      id: 'pruebas_demora',
      name: 'Demora Pruebas Diagnósticas (días)',
      color: '#10b981',
      firstPeriod: pSeries.firstYear,
      lastPeriod: pSeries.lastYear,
      missingPeriods: pSeries.missingYears,
      data: pSeries.years.map(y => ({
        x: y,
        y: pSeries.demora[y] ?? null
      }))
    });
  }

  const latestQYear = qSeries.lastYear;
  const latestQDelay = latestQYear ? qSeries.demora[latestQYear] : null;
  const latestQPacientes = latestQYear ? qSeries.pacientes[latestQYear] : null;

  const latestCYear = cSeries.lastYear;
  const latestCDelay = latestCYear ? cSeries.demora[latestCYear] : null;
  const latestCPacientes = latestCYear ? cSeries.pacientes[latestCYear] : null;

  const latestPYear = pSeries.lastYear;
  const latestPDelay = latestPYear ? pSeries.demora[latestPYear] : null;
  const latestPPacientes = latestPYear ? pSeries.pacientes[latestPYear] : null;

  const seriesAuditRows = [
    {
      label: 'Lista Quirúrgica (LEQ_Hosp)',
      color: '#0284c7',
      series: qSeries,
      validCount: qSeries.years.filter(y => qSeries.demora[y] !== null && qSeries.demora[y] !== undefined).length,
      latestValue: latestQDelay !== null && latestQDelay !== undefined ? `${formatEsDec(latestQDelay, 1)} d (${latestQYear})` : 'No aplicable'
    },
    {
      label: 'Consultas Externas (LECE_Hosp)',
      color: '#8b5cf6',
      series: cSeries,
      validCount: cSeries.years.filter(y => cSeries.demora[y] !== null && cSeries.demora[y] !== undefined).length,
      latestValue: latestCDelay !== null && latestCDelay !== undefined ? `${formatEsDec(latestCDelay, 1)} d (${latestCYear})` : 'Sin registro'
    },
    {
      label: 'Pruebas Diagnósticas (LEPD_Hosp)',
      color: '#10b981',
      series: pSeries,
      validCount: pSeries.years.filter(y => pSeries.demora[y] !== null && pSeries.demora[y] !== undefined).length,
      latestValue: latestPDelay !== null && latestPDelay !== undefined ? `${formatEsDec(latestPDelay, 1)} d (${latestPYear})` : 'No aplicable'
    }
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#202321]/70 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-[#FAF9F5] rounded-sm shadow-2xl border border-[#A6A18F] overflow-hidden my-4 max-h-[92vh] flex flex-col obs-enter"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Masthead */}
        <div className="flex items-start justify-between gap-4 p-6 bg-[#202321] text-[#FAF9F5] border-b-[3px] border-b-[#C64B37] shrink-0">
          <div className="space-y-2 min-w-0">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] font-mono text-[#DAD6CC]">
              <span className="text-[#E88A78] font-semibold">{hospital.complexityLabel}</span>
              <span aria-hidden="true">·</span>
              <span>Titularidad: {hospital.ownership}</span>
              <span aria-hidden="true">·</span>
              <span>{hospital.managementModel}</span>
              <span aria-hidden="true">·</span>
              <span>Área {hospital.area}</span>
            </div>
            <h3 className="font-serif text-2xl sm:text-[26px] tracking-tight text-[#FAF9F5] leading-tight">
              {hospital.fullName}
            </h3>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-[#DAD6CC] pt-1">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#C64B37] shrink-0" />
                <span>
                  {hospital.municipality}
                  {hospital.address ? ` (${hospital.address})` : ''} ·{' '}
                  <span className="font-mono text-[11px]">
                    {formatEsDec(hospital.lat, 4)}, {formatEsDec(hospital.lng, 4)}
                  </span>
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5" title="Fuente: Memoria Anual SERMAS 2024 (SIAE) y contraste CNH 2025">
                <Bed className="w-3.5 h-3.5 text-[#7BA7B5] shrink-0" />
                <span>
                  {hospital.beds !== null ? (
                    <>
                      <strong className="font-mono text-[#FAF9F5]">{formatEsInt(hospital.beds)}</strong> camas instaladas
                      {hospital.operatingBeds !== null && hospital.operatingBeds !== undefined && (
                        <span className="text-[#A6A18F] font-mono"> ({formatEsInt(hospital.operatingBeds)} func. 2024)</span>
                      )}
                    </>
                  ) : (
                    'Camas: No disponible en fuente oficial verificada'
                  )}
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5" title="Fuente: Memoria Anual SERMAS 2024 (SIAE)">
                <Scissors className="w-3.5 h-3.5 text-[#D8A85A] shrink-0" />
                <span>
                  {hospital.quirofanos !== null ? (
                    <>
                      <strong className="font-mono text-[#FAF9F5]">{formatEsInt(hospital.quirofanos)}</strong> quirófanos instalados (2024)
                    </>
                  ) : (
                    'Quirófanos: No disponible en fuente oficial verificada'
                  )}
                </span>
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar expediente"
            className="p-1.5 rounded-sm text-[#A6A18F] hover:text-[#FAF9F5] hover:bg-[#2F3330] transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 bg-[#F3F0E8]">
          {/* Governance & Classification Note */}
          <div className="bg-[#FAF9F5] border border-[#DAD6CC] rounded-sm p-4 text-xs text-[#202321] flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <Shield className="w-4 h-4 text-[#426C79] shrink-0 mt-0.5" />
              <div className="space-y-2">
                <div className="leading-relaxed">
                  <strong className="text-[#202321]">Clasificación institucional y recursos estructurales verificados: </strong>
                  {hospital.managementNote}
                </div>
                <div className="text-[11px] text-[#77766F] font-mono flex flex-wrap gap-x-4 gap-y-0.5">
                  {hospital.ccn && <span>CCN: {hospital.ccn}</span>}
                  {hospital.codCnh && <span>CODCNH: {hospital.codCnh}</span>}
                  {hospital.camRegistro && <span>Registro CAM: {hospital.camRegistro}</span>}
                  {hospital.cnhBeds !== null && hospital.cnhBeds !== undefined && (
                    <span>CNH 2025 (31-dic-2024): {formatEsInt(hospital.cnhBeds)} camas</span>
                  )}
                </div>
                {hospital.structuralProvenance?.camasInstaladas?.discrepancyNote && (
                  <div className="text-[11px] text-[#2D4F5A] bg-[#EDF3F5] border border-[#426C79]/30 rounded-xs px-2.5 py-1.5">
                    <strong>Contraste entre fuentes oficiales:</strong>{' '}
                    {hospital.structuralProvenance.camasInstaladas.discrepancyNote}
                  </div>
                )}
                <span className="block text-[11px] text-[#77766F]">
                  Atribución: {hospital.complexitySource}.{' '}
                  {hospital.sermasMemoriaUrl && (
                    <>
                      <a
                        href={hospital.sermasMemoriaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#426C79] hover:text-[#C64B37] hover:underline inline-flex items-center gap-0.5 font-medium"
                      >
                        Memoria SERMAS 2024 (ZIP SIAE) <ExternalLink className="w-2.5 h-2.5" />
                      </a>{' '}
                      ·{' '}
                    </>
                  )}
                  <a
                    href="https://www.sanidad.gob.es/estadEstudios/estadisticas/sisInfSanSNS/ofertaRecursos/hospitales/docs/CNH_2025.xlsx"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#426C79] hover:text-[#C64B37] hover:underline inline-flex items-center gap-0.5 font-medium"
                  >
                    Catálogo Nacional de Hospitales 2025 <ExternalLink className="w-2.5 h-2.5" />
                  </a>{' '}
                  ·{' '}
                  <a
                    href="https://datos.comunidad.madrid/dataset/centros_servicios_establecimientos_sanitarios"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#426C79] hover:text-[#C64B37] hover:underline inline-flex items-center gap-0.5 font-medium"
                  >
                    Catálogo Centros CAM <ExternalLink className="w-2.5 h-2.5" />
                  </a>.
                </span>
              </div>
            </div>
            <CategoryBadge category="OFICIAL" className="shrink-0 self-start" />
          </div>

          {/* Key Metrics Broadsheet Strip */}
          <div className="bg-[#FAF9F5] border border-[#DAD6CC] rounded-sm grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#DAD6CC]">
            <div className="p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-bold text-[#426C79] tracking-wide">Lista Quirúrgica</span>
                  <CategoryBadge category="OFICIAL" />
                </div>
                <div className="mt-2 flex items-baseline justify-between gap-2">
                  <div>
                    <span className="text-2xl font-bold text-[#202321] font-mono tabular-nums">
                      {latestQDelay !== null && latestQDelay !== undefined ? `${formatEsDec(latestQDelay, 1)} d` : 'N/A'}
                    </span>
                    <span className="text-[11px] text-[#77766F] block font-mono">
                      {latestQYear ? `31-dic-${latestQYear}` : 'Sin lista quirúrgica en CSV'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-bold text-[#426C79] font-mono tabular-nums">
                      {latestQPacientes !== null && latestQPacientes !== undefined
                        ? formatEsInt(latestQPacientes)
                        : 'N/A'}
                    </span>
                    <span className="text-[11px] text-[#77766F] block">pacientes</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-[#DAD6CC]/70 text-[10px] font-mono text-[#77766F]">
                Serie: {qSeries.firstYear ? `${qSeries.firstYear}–${qSeries.lastYear}` : 'No aplicable'}
                {qSeries.missingYears.length > 0 && ` · Huecos: ${qSeries.missingYears.join(', ')}`}
              </div>
            </div>

            <div className="p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-bold text-[#6E4D7B] tracking-wide">Consultas Externas</span>
                  <CategoryBadge category="OFICIAL" />
                </div>
                <div className="mt-2 flex items-baseline justify-between gap-2">
                  <div>
                    <span className="text-2xl font-bold text-[#202321] font-mono tabular-nums">
                      {latestCDelay !== null && latestCDelay !== undefined ? `${formatEsDec(latestCDelay, 1)} d` : 'N/D'}
                    </span>
                    <span className="text-[11px] text-[#77766F] block font-mono">
                      {latestCYear ? `31-dic-${latestCYear}` : 'Sin datos'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-bold text-[#6E4D7B] font-mono tabular-nums">
                      {latestCPacientes !== null && latestCPacientes !== undefined
                        ? formatEsInt(latestCPacientes)
                        : 'N/D'}
                    </span>
                    <span className="text-[11px] text-[#77766F] block">pacientes</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-[#DAD6CC]/70 text-[10px] font-mono text-[#77766F]">
                Serie: {cSeries.firstYear ? `${cSeries.firstYear}–${cSeries.lastYear}` : 'N/D'}
                {cSeries.missingYears.length > 0 && (
                  <span className="text-[#9A4D10] font-semibold"> · Hueco oficial: {cSeries.missingYears.join(', ')}</span>
                )}
              </div>
            </div>

            <div className="p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-bold text-[#2D6A4F] tracking-wide">Pruebas Diagnósticas</span>
                  <CategoryBadge category="OFICIAL" />
                </div>
                <div className="mt-2 flex items-baseline justify-between gap-2">
                  <div>
                    <span className="text-2xl font-bold text-[#202321] font-mono tabular-nums">
                      {latestPDelay !== null && latestPDelay !== undefined ? `${formatEsDec(latestPDelay, 1)} d` : 'N/A'}
                    </span>
                    <span className="text-[11px] text-[#77766F] block font-mono">
                      {latestPYear ? `31-dic-${latestPYear}` : 'Sin lista en CSV'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-bold text-[#2D6A4F] font-mono tabular-nums">
                      {latestPPacientes !== null && latestPPacientes !== undefined
                        ? formatEsInt(latestPPacientes)
                        : 'N/A'}
                    </span>
                    <span className="text-[11px] text-[#77766F] block">pacientes</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-[#DAD6CC]/70 text-[10px] font-mono text-[#77766F]">
                Serie: {pSeries.firstYear ? `${pSeries.firstYear}–${pSeries.lastYear}` : 'No aplicable'}
                {pSeries.missingYears.length > 0 && (
                  <span className="text-[#9A4D10] font-semibold"> · Hueco oficial: {pSeries.missingYears.join(', ')}</span>
                )}
              </div>
            </div>
          </div>

          {/* Series Audit Table per Center */}
          <div className="bg-[#FAF9F5] border border-[#DAD6CC] rounded-sm p-4 space-y-3">
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#DAD6CC]">
              <h4 className="text-xs font-bold text-[#202321] tracking-wide flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-[#426C79]" />
                Auditoría Individual de Series Oficiales del Centro
              </h4>
              <CategoryBadge category="OFICIAL" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="border-b border-[#DAD6CC] text-[#77766F] font-semibold">
                    <th className="py-2 px-2.5">Serie / Archivo CSV</th>
                    <th className="py-2 px-2">Periodo</th>
                    <th className="py-2 px-2 text-right">Obs. Válidas</th>
                    <th className="py-2 px-2">Huecos Oficiales (&quot;-&quot;)</th>
                    <th className="py-2 px-2 text-right">Último Dato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DAD6CC]/60 font-mono tabular-nums">
                  {seriesAuditRows.map(row => (
                    <tr key={row.label} className="hover:bg-[#F3F0E8]/60">
                      <td className="py-2 px-2.5 font-sans font-semibold text-[#202321] flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-xs shrink-0" style={{ backgroundColor: row.color }} />
                        <span>{row.label}</span>
                      </td>
                      <td className="py-2 px-2 text-[#77766F]">
                        {row.series.firstYear ? `${row.series.firstYear}–${row.series.lastYear}` : 'N/A'}
                      </td>
                      <td className="py-2 px-2 text-right text-[#202321]">{row.validCount}</td>
                      <td className="py-2 px-2">
                        {row.series.missingYears.length > 0 ? (
                          <span className="text-[#9A4D10] font-semibold">
                            {row.series.missingYears.join(', ')} (sin interpolar)
                          </span>
                        ) : row.validCount > 0 ? (
                          <span className="text-[#1F513B]">Completa (0 huecos)</span>
                        ) : (
                          <span className="text-[#A6A18F]">No aplica</span>
                        )}
                      </td>
                      <td className="py-2 px-2 text-right font-semibold text-[#202321]">{row.latestValue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Radar Alerts for this hospital */}
          {hospAlerts.length > 0 && (
            <div className="bg-[#FBECE9]/70 border border-[#C64B37]/35 rounded-sm p-4">
              <div className="flex items-center justify-between gap-2 pb-2.5 mb-3 border-b border-[#C64B37]/20">
                <h4 className="text-sm font-bold text-[#9A3323] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-[#C64B37]" />
                  Señales del Radar Sanitario ({hospAlerts.length})
                </h4>
                <CategoryBadge category="ESTADISTICO" />
              </div>
              <div className="space-y-2.5">
                {hospAlerts.map(alert => (
                  <div
                    key={alert.id}
                    className="bg-[#FAF9F5] p-3.5 rounded-sm border border-[#DAD6CC] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <AlertBadge level={alert.level} />
                        <span className="text-[11px] font-mono text-[#77766F]">
                          {alert.radarType === 'comparativo' ? 'Radar Comparativo' : 'Radar Temporal Individual'}
                        </span>
                        <span aria-hidden="true" className="text-[#A6A18F]">·</span>
                        <span className="text-xs font-semibold text-[#202321]">{alert.listLabel}</span>
                        <span aria-hidden="true" className="text-[#A6A18F]">·</span>
                        <span className="text-xs text-[#77766F] font-mono">31-dic-{alert.period}</span>
                      </div>
                      <p className="text-xs text-[#55544E] leading-relaxed">{alert.rationale}</p>
                    </div>
                    <div className="text-left sm:text-right shrink-0 font-mono tabular-nums">
                      <div className="text-xs text-[#C64B37] font-bold">
                        Obs: {formatEsDec(alert.observedValue, 1)} d (Med red: {formatEsDec(alert.referenceValue, 1)} d)
                      </div>
                      <div className="text-[10px] text-[#77766F] mt-0.5">
                        Mod Z (red): {formatEsDec(alert.modifiedZScore, 2, { signed: true })}
                        {alert.selfZ !== null && alert.selfZ !== undefined && (
                          <> | Z-propio: {formatEsDec(alert.selfZ, 2, { signed: true })}σ</>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Time Series Chart */}
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-[#202321] flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#426C79]" />
                  Evolución Histórica Individual por Tipo de Lista (Datos a 31 de diciembre)
                </h4>
                <p className="text-[11px] text-[#77766F] mt-0.5">
                  Cada serie respeta su periodo oficial disponible (LEQ: 2015–2025; LECE/LEPD: 2017–2024). Los huecos oficiales (p. ej. 2022 en Clínico o 2023 en Gómez Ulla) se muestran discontinuos sin interpolación.
                </p>
              </div>
              <CategoryBadge category="OFICIAL" />
            </div>
            <InteractiveLineChart
              series={lineSeriesList}
              unit="días"
              height={290}
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-[#FAF9F5] border-t border-[#DAD6CC] flex flex-wrap items-center justify-between gap-2 text-xs text-[#77766F] shrink-0">
          <span>Fuente: Portal de Datos Abiertos de la Comunidad de Madrid (LEQ_Hosp, LECE_Hosp, LEPD_Hosp)</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#202321] hover:bg-[#343835] text-[#FAF9F5] font-semibold rounded-sm text-xs cursor-pointer transition-colors"
          >
            Cerrar Expediente
          </button>
        </div>
      </div>
    </div>
  );
};
