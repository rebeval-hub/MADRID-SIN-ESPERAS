/**
 * MADRID SIN ESPERAS - Audited Data Ingestion & Statistical Pipeline
 * Fetches verified official data & CKAN metadata from datos.comunidad.madrid
 * Performs provenance tracking, separated hospital classification, anomaly detection,
 * rolling-origin forecasting validation, and data quality auditing.
 */

import fs from 'fs';
import path from 'path';
import { loadAllOfficialStructuralData, OFFICIAL_STRUCTURAL_URLS } from './structural_loader.js';

const DATASETS = {
  LEQ_Hosp: {
    packageId: "5adfb9ef-7444-4347-9498-70f8115007b2",
    title: "Lista de espera quirúrgica por hospitales",
    portalUrl: "https://datos.comunidad.madrid/dataset/lista_de_espera_quirurgica_por_hospitales",
    url: "https://datos.comunidad.madrid/dataset/5adfb9ef-7444-4347-9498-70f8115007b2/resource/882330b5-81ee-4054-be2a-825134a81e39/download/lista-de-espera-quirurgica-por-hospitales.csv",
    type: "quirurgica",
    category: "hospital",
    coverage: "Comunidad de Madrid - Hospitales de la red SERMAS (29 centros con actividad quirúrgica programada)"
  },
  LECE_Hosp: {
    packageId: "17f7564c-c6ec-431e-87dd-d074bbebe38f",
    title: "Lista de espera para consultas externas por hospitales",
    portalUrl: "https://datos.comunidad.madrid/dataset/lista_espera_consultas_externas_por_hospitales",
    url: "https://datos.comunidad.madrid/dataset/17f7564c-c6ec-431e-87dd-d074bbebe38f/resource/0eeaa8e2-a2a1-43af-b309-d5161d9eb996/download/lista-de-espera-para-consultas-externas-por-hospitales.csv",
    type: "consultas",
    category: "hospital",
    coverage: "Comunidad de Madrid - Hospitales de la red SERMAS (31 centros)"
  },
  LEPD_Hosp: {
    packageId: "821cbb6d-1307-4df0-b616-81dc179ad27c",
    title: "Lista de espera para pruebas diagnósticas por hospitales",
    portalUrl: "https://datos.comunidad.madrid/dataset/lista_de_espera_pruebas_diagnosticas_por_hospitales",
    url: "https://datos.comunidad.madrid/dataset/821cbb6d-1307-4df0-b616-81dc179ad27c/resource/ec9cb97c-99b6-461a-a3e3-38e5b11385a8/download/lista-de-espera-para-pruebas-diagnosticas-por-hospitales.csv",
    type: "pruebas",
    category: "hospital",
    coverage: "Comunidad de Madrid - Hospitales de la red SERMAS (29 centros con pruebas diagnósticas)"
  },
  LEQ_Global: {
    packageId: "5c5d1dbc-502e-487b-a0c8-f0b890ee7ccc",
    title: "Lista de espera quirúrgica agregada y tramos",
    portalUrl: "https://datos.comunidad.madrid/dataset/1922240",
    url: "https://datos.comunidad.madrid/dataset/5c5d1dbc-502e-487b-a0c8-f0b890ee7ccc/resource/701764d8-0363-40c4-ac1e-766355a1996e/download/lista-de-espera-quirurgica.csv",
    type: "quirurgica",
    category: "global",
    coverage: "Comunidad de Madrid - Total agregado red SERMAS"
  },
  LECE_Global: {
    packageId: "7af26a0d-6885-4a9d-96c3-f758737eda7d",
    title: "Lista de espera consultas externas agregada y tramos",
    portalUrl: "https://datos.comunidad.madrid/dataset/1922241",
    url: "https://datos.comunidad.madrid/dataset/7af26a0d-6885-4a9d-96c3-f758737eda7d/resource/87a266e0-62df-4eb6-8675-b7865033fa4e/download/lista-de-espera-consultas-externas.csv",
    type: "consultas",
    category: "global",
    coverage: "Comunidad de Madrid - Total agregado red SERMAS"
  },
  LEPD_Global: {
    packageId: "ee435f63-3e3b-4958-8980-401c74c6b659",
    title: "Lista de espera de pruebas diagnósticas/terapéuticas agregada",
    portalUrl: "https://datos.comunidad.madrid/dataset/1922242",
    url: "https://datos.comunidad.madrid/dataset/ee435f63-3e3b-4958-8980-401c74c6b659/resource/442a3acd-1a61-4121-a50a-5557006e3a32/download/lista-de-espera-de-pruebas-diagnosticasterapeuticas.csv",
    type: "pruebas",
    category: "global",
    coverage: "Comunidad de Madrid - Total agregado red SERMAS"
  },
  Consultas_Especialidad: {
    packageId: "f82af7ba-d20a-42b6-8245-d8f23b49041f",
    title: "Consultas por especialidad médica (ESCRI)",
    portalUrl: "https://datos.comunidad.madrid/dataset/1914582",
    url: "https://datos.comunidad.madrid/dataset/f82af7ba-d20a-42b6-8245-d8f23b49041f/resource/511aa2c8-7217-45a1-b5fb-9655168ea614/download/consultas-por-especialidad.csv",
    type: "especialidades",
    category: "actividad",
    coverage: "Comunidad de Madrid - Establecimientos sanitarios con régimen de internado (ESCRI, red completa)"
  },
  Actividad_Diagnostica: {
    packageId: "686ee847-c18d-4582-bc41-5d659d028d41",
    title: "Indicadores de actividad diagnóstica y quirúrgica (ESCRI)",
    portalUrl: "https://datos.comunidad.madrid/dataset/1914583",
    url: "https://datos.comunidad.madrid/dataset/686ee847-c18d-4582-bc41-5d659d028d41/resource/f054ebcc-1deb-414f-8257-f19b3f2321e3/download/indicadores-de-actividad-diagnostica-y-quirurgica.csv",
    type: "pruebas_especificas",
    category: "actividad",
    coverage: "Comunidad de Madrid - Establecimientos sanitarios con régimen de internado (ESCRI)"
  },
  Frecuentacion: {
    packageId: "704fe77b-eeb8-481c-b72b-ae94d96fdb67",
    title: "Indicadores de frecuentación y de hospitalización (ESCRI)",
    portalUrl: "https://datos.comunidad.madrid/dataset/1912749",
    url: "https://datos.comunidad.madrid/dataset/704fe77b-eeb8-481c-b72b-ae94d96fdb67/resource/db3daa8c-38ed-44c6-8a92-aa9256121322/download/indicadores-de-frecuentacion-y-de-hospitalizacion.csv",
    type: "frecuentacion",
    category: "sistema",
    coverage: "Comunidad de Madrid - Establecimientos sanitarios con régimen de internado (ESCRI)"
  }
};


function parseCsv(text) {
  const lines = text.split("\n").filter(l => l.trim().length > 0);
  if (lines.length === 0) return { header: [], rows: [] };
  const delimiter = lines[0].includes(";") ? ";" : ",";
  const header = lines[0].split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ''));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ''));
    if (cols.length >= header.length) {
      rows.push(cols);
    }
  }
  return { header, rows };
}

// Statistical helpers (unrounded internal arithmetic)
function median(values) {
  if (!values || values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function mean(values) {
  if (!values || values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function sampleStdDev(values, avg) {
  if (!values || values.length < 2) return 0;
  const m = avg ?? mean(values);
  const variance = values.reduce((sum, v) => sum + Math.pow(v - m, 2), 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function modifiedZScore(value, med, mad) {
  if (mad === 0 || isNaN(mad) || mad === null || med === null) return 0;
  return (0.6745 * (value - med)) / mad;
}

// Fit Holt linear trend for given (alpha, beta)
function fitHolt(series, alpha, beta) {
  let level = series[0];
  let trend = series[1] - series[0];
  const oneStepResiduals = [];

  for (let t = 1; t < series.length; t++) {
    const oneStepPred = level + trend;
    oneStepResiduals.push(series[t] - oneStepPred);
    const prevLevel = level;
    level = alpha * series[t] + (1 - alpha) * (prevLevel + trend);
    trend = beta * (level - prevLevel) + (1 - beta) * trend;
  }

  const sse = oneStepResiduals.reduce((acc, r) => acc + r * r, 0);
  return { level, trend, oneStepResiduals, sse };
}

// Estimate (alpha, beta) purely on training subset via grid search (no future leakage)
function selectHoltParameters(trainSeries) {
  if (!trainSeries || trainSeries.length < 4) return { alpha: 0.5, beta: 0.2 };
  let best = { alpha: 0.5, beta: 0.2, sse: Infinity };
  for (let a = 0.1; a <= 0.91; a += 0.1) {
    for (let b = 0.05; b <= 0.61; b += 0.05) {
      const alpha = Math.round(a * 100) / 100;
      const beta = Math.round(b * 100) / 100;
      const fit = fitHolt(trainSeries, alpha, beta);
      if (fit.sse < best.sse) {
        best = { alpha, beta, sse: fit.sse };
      }
    }
  }
  return { alpha: best.alpha, beta: best.beta };
}

// Holt forecast with ETS(A,A,N) analytical multi-step variance
function holtLinearForecast(series, h = 3) {
  if (!series || series.length < 4) return null;
  const { alpha, beta } = selectHoltParameters(series);
  const { level, trend, oneStepResiduals } = fitHolt(series, alpha, beta);

  const df = Math.max(1, oneStepResiduals.length - 2);
  const se = Math.sqrt(oneStepResiduals.reduce((acc, r) => acc + r * r, 0) / df);

  // ETS(A,A,N) h-step forecast error variance factor: 1 + sum_{j=1}^{h-1} (alpha + j*alpha*beta)^2
  const forecasts = [];
  for (let step = 1; step <= h; step++) {
    const point = level + step * trend;
    let varMultiplier = 1;
    for (let j = 1; j < step; j++) {
      const psi = alpha + j * alpha * beta;
      varMultiplier += psi * psi;
    }
    const stepSe = se * Math.sqrt(varMultiplier);
    const margin80 = 1.28155 * stepSe;
    const margin95 = 1.95996 * stepSe;

    forecasts.push({
      step,
      point: Math.round(point * 10) / 10,
      lower80: Math.max(0, Math.round((point - margin80) * 10) / 10),
      upper80: Math.round((point + margin80) * 10) / 10,
      lower95: Math.max(0, Math.round((point - margin95) * 10) / 10),
      upper95: Math.round((point + margin95) * 10) / 10
    });
  }

  return {
    forecasts,
    alpha,
    beta,
    standardError: Math.round(se * 100) / 100,
    lastLevel: Math.round(level * 10) / 10,
    lastTrend: Math.round(trend * 100) / 100
  };
}

// Rolling-origin cross-validation + final 2-year holdout comparison (zero leakage)
function evaluateModels(series, years) {
  if (!series || series.length < 6) {
    return { status: "insufficient_data", message: "Se requieren al menos 6 observaciones históricas para validación rodante" };
  }

  const minTrain = 5;
  const holtErrors = [];
  const naiveErrors = [];
  const actuals = [];

  for (let t = minTrain; t < series.length; t++) {
    const train = series.slice(0, t);
    const actual = series[t];
    const params = selectHoltParameters(train);
    const fit = fitHolt(train, params.alpha, params.beta);
    const holtPred = fit.level + fit.trend; // 1-step ahead
    const naivePred = train[train.length - 1];

    holtErrors.push(actual - holtPred);
    naiveErrors.push(actual - naivePred);
    actuals.push(actual);
  }

  const calcMetrics = (errs, acts) => {
    const mae = errs.reduce((s, e) => s + Math.abs(e), 0) / errs.length;
    const rmse = Math.sqrt(errs.reduce((s, e) => s + e * e, 0) / errs.length);
    const allPos = acts.every(a => a > 0);
    const mape = allPos
      ? (errs.reduce((s, e, i) => s + Math.abs(e) / acts[i], 0) / errs.length) * 100
      : 0;
    return {
      mae: Math.round(mae * 100) / 100,
      rmse: Math.round(rmse * 100) / 100,
      mape: Math.round(mape * 100) / 100,
      rawMae: mae
    };
  };

  const nMetrics = calcMetrics(naiveErrors, actuals);
  const hMetrics = calcMetrics(holtErrors, actuals);
  const improvementPct = nMetrics.rawMae > 0
    ? ((nMetrics.rawMae - hMetrics.rawMae) / nMetrics.rawMae) * 100
    : 0;

  // Static final 2-year holdout (for transparency / comparison, unrounded internal arithmetic)
  const splitIdx = series.length - 2;
  const staticTrain = series.slice(0, splitIdx);
  const staticTest = series.slice(splitIdx);
  const staticNaivePred = [staticTrain[staticTrain.length - 1], staticTrain[staticTrain.length - 1]];
  const staticParams = selectHoltParameters(staticTrain);
  const staticFit = fitHolt(staticTrain, staticParams.alpha, staticParams.beta);
  const staticHoltPred = [staticFit.level + 1 * staticFit.trend, staticFit.level + 2 * staticFit.trend];

  const staticNaiveErrs = [staticTest[0] - staticNaivePred[0], staticTest[1] - staticNaivePred[1]];
  const staticHoltErrs = [staticTest[0] - staticHoltPred[0], staticTest[1] - staticHoltPred[1]];
  const sNaive = calcMetrics(staticNaiveErrs, staticTest);
  const sHolt = calcMetrics(staticHoltErrs, staticTest);
  const sImp = sNaive.rawMae > 0 ? ((sNaive.rawMae - sHolt.rawMae) / sNaive.rawMae) * 100 : 0;

  return {
    status: "evaluated",
    method: "Validación de Origen Rodante (Rolling-Origin CV, horizonte h=1)",
    totalObservations: series.length,
    minTrainWindow: minTrain,
    rollingFolds: holtErrors.length,
    testOriginsRange: `${years[minTrain]} - ${years[years.length - 1]}`,
    trainObservations: splitIdx,
    testObservations: 2,
    naive: { mae: nMetrics.mae, rmse: nMetrics.rmse, mape: nMetrics.mape },
    holt: {
      mae: hMetrics.mae,
      rmse: hMetrics.rmse,
      mape: hMetrics.mape,
      improvementPct: Math.round(improvementPct * 10) / 10
    },
    staticHoldout2: {
      trainYears: `${years[0]} - ${years[splitIdx - 1]}`,
      testYears: `${years[splitIdx]} - ${years[years.length - 1]}`,
      naive: { mae: sNaive.mae, rmse: sNaive.rmse, mape: sNaive.mape },
      holt: {
        mae: sHolt.mae,
        rmse: sHolt.rmse,
        mape: sHolt.mape,
        improvementPct: Math.round(sImp * 10) / 10
      }
    }
  };
}

async function fetchCkanMeta(packageId) {
  try {
    const res = await fetch(`https://datos.comunidad.madrid/api/3/action/package_show?id=${packageId}`);
    if (!res.ok) return null;
    const j = await res.json();
    if (!j.success) return null;
    const p = j.result;
    const extras = {};
    for (const e of (p.extras || [])) {
      extras[e.key] = e.value;
    }
    return {
      organization: p.organization?.title || "Instituto de Estadística de la Comunidad de Madrid",
      sourceOrg: extras["Fuente"] || "Servicio Madrileño de Salud. Consejería de Sanidad.",
      publishedAt: p.metadata_created ? p.metadata_created.slice(0, 10) : "N/D",
      updatedAt: extras["Fecha Actualización"] || (p.metadata_modified ? p.metadata_modified.slice(0, 10) : "N/D"),
      unit: (extras["Unidad"] || "Número").replace(/\s+/g, ", "),
      notes: (p.notes || "").replace(/\s+/g, " ").trim()
    };
  } catch {
    return null;
  }
}

async function runPipeline() {
  console.log("=== INITIATING AUDITED MADRID SIN ESPERAS DATA PIPELINE ===");
  const auditReport = {
    executedAt: new Date().toISOString(),
    datasetsChecked: 0,
    datasetsValid: 0,
    totalRecordsProcessed: 0,
    discardedRecords: 0,
    missingValuesCount: 0,
    zeroValuesCount: 0,
    duplicateRecordsCount: 0,
    details: {},
    provenanceRegistry: [
      {
        module: "Visión General — Lista Quirúrgica (LEQ)",
        indicator: "Total LEQ, espera estructural, TNP, rechazo derivación, demora estructural, demora rechazo, tramos",
        datasetKeys: ["LEQ_Global", "LEQ_Hosp"],
        unit: "Pacientes / Días naturales",
        cutoff: "Datos a 31 de diciembre (2015–2025)",
        category: "OFICIAL"
      },
      {
        module: "Visión General — Consultas Externas (LECE) y Pruebas (LEPD)",
        indicator: "Pacientes en espera estructural, demora media, tasa por 1.000 hab., tramos",
        datasetKeys: ["LECE_Global", "LEPD_Global", "LECE_Hosp", "LEPD_Hosp"],
        unit: "Pacientes / Días naturales / Tasa ‰",
        cutoff: "Datos a 31 de diciembre (2015–2024 agregado; 2017–2024 centros)",
        category: "OFICIAL"
      },
      {
        module: "Hospitales y Territorio",
        indicator: "Media simple, media ponderada calculada, DE muestral, CV, rango, cociente Max/Min, análisis por gestión y complejidad",
        datasetKeys: ["LEQ_Hosp", "LECE_Hosp", "LEPD_Hosp", "LEQ_Global", "LECE_Global", "LEPD_Global"],
        unit: "Días naturales / Pacientes / %",
        cutoff: "LEQ: 31-dic-2025; LECE/LEPD: 31-dic-2024",
        category: "CALCULADO"
      },
      {
        module: "Especialidades y Pruebas (Actividad)",
        indicator: "Consultas por especialidad, pruebas de alta tecnología (RM, TAC, PET), intervenciones CMA vs hospitalización",
        datasetKeys: ["Consultas_Especialidad", "Actividad_Diagnostica"],
        unit: "Consultas / Exploraciones / Intervenciones / %",
        cutoff: "Actividad anual acumulada ESCRI (2010–2023)",
        category: "OFICIAL"
      },
      {
        module: "Evolución Temporal Multihospitalaria",
        indicator: "Trayectorias longitudinales por centro frente a serie regional oficial",
        datasetKeys: ["LEQ_Hosp", "LECE_Hosp", "LEPD_Hosp", "LEQ_Global", "LECE_Global", "LEPD_Global"],
        unit: "Días naturales / Pacientes",
        cutoff: "LEQ: 2015–2025; LECE/LEPD: 2017–2024 (31-dic)",
        category: "OFICIAL"
      },
      {
        module: "RADAR SANITARIO",
        indicator: "Radar comparativo (Modified Z-Score + SPC ±2σ/±3σ) y Radar temporal individual (persistencia)",
        datasetKeys: ["LEQ_Hosp", "LECE_Hosp", "LEPD_Hosp"],
        unit: "Días naturales / Puntuación Z",
        cutoff: "LEQ: 2025; LECE/LEPD: 2024",
        category: "ESTADISTICO"
      },
      {
        module: "Frecuentación Hospitalaria (ESCRI)",
        indicator: "Estancia media, índice de ocupación, rotación, mortalidad intrahospitalaria y frecuentación por 1.000 hab.",
        datasetKeys: ["Frecuentacion"],
        unit: "Días / % / Tasa por 1.000 hab.",
        cutoff: "Serie anual ESCRI (2007–2023)",
        category: "OFICIAL"
      },
      {
        module: "Modelos Predictivos",
        indicator: "Proyecciones Holt con selección de parámetros en entrenamiento y validación de origen rodante vs Naive",
        datasetKeys: ["LEQ_Global", "LECE_Global", "LEPD_Global"],
        unit: "Pacientes / Días naturales",
        cutoff: "Series anuales hasta 2025 (LEQ) y 2024 (LECE/LEPD)",
        category: "PREDICCION"
      },
      {
        module: "Metadatos Estructurales de Centros",
        indicator: "Camas instaladas, camas funcionantes, quirófanos instalados (nulo si no publicado), complejidad SERMAS, titularidad, gestión, municipio y coordenadas",
        datasetKeys: [
          "Memoria SERMAS 2024 (31 ZIPs + 3.5 + 6.5)",
          "CNH 2025 (Ministerio de Sanidad)",
          "Observatorio SERMAS 2025",
          "Catálogo Centros CAM + IGN CartoCiudad"
        ],
        unit: "Camas / Quirófanos / Categoría / WGS84",
        cutoff: "Memoria SERMAS 2024 (SIAE) & CNH 2025 (corte 31-dic-2024)",
        category: "OFICIAL"
      }
    ],
    structuralAudit: {
      verifiedAt: new Date().toISOString(),
      hospitalsTotal: 31,
      hospitalsFullyVerified: 29,
      hospitalsPartialVerified: 2,
      partialNote: "Guadarrama y José Germain disponen de camas, complejidad, titularidad, gestión y ubicación verificadas; el indicador de quirófanos no se publica en su tabla oficial de Recursos Materiales y permanece como null ('No disponible en fuente oficial verificada').",
      sources: [
        { name: "Memoria Anual SERMAS 2024 — Datos Abiertos (31 centros + global 3.5 y 6.5)", url: OFFICIAL_STRUCTURAL_URLS.SERMAS_MEMORIA_PORTAL, cutoff: "Ejercicio 2024 (SIAE)" },
        { name: "Catálogo Nacional de Hospitales 2025 (Ministerio de Sanidad)", url: OFFICIAL_STRUCTURAL_URLS.CNH_PORTAL, cutoff: "31-dic-2024" },
        { name: "Observatorio de Resultados del SERMAS", url: OFFICIAL_STRUCTURAL_URLS.OBSERVATORIO_PORTAL, cutoff: "Resultados 2025" },
        { name: "Catálogo de Centros, Servicios y Establecimientos Sanitarios (CAM)", url: OFFICIAL_STRUCTURAL_URLS.CAM_CENTROS_PORTAL, cutoff: "Registro vigente CAM (ETRS89→WGS84)" }
      ]
    }
  };

  const rawData = {};

  for (const [key, meta] of Object.entries(DATASETS)) {
    try {
      console.log(`Downloading ${key} (${meta.title})...`);
      auditReport.datasetsChecked++;
      const [res, ckanMeta] = await Promise.all([
        fetch(meta.url),
        fetchCkanMeta(meta.packageId)
      ]);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const parsed = parseCsv(text);

      // Value column index: 6 for hospital CSVs (has Medida at col 5), 5 for global/activity CSVs
      const valColIdx = parsed.header.indexOf("Valor");
      const yearColIdx = 0;
      const conceptColIdx = 1;
      const medidaColIdx = parsed.header.indexOf("Medida");

      let missingMetricValues = 0;
      let zeroMetricValues = 0;
      const missingDetails = [];
      const seenKeys = new Set();
      let duplicateRows = 0;

      for (const row of parsed.rows) {
        const rawVal = row[valColIdx];
        const numVal = parseFloat(rawVal);
        const rowKey = `${row[yearColIdx]}|${row[conceptColIdx]}|${medidaColIdx >= 0 ? row[medidaColIdx] : ''}`;
        if (seenKeys.has(rowKey)) {
          duplicateRows++;
        } else {
          seenKeys.add(rowKey);
        }

        if (rawVal === undefined || rawVal === "" || rawVal === "-" || isNaN(numVal)) {
          missingMetricValues++;
          missingDetails.push(`${row[yearColIdx]}: ${row[conceptColIdx]}${medidaColIdx >= 0 ? ` (${row[medidaColIdx]})` : ''} [valor='${rawVal}']`);
        } else if (numVal === 0) {
          zeroMetricValues++;
        }
      }

      const yearsInCsv = [...new Set(parsed.rows.map(r => r[0]))].sort();
      const cutoffNote = meta.category === "actividad" || meta.category === "sistema"
        ? "Actividad anual acumulada (Estadística ESCRI)"
        : "Datos a 31 de diciembre de cada ejercicio";

      auditReport.datasetsValid++;
      auditReport.totalRecordsProcessed += parsed.rows.length;
      auditReport.missingValuesCount += missingMetricValues;
      auditReport.zeroValuesCount += zeroMetricValues;
      auditReport.duplicateRecordsCount += duplicateRows;

      auditReport.details[key] = {
        title: meta.title,
        organization: ckanMeta?.organization || "Instituto de Estadística de la Comunidad de Madrid",
        sourceOrg: ckanMeta?.sourceOrg || "Servicio Madrileño de Salud. Consejería de Sanidad.",
        portalUrl: meta.portalUrl,
        url: meta.url,
        format: "CSV (UTF-8, delimitador ';')",
        publishedAt: ckanMeta?.publishedAt || "N/D",
        updatedAt: ckanMeta?.updatedAt || "N/D",
        dateRange: `${yearsInCsv[0]} - ${yearsInCsv[yearsInCsv.length - 1]}`,
        cutoffNote,
        frequency: "Anual",
        unit: ckanMeta?.unit || "Número / Días",
        coverage: meta.coverage,
        totalRows: parsed.rows.length,
        missingFields: missingMetricValues,
        missingMetricValues,
        zeroMetricValues,
        duplicateRows,
        missingDetails: missingDetails.slice(0, 20),
        status: "ONLINE_VERIFIED"
      };

      rawData[key] = parsed;
      console.log(`✓ ${key}: ${parsed.rows.length} rows | missing=${missingMetricValues} | zeros=${zeroMetricValues} | dup=${duplicateRows}`);
    } catch (err) {
      console.error(`✗ Error downloading ${key}:`, err.message);
      auditReport.details[key] = {
        title: meta.title,
        organization: "Instituto de Estadística de la Comunidad de Madrid",
        sourceOrg: "Comunidad de Madrid",
        portalUrl: meta.portalUrl,
        url: meta.url,
        format: "CSV",
        publishedAt: "N/D",
        updatedAt: "N/D",
        dateRange: "N/D",
        cutoffNote: "N/D",
        frequency: "Anual",
        unit: "N/D",
        coverage: meta.coverage,
        totalRows: 0,
        missingFields: 0,
        missingMetricValues: 0,
        zeroMetricValues: 0,
        duplicateRows: 0,
        missingDetails: [],
        status: "FAILED_OFFLINE",
        error: err.message
      };
    }
  }

  // --- 1. LOAD VERIFIED OFFICIAL STRUCTURAL DATA & PROCESS WAIT LIST TIME SERIES ---
  const structuralDirectory = await loadAllOfficialStructuralData();

  console.log("Processing hospital-level wait list series...");
  const hospitalData = {};

  for (const [fullName, hMeta] of Object.entries(structuralDirectory)) {
    hospitalData[hMeta.id] = {
      id: hMeta.id,
      fullName,
      shortName: hMeta.shortName,
      tier: hMeta.complexityLabel,
      complexityGroup: hMeta.complexityGroup,
      grupo_complejidad: hMeta.complexityGroup,
      complexityLabel: hMeta.complexityLabel,
      complexitySource: hMeta.complexitySource,
      managementModel: hMeta.managementModel,
      modelo_gestion: hMeta.managementModel,
      ownership: hMeta.ownership,
      titularidad: hMeta.ownership,
      managementNote: hMeta.managementNote,
      structuralSourceStatus: hMeta.structuralSourceStatus,
      area: hMeta.area,
      municipality: hMeta.municipality,
      address: hMeta.address,
      lat: hMeta.lat,
      lng: hMeta.lng,
      beds: hMeta.beds,
      operatingBeds: hMeta.operatingBeds,
      cnhBeds: hMeta.cnhBeds,
      quirofanos: hMeta.quirofanos,
      ccn: hMeta.ccn,
      codCnh: hMeta.codCnh,
      camRegistro: hMeta.camRegistro,
      sermasMemoriaUrl: hMeta.sermasMemoriaUrl,
      structuralProvenance: hMeta.structuralProvenance,
      series: {
        quirurgica: { years: [], firstYear: null, lastYear: null, missingYears: [], pacientes: {}, demora: {} },
        consultas: { years: [], firstYear: null, lastYear: null, missingYears: [], pacientes: {}, demora: {} },
        pruebas: { years: [], firstYear: null, lastYear: null, missingYears: [], pacientes: {}, demora: {} }
      }
    };
  }

  function cleanHospitalName(concept) {
    const match = concept.match(/(?:en el|en la)\s+(.+)$/i);
    return match ? match[1].trim() : concept.trim();
  }

  function findHospitalMeta(cleanName) {
    if (structuralDirectory[cleanName]) return structuralDirectory[cleanName];
    const lower = cleanName.toLowerCase();
    for (const [name, meta] of Object.entries(structuralDirectory)) {
      if (name.toLowerCase() === lower) return meta;
    }
    for (const [name, meta] of Object.entries(structuralDirectory)) {
      if (lower.includes(meta.shortName.toLowerCase())) return meta;
    }
    return null;
  }

  const expectedYearsByList = {
    quirurgica: new Set(),
    consultas: new Set(),
    pruebas: new Set()
  };

  function ingestHospitalCsv(parsed, listType) {
    if (!parsed) return;
    for (const r of parsed.rows) {
      const year = r[0];
      expectedYearsByList[listType].add(year);
      const concept = r[1];
      const medida = r[5];
      const val = parseFloat(r[6]);
      const hName = cleanHospitalName(concept);
      const hMeta = findHospitalMeta(hName);
      if (!hMeta || !hospitalData[hMeta.id]) continue;

      const s = hospitalData[hMeta.id].series[listType];
      if (!s.years.includes(year)) s.years.push(year);

      // Preserve null for missing ('-'), preserve 0 for genuine 0
      const cleanVal = isNaN(val) ? null : val;
      if (medida.toLowerCase().includes("paciente")) {
        s.pacientes[year] = cleanVal;
      } else if (medida.toLowerCase().includes("demora")) {
        s.demora[year] = cleanVal;
      }
    }
  }

  ingestHospitalCsv(rawData.LEQ_Hosp, "quirurgica");
  ingestHospitalCsv(rawData.LECE_Hosp, "consultas");
  ingestHospitalCsv(rawData.LEPD_Hosp, "pruebas");

  // Compute sorted years, firstYear, lastYear, missingYears (relative to network span for that list)
  for (const h of Object.values(hospitalData)) {
    for (const listType of ["quirurgica", "consultas", "pruebas"]) {
      const s = h.series[listType];
      const networkYears = [...expectedYearsByList[listType]].sort();
      s.years.sort();

      // Valid observed years (at least demora or pacientes non-null)
      const validYears = s.years.filter(y => s.demora[y] !== null && s.demora[y] !== undefined);
      s.firstYear = validYears.length > 0 ? validYears[0] : null;
      s.lastYear = validYears.length > 0 ? validYears[validYears.length - 1] : null;

      if (s.years.length === 0) {
        s.missingYears = [];
      } else {
        s.missingYears = networkYears.filter(y => s.demora[y] === null || s.demora[y] === undefined);
        // Ensure years array covers full network span for that list if the hospital participates, with explicit nulls
        s.years = networkYears;
        for (const ny of networkYears) {
          if (s.demora[ny] === undefined) s.demora[ny] = null;
          if (s.pacientes[ny] === undefined) s.pacientes[ny] = null;
        }
      }
    }
  }

  // --- 2. PROCESS REGIONAL AGGREGATES & TRAMOS ---
  console.log("Processing regional aggregates and tramos...");
  const regionalData = {
    quirurgica: { series: [], metrics2024: {}, metrics2025: {} },
    consultas: { series: [], metrics2024: {} },
    pruebas: { series: [], metrics2024: {} }
  };

  if (rawData.LEQ_Global) {
    const years = [...new Set(rawData.LEQ_Global.rows.map(r => r[0]))].sort();
    for (const y of years) {
      const rowsY = rawData.LEQ_Global.rows.filter(r => r[0] === y);
      const entry = { year: y, tramos: {} };
      for (const r of rowsY) {
        const c = r[1];
        const val = parseFloat(r[5]);
        if (isNaN(val)) continue;
        if (c === "Total pacientes en lista de espera quirúrgica") entry.totalPacientes = val;
        if (c === "Pacientes en lista de espera quirúrgica estructural") entry.estructuralPacientes = val;
        if (c.includes("transitoriamente no programables")) entry.tnpPacientes = val;
        if (c === "Pacientes en lista de espera quirúrgica tras rechazo a la intervención en un centro alternativo") entry.rechazoPacientes = val;
        if (c === "Tiempo promedio de demora de los pacientes pendientes de intervención en espera estructural") entry.demoraMedia = val;
        if (c === "Tiempo promedio de demora de los pacientes pendientes de intervención tras rechazo a la intervención en un centro alternativo") entry.rechazoDemora = val;
        if (c === "Total salidas del Registro Unificado de pacientes en lista de espera quirúrgica") entry.salidasTotal = val;
        if (c === "Salidas del Registro Unificado de pacientes en lista de espera quirúrgica") entry.salidasEstructural = val;
        if (c === "Salidas del Registro Unificado de pacientes en lista de espera quirúrgica tras rechazo a la intervención en un centro alternativo") entry.salidasRechazo = val;
        if (c.includes("0 a 30 días")) entry.tramos.d0_30 = val;
        if (c.includes("30 a 60 días")) entry.tramos.d30_60 = val;
        if (c.includes("60 a 90 días")) entry.tramos.d60_90 = val;
        if (c.includes("90 a 180 días")) entry.tramos.d90_180 = val;
        if (c.includes("180 días y más")) entry.tramos.d180_plus = val;
      }
      entry.tramosSum = (entry.tramos.d0_30 || 0) + (entry.tramos.d30_60 || 0) + (entry.tramos.d60_90 || 0) + (entry.tramos.d90_180 || 0) + (entry.tramos.d180_plus || 0);
      entry.tramosDiff = entry.estructuralPacientes !== undefined ? entry.estructuralPacientes - entry.tramosSum : 0;
      regionalData.quirurgica.series.push(entry);
      if (y === "2024") regionalData.quirurgica.metrics2024 = entry;
      if (y === "2025") regionalData.quirurgica.metrics2025 = entry;
    }
  }

  if (rawData.LECE_Global) {
    const years = [...new Set(rawData.LECE_Global.rows.map(r => r[0]))].sort();
    for (const y of years) {
      const rowsY = rawData.LECE_Global.rows.filter(r => r[0] === y);
      const entry = { year: y, tramos: {} };
      for (const r of rowsY) {
        const c = r[1];
        const val = parseFloat(r[5]);
        if (isNaN(val)) continue;
        if (c === "Pacientes en espera estructural para primera consulta externa") entry.totalPacientes = val;
        if (c === "Demora media de espera para consultas externas") entry.demoraMedia = val;
        if (c.includes("Tasa por 1.000 habitantes")) entry.tasa1000 = val;
        if (c.includes("0 a 30 días")) entry.tramos.d0_30 = val;
        if (c.includes("31 a 60 días")) entry.tramos.d31_60 = val;
        if (c.includes("61 a 90 días")) entry.tramos.d61_90 = val;
        if (c.includes("90 días y más")) entry.tramos.d90_plus = val;
      }
      entry.tramosSum = (entry.tramos.d0_30 || 0) + (entry.tramos.d31_60 || 0) + (entry.tramos.d61_90 || 0) + (entry.tramos.d90_plus || 0);
      entry.tramosDiff = entry.totalPacientes !== undefined ? entry.totalPacientes - entry.tramosSum : 0;
      regionalData.consultas.series.push(entry);
      if (y === "2024") regionalData.consultas.metrics2024 = entry;
    }
  }

  if (rawData.LEPD_Global) {
    const years = [...new Set(rawData.LEPD_Global.rows.map(r => r[0]))].sort();
    for (const y of years) {
      const rowsY = rawData.LEPD_Global.rows.filter(r => r[0] === y);
      const entry = { year: y, tramos: {} };
      for (const r of rowsY) {
        const c = r[1];
        const val = parseFloat(r[5]);
        if (isNaN(val)) continue;
        if (c.includes("Total pacientes en espera estructural")) entry.totalPacientes = val;
        if (c.includes("Demora media de espera para pruebas")) entry.demoraMedia = val;
        if (c.includes("Tasa por 1.000 habitantes")) entry.tasa1000 = val;
        if (c.includes("0 a 30 días")) entry.tramos.d0_30 = val;
        if (c.includes("31 a 60 días")) entry.tramos.d31_60 = val;
        if (c.includes("61 a 90 días")) entry.tramos.d61_90 = val;
        if (c.includes("90 días y más")) entry.tramos.d90_plus = val;
      }
      entry.tramosSum = (entry.tramos.d0_30 || 0) + (entry.tramos.d31_60 || 0) + (entry.tramos.d61_90 || 0) + (entry.tramos.d90_plus || 0);
      entry.tramosDiff = entry.totalPacientes !== undefined ? entry.totalPacientes - entry.tramosSum : 0;
      regionalData.pruebas.series.push(entry);
      if (y === "2024") regionalData.pruebas.metrics2024 = entry;
    }
  }

  // --- 3. PROCESS SPECIALTIES & DIAGNOSTIC PROCEDURES (ESCRI) ---
  console.log("Processing specialty consultations and diagnostic procedures...");
  const specialtyData = [];
  if (rawData.Consultas_Especialidad) {
    const years = [...new Set(rawData.Consultas_Especialidad.rows.map(r => r[0]))].sort();
    const concepts = [...new Set(rawData.Consultas_Especialidad.rows.map(r => r[1]))];
    for (const c of concepts) {
      if (c.includes("Total consultas")) continue;
      const cleanSpecialty = c
        .replace("Consultas de ", "")
        .replace(" en establecimientos sanitarios con régimen de internado", "")
        .replace("Consultas del resto de ", "Otras ");
      const series = [];
      for (const y of years) {
        const row = rawData.Consultas_Especialidad.rows.find(r => r[0] === y && r[1] === c);
        if (row) {
          const val = parseFloat(row[5]);
          if (!isNaN(val)) series.push({ year: y, value: val });
        }
      }
      if (series.length > 0) {
        const last = series[series.length - 1];
        specialtyData.push({
          specialty: cleanSpecialty.charAt(0).toUpperCase() + cleanSpecialty.slice(1),
          originalConcept: c,
          latestYear: last.year,
          latestValue: last.value,
          total2023: series.find(s => s.year === "2023")?.value || last.value,
          series
        });
      }
    }
    specialtyData.sort((a, b) => b.latestValue - a.latestValue);
  }

  const diagnosticActivity = [];
  if (rawData.Actividad_Diagnostica) {
    const years = [...new Set(rawData.Actividad_Diagnostica.rows.map(r => r[0]))].sort();
    const concepts = [...new Set(rawData.Actividad_Diagnostica.rows.map(r => r[1]))];
    for (const c of concepts) {
      const cleanName = c
        .replace(" realizadas en establecimientos sanitarios con régimen de internado", "")
        .replace(" realizada en establecimientos sanitarios con régimen de internado", "")
        .replace(" realizados en establecimientos sanitarios con régimen de internado", "");
      const series = [];
      let unit = "Número";
      for (const y of years) {
        const row = rawData.Actividad_Diagnostica.rows.find(r => r[0] === y && r[1] === c);
        if (row) {
          unit = row[6] || unit;
          const val = parseFloat(row[5]);
          if (!isNaN(val)) series.push({ year: y, value: val });
        }
      }
      if (series.length > 0) {
        const last = series[series.length - 1];
        diagnosticActivity.push({
          procedure: cleanName,
          latestYear: last.year,
          latestValue: last.value,
          unit,
          total2023: series.find(s => s.year === "2023")?.value || last.value,
          series
        });
      }
    }
  }

  const frecuentacionActivity = [];
  if (rawData.Frecuentacion) {
    const years = [...new Set(rawData.Frecuentacion.rows.map(r => r[0]))].sort();
    const concepts = [...new Set(rawData.Frecuentacion.rows.map(r => r[1]))];
    for (const c of concepts) {
      const series = [];
      let unit = "Número";
      for (const y of years) {
        const row = rawData.Frecuentacion.rows.find(r => r[0] === y && r[1] === c);
        if (row) {
          unit = row[6] || unit;
          const val = parseFloat(row[5]);
          if (!isNaN(val)) series.push({ year: y, value: val });
        }
      }
      if (series.length > 0) {
        const last = series[series.length - 1];
        frecuentacionActivity.push({
          indicator: c,
          latestYear: last.year,
          latestValue: last.value,
          unit,
          series
        });
      }
    }
  }

  // --- 4. STATISTICAL RADAR: SEPARATED COMPARATIVE & TEMPORAL ENGINES ---
  console.log("Computing Statistical Radar (Comparative Cross-Sectional + Individual Temporal)...");
  const radarAlerts = [];

  const listTypes = [
    { key: "quirurgica", label: "Lista Quirúrgica", latestYear: "2025" },
    { key: "consultas", label: "Consultas Externas", latestYear: "2024" },
    { key: "pruebas", label: "Pruebas Diagnósticas", latestYear: "2024" }
  ];

  for (const { key: listType, label: listLabel, latestYear } of listTypes) {
    const hospDemoras = [];
    for (const h of Object.values(hospitalData)) {
      const val = h.series[listType].demora[latestYear];
      if (val !== undefined && val !== null && !isNaN(val)) {
        hospDemoras.push({ hospital: h, value: val });
      }
    }

    if (hospDemoras.length <= 5) continue;

    const demoraVals = hospDemoras.map(d => d.value);
    const demoraMed = median(demoraVals);
    const demoraMad = median(demoraVals.map(v => Math.abs(v - demoraMed)));
    const demoraAvg = mean(demoraVals);
    const demoraSd = sampleStdDev(demoraVals, demoraAvg);
    const ucl = demoraAvg + 3 * demoraSd;
    const uwl = demoraAvg + 2 * demoraSd;
    const lcl = Math.max(0, demoraAvg - 3 * demoraSd);

    for (const { hospital: h, value } of hospDemoras) {
      const mz = modifiedZScore(value, demoraMed, demoraMad);
      const zStandard = demoraSd > 0 ? (value - demoraAvg) / demoraSd : 0;

      // Individual hospital history (valid non-null points)
      const s = h.series[listType];
      const validYears = s.years.filter(y => s.demora[y] !== null && s.demora[y] !== undefined);
      let consecutiveWorsening = 0;
      for (let i = validYears.length - 1; i > 0; i--) {
        const curr = s.demora[validYears[i]];
        const prev = s.demora[validYears[i - 1]];
        if (curr > prev) {
          consecutiveWorsening++;
        } else {
          break;
        }
      }

      const priorVals = validYears.slice(0, -1).map(y => s.demora[y]);
      const selfMean = priorVals.length > 0 ? mean(priorVals) : null;
      const selfSd = priorVals.length >= 2 ? sampleStdDev(priorVals, selfMean) : null;
      const selfDeltaFromPrev = validYears.length >= 2
        ? value - s.demora[validYears[validYears.length - 2]]
        : null;
      const selfZ = (selfMean !== null && selfSd !== null && selfSd > 0)
        ? (value - selfMean) / selfSd
        : null;

      // A) COMPARATIVE CROSS-SECTIONAL RADAR (strict alignment with SPC +2σ/+3σ and Modified Z ≥2.0/≥3.5)
      let compLevel = null;
      let compPersistence = null;
      let compRationale = "";

      if (mz >= 3.5 || zStandard >= 3.0) {
        if (consecutiveWorsening >= 3) {
          compLevel = "ALERTA_PERSISTENTE";
          compPersistence = "Anomalía comparativa persistente";
        } else {
          compLevel = "ALERTA";
          compPersistence = "Anomalía estadística puntual";
        }
        compRationale = `Desviación extrema superior respecto a la red (${value.toFixed(1)} d vs mediana ${demoraMed.toFixed(1)} d; Modified Z = +${mz.toFixed(2)}, Z-SPC = +${zStandard.toFixed(2)}σ).`;
      } else if (mz >= 2.0 || zStandard >= 2.0) {
        compLevel = "ATENCION";
        compPersistence = "Zona de vigilancia";
        compRationale = `Zona de vigilancia comparativa superior (entre +2σ/+2,0 MAD y +3σ/+3,5 MAD): ${value.toFixed(1)} d frente a mediana regional de ${demoraMed.toFixed(1)} d (Modified Z = +${mz.toFixed(2)}, Z-SPC = ${zStandard >= 0 ? '+' : ''}${zStandard.toFixed(2)}σ)${consecutiveWorsening >= 3 ? ` con racha de ${consecutiveWorsening} periodos de subida.` : '.'}`;
      }

      if (compLevel) {
        radarAlerts.push({
          id: `comp_${h.id}_${listType}_${latestYear}`,
          radarType: "comparativo",
          level: compLevel,
          persistenceCategory: compPersistence,
          hospitalId: h.id,
          hospitalName: h.fullName,
          hospitalShort: h.shortName,
          tier: h.complexityLabel,
          complexityGroup: h.complexityGroup,
          managementModel: h.managementModel,
          area: h.area,
          listType,
          listLabel,
          indicator: "Demora Media (Días)",
          observedValue: Math.round(value * 10) / 10,
          referenceValue: Math.round(demoraMed * 10) / 10,
          regionalMean: Math.round(demoraAvg * 10) / 10,
          regionalSd: Math.round(demoraSd * 100) / 100,
          regionalMad: Math.round(demoraMad * 100) / 100,
          regionalUcl: Math.round(ucl * 10) / 10,
          regionalUwl: Math.round(uwl * 10) / 10,
          regionalLcl: Math.round(lcl * 10) / 10,
          period: latestYear,
          modifiedZScore: Math.round(mz * 100) / 100,
          standardZScore: Math.round(zStandard * 100) / 100,
          selfMean: selfMean !== null ? Math.round(selfMean * 10) / 10 : null,
          selfSd: selfSd !== null ? Math.round(selfSd * 100) / 100 : null,
          selfZ: selfZ !== null ? Math.round(selfZ * 100) / 100 : null,
          selfDeltaFromPrev: selfDeltaFromPrev !== null ? Math.round(selfDeltaFromPrev * 10) / 10 : null,
          consecutiveWorseningYears: consecutiveWorsening,
          sampleSize: hospDemoras.length,
          method: "Radar Comparativo (Transversal): Modified Z-Score (Mediana + MAD, vigilancia M≥2,0 / extremo M≥3,5) y Control Estadístico SPC (+2σ / +3σ)",
          rationale: compRationale
        });
      }

      // B) TEMPORAL INDIVIDUAL RADAR (hospital vs its own historical series; never classify below-median centers as severe ALERTA)
      const isAboveMedian = value >= demoraMed;
      const pctAboveSelfMean = selfMean && selfMean > 0 ? ((value - selfMean) / selfMean) * 100 : 0;

      if (consecutiveWorsening >= 3 || (selfZ !== null && selfZ >= 2.0 && value > 10)) {
        const tempLevel = isAboveMedian
          ? (consecutiveWorsening >= 3 ? "ALERTA_PERSISTENTE" : "ALERTA")
          : "ATENCION";

        const tempCategory = isAboveMedian && consecutiveWorsening >= 3
          ? "Deterioro temporal persistente"
          : "Zona de vigilancia";

        const selfZStr = selfZ !== null ? `${selfZ >= 0 ? '+' : ''}${selfZ.toFixed(2)}σ propios` : 'N/D';
        const contextNote = isAboveMedian
          ? `Además se sitúa por encima de la mediana de la red (${value.toFixed(1)} d vs ${demoraMed.toFixed(1)} d; Mod Z comparativo = ${mz >= 0 ? '+' : ''}${mz.toFixed(2)}).`
          : `Nota comparativa: pese al repunte respecto a su propio histórico (${selfZStr}), su demora absoluta (${value.toFixed(1)} d) permanece en zona habitual/baja por debajo de la mediana de la red (${demoraMed.toFixed(1)} d; Mod Z comparativo = ${mz.toFixed(2)}).`;

        radarAlerts.push({
          id: `temp_${h.id}_${listType}_${latestYear}`,
          radarType: "temporal",
          level: tempLevel,
          persistenceCategory: tempCategory,
          hospitalId: h.id,
          hospitalName: h.fullName,
          hospitalShort: h.shortName,
          tier: h.complexityLabel,
          complexityGroup: h.complexityGroup,
          managementModel: h.managementModel,
          area: h.area,
          listType,
          listLabel,
          indicator: "Trayectoria Longitudinal Individual (Días)",
          observedValue: Math.round(value * 10) / 10,
          referenceValue: Math.round(demoraMed * 10) / 10,
          regionalMean: Math.round(demoraAvg * 10) / 10,
          regionalSd: Math.round(demoraSd * 100) / 100,
          regionalMad: Math.round(demoraMad * 100) / 100,
          regionalUcl: Math.round(ucl * 10) / 10,
          regionalUwl: Math.round(uwl * 10) / 10,
          regionalLcl: Math.round(lcl * 10) / 10,
          period: latestYear,
          modifiedZScore: Math.round(mz * 100) / 100,
          standardZScore: Math.round(zStandard * 100) / 100,
          selfMean: selfMean !== null ? Math.round(selfMean * 10) / 10 : null,
          selfSd: selfSd !== null ? Math.round(selfSd * 100) / 100 : null,
          selfZ: selfZ !== null ? Math.round(selfZ * 100) / 100 : null,
          selfDeltaFromPrev: selfDeltaFromPrev !== null ? Math.round(selfDeltaFromPrev * 10) / 10 : null,
          consecutiveWorseningYears: consecutiveWorsening,
          sampleSize: validYears.length,
          method: "Radar Temporal Individual: Racha interanual y Z-score propio respecto al histórico previo del centro (separado del Z comparativo de red)",
          rationale: `${consecutiveWorsening} periodos consecutivos de incremento respecto a su propio histórico (media previa: ${selfMean !== null ? selfMean.toFixed(1) : 'N/D'} d, Z-propio: ${selfZStr}, variación: ${pctAboveSelfMean >= 0 ? '+' : ''}${pctAboveSelfMean.toFixed(1)}%). ${contextNote}`
        });
      }
    }
  }

  const severityWeight = { ALERTA_PERSISTENTE: 3, ALERTA: 2, ATENCION: 1 };
  radarAlerts.sort((a, b) => {
    if (a.radarType !== b.radarType) return a.radarType === "comparativo" ? -1 : 1;
    const diff = severityWeight[b.level] - severityWeight[a.level];
    if (diff !== 0) return diff;
    return b.modifiedZScore - a.modifiedZScore;
  });

  // --- 5. FORECASTING WITH ROLLING-ORIGIN CROSS-VALIDATION ---
  console.log("Training experimental forecasting models (Holt ETS vs Naive with Rolling-Origin CV)...");
  const forecastingResults = {};

  function buildForecastEntry(key, label, unit, sourceDataset, cutoffNote, rawSeriesObjects, valueField) {
    const valid = rawSeriesObjects.filter(s => s[valueField] !== undefined && s[valueField] !== null);
    const values = valid.map(s => s[valueField]);
    const years = valid.map(s => s.year);

    if (values.length < 6) return;

    const evalResult = evaluateModels(values, years);
    const forecast = holtLinearForecast(values, 3);
    const lastYearNum = parseInt(years[years.length - 1], 10);
    const futureYears = [lastYearNum + 1, lastYearNum + 2, lastYearNum + 3];

    forecastingResults[key] = {
      label,
      unit,
      sourceDataset,
      cutoffNote,
      periodicity: "Anual (1 paso = 1 año a 31 de diciembre)",
      historical: years.map((y, idx) => ({ year: y, observed: values[idx] })),
      validation: evalResult,
      projections: forecast.forecasts.map((f, idx) => ({
        year: futureYears[idx].toString(),
        point: f.point,
        lower80: f.lower80,
        upper80: f.upper80,
        lower95: f.lower95,
        upper95: f.upper95
      })),
      modelDetails: {
        name: "Suavizado Exponencial de Holt (ETS A,A,N con tendencia aditiva)",
        alpha: forecast.alpha,
        beta: forecast.beta,
        parameterSelection: "Búsqueda en rejilla minimizando SSE a 1 paso dentro del conjunto de entrenamiento (sin fuga futura)",
        baseline: "Modelo Naive (último valor observado)",
        standardError: forecast.standardError,
        intervalFormula: "IC(h) = ŷ ± z · σ · √(1 + Σ_{j=1}^{h-1} (α + j·α·β)²)"
      }
    };
  }

  buildForecastEntry(
    "quirurgica_pacientes",
    "Total Pacientes en Lista de Espera Quirúrgica (Comunidad de Madrid)",
    "Pacientes",
    "LEQ_Global (datos.comunidad.madrid)",
    "Datos anuales a 31 de diciembre (2015–2025)",
    regionalData.quirurgica.series,
    "totalPacientes"
  );

  buildForecastEntry(
    "quirurgica_demora",
    "Demora Media Quirúrgica en Espera Estructural (Comunidad de Madrid)",
    "Días",
    "LEQ_Global (datos.comunidad.madrid)",
    "Datos anuales a 31 de diciembre (2015–2025)",
    regionalData.quirurgica.series,
    "demoraMedia"
  );

  buildForecastEntry(
    "consultas_demora",
    "Demora Media en Consultas Externas (Comunidad de Madrid)",
    "Días",
    "LECE_Global (datos.comunidad.madrid)",
    "Datos anuales a 31 de diciembre (2015–2024)",
    regionalData.consultas.series,
    "demoraMedia"
  );

  buildForecastEntry(
    "pruebas_demora",
    "Demora Media en Pruebas Diagnósticas (Comunidad de Madrid)",
    "Días",
    "LEPD_Global (datos.comunidad.madrid)",
    "Datos anuales a 31 de diciembre (2015–2024)",
    regionalData.pruebas.series,
    "demoraMedia"
  );

  const outputData = {
    metadata: {
      appName: "MADRID SIN ESPERAS",
      generatedAt: new Date().toISOString(),
      version: "2.0.0-AUDITED",
      dataGovernance: {
        sourceOrg: "Comunidad de Madrid - Consejería de Sanidad / SERMAS / Instituto de Estadística",
        portal: "Portal de Datos Abiertos de la Comunidad de Madrid (datos.comunidad.madrid)",
        license: "Creative Commons Reconocimiento (CC-BY 4.0)",
        coverage: "Red Hospitalaria Pública del Servicio Madrileño de Salud (SERMAS) y estadística ESCRI",
        strictRule: "Datos verificados sin extrapolación ni reemplazo de valores ausentes por ceros."
      }
    },
    auditReport,
    hospitals: hospitalData,
    regional: regionalData,
    specialties: specialtyData,
    diagnosticActivity,
    frecuentacion: frecuentacionActivity,
    radarAlerts,
    forecasting: forecastingResults
  };

  const srcPath = path.resolve('src/data/officialHealthData.json');
  const pubPath = path.resolve('public/data/officialHealthData.json');
  fs.writeFileSync(srcPath, JSON.stringify(outputData, null, 2), 'utf-8');
  fs.writeFileSync(pubPath, JSON.stringify(outputData, null, 2), 'utf-8');

  console.log(`✓ Audited data compiled to ${srcPath} & ${pubPath}`);
  console.log(`Summary: ${auditReport.totalRecordsProcessed} rows | Missing metric values: ${auditReport.missingValuesCount} | Real zeros: ${auditReport.zeroValuesCount} | Duplicates: ${auditReport.duplicateRecordsCount}`);
  console.log(`Radar Alerts: ${radarAlerts.length} (Comparative: ${radarAlerts.filter(a => a.radarType === 'comparativo').length}, Temporal: ${radarAlerts.filter(a => a.radarType === 'temporal').length})`);
}

runPipeline().catch(console.error);
