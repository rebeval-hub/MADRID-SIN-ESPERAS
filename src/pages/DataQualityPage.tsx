import React, { useState } from 'react';
import {
  Database,
  ShieldCheck,
  Download,
  ExternalLink,
  BookOpen,
  GitMerge,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { FullHealthData } from '../types';
import { CategoryBadge } from '../components/common/Badge';
import { formatEsInt } from '../utils/format';

interface DataQualityPageProps {
  data: FullHealthData;
  onExportCsv: () => void;
}

export const DataQualityPage: React.FC<DataQualityPageProps> = ({ data, onExportCsv }) => {
  const { auditReport, metadata } = data;
  // Omitimos el dataset de Frecuentación hospitalaria al haberse retirado su sección en Especialidades
  const datasets = Object.entries(auditReport.details).filter(([key]) => key !== 'Frecuentacion');
  const activeDatasetsCount = datasets.length;
  const activeRecordsCount = datasets.reduce((acc, [, d]) => acc + (d.totalRows || 0), 0);

  const [showCkanSources, setShowCkanSources] = useState(false);
  const [showStructuralSources, setShowStructuralSources] = useState(false);
  const [showProvenance, setShowProvenance] = useState(false);
  const [showMissingLog, setShowMissingLog] = useState(false);
  const [showFormulas, setShowFormulas] = useState(false);

  const missingEntries = datasets.flatMap(([key, d]) =>
    (d.missingDetails || []).map(detail => ({ key, title: d.title, detail }))
  );

  return (
    <div className="space-y-6">
      {/* Autoría y Créditos */}
      <section
        aria-labelledby="autoria-creditos-title"
        className="bg-[#FAF9F5] border border-[#DAD6CC] border-l-[3px] border-l-[#426C79] rounded-sm px-5 py-4"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1.5">
          <h3 id="autoria-creditos-title" className="font-serif text-base tracking-tight text-[#202321]">
            Autoría y Créditos
          </h3>
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#77766F]">
            DATAMAD 2026 · UCM
          </span>
        </div>
        <p className="text-xs leading-relaxed text-[#4A4D48]">
          MADRID SIN ESPERAS es un proyecto desarrollado por Rebeca del Val y Emir Jiménez, estudiantes de Ciencia de Datos en la Universidad Complutense de Madrid (UCM). Hemos creado esta plataforma de inteligencia sanitaria con el objetivo de analizar y visibilizar la problemática de las listas de espera en la sanidad pública madrileña, una cuestión de gran relevancia social y actualidad, transformando los datos abiertos en información útil para comprender la situación y explorar posibles soluciones.
        </p>
      </section>

      {/* Title */}
      <div className="bg-[#FAF9F5] border border-[#DAD6CC] rounded-sm p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="font-serif text-2xl tracking-tight text-[#202321]">
              Fuentes, Auditoría y Metodología
            </h2>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-xs bg-[#EBF3EE] text-[#1F513B] border border-[#2D6A4F]/30">
              Auditado Noviembre 2026
            </span>
          </div>
          <p className="text-xs text-[#77766F] mt-1">
            Trazabilidad de {activeDatasetsCount} conjuntos oficiales de{' '}
            <span className="font-mono text-[#202321]">datos.comunidad.madrid</span> y fórmulas.
          </p>
        </div>

        <button
          onClick={onExportCsv}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#C64B37] hover:bg-[#AE3F2D] text-[#FAF9F5] rounded-xs text-xs font-semibold cursor-pointer transition-colors shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Descargar Matriz Consolidada CSV</span>
        </button>
      </div>

      {/* Summary Audit KPIs Ledger */}
      <div className="bg-[#FAF9F5] border border-[#DAD6CC] rounded-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x lg:divide-x-0 xl:divide-x divide-[#DAD6CC]">
        <div className="p-4 lg:border-r lg:border-[#DAD6CC] xl:border-r-0">
          <span className="text-[10px] text-[#77766F] uppercase font-mono block">Datasets Verificados</span>
          <div className="text-2xl font-bold font-mono tabular-nums text-[#2D6A4F] mt-1">
            {activeDatasetsCount} / {activeDatasetsCount}
          </div>
          <span className="text-[10px] text-[#77766F]">API CKAN y CSV en vivo</span>
        </div>

        <div className="p-4 lg:border-r lg:border-[#DAD6CC] xl:border-r-0">
          <span className="text-[10px] text-[#77766F] uppercase font-mono block">Registros Procesados</span>
          <div className="text-2xl font-bold font-mono tabular-nums text-[#202321] mt-1">
            {formatEsInt(activeRecordsCount)}
          </div>
          <span className="text-[10px] text-[#77766F]">Filas oficiales procesadas</span>
        </div>

        <div className="p-4">
          <span className="text-[10px] text-[#77766F] uppercase font-mono block">Valores Ausentes (&quot;-&quot;)</span>
          <div className="text-2xl font-bold font-mono tabular-nums text-[#B4691E] mt-1">
            {formatEsInt(auditReport.missingValuesCount)}
          </div>
          <span className="text-[10px] text-[#77766F]">Conservados como nulos</span>
        </div>

        <div className="p-4 lg:border-t lg:border-r lg:border-[#DAD6CC] xl:border-t-0 xl:border-r-0">
          <span className="text-[10px] text-[#77766F] uppercase font-mono block">Ceros Reales Publicados</span>
          <div className="text-2xl font-bold font-mono tabular-nums text-[#426C79] mt-1">
            {formatEsInt(auditReport.zeroValuesCount)}
          </div>
          <span className="text-[10px] text-[#77766F]">Guadarrama LECE 2020–2024</span>
        </div>

        <div className="p-4 lg:border-t lg:border-r lg:border-[#DAD6CC] xl:border-t-0 xl:border-r-0">
          <span className="text-[10px] text-[#77766F] uppercase font-mono block">Filas Duplicadas</span>
          <div className="text-2xl font-bold font-mono tabular-nums text-[#2D6A4F] mt-1">
            {formatEsInt(auditReport.duplicateRecordsCount)}
          </div>
          <span className="text-[10px] text-[#77766F]">Clave año+centro+concepto</span>
        </div>
      </div>

      {/* Full CKAN Provenance Inventory Table */}
      <div className="bg-[#FAF9F5] border border-[#DAD6CC] rounded-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setShowCkanSources(prev => !prev)}
          aria-expanded={showCkanSources}
          className="w-full p-5 flex items-center justify-between gap-3 text-left hover:bg-[#F3F0E8]/70 transition-colors cursor-pointer"
        >
          <h3 className="font-serif text-lg text-[#202321] flex items-center gap-2">
            <Database className="w-4 h-4 text-[#426C79] shrink-0" />
            <span>Fuentes Oficiales Verificadas (datos.comunidad.madrid) — Metadatos CKAN</span>
          </h3>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[#77766F] shrink-0">
            <span>{showCkanSources ? 'Ocultar' : 'Ver detalle'}</span>
            {showCkanSources ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </span>
        </button>

        {showCkanSources && (
          <div className="px-5 pb-5 pt-2 border-t border-[#E6E2D8] space-y-3">
            <p className="text-xs text-[#77766F]">
              Cada botón <strong className="text-[#202321]">Portal</strong> enlaza con la ficha oficial CKAN del conjunto en{' '}
              <span className="font-mono">datos.comunidad.madrid</span> y cada botón{' '}
              <strong className="text-[#202321]">CSV</strong> apunta al recurso descargable original.
            </p>

            <div className="overflow-x-auto border border-[#DAD6CC]">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#ECE8DD] border-b border-[#DAD6CC] text-[#202321] font-mono text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 px-3">Conjunto de Datos y Organismo</th>
                    <th className="py-2.5 px-3">Publicación / Act.</th>
                    <th className="py-2.5 px-3">Periodo y Corte</th>
                    <th className="py-2.5 px-3">Frecuencia / Unidad / Cobertura</th>
                    <th className="py-2.5 px-3 text-right">Filas</th>
                    <th className="py-2.5 px-3 text-right">Aus. / 0 / Dup.</th>
                    <th className="py-2.5 px-3 text-center">Fuentes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E2D8]">
                  {datasets.map(([key, item]) => (
                    <tr key={key} className="hover:bg-[#F3F0E8]/70 align-top">
                      <td className="py-2.5 px-3 max-w-[260px]">
                        <div className="font-bold text-[#202321]">{item.title}</div>
                        <div className="text-[11px] text-[#77766F] mt-0.5">{item.sourceOrg}</div>
                        <div className="text-[10px] text-[#77766F] font-mono">{key} • {item.organization}</div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-[#77766F] whitespace-nowrap">
                        <div>Pub: {item.publishedAt}</div>
                        <div className="font-semibold text-[#202321]">Act: {item.updatedAt}</div>
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-[#4A4D48] max-w-[200px]">
                        <div className="font-mono font-bold text-[#202321]">{item.dateRange}</div>
                        <div className="text-[#77766F] mt-0.5">{item.cutoffNote}</div>
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-[#4A4D48] max-w-[220px]">
                        <div><strong className="text-[#202321]">Frec:</strong> {item.frequency}</div>
                        <div><strong className="text-[#202321]">Unidad:</strong> {item.unit}</div>
                        <div><strong className="text-[#202321]">Cob:</strong> {item.coverage}</div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-[#202321]">
                        {formatEsInt(item.totalRows)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-[11px] text-[#4A4D48] whitespace-nowrap">
                        <span className={item.missingMetricValues > 0 ? 'text-[#B4691E] font-bold' : ''}>
                          {item.missingMetricValues}
                        </span>{' '}
                        /{' '}
                        <span className={item.zeroMetricValues > 0 ? 'text-[#426C79] font-bold' : ''}>
                          {item.zeroMetricValues}
                        </span>{' '}
                        / {item.duplicateRows}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="flex flex-col gap-1 items-center">
                          <a
                            href={item.portalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#426C79] hover:text-[#C64B37] inline-flex items-center gap-1 text-[11px] font-semibold"
                          >
                            <span>Portal</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#77766F] hover:text-[#202321] inline-flex items-center gap-1 text-[10px] font-mono"
                          >
                            <span>CSV</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Verified Official Sources for SERMAS Structural Data */}
      <div className="bg-[#FAF9F5] border border-[#DAD6CC] rounded-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setShowStructuralSources(prev => !prev)}
          aria-expanded={showStructuralSources}
          className="w-full p-5 flex items-center justify-between gap-3 text-left hover:bg-[#F3F0E8]/70 transition-colors cursor-pointer"
        >
          <div className="flex flex-wrap items-center gap-2.5">
            <h3 className="font-serif text-lg text-[#202321] flex items-center gap-2">
              <Database className="w-4 h-4 text-[#2D6A4F] shrink-0" />
              <span>Fuentes Oficiales Verificadas de Estructura Hospitalaria (SERMAS, Sanidad y CAM)</span>
            </h3>
            <CategoryBadge category="OFICIAL" />
          </div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[#77766F] shrink-0">
            <span>{showStructuralSources ? 'Ocultar' : 'Ver detalle'}</span>
            {showStructuralSources ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </span>
        </button>

        {showStructuralSources && (
          <div className="px-5 pb-5 pt-2 border-t border-[#E6E2D8] space-y-3">
            <p className="text-xs text-[#77766F]">
              Los 31 hospitales cruzan camas instaladas/funcionantes, quirófanos instalados, complejidad, titularidad, gestión y geolocalización directamente desde ficheros oficiales publicados. Si un indicador no consta en fuente (p. ej. quirófanos en Guadarrama o José Germain), se conserva como <span className="font-mono text-[#202321]">null</span> («No disponible en fuente oficial verificada»).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-4 bg-[#F3F0E8] border border-[#DAD6CC] rounded-xs space-y-1.5">
                <div className="font-bold text-[#202321]">Memoria Anual de Actividad SERMAS 2024 (31 ZIPs + Global 3.5 y 6.5)</div>
                <p className="text-[11px] text-[#4A4D48] leading-relaxed">
                  Fuente primaria SIAE por hospital (<span className="font-mono">1. Nuestro Centro 2024.xlsx</span>): publica <strong>Camas Instaladas</strong>, <strong>Camas Funcionantes</strong> y <strong>Quirófanos Instalados</strong> de cada centro (2023–2024), además de la casuística de complejidad (3.5) y auditorías de concesión/sustitutoria (6.5).
                </p>
                <div className="flex flex-wrap gap-3 pt-1 font-mono text-[11px]">
                  <a
                    href="https://www.comunidad.madrid/servicios/salud/memorias-e-informes-servicio-madrileno-salud"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#426C79] hover:text-[#C64B37] inline-flex items-center gap-1 font-semibold"
                  >
                    <span>Portal Memorias SERMAS</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <a
                    href="https://www.comunidad.madrid/docs/assets/2025/10/30/3.datos_abiertos_memoria_2024.zip"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#77766F] hover:text-[#202321] inline-flex items-center gap-1"
                  >
                    <span>ZIP Global 2024</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="p-4 bg-[#F3F0E8] border border-[#DAD6CC] rounded-xs space-y-1.5">
                <div className="font-bold text-[#202321]">Catálogo de Centros, Servicios y Establecimientos Sanitarios (CAM) + IGN</div>
                <p className="text-[11px] text-[#4A4D48] leading-relaxed">
                  Registro oficial CAM (<span className="font-mono">CH*</span>) utilizado para verificar municipio, dirección, dependencia funcional/patrimonial y coordenadas oficiales ETRS89 UTM30→WGS84 (complementado con IGN CartoCiudad <span className="font-mono">SEIG_C_1328019438</span> para Gómez Ulla, de titularidad estatal Defensa).
                </p>
                <div className="flex flex-wrap gap-3 pt-1 font-mono text-[11px]">
                  <a
                    href="https://datos.comunidad.madrid/dataset/centros_servicios_establecimientos_sanitarios"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#426C79] hover:text-[#C64B37] inline-flex items-center gap-1 font-semibold"
                  >
                    <span>Portal Catálogo Centros</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <a
                    href="https://datos.comunidad.madrid/dataset/d8a0a444-adf5-4c04-8999-0eac3de52cb7/resource/2948b4da-8b39-42b7-b667-779a5284f39d/download/centros_servicios_establecimientos_sanitarios.csv"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#77766F] hover:text-[#202321] inline-flex items-center gap-1"
                  >
                    <span>CSV Centros</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="p-4 bg-[#F3F0E8] border border-[#DAD6CC] rounded-xs space-y-1.5">
                <div className="font-bold text-[#202321]">Catálogo Nacional de Hospitales 2025 (Ministerio de Sanidad)</div>
                <p className="text-[11px] text-[#4A4D48] leading-relaxed">
                  Contraste oficial estatal (corte 31-dic-2024, códigos <span className="font-mono">CCN</span> y <span className="font-mono">CODCNH</span>): confirma coincidencia exacta de camas instaladas en 21 centros (p. ej. 12 de Octubre = 1.161 camas) y documenta diferencias de corte/complejo en los 10 restantes.
                </p>
                <div className="flex flex-wrap gap-3 pt-1 font-mono text-[11px]">
                  <a
                    href="https://www.sanidad.gob.es/estadEstudios/estadisticas/sisInfSanSNS/ofertaRecursos/hospitales/home.htm"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#426C79] hover:text-[#C64B37] inline-flex items-center gap-1 font-semibold"
                  >
                    <span>Portal CNH 2025</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <a
                    href="https://www.sanidad.gob.es/estadEstudios/estadisticas/sisInfSanSNS/ofertaRecursos/hospitales/docs/CNH_2025.xlsx"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#77766F] hover:text-[#202321] inline-flex items-center gap-1"
                  >
                    <span>CNH 2025 (XLSX)</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="p-4 bg-[#F3F0E8] border border-[#DAD6CC] rounded-xs space-y-1.5">
                <div className="font-bold text-[#202321]">Observatorio de Resultados del SERMAS (2025) y Dotación Agregada CAM</div>
                <p className="text-[11px] text-[#4A4D48] leading-relaxed">
                  CSV oficial de resultados hospitalarios para validar grupos de complejidad (Alta/Media/Baja complejidad y Otros Hospitales), junto a las series regionales agregadas de camas CAM (<span className="font-mono">1912720</span>).
                </p>
                <div className="flex flex-wrap gap-3 pt-1 font-mono text-[11px]">
                  <a
                    href="https://observatorioresultados.sanidadmadrid.org/Descargas/resultados_hospitales_2025.csv"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#426C79] hover:text-[#C64B37] inline-flex items-center gap-1 font-semibold"
                  >
                    <span>CSV Observatorio 2025</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <a
                    href="https://datos.comunidad.madrid/dataset/1912720"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#77766F] hover:text-[#202321] inline-flex items-center gap-1"
                  >
                    <span>Portal Camas Agregadas CAM</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Module Provenance Registry */}
      <div className="bg-[#FAF9F5] border border-[#DAD6CC] rounded-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setShowProvenance(prev => !prev)}
          aria-expanded={showProvenance}
          className="w-full p-5 flex items-center justify-between gap-3 text-left hover:bg-[#F3F0E8]/70 transition-colors cursor-pointer"
        >
          <h3 className="font-serif text-lg text-[#202321] flex items-center gap-2">
            <GitMerge className="w-4 h-4 text-[#426C79] shrink-0" />
            <span>Registro de Procedencia por Módulo e Indicador (Diferenciación Estricta de Naturaleza)</span>
          </h3>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[#77766F] shrink-0">
            <span>{showProvenance ? 'Ocultar' : 'Ver detalle'}</span>
            {showProvenance ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </span>
        </button>

        {showProvenance && (
          <div className="px-5 pb-5 pt-1">
            <div className="overflow-x-auto border border-[#DAD6CC]">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#ECE8DD] border-b border-[#DAD6CC] text-[#202321] font-mono text-[11px] uppercase tracking-wider">
                    <th className="py-2 px-3">Módulo de la Plataforma</th>
                    <th className="py-2 px-3">Indicadores Alimentados</th>
                    <th className="py-2 px-3">Datasets Origen</th>
                    <th className="py-2 px-3">Unidad / Corte</th>
                    <th className="py-2 px-3 text-center">Naturaleza</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E2D8]">
                  {auditReport.provenanceRegistry
                    .filter(rec => !rec.datasetKeys.includes('Frecuentacion'))
                    .map((rec, idx) => (
                      <tr key={idx} className="hover:bg-[#F3F0E8]/70">
                        <td className="py-2.5 px-3 font-bold text-[#202321]">{rec.module}</td>
                        <td className="py-2.5 px-3 text-[#4A4D48] text-[11px] max-w-[280px]">{rec.indicator}</td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-[#426C79]">{rec.datasetKeys.join(', ')}</td>
                        <td className="py-2.5 px-3 text-[11px] text-[#4A4D48]">
                          <div>{rec.unit}</div>
                          <div className="text-[#77766F]">{rec.cutoff}</div>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <CategoryBadge category={rec.category} />
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Exact Missing Values & Zeros Log */}
      <div className="bg-[#FAF9F5] border border-[#DAD6CC] rounded-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setShowMissingLog(prev => !prev)}
          aria-expanded={showMissingLog}
          className="w-full p-5 flex items-center justify-between gap-3 text-left hover:bg-[#F3F0E8]/70 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#2D6A4F] shrink-0" />
            <h3 className="font-serif text-lg text-[#202321]">
              Registro Exacto de Valores Ausentes (&quot;-&quot;) y Ceros Reales
            </h3>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[#77766F] shrink-0">
            <span>{showMissingLog ? 'Ocultar' : 'Ver detalle'}</span>
            {showMissingLog ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </span>
        </button>

        {showMissingLog && (
          <div className="px-5 pb-5 pt-2 border-t border-[#E6E2D8] space-y-3">
            <p className="text-xs text-[#4A4D48]">
              Los valores codificados como <span className="font-mono text-[#202321]">&quot;-&quot;</span> en origen ({auditReport.missingValuesCount} valores métricos) se conservan estrictamente como <span className="font-mono text-[#202321]">null</span> (nunca sustituidos por 0 ni interpolados). En contraste, los {auditReport.zeroValuesCount} valores <span className="font-mono text-[#202321]">0 / 0,00</span> registrados en <span className="font-mono text-[#202321]">LECE_Hosp</span> corresponden al Hospital de Guadarrama (2020–2024) y reflejan actividad cero publicada oficialmente.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-[11px] font-mono">
              {missingEntries.map((m, idx) => (
                <div key={idx} className="p-2.5 bg-[#FBF3E8] border border-[#B4691E]/35 rounded-xs text-[#7D4710]">
                  <strong className="block text-[10px] text-[#9A4D10]">{m.key}</strong>
                  <span>{m.detail}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mathematical Glossary & Formulas */}
      <div className="bg-[#FAF9F5] border border-[#DAD6CC] rounded-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setShowFormulas(prev => !prev)}
          aria-expanded={showFormulas}
          className="w-full p-5 sm:px-6 flex items-center justify-between gap-3 text-left hover:bg-[#F3F0E8]/70 transition-colors cursor-pointer"
        >
          <h3 className="font-serif text-lg text-[#202321] flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#426C79] shrink-0" />
            <span>Fórmulas Matemáticas y Metodologías Estadísticas Auditadas</span>
          </h3>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[#77766F] shrink-0">
            <span>{showFormulas ? 'Ocultar' : 'Ver detalle'}</span>
            {showFormulas ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </span>
        </button>

        {showFormulas && (
          <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-2 border-t border-[#E6E2D8]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-[#F3F0E8] border border-[#DAD6CC] rounded-xs space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <strong className="text-[#202321] font-bold">1. Dispersión, Mediana y Cociente Exactos</strong>
                  <CategoryBadge category="CALCULADO" />
                </div>
                <code className="block bg-[#FAF9F5] p-2.5 rounded-xs border border-[#DAD6CC] text-[#202321] font-mono text-[11px]">
                  s = √(Σ(X_i − x̄)² / (N − 1)), CV = (s / x̄)·100, R = Máx / Mín (si Mín = 0, usa Mín &gt; 0)
                </code>
                <p className="text-[#4A4D48] text-[11px] leading-relaxed">
                  Con N par, la mediana es el promedio de los dos valores centrales. Todos los cálculos operan en coma flotante exacta sin redondeos previos hasta la presentación, conservando la trazabilidad si R usa el mínimo estrictamente positivo.
                </p>
              </div>

              <div className="p-4 bg-[#F3F0E8] border border-[#DAD6CC] rounded-xs space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <strong className="text-[#202321] font-bold">2. Modified Z-Score, SPC y Z-Score Propio</strong>
                  <CategoryBadge category="ESTADISTICO" />
                </div>
                <code className="block bg-[#FAF9F5] p-2.5 rounded-xs border border-[#DAD6CC] text-[#202321] font-mono text-[11px]">
                  M_i = 0,6745·(X_i − Mediana) / MAD | Z_propio = (X_t − μ_prev) / s_prev
                </code>
                <p className="text-[#4A4D48] text-[11px] leading-relaxed">
                  Se separa estrictamente la anomalía comparativa transversal (red) del deterioro longitudinal propio respecto al pasado individual del hospital.
                </p>
              </div>

              <div className="p-4 bg-[#F3F0E8] border border-[#DAD6CC] rounded-xs space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <strong className="text-[#202321] font-bold">3. Suavizado de Holt ETS(A,A,N)</strong>
                  <CategoryBadge category="PREDICCION" />
                </div>
                <code className="block bg-[#FAF9F5] p-2.5 rounded-xs border border-[#DAD6CC] text-[#202321] font-mono text-[11px]">
                  IC(h) = ŷ ± z · σ · √(1 + Σ_{'{j=1}'}^{'{h-1}'} (α + j·α·β)²)
                </code>
                <p className="text-[#4A4D48] text-[11px] leading-relaxed">
                  Parámetros (α, β) seleccionados en rejilla sobre entrenamiento sin fuga futura y evaluados mediante validación de origen rodante (Rolling-Origin CV) frente a Naive.
                </p>
              </div>

              <div className="p-4 bg-[#F3F0E8] border border-[#DAD6CC] rounded-xs space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <strong className="text-[#202321] font-bold">4. Contraste Kruskal-Wallis H por Permutaciones</strong>
                  <CategoryBadge category="ESTADISTICO" />
                </div>
                <code className="block bg-[#FAF9F5] p-2.5 rounded-xs border border-[#DAD6CC] text-[#202321] font-mono text-[11px]">
                  p_perm = (1 + #{'{'}H_b ≥ H_obs{'}'}) / (B + 1) · (exacta si M ≤ 10.000; Monte Carlo B = 10.000 si M &gt; 10.000)
                </code>
                <p className="text-[#4A4D48] text-[11px] leading-relaxed">
                  Dado el tamaño muestral reducido por estrato hospitalario (N ≥ 2 por grupo), la significación de H (con corrección por empates) se calcula mediante test de permutaciones en lugar de depender de la aproximación asintótica χ².
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <p className="text-[11px] text-[#77766F] pt-1 font-mono">
        Licencia de reutilización: {metadata.dataGovernance.license} • {metadata.dataGovernance.sourceOrg}.
      </p>
    </div>
  );
};
