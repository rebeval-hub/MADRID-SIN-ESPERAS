export type WaitListType = 'quirurgica' | 'consultas' | 'pruebas';

export type HospitalViewCategory = 'general' | WaitListType;

export type BadgeCategory = 'OFICIAL' | 'CALCULADO' | 'ESTADISTICO' | 'PREDICCION' | 'NO_VERIFICADO';

export type AlertLevel = 'ALERTA_PERSISTENTE' | 'ALERTA' | 'ATENCION';

export type ComplexityGroup =
  | 'Grupo 1'
  | 'Grupo 2'
  | 'Grupo 3'
  | 'Apoyo / Especialidades'
  | 'Media y Larga Estancia'
  | 'Salud Mental Monográfico';

export type ManagementModel =
  | 'Gestión pública directa'
  | 'Gestión pública directa (infraestructura PFI)'
  | 'Concesión privada'
  | 'Concierto singular'
  | 'Convenio Defensa';

export type OwnershipType = 'Pública' | 'Privada';

export interface HospitalSeries {
  years: string[];
  firstYear: string | null;
  lastYear: string | null;
  missingYears: string[];
  pacientes: Record<string, number | null>;
  demora: Record<string, number | null>;
}

export interface StructuralDatumProvenance {
  value: string | number | null;
  source: string;
  url: string;
  referenceDate: string;
  definition: string;
  unit: string;
  status: 'VERIFICADO' | 'NO_DISPONIBLE';
  discrepancyNote?: string;
}

export interface AgePyramidBracket {
  rango: string;
  hombres: number;
  mujeres: number;
}

export interface HospitalEquipmentItem {
  nombre: string;
  u2023: number;
  u2024: number;
}

export interface HospitalDemographics {
  hasDemographics: boolean;
  poblacionReferenciaTotal: number | null;
  poblacionHombres: number | null;
  poblacionMujeres: number | null;
  pctMujeres: number | null;
  pctHombres: number | null;
  pctMayores65: number | null;
  sourceNote: string;
  piramide: AgePyramidBracket[];
  altaTecnologia: HospitalEquipmentItem[];
  otrosEquipos: HospitalEquipmentItem[];
}

export interface HospitalMetadata {
  id: string;
  fullName: string;
  shortName: string;
  tier: string;
  complexityGroup: ComplexityGroup;
  grupo_complejidad: ComplexityGroup;
  complexityLabel: string;
  complexitySource: string;
  managementModel: ManagementModel;
  modelo_gestion: ManagementModel;
  ownership: OwnershipType;
  titularidad: OwnershipType;
  managementNote: string;
  structuralSourceStatus?: string;
  area: 'Centro' | 'Norte' | 'Sur' | 'Este' | 'Oeste';
  municipality: string;
  address?: string;
  lat: number;
  lng: number;
  beds: number | null;
  operatingBeds?: number | null;
  cnhBeds?: number | null;
  quirofanos: number | null;
  ccn?: string;
  codCnh?: string | null;
  camRegistro?: string | null;
  sermasMemoriaUrl?: string;
  structuralProvenance?: Record<string, StructuralDatumProvenance>;
  demografiaYEquipamiento?: HospitalDemographics;
  series: {
    quirurgica: HospitalSeries;
    consultas: HospitalSeries;
    pruebas: HospitalSeries;
  };
}

export interface RegionalMetricEntry {
  year: string;
  totalPacientes?: number;
  estructuralPacientes?: number;
  tnpPacientes?: number;
  rechazoPacientes?: number;
  demoraMedia?: number;
  rechazoDemora?: number;
  salidasTotal?: number;
  salidasEstructural?: number;
  salidasRechazo?: number;
  tasa1000?: number;
  tramosSum?: number;
  tramosDiff?: number;
  tramos: {
    d0_30?: number;
    d30_60?: number;
    d31_60?: number;
    d60_90?: number;
    d61_90?: number;
    d90_180?: number;
    d90_plus?: number;
    d180_plus?: number;
  };
}

export interface SpecialtyEntry {
  specialty: string;
  originalConcept: string;
  latestYear: string;
  latestValue: number;
  total2023: number;
  series: { year: string; value: number }[];
}

export interface DiagnosticActivityEntry {
  procedure: string;
  latestYear: string;
  latestValue: number;
  unit: string;
  total2023: number;
  series: { year: string; value: number }[];
}

export interface FrecuentacionEntry {
  indicator: string;
  latestYear: string;
  latestValue: number;
  unit: string;
  series: { year: string; value: number }[];
}

export interface RadarAlert {
  id: string;
  radarType: 'comparativo' | 'temporal';
  level: AlertLevel;
  persistenceCategory:
    | 'Anomalía comparativa persistente'
    | 'Anomalía estadística puntual'
    | 'Zona de vigilancia'
    | 'Deterioro temporal persistente';
  hospitalId: string;
  hospitalName: string;
  hospitalShort: string;
  tier: string;
  complexityGroup: ComplexityGroup;
  managementModel: ManagementModel;
  area: string;
  listType: WaitListType;
  listLabel: string;
  indicator: string;
  observedValue: number;
  referenceValue: number;
  regionalMean: number;
  regionalSd: number;
  regionalMad: number;
  regionalUcl: number;
  regionalUwl: number;
  regionalLcl: number;
  period: string;
  modifiedZScore: number;
  standardZScore: number;
  selfMean: number | null;
  selfSd?: number | null;
  selfZ?: number | null;
  selfDeltaFromPrev: number | null;
  consecutiveWorseningYears: number;
  sampleSize: number;
  method: string;
  rationale: string;
}

export interface ForecastProjection {
  year: string;
  point: number;
  lower80: number;
  upper80: number;
  lower95: number;
  upper95: number;
}

export interface ForecastValidationMetrics {
  mae: number;
  rmse: number;
  mape: number;
}

export interface ForecastModelData {
  label: string;
  unit: string;
  sourceDataset: string;
  cutoffNote: string;
  periodicity: string;
  historical: { year: string; observed: number }[];
  validation: {
    status: string;
    method: string;
    totalObservations: number;
    minTrainWindow: number;
    rollingFolds: number;
    testOriginsRange: string;
    trainObservations: number;
    testObservations: number;
    naive: ForecastValidationMetrics;
    holt: ForecastValidationMetrics & { improvementPct: number };
    staticHoldout2: {
      trainYears: string;
      testYears: string;
      naive: ForecastValidationMetrics;
      holt: ForecastValidationMetrics & { improvementPct: number };
    };
  };
  projections: ForecastProjection[];
  modelDetails: {
    name: string;
    alpha: number;
    beta: number;
    parameterSelection: string;
    baseline: string;
    standardError: number;
    intervalFormula: string;
  };
}

export interface AuditDatasetDetail {
  title: string;
  organization: string;
  sourceOrg: string;
  portalUrl: string;
  url: string;
  format: string;
  publishedAt: string;
  updatedAt: string;
  dateRange: string;
  cutoffNote: string;
  frequency: string;
  unit: string;
  coverage: string;
  totalRows: number;
  missingFields: number;
  missingMetricValues: number;
  zeroMetricValues: number;
  duplicateRows: number;
  missingDetails: string[];
  status: string;
  error?: string;
}

export interface ProvenanceRecord {
  module: string;
  indicator: string;
  datasetKeys: string[];
  unit: string;
  cutoff: string;
  category: BadgeCategory;
}

export interface FullHealthData {
  metadata: {
    appName: string;
    generatedAt: string;
    version: string;
    dataGovernance: {
      sourceOrg: string;
      portal: string;
      license: string;
      coverage: string;
      strictRule: string;
    };
  };
  auditReport: {
    executedAt: string;
    datasetsChecked: number;
    datasetsValid: number;
    totalRecordsProcessed: number;
    discardedRecords: number;
    missingValuesCount: number;
    zeroValuesCount: number;
    duplicateRecordsCount: number;
    details: Record<string, AuditDatasetDetail>;
    provenanceRegistry: ProvenanceRecord[];
    structuralAudit?: {
      verifiedAt: string;
      hospitalsTotal: number;
      hospitalsFullyVerified: number;
      hospitalsPartialVerified: number;
      partialNote: string;
      sources: { name: string; url: string; cutoff: string }[];
    };
  };
  hospitals: Record<string, HospitalMetadata>;
  regional: {
    quirurgica: {
      series: RegionalMetricEntry[];
      metrics2024: RegionalMetricEntry;
      metrics2025: RegionalMetricEntry;
    };
    consultas: {
      series: RegionalMetricEntry[];
      metrics2024: RegionalMetricEntry;
    };
    pruebas: {
      series: RegionalMetricEntry[];
      metrics2024: RegionalMetricEntry;
    };
  };
  specialties: SpecialtyEntry[];
  diagnosticActivity: DiagnosticActivityEntry[];
  frecuentacion: FrecuentacionEntry[];
  radarAlerts: RadarAlert[];
  forecasting: Record<string, ForecastModelData>;
}
