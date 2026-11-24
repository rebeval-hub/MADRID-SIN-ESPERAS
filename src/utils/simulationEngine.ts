import { FullHealthData, HospitalMetadata } from '../types';

// ============================================================================
// SIMULADOR 1: CAPACIDAD QUIRÚRGICA Y QUIRÓFANOS (BALANCE DE FLUJOS / LITTLE)
// ============================================================================

export interface CapacitySimInput {
  extraOperatingRooms: number; // 0 .. 40
  afternoonShiftBoostPct: number; // 0 .. 35 (%)
  horizonMonths: number; // 6, 12, 18, 24
}

export interface CapacitySimResult {
  totalBaseOR: number;
  effectiveOR: number;
  baseQueue: number;
  baseWaitDays: number;
  baseMonthlyExits: number;
  inertialQueue: number;
  inertialWaitDays: number;
  simulatedQueue: number;
  simulatedWaitDays: number;
  simulatedMonthlyExits: number;
  daysSavedVsInertial: number;
  daysSavedVsBase: number;
  patientsReducedVsInertial: number;
  monthlyNetBalance: number; // < 0 means queue is shrinking
}

export function runCapacitySimulation(
  data: FullHealthData,
  input: CapacitySimInput
): CapacitySimResult {
  const hospitals = Object.values(data.hospitals);
  const totalBaseOR = hospitals.reduce((acc, h) => acc + (h.quirofanos ?? 0), 0) || 400;

  const m2025 = data.regional.quirurgica.metrics2025;
  const m2024 = data.regional.quirurgica.metrics2024;

  const baseQueue = m2025.estructuralPacientes ?? 80883;
  const prevQueue = m2024.estructuralPacientes ?? 73870;
  const baseWaitDays = m2025.demoraMedia ?? 49.83;
  const baseMonthlyExits = m2025.salidasEstructural ?? 30448;

  // Tasa mensual de crecimiento inercial observada entre dic-2024 y dic-2025
  const observedMonthlyDrift = (baseQueue - prevQueue) / 12; // ~+584 pac/mes
  const estimatedMonthlyInflows = baseMonthlyExits + observedMonthlyDrift;

  // Multiplicador de capacidad con factor de aprovechamiento operativo (0.85)
  const orMultiplier = 1 + (input.extraOperatingRooms / totalBaseOR) * 0.85;
  const shiftMultiplier = 1 + (input.afternoonShiftBoostPct / 100) * 0.85;
  const totalMultiplier = orMultiplier * shiftMultiplier;

  const simulatedMonthlyExits = Math.round(baseMonthlyExits * totalMultiplier);
  const monthlyNetBalance = estimatedMonthlyInflows - simulatedMonthlyExits;

  // Escenario inercial (sin cambios, T meses)
  const inertialQueue = Math.max(
    15000,
    Math.round(baseQueue + observedMonthlyDrift * input.horizonMonths)
  );
  const inertialWaitDays = Number(
    (baseWaitDays * (inertialQueue / baseQueue)).toFixed(1)
  );

  // Escenario simulado tras T meses (suelo estructural mínimo de 20.000 pac. por preoperatorios)
  const rawSimQueue = baseQueue + monthlyNetBalance * input.horizonMonths;
  const simulatedQueue = Math.max(20000, Math.round(rawSimQueue));

  // Demora estimada por proporcionalidad de Ley de Little (W ~ L / S), suelo mínimo 15 días
  const rawSimWait = baseWaitDays * (simulatedQueue / baseQueue) * (baseMonthlyExits / simulatedMonthlyExits);
  const simulatedWaitDays = Number(Math.max(15, rawSimWait).toFixed(1));

  return {
    totalBaseOR,
    effectiveOR: totalBaseOR + input.extraOperatingRooms,
    baseQueue,
    baseWaitDays: Number(baseWaitDays.toFixed(1)),
    baseMonthlyExits,
    inertialQueue,
    inertialWaitDays,
    simulatedQueue,
    simulatedWaitDays,
    simulatedMonthlyExits,
    daysSavedVsInertial: Number((inertialWaitDays - simulatedWaitDays).toFixed(1)),
    daysSavedVsBase: Number((baseWaitDays - simulatedWaitDays).toFixed(1)),
    patientsReducedVsInertial: inertialQueue - simulatedQueue,
    monthlyNetBalance: Math.round(monthlyNetBalance)
  };
}

// ============================================================================
// SIMULADOR 2: REDISTRIBUCIÓN TERRITORIAL (LIBRE ELECCIÓN EN RED)
// ============================================================================

export type AreaScope = 'Todas' | 'Centro' | 'Norte' | 'Sur' | 'Este' | 'Oeste';

export interface RedistributionSimInput {
  redistributionPct: number; // 0 .. 40 (%)
  areaScope: AreaScope;
}

export interface HospitalRedistributionRow {
  hospital: HospitalMetadata;
  baseWait: number;
  simWait: number;
  deltaDays: number;
  basePatients: number;
  simPatients: number;
  role: 'aliviado' | 'receptor' | 'neutro';
}

export interface RedistributionSimResult {
  scopeLabel: string;
  baseWeightedWait: number;
  simWeightedWait: number;
  daysSavedWeighted: number;
  baseGapDays: number;
  simGapDays: number;
  patientsMoved: number;
  topRelieved: HospitalRedistributionRow[];
  topReceivers: HospitalRedistributionRow[];
}

export function runRedistributionSimulation(
  data: FullHealthData,
  input: RedistributionSimInput
): RedistributionSimResult {
  const allHospitals = Object.values(data.hospitals).filter(h => {
    const w = h.series.quirurgica.demora['2025'];
    const p = h.series.quirurgica.pacientes['2025'];
    return w !== null && w !== undefined && w > 0 && p !== null && p !== undefined && p > 0;
  });

  const scopedHospitals =
    input.areaScope === 'Todas'
      ? allHospitals
      : allHospitals.filter(h => h.area === input.areaScope);

  // Mediana regional como umbral de saturación
  const sortedWaits = [...allHospitals]
    .map(h => h.series.quirurgica.demora['2025'] as number)
    .sort((a, b) => a - b);
  const medianWait = sortedWaits[Math.floor(sortedWaits.length / 2)] || 53;

  const saturated = scopedHospitals.filter(
    h => (h.series.quirurgica.demora['2025'] as number) > medianWait
  );
  // Receptores: centros por debajo de la mediana en toda la red (Libre Elección CAM)
  const receivers = allHospitals
    .filter(h => (h.series.quirurgica.demora['2025'] as number) < medianWait)
    .sort((a, b) => (a.series.quirurgica.demora['2025'] as number) - (b.series.quirurgica.demora['2025'] as number))
    .slice(0, 8);

  const receiverTotalCapacity =
    receivers.reduce((sum, h) => sum + Math.max(h.quirofanos ?? 6, 4), 0) || 1;

  const movedFromMap: Record<string, number> = {};
  let totalMoved = 0;

  saturated.forEach(h => {
    const pac = h.series.quirurgica.pacientes['2025'] as number;
    const moved = Math.round(pac * (input.redistributionPct / 100));
    movedFromMap[h.id] = moved;
    totalMoved += moved;
  });

  const receivedByMap: Record<string, number> = {};
  receivers.forEach(h => {
    const weight = Math.max(h.quirofanos ?? 6, 4) / receiverTotalCapacity;
    receivedByMap[h.id] = Math.round(totalMoved * weight);
  });

  // Calcular nueva espera estimada por hospital
  const rows: HospitalRedistributionRow[] = allHospitals.map(h => {
    const baseWait = h.series.quirurgica.demora['2025'] as number;
    const basePatients = h.series.quirurgica.pacientes['2025'] as number;
    const outPac = movedFromMap[h.id] || 0;
    const inPac = receivedByMap[h.id] || 0;
    const simPatients = Math.max(10, basePatients - outPac + inPac);

    // Elasticidad de demora respecto al cambio de cola (0.78 para reflejar rigidez estructural)
    const ratio = simPatients / basePatients;
    const adjustedFactor = 1 + (ratio - 1) * 0.78;
    const simWait = Number(Math.max(15, baseWait * adjustedFactor).toFixed(1));
    const deltaDays = Number((simWait - baseWait).toFixed(1));

    const role: HospitalRedistributionRow['role'] =
      outPac > 0 ? 'aliviado' : inPac > 0 ? 'receptor' : 'neutro';

    return {
      hospital: h,
      baseWait: Number(baseWait.toFixed(1)),
      simWait,
      deltaDays,
      basePatients,
      simPatients,
      role
    };
  });

  const scopedIds = new Set(scopedHospitals.map(h => h.id));
  const scopedRows = rows.filter(r => scopedIds.has(r.hospital.id));

  const calcWeighted = (list: HospitalRedistributionRow[], useSim: boolean) => {
    const totPac = list.reduce((s, r) => s + (useSim ? r.simPatients : r.basePatients), 0) || 1;
    const weightedSum = list.reduce(
      (s, r) => s + (useSim ? r.simWait * r.simPatients : r.baseWait * r.basePatients),
      0
    );
    return Number((weightedSum / totPac).toFixed(1));
  };

  const baseWeightedWait = calcWeighted(scopedRows, false);
  const simWeightedWait = calcWeighted(scopedRows, true);

  const baseWaits = scopedRows.map(r => r.baseWait);
  const simWaits = scopedRows.map(r => r.simWait);
  const baseGapDays = Number((Math.max(...baseWaits) - Math.min(...baseWaits)).toFixed(1));
  const simGapDays = Number((Math.max(...simWaits) - Math.min(...simWaits)).toFixed(1));

  const topRelieved = [...scopedRows]
    .filter(r => r.role === 'aliviado')
    .sort((a, b) => a.deltaDays - b.deltaDays)
    .slice(0, 4);

  const topReceivers = [...rows]
    .filter(r => r.role === 'receptor')
    .sort((a, b) => b.deltaDays - a.deltaDays)
    .slice(0, 4);

  return {
    scopeLabel: input.areaScope === 'Todas' ? 'Toda la Comunidad de Madrid' : `Área Sanitaria ${input.areaScope}`,
    baseWeightedWait,
    simWeightedWait,
    daysSavedWeighted: Number((baseWeightedWait - simWeightedWait).toFixed(1)),
    baseGapDays,
    simGapDays,
    patientsMoved: totalMoved,
    topRelieved,
    topReceivers
  };
}

// ============================================================================
// SIMULADOR 3: IMPACTO DEL RECHAZO A DERIVACIÓN (rechazoPacientes)
// ============================================================================

export interface RejectionSimInput {
  rejectionReductionPct: number; // 0 .. 70 (%)
}

export interface RejectionSimResult {
  baseStructuralPatients: number;
  baseStructuralWait: number;
  baseRejectionPatients: number;
  baseRejectionWait: number;
  baseCombinedWait: number;
  patientsRecovered: number;
  simRejectionPatients: number;
  targetDerivationWait: number;
  simCombinedWait: number;
  combinedDaysSaved: number;
  totalPatientDaysSaved: number;
}

export function runRejectionSimulation(
  data: FullHealthData,
  input: RejectionSimInput
): RejectionSimResult {
  const m2025 = data.regional.quirurgica.metrics2025;
  const baseStructuralPatients = m2025.estructuralPacientes ?? 80883;
  const baseStructuralWait = m2025.demoraMedia ?? 49.83;
  const baseRejectionPatients = m2025.rechazoPacientes ?? 11584;
  const baseRejectionWait = m2025.rechazoDemora ?? 130.22;

  const totalActive = baseStructuralPatients + baseRejectionPatients;
  const baseCombinedWait = Number(
    (
      (baseStructuralPatients * baseStructuralWait + baseRejectionPatients * baseRejectionWait) /
      totalActive
    ).toFixed(1)
  );

  // Espera media en hospitales alternativos ágiles de la red (promedio top 5 menor espera)
  const fastWaits = Object.values(data.hospitals)
    .map(h => h.series.quirurgica.demora['2025'])
    .filter((w): w is number => w !== null && w !== undefined && w > 0)
    .sort((a, b) => a - b)
    .slice(0, 5);
  const targetDerivationWait = Number(
    (fastWaits.reduce((s, v) => s + v, 0) / (fastWaits.length || 1)).toFixed(1)
  );

  const patientsRecovered = Math.round(baseRejectionPatients * (input.rejectionReductionPct / 100));
  const simRejectionPatients = baseRejectionPatients - patientsRecovered;

  const simTotalWaitDays =
    baseStructuralPatients * baseStructuralWait +
    simRejectionPatients * baseRejectionWait +
    patientsRecovered * targetDerivationWait;

  const simCombinedWait = Number((simTotalWaitDays / totalActive).toFixed(1));
  const combinedDaysSaved = Number((baseCombinedWait - simCombinedWait).toFixed(1));
  const totalPatientDaysSaved = Math.round(
    patientsRecovered * (baseRejectionWait - targetDerivationWait)
  );

  return {
    baseStructuralPatients,
    baseStructuralWait: Number(baseStructuralWait.toFixed(1)),
    baseRejectionPatients,
    baseRejectionWait: Number(baseRejectionWait.toFixed(1)),
    baseCombinedWait,
    patientsRecovered,
    simRejectionPatients,
    targetDerivationWait,
    simCombinedWait,
    combinedDaysSaved,
    totalPatientDaysSaved
  };
}
