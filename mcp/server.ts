/**
 * MADRID SIN ESPERAS - Model Context Protocol (MCP) Server
 * Servidor MCP oficial para consultar datos abiertos y analítica sanitaria del SERMAS
 * Compatible con Google Antigravity, Cursor, Claude Desktop y clientes MCP estándar.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar la base de datos oficial auditada
function loadHealthData() {
  const candidates = [
    path.resolve(__dirname, '../src/data/officialHealthData.json'),
    path.resolve(__dirname, '../public/data/officialHealthData.json'),
    path.resolve(process.cwd(), 'src/data/officialHealthData.json'),
    path.resolve(process.cwd(), 'public/data/officialHealthData.json')
  ];

  for (const p of candidates) {
    if (fs.existsSync(p)) {
      try {
        const raw = fs.readFileSync(p, 'utf-8');
        return JSON.parse(raw);
      } catch (err) {
        console.error(`Error al parsear ${p}:`, err);
      }
    }
  }
  throw new Error('No se pudo encontrar officialHealthData.json en ninguna ruta esperada.');
}

const data = loadHealthData();

// Instanciar el servidor MCP
const server = new McpServer({
  name: 'madrid-sin-esperas-mcp',
  version: '1.0.0'
});

// Helper de búsqueda de hospital
function findHospital(query: string) {
  const q = query.toLowerCase().trim();
  const hospitals = Object.values(data.hospitals) as any[];
  
  // Coincidencia exacta por ID
  let match = hospitals.find(h => h.id.toLowerCase() === q);
  if (match) return match;

  // Coincidencia por nombre corto
  match = hospitals.find(h => h.shortName.toLowerCase() === q);
  if (match) return match;

  // Coincidencia por subcadena en nombre completo o corto
  match = hospitals.find(h => 
    h.fullName.toLowerCase().includes(q) || 
    h.shortName.toLowerCase().includes(q)
  );
  return match || null;
}

// -------------------------------------------------------------
// TOOL 1: Listar Hospitales del SERMAS
// -------------------------------------------------------------
server.tool(
  'sermas_list_hospitals',
  'Lista los 31 hospitales de la red pública del SERMAS con su ID, nombre, municipio, área geográfica, modelo de gestión y grupo de complejidad.',
  {
    area: z.enum(['Centro', 'Norte', 'Sur', 'Este', 'Oeste']).optional().describe('Filtrar por área sanitaria territorial'),
    complejidad: z.string().optional().describe("Filtrar por grupo de complejidad (ej. 'Grupo 1', 'Grupo 2', 'Grupo 3', 'Apoyo / Especialidades')"),
    modelo_gestion: z.string().optional().describe("Filtrar por modelo de gestión (ej. 'Gestión pública directa', 'Concesión privada', 'PFI')")
  },
  async ({ area, complejidad, modelo_gestion }) => {
    let list = Object.values(data.hospitals) as any[];

    if (area) {
      list = list.filter(h => h.area === area);
    }
    if (complejidad) {
      list = list.filter(h => h.complexityGroup.toLowerCase().includes(complejidad.toLowerCase()));
    }
    if (modelo_gestion) {
      list = list.filter(h => h.managementModel.toLowerCase().includes(modelo_gestion.toLowerCase()));
    }

    const result = list.map(h => ({
      id: h.id,
      nombre_corto: h.shortName,
      nombre_oficial: h.fullName,
      complejidad: h.complexityGroup,
      modelo_gestion: h.managementModel,
      titularidad: h.ownership,
      area: h.area,
      municipio: h.municipality,
      camas_instaladas: h.beds,
      camas_funcionantes: h.operatingBeds,
      quirofanos: h.quirofanos
    }));

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ total: result.length, hospitales: result }, null, 2)
        }
      ]
    };
  }
);

// -------------------------------------------------------------
// TOOL 2: Detalle Completo de un Hospital
// -------------------------------------------------------------
server.tool(
  'sermas_get_hospital',
  'Obtiene la ficha técnica oficial completa de un hospital: recursos estructurales (camas, quirófanos, coordenadas) y series históricas exactas de demoras y pacientes (LEQ 2015-2025, LECE 2017-2024, LEPD 2017-2024).',
  {
    hospital: z.string().describe("ID del hospital (ej. 'la_paz', 'gregorio_maranon', '12_de_octubre') o nombre (ej. 'La Paz', 'Fuenlabrada')")
  },
  async ({ hospital }) => {
    const h = findHospital(hospital);
    if (!h) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ error: `No se encontró ningún hospital con el término '${hospital}'. Usa 'sermas_list_hospitals' para consultar los IDs válidos.` })
          }
        ]
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            identificacion: {
              id: h.id,
              nombre_corto: h.shortName,
              nombre_oficial: h.fullName,
              complejidad: h.complexityGroup,
              modelo_gestion: h.managementModel,
              titularidad: h.ownership,
              area: h.area,
              municipio: h.municipality,
              direccion: h.address,
              coordenadas: { lat: h.lat, lng: h.lng },
              codigos_oficiales: { codCnh: h.codCnh, ccn: h.ccn, camRegistro: h.camRegistro }
            },
            recursos_materiales_sermas_2024: {
              camas_instaladas: h.beds,
              camas_funcionantes: h.operatingBeds,
              camas_cnh_2025: h.cnhBeds,
              quirofanos: h.quirofanos,
              fuente: 'Memoria Anual SERMAS 2024 (SIAE) y Catálogo Nacional de Hospitales 2025'
            },
            series_temporales: {
              quirurgica: {
                unidad: 'Días naturales / Pacientes en espera estructural',
                anios: h.series.quirurgica.years,
                demora_media: h.series.quirurgica.demora,
                pacientes: h.series.quirurgica.pacientes
              },
              consultas_externas: {
                unidad: 'Días naturales / Pacientes en espera',
                anios: h.series.consultas.years,
                demora_media: h.series.consultas.demora,
                pacientes: h.series.consultas.pacientes
              },
              pruebas_diagnosticas: {
                unidad: 'Días naturales / Pacientes en espera',
                anios: h.series.pruebas.years,
                demora_media: h.series.pruebas.demora,
                pacientes: h.series.pruebas.pacientes
              }
            }
          }, null, 2)
        }
      ]
    };
  }
);

// -------------------------------------------------------------
// TOOL 3: Comparativa Multihospitalaria
// -------------------------------------------------------------
server.tool(
  'sermas_compare_hospitals',
  'Compara de forma cruzada múltiples hospitales en un tipo de lista y año concreto, incluyendo demoras, pacientes pendientes y dotación estructural.',
  {
    hospitales: z.array(z.string()).describe("Lista de IDs o nombres de hospitales a comparar (ej. ['la_paz', '12_de_octubre', 'gregorio_maranon'])"),
    tipo_lista: z.enum(['quirurgica', 'consultas', 'pruebas']).describe("Tipo de lista de espera a comparar"),
    anio: z.string().optional().describe("Año de corte a evaluar (ej. '2025' para quirúrgica, '2024' para consultas/pruebas). Por defecto toma el último disponible.")
  },
  async ({ hospitales, tipo_lista, anio }) => {
    const defaultYear = tipo_lista === 'quirurgica' ? '2025' : '2024';
    const targetYear = anio || defaultYear;

    const comparisons = hospitales.map(hQuery => {
      const h = findHospital(hQuery);
      if (!h) return { consulta: hQuery, error: 'Hospital no encontrado' };

      const series = h.series[tipo_lista];
      const demora = series?.demora?.[targetYear] ?? null;
      const pacientes = series?.pacientes?.[targetYear] ?? null;

      return {
        id: h.id,
        nombre: h.shortName,
        complejidad: h.complexityGroup,
        modelo_gestion: h.managementModel,
        area: h.area,
        camas_instaladas: h.beds,
        camas_funcionantes: h.operatingBeds,
        quirofanos: h.quirofanos,
        anio: targetYear,
        tipo_lista,
        demora_media_dias: demora,
        pacientes_pendientes: pacientes
      };
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ tipo_lista, anio: targetYear, resultados: comparisons }, null, 2)
        }
      ]
    };
  }
);

// -------------------------------------------------------------
// TOOL 4: Alertas Estadísticas del Radar Sanitario y SPC
// -------------------------------------------------------------
server.tool(
  'sermas_get_radar_alerts',
  'Consulta las señales estadísticas de detección temprana generadas por el Radar Sanitario (Modified Z-Score y límites SPC ±2σ / ±3σ) y el Radar Temporal (Z propio del centro y rachas de deterioro).',
  {
    nivel: z.enum(['ALERTA_PERSISTENTE', 'ALERTA', 'ATENCION']).optional().describe('Filtrar por nivel de severidad'),
    tipo_radar: z.enum(['comparativo', 'temporal']).optional().describe('Filtrar por radar comparativo (transversal entre hospitales) o temporal (trayectoria individual del centro)'),
    tipo_lista: z.enum(['quirurgica', 'consultas', 'pruebas']).optional().describe('Filtrar por tipo de lista de espera'),
    hospital: z.string().optional().describe('Filtrar alertas de un hospital específico')
  },
  async ({ nivel, tipo_radar, tipo_lista, hospital }) => {
    let alerts = data.radarAlerts as any[];

    if (nivel) {
      alerts = alerts.filter(a => a.level === nivel);
    }
    if (tipo_radar) {
      alerts = alerts.filter(a => a.radarType === tipo_radar);
    }
    if (tipo_lista) {
      alerts = alerts.filter(a => a.listType === tipo_lista);
    }
    if (hospital) {
      const h = findHospital(hospital);
      if (h) {
        alerts = alerts.filter(a => a.hospitalId === h.id);
      }
    }

    const formatted = alerts.map(a => ({
      id: a.id,
      tipo_radar: a.radarType,
      nivel: a.level,
      hospital: a.hospitalShort,
      complejidad: a.complexityGroup,
      area: a.area,
      tipo_lista: a.listType,
      periodo: a.period,
      valor_observado: a.observedValue,
      valor_referencia: a.referenceValue,
      modified_z_score: a.modifiedZScore,
      spc_standard_z: a.standardZScore,
      self_z_propio: a.selfZ,
      rachas_empeoramiento_anios: a.consecutiveWorseningYears,
      metodologia: a.method,
      justificacion_analitica: a.rationale
    }));

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ total_alertas: formatted.length, alertas: formatted }, null, 2)
        }
      ]
    };
  }
);

// -------------------------------------------------------------
// TOOL 5: Serie Regional Agregada de la Comunidad de Madrid
// -------------------------------------------------------------
server.tool(
  'sermas_get_regional_series',
  'Obtiene la serie temporal agregada de toda la Comunidad de Madrid (2015-2025) para una lista, con el desglose exacto de tramos de espera (días) y balance de salidas.',
  {
    tipo_lista: z.enum(['quirurgica', 'consultas', 'pruebas']).describe('Tipo de lista de espera autonómica')
  },
  async ({ tipo_lista }) => {
    const reg = data.regional[tipo_lista];
    if (!reg) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ error: `No se encontraron datos regionales para ${tipo_lista}` }) }]
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            tipo_lista,
            cobertura: 'Comunidad de Madrid - Total Agregado Red SERMAS',
            series_historicas: reg.series
          }, null, 2)
        }
      ]
    };
  }
);

// -------------------------------------------------------------
// TOOL 6: Consultas por Especialidad y Pruebas Diagnósticas
// -------------------------------------------------------------
server.tool(
  'sermas_get_specialties_and_diagnostics',
  'Consulta la actividad anual acumulada de las 17 especialidades médicas y 16 pruebas diagnósticas (TAC, RM, Mamografías, etc.) de la estadística oficial ESCRI.',
  {
    categoria: z.enum(['especialidades', 'pruebas_diagnosticas']).describe('Consultar especialidades médicas o pruebas diagnósticas'),
    busqueda: z.string().optional().describe("Texto de búsqueda (ej. 'trauma', 'oftalmo', 'resonancia', 'tac')")
  },
  async ({ categoria, busqueda }) => {
    const q = busqueda ? busqueda.toLowerCase().trim() : '';

    if (categoria === 'especialidades') {
      let list = data.specialties as any[];
      if (q) {
        list = list.filter(e => e.specialty.toLowerCase().includes(q) || e.originalConcept.toLowerCase().includes(q));
      }
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ total: list.length, especialidades: list }, null, 2)
          }
        ]
      };
    } else {
      let list = data.diagnosticActivity as any[];
      if (q) {
        list = list.filter(d => d.procedure.toLowerCase().includes(q));
      }
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ total: list.length, pruebas_diagnosticas: list }, null, 2)
          }
        ]
      };
    }
  }
);

// -------------------------------------------------------------
// TOOL 7: Modelos Predictivos y Proyecciones Holt-Winters
// -------------------------------------------------------------
server.tool(
  'sermas_get_forecast',
  'Obtiene las proyecciones estadísticas oficiales para 2026 y 2027 ajustadas por modelos Holt-Winters con intervalos de predicción al 80% y 95% y validación de residuos (Ljung-Box).',
  {
    serie: z.enum(['quirurgica_pacientes', 'quirurgica_demora', 'consultas_demora', 'pruebas_demora']).describe('Serie predictiva a consultar')
  },
  async ({ serie }) => {
    const fc = data.forecasting[serie];
    if (!fc) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ error: `Serie predictiva '${serie}' no disponible.` }) }]
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            indicador: fc.label,
            unidad: fc.unit,
            fuente_oficial: fc.sourceDataset,
            metodo: fc.modelDetails?.name || fc.method,
            modelo_detalles: fc.modelDetails,
            validacion_cruzada_rolling_origin: fc.validation,
            historico_observado: fc.historical,
            proyecciones_futuras: fc.projections
          }, null, 2)
        }
      ]
    };
  }
);

// -------------------------------------------------------------
// TOOL 8: Gobernanza y Metadatos DCAT-AP-ES
// -------------------------------------------------------------
server.tool(
  'sermas_get_dcat_metadata',
  'Recupera los metadatos oficiales de gobernanza y catalogación DCAT-AP-ES (Portal datos.comunidad.madrid / datos.gob.es) de los 9 datasets que alimentan el sistema.',
  {
    dataset_clave: z.string().optional().describe("Clave del dataset (ej. 'LEQ_Hosp', 'LECE_Hosp', 'LEPD_Hosp', 'LEQ_Global', 'Consultas_Especialidad', 'Actividad_Diagnostica', 'Frecuentacion')")
  },
  async ({ dataset_clave }) => {
    if (dataset_clave) {
      const item = data.auditReport.details[dataset_clave];
      if (!item) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ error: `Clave '${dataset_clave}' no encontrada. Claves válidas: ${Object.keys(data.auditReport.details).join(', ')}` })
            }
          ]
        };
      }
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              clave: dataset_clave,
              dcat_ap_es: {
                'dct:title': item.title,
                'dct:publisher': item.organization,
                'dct:creator': item.sourceOrg,
                'dcat:landingPage': item.portalUrl,
                'dcat:downloadURL': item.url,
                'dct:format': item.format,
                'dct:issued': item.publishedAt,
                'dct:modified': item.updatedAt,
                'dct:temporal': item.dateRange,
                'dct:spatial': item.coverage,
                'dct:accrualPeriodicity': item.frequency,
                'dct:license': data.metadata.dataGovernance.license
              },
              calidad_ingesta: {
                filas_procesadas: item.totalRows,
                valores_ausentes_nulos: item.missingMetricValues,
                ceros_reales: item.zeroMetricValues,
                duplicados: item.duplicateRows,
                estado: item.status
              }
            }, null, 2)
          }
        ]
      };
    }

    // Si no se pide clave, devolver inventario global
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            catalogo_general: {
              'dct:title': data.metadata.appName,
              'dct:publisher': data.metadata.dataGovernance.sourceOrg,
              'foaf:homepage': data.metadata.dataGovernance.portal,
              'dct:license': data.metadata.dataGovernance.license,
              'dct:language': 'es',
              'dcat:themeTaxonomy': 'http://datos.gob.es/kos/sector-publico/sector/salud',
              'dct:modified': data.metadata.generatedAt
            },
            resumen_auditoria_calidad: {
              datasets_verificados: `${data.auditReport.datasetsValid} / ${data.auditReport.datasetsChecked}`,
              total_registros_procesados: data.auditReport.totalRecordsProcessed,
              valores_ausentes: data.auditReport.missingValuesCount,
              ceros_reales: data.auditReport.zeroValuesCount,
              duplicados: data.auditReport.duplicateRecordsCount
            },
            datasets_disponibles: Object.keys(data.auditReport.details)
          }, null, 2)
        }
      ]
    };
  }
);

// Arrancar el transporte Stdio
async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Madrid Sin Esperas MCP Server running on Stdio');
}

run().catch((error) => {
  console.error('Error starting MCP server:', error);
  process.exit(1);
});
