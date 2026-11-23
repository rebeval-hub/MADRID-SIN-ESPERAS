export function exactMedian(values: number[]): number | null {
  if (!values || values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function exactMean(values: number[]): number | null {
  if (!values || values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function sampleStdDev(values: number[], avg?: number | null): number | null {
  if (!values || values.length < 2) return null;
  const m = avg ?? exactMean(values);
  if (m === null) return null;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - m, 2), 0) / (values.length - 1);
  return Math.sqrt(variance);
}

export interface DispersionSummary {
  n: number;
  mean: number | null;
  median: number | null;
  weightedMean: number | null;
  totalPatients: number;
  sd: number | null;
  cv: number | null;
  min: number | null;
  max: number | null;
  range: number | null;
  ratio: number | null;
  ratioCalculable: boolean;
  usedPositiveMinFallback: boolean;
  effectiveMin: number | null;
  minHospitalNames: string[];
  effectiveMinHospitalNames: string[];
  zeroHospitalNames: string[];
  maxHospitalNames: string[];
}

export function computeHospitalDispersion(
  items: { name: string; delay: number; patients: number }[]
): DispersionSummary {
  const valid = items.filter(i => i.delay !== null && i.delay !== undefined && !isNaN(i.delay));
  const n = valid.length;
  if (n === 0) {
    return {
      n: 0,
      mean: null,
      median: null,
      weightedMean: null,
      totalPatients: 0,
      sd: null,
      cv: null,
      min: null,
      max: null,
      range: null,
      ratio: null,
      ratioCalculable: false,
      usedPositiveMinFallback: false,
      effectiveMin: null,
      minHospitalNames: [],
      effectiveMinHospitalNames: [],
      zeroHospitalNames: [],
      maxHospitalNames: []
    };
  }

  const delays = valid.map(v => v.delay);
  const m = exactMean(delays)!;
  const med = exactMedian(delays)!;
  const sd = sampleStdDev(delays, m);
  const cv = sd !== null && m > 0 ? (sd / m) * 100 : null;

  const totalPatients = valid.reduce((acc, v) => acc + (v.patients || 0), 0);
  const weightedSum = valid.reduce((acc, v) => acc + v.delay * (v.patients || 0), 0);
  const weightedMean = totalPatients > 0 ? weightedSum / totalPatients : null;

  const minVal = Math.min(...delays);
  const maxVal = Math.max(...delays);
  const range = n >= 2 ? maxVal - minVal : 0;

  const minHospitalNames = valid.filter(v => v.delay === minVal).map(v => v.name);
  const maxHospitalNames = valid.filter(v => v.delay === maxVal).map(v => v.name);
  const zeroHospitalNames = valid.filter(v => v.delay === 0).map(v => v.name);

  let ratioCalculable = false;
  let ratio: number | null = null;
  let usedPositiveMinFallback = false;
  let effectiveMin: number | null = null;
  let effectiveMinHospitalNames: string[] = [];

  if (n >= 2 && minVal > 0) {
    ratioCalculable = true;
    effectiveMin = minVal;
    effectiveMinHospitalNames = minHospitalNames;
    ratio = maxVal / minVal;
  } else if (n >= 2 && minVal === 0 && maxVal > 0) {
    const positiveItems = valid.filter(v => v.delay > 0);
    if (positiveItems.length > 0) {
      const minPositive = Math.min(...positiveItems.map(v => v.delay));
      ratioCalculable = true;
      usedPositiveMinFallback = true;
      effectiveMin = minPositive;
      effectiveMinHospitalNames = positiveItems.filter(v => v.delay === minPositive).map(v => v.name);
      ratio = maxVal / minPositive;
    }
  }

  return {
    n,
    mean: m,
    median: med,
    weightedMean,
    totalPatients,
    sd,
    cv,
    min: minVal,
    max: maxVal,
    range,
    ratio,
    ratioCalculable,
    usedPositiveMinFallback,
    effectiveMin,
    minHospitalNames,
    effectiveMinHospitalNames,
    zeroHospitalNames,
    maxHospitalNames
  };
}

export interface KruskalWallisResult {
  hStatistic: number;
  df: number;
  pValue: number;
  asymptoticPValue: number;
  permutations: number;
  method: 'exact' | 'monte-carlo';
  significant05: boolean;
  groupsEvaluated: number;
  totalN: number;
}

// Lanczos approximation for log-gamma & upper regularized gamma for asymptotic Chi-square reference
function logGamma(z: number): number {
  const g = 7;
  const p = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7
  ];
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
  z -= 1;
  let x = p[0];
  for (let i = 1; i < g + 2; i++) x += p[i] / (z + i);
  const t = z + g + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

function upperIncompleteGammaP(a: number, x: number): number {
  if (x <= 0) return 1;
  if (x < a + 1) {
    let ap = a;
    let sum = 1 / a;
    let del = sum;
    for (let n = 1; n <= 120; n++) {
      ap += 1;
      del *= x / ap;
      sum += del;
      if (Math.abs(del) < Math.abs(sum) * 1e-10) break;
    }
    const lower = sum * Math.exp(-x + a * Math.log(x) - logGamma(a));
    return Math.max(0, Math.min(1, 1 - lower));
  }
  let b = x + 1 - a;
  let c = 1 / 1e-30;
  let d = 1 / b;
  let h = d;
  for (let i = 1; i <= 120; i++) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = b + an / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < 1e-10) break;
  }
  return Math.max(0, Math.min(1, Math.exp(-x + a * Math.log(x) - logGamma(a)) * h));
}

function createMulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function countMultinomialCapped(groupSizes: number[], cap: number): number {
  let total = 1;
  let runningN = 0;
  for (let g = 0; g < groupSizes.length; g++) {
    const k = groupSizes[g];
    runningN += k;
    const r = Math.min(k, runningN - k);
    let binom = 1;
    for (let i = 1; i <= r; i++) {
      binom = (binom * (runningN - r + i)) / i;
      if (total * binom > cap) return cap + 1;
    }
    total *= Math.round(binom);
    if (total > cap) return cap + 1;
  }
  return total;
}

const KW_EXACT_THRESHOLD = 10000;
const KW_MONTE_CARLO_PERMUTATIONS = 10000;
const KW_EPS = 1e-11;

export function kruskalWallisTest(
  groups: number[][],
  numPermutations: number = KW_MONTE_CARLO_PERMUTATIONS
): KruskalWallisResult | null {
  const validGroups = groups
    .map(g => g.filter(val => val !== null && val !== undefined && !isNaN(val)))
    .filter(g => g.length > 0);
  if (validGroups.length < 2) return null;

  const tagged: { value: number; groupIdx: number }[] = [];
  validGroups.forEach((grp, idx) => {
    grp.forEach(val => {
      tagged.push({ value: val, groupIdx: idx });
    });
  });

  const N = tagged.length;
  if (N < 4) return null;

  tagged.sort((a, b) => a.value - b.value);

  const k = validGroups.length;
  const ranks = new Float64Array(N);
  const rankSumByGroup = new Array<number>(k).fill(0);
  const countByGroup = new Array<number>(k).fill(0);
  let tieCorrectionSum = 0;

  let i = 0;
  while (i < N) {
    let j = i;
    while (j + 1 < N && tagged[j + 1].value === tagged[i].value) {
      j++;
    }
    const avgRank = (i + 1 + j + 1) / 2;
    const tieCount = j - i + 1;
    if (tieCount > 1) {
      tieCorrectionSum += Math.pow(tieCount, 3) - tieCount;
    }
    for (let idx = i; idx <= j; idx++) {
      ranks[idx] = avgRank;
      rankSumByGroup[tagged[idx].groupIdx] += avgRank;
      countByGroup[tagged[idx].groupIdx]++;
    }
    i = j + 1;
  }

  let obsSumTerm = 0;
  for (let g = 0; g < k; g++) {
    if (countByGroup[g] > 0) {
      obsSumTerm += (rankSumByGroup[g] * rankSumByGroup[g]) / countByGroup[g];
    }
  }

  const H_raw = (12 / (N * (N + 1))) * obsSumTerm - 3 * (N + 1);
  const tieDenom = 1 - tieCorrectionSum / (Math.pow(N, 3) - N);
  const H = tieDenom > 0 ? Math.max(0, H_raw / tieDenom) : 0;
  const df = k - 1;
  const asymptoticPValue = upperIncompleteGammaP(df / 2, H / 2);

  // Degenerate case: all observations are tied
  if (tieDenom <= 0 || H <= KW_EPS) {
    return {
      hStatistic: 0,
      df,
      pValue: 1,
      asymptoticPValue: 1,
      permutations: 1,
      method: 'exact',
      significant05: false,
      groupsEvaluated: k,
      totalN: N
    };
  }

  // Since N, group sizes, and tie correction are invariant under label permutations,
  // H(pi) >= H_obs is algebraically equivalent to sum(R_g(pi)^2 / n_g) >= obsSumTerm.
  const totalPartitions = countMultinomialCapped(countByGroup, KW_EXACT_THRESHOLD);
  let pValue: number;
  let permutationsEvaluated: number;
  let method: 'exact' | 'monte-carlo';

  if (totalPartitions <= KW_EXACT_THRESHOLD) {
    method = 'exact';
    permutationsEvaluated = totalPartitions;
    const totalRankSum = (N * (N + 1)) / 2;
    const used = new Uint8Array(N);
    let exceedances = 0;

    const chooseForGroup = (
      groupIdx: number,
      need: number,
      startIdx: number,
      groupSum: number,
      accSumTerm: number,
      remRankSum: number
    ) => {
      if (need === 0) {
        const nextAcc = accSumTerm + (groupSum * groupSum) / countByGroup[groupIdx];
        const nextRem = remRankSum - groupSum;
        if (groupIdx + 1 === k - 1) {
          const finalSumTerm = nextAcc + (nextRem * nextRem) / countByGroup[k - 1];
          if (finalSumTerm >= obsSumTerm - KW_EPS) {
            exceedances++;
          }
          return;
        }
        chooseForGroup(groupIdx + 1, countByGroup[groupIdx + 1], 0, 0, nextAcc, nextRem);
        return;
      }

      const maxIdx = N - need;
      for (let idx = startIdx; idx <= maxIdx; idx++) {
        if (!used[idx]) {
          used[idx] = 1;
          chooseForGroup(groupIdx, need - 1, idx + 1, groupSum + ranks[idx], accSumTerm, remRankSum);
          used[idx] = 0;
        }
      }
    };

    chooseForGroup(0, countByGroup[0], 0, 0, 0, totalRankSum);
    pValue = exceedances / totalPartitions;
  } else {
    method = 'monte-carlo';
    permutationsEvaluated = numPermutations;
    // Deterministic permutation-invariant seed derived solely from pooled ranks and group sizes
    let seed = 0x811c9dc5;
    for (let idx = 0; idx < N; idx++) {
      seed = Math.imul(seed ^ Math.round(ranks[idx] * 2), 0x01000193);
    }
    for (let g = 0; g < k; g++) {
      seed = Math.imul(seed ^ countByGroup[g], 0x01000193);
    }
    const rng = createMulberry32(seed);
    const permRanks = Float64Array.from(ranks);
    let exceedances = 0;

    for (let b = 0; b < numPermutations; b++) {
      for (let idx = N - 1; idx > 0; idx--) {
        const swapIdx = Math.floor(rng() * (idx + 1));
        const tmp = permRanks[idx];
        permRanks[idx] = permRanks[swapIdx];
        permRanks[swapIdx] = tmp;
      }

      let offset = 0;
      let permSumTerm = 0;
      for (let g = 0; g < k; g++) {
        const ng = countByGroup[g];
        let rSum = 0;
        for (let j = 0; j < ng; j++) {
          rSum += permRanks[offset + j];
        }
        offset += ng;
        permSumTerm += (rSum * rSum) / ng;
      }

      if (permSumTerm >= obsSumTerm - KW_EPS) {
        exceedances++;
      }
    }

    // Phipson & Smyth (2010) permutation p-value ensuring exact type-I error control
    pValue = (exceedances + 1) / (numPermutations + 1);
  }

  return {
    hStatistic: H,
    df,
    pValue,
    asymptoticPValue,
    permutations: permutationsEvaluated,
    method,
    significant05: pValue < 0.05,
    groupsEvaluated: k,
    totalN: N
  };
}
