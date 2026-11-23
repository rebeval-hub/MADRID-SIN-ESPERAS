import { FullHealthData } from '../types';

export type ForecastModelId =
  | 'naive'
  | 'drift'
  | 'holt'
  | 'damped_holt'
  | 'arima'
  | 'theta';

export type ForecastIndicatorKey =
  | 'quirurgica_pacientes'
  | 'quirurgica_demora'
  | 'consultas_demora'
  | 'pruebas_demora';

export interface SeriesPoint {
  year: string;
  value: number;
}

export interface ForecastPoint {
  year: string;
  horizon: number;
  point: number;
  lower80: number;
  upper80: number;
  lower95: number;
  upper95: number;
}

export interface FoldErrorDetail {
  year: string;
  actual: number;
  predicted: number;
  error: number;
  absError: number;
  naiveAbsError: number;
  beatsNaive: boolean;
}

export interface ModelEvaluationResult {
  modelId: ForecastModelId;
  modelName: string;
  shortName: string;
  family: string;
  cvMae: number;
  cvRmse: number;
  cvMase: number;
  improvementVsNaiveMaePct: number;
  improvementVsNaiveRmsePct: number;
  foldMaeSd: number;
  foldsBeatingNaive: number;
  foldsTotal: number;
  holdout2Mae: number;
  holdout2Rmse: number;
  holdout2ImprovementPct: number;
  foldErrors: FoldErrorDetail[];
  fittedDescription: string;
  intervalFormula: string;
  residualSigma: number;
  projections: ForecastPoint[];
  rank: number;
}

export interface IndicatorForecastAudit {
  key: ForecastIndicatorKey;
  label: string;
  unit: string;
  sourceDataset: string;
  cutoffNote: string;
  historical: SeriesPoint[];
  seriesAudit: {
    n: number;
    startYear: string;
    endYear: string;
    periodicity: string;
    missingGaps: number;
    hasArtificialPoints: boolean;
    naiveInSampleMae: number;
  };
  minTrainWindow: number;
  cvYearsRange: string;
  holdoutYearsRange: string;
  models: ModelEvaluationResult[];
  winner: ModelEvaluationResult;
  beatsNaiveAny: boolean;
}

const Z_80 = 1.2815515655446004;
const Z_95 = 1.959963984540054;

interface FitOutput {
  modelId: ForecastModelId;
  modelName: string;
  shortName: string;
  family: string;
  fittedDescription: string;
  intervalFormula: string;
  residualSigma: number;
  predictStep: (h: number) => number;
  seStep: (h: number) => number;
}

function sampleSd(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const v = values.reduce((s, x) => s + Math.pow(x - mean, 2), 0) / (values.length - 1);
  return Math.sqrt(v);
}

// 1. Naive Random Walk
function fitNaive(y: number[]): FitOutput {
  const T = y.length;
  const diffs: number[] = [];
  for (let t = 1; t < T; t++) {
    diffs.push(y[t] - y[t - 1]);
  }
  const sse = diffs.reduce((s, e) => s + e * e, 0);
  const sigma = Math.sqrt(sse / Math.max(1, diffs.length));
  const last = y[T - 1];
  return {
    modelId: 'naive',
    modelName: 'Naive (Último valor observado)',
    shortName: 'Naive',
    family: 'Benchmark',
    fittedDescription: `ŷ_{T+h} = y_T = ${last.toFixed(2)}`,
    intervalFormula: 'IC(h) = ŷ ± z · σ · √h',
    residualSigma: sigma,
    predictStep: () => last,
    seStep: h => sigma * Math.sqrt(h)
  };
}

// 2. Naive with Drift
function fitDrift(y: number[]): FitOutput {
  const T = y.length;
  const last = y[T - 1];
  const drift = T > 1 ? (y[T - 1] - y[0]) / (T - 1) : 0;
  const errs: number[] = [];
  for (let t = 1; t < T; t++) {
    errs.push(y[t] - (y[t - 1] + drift));
  }
  const sse = errs.reduce((s, e) => s + e * e, 0);
  const sigma = Math.sqrt(sse / Math.max(1, errs.length - 1));
  return {
    modelId: 'drift',
    modelName: 'Naive con Deriva (Drift lineal)',
    shortName: 'Drift',
    family: 'Benchmark lineal',
    fittedDescription: `deriva d = ${drift.toFixed(2)} / año`,
    intervalFormula: 'IC(h) = ŷ ± z · σ · √(h · (1 + h / (T − 1)))',
    residualSigma: sigma,
    predictStep: h => last + h * drift,
    seStep: h => sigma * Math.sqrt(h * (1 + h / Math.max(1, T - 1)))
  };
}

// 3. Holt Additive ETS(A,A,N)
function fitHolt(y: number[]): FitOutput {
  const T = y.length;
  const alphas = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
  const betas = [0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8];

  let bestAlpha = 0.5;
  let bestBeta = 0.2;
  let bestSse = Infinity;
  let bestL = y[T - 1];
  let bestB = 0;

  for (const alpha of alphas) {
    for (const beta of betas) {
      let l = y[0];
      let b = T > 1 ? y[1] - y[0] : 0;
      let sse = 0;
      for (let t = 1; t < T; t++) {
        const pred = l + b;
        const err = y[t] - pred;
        sse += err * err;
        const nextL = alpha * y[t] + (1 - alpha) * (l + b);
        const nextB = beta * (nextL - l) + (1 - beta) * b;
        l = nextL;
        b = nextB;
      }
      if (sse < bestSse) {
        bestSse = sse;
        bestAlpha = alpha;
        bestBeta = beta;
        bestL = l;
        bestB = b;
      }
    }
  }

  const sigma = Math.sqrt(bestSse / Math.max(1, T - 2));
  return {
    modelId: 'holt',
    modelName: 'Suavizado de Holt ETS(A,A,N)',
    shortName: 'Holt',
    family: 'Suavizado exponencial',
    fittedDescription: `α = ${bestAlpha.toFixed(2)}, β = ${bestBeta.toFixed(2)}`,
    intervalFormula: 'IC(h) = ŷ ± z · σ · √(1 + Σ_{j=1}^{h-1} (α + j·α·β)²)',
    residualSigma: sigma,
    predictStep: h => bestL + h * bestB,
    seStep: h => {
      let acc = 1;
      for (let j = 1; j < h; j++) {
        const c = bestAlpha + j * bestAlpha * bestBeta;
        acc += c * c;
      }
      return sigma * Math.sqrt(acc);
    }
  };
}

// 4. Damped Holt ETS(A,Ad,N)
function fitDampedHolt(y: number[]): FitOutput {
  const T = y.length;
  const alphas = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
  const betas = [0.05, 0.1, 0.2, 0.3, 0.4, 0.6];
  const phis = [0.8, 0.85, 0.9, 0.95, 0.98];

  let bestAlpha = 0.5;
  let bestBeta = 0.1;
  let bestPhi = 0.9;
  let bestSse = Infinity;
  let bestL = y[T - 1];
  let bestB = 0;

  for (const alpha of alphas) {
    for (const beta of betas) {
      for (const phi of phis) {
        let l = y[0];
        let b = T > 1 ? y[1] - y[0] : 0;
        let sse = 0;
        for (let t = 1; t < T; t++) {
          const pred = l + phi * b;
          const err = y[t] - pred;
          sse += err * err;
          l = pred + alpha * err;
          b = phi * b + alpha * beta * err;
        }
        if (sse < bestSse) {
          bestSse = sse;
          bestAlpha = alpha;
          bestBeta = beta;
          bestPhi = phi;
          bestL = l;
          bestB = b;
        }
      }
    }
  }

  const sigma = Math.sqrt(bestSse / Math.max(1, T - 3));
  return {
    modelId: 'damped_holt',
    modelName: 'Holt Amortiguado ETS(A,Ad,N)',
    shortName: 'Holt Amort.',
    family: 'Suavizado exponencial',
    fittedDescription: `α = ${bestAlpha.toFixed(2)}, β = ${bestBeta.toFixed(2)}, φ = ${bestPhi.toFixed(2)}`,
    intervalFormula: 'IC(h) = ŷ ± z · σ · √(1 + Σ_{j=1}^{h-1} (α + α·β·Σ_{k=1}^j φ^k)²)',
    residualSigma: sigma,
    predictStep: h => {
      let phiSum = 0;
      for (let k = 1; k <= h; k++) phiSum += Math.pow(bestPhi, k);
      return bestL + bestB * phiSum;
    },
    seStep: h => {
      let acc = 1;
      for (let j = 1; j < h; j++) {
        let phiSum = 0;
        for (let k = 1; k <= j; k++) phiSum += Math.pow(bestPhi, k);
        const c = bestAlpha + bestAlpha * bestBeta * phiSum;
        acc += c * c;
      }
      return sigma * Math.sqrt(acc);
    }
  };
}

// 5. Parsimonious ARIMA selected purely in-sample by AICc:
// Candidates: ARIMA(1,1,0) no-drift, ARIMA(1,1,0)+drift, ARIMA(0,1,1) no-drift
function computeAicc(sse: number, m: number, kParams: number): number {
  const p = kParams + 1; // +1 for residual variance
  const sigma2 = Math.max(1e-12, sse / Math.max(1, m));
  const penalty = 2 * p + (2 * p * (p + 1)) / Math.max(1, m - p - 1);
  return m * Math.log(sigma2) + penalty;
}

function fitArima(y: number[]): FitOutput {
  const T = y.length;
  const dy: number[] = [];
  for (let t = 1; t < T; t++) dy.push(y[t] - y[t - 1]);
  const nD = dy.length;

  // Fallback for very small nD < 3
  if (nD < 3) {
    const nFit = fitNaive(y);
    return {
      ...nFit,
      modelId: 'arima',
      modelName: 'ARIMA parsimonioso (fallback orden (0,1,0))',
      shortName: 'ARIMA',
      family: 'Box-Jenkins'
    };
  }

  // Common evaluation window t = 1 .. nD-1 on dy (m = nD - 1 observations)
  const m = nD - 1;

  // Candidate A: ARIMA(1,1,0) without drift: dy[t] = phi1 * dy[t-1]
  let numA = 0;
  let denA = 0;
  for (let t = 1; t < nD; t++) {
    numA += dy[t] * dy[t - 1];
    denA += dy[t - 1] * dy[t - 1];
  }
  const phiA = denA > 0 ? Math.max(-0.92, Math.min(0.92, numA / denA)) : 0;
  let sseA = 0;
  for (let t = 1; t < nD; t++) {
    const e = dy[t] - phiA * dy[t - 1];
    sseA += e * e;
  }
  const aiccA = computeAicc(sseA, m, 1);

  // Candidate B: ARIMA(1,1,0) with drift: dy[t] = c + phi1 * dy[t-1]
  let meanX = 0;
  let meanY = 0;
  for (let t = 1; t < nD; t++) {
    meanX += dy[t - 1];
    meanY += dy[t];
  }
  meanX /= m;
  meanY /= m;
  let covXY = 0;
  let varX = 0;
  for (let t = 1; t < nD; t++) {
    covXY += (dy[t - 1] - meanX) * (dy[t] - meanY);
    varX += (dy[t - 1] - meanX) * (dy[t - 1] - meanX);
  }
  const phiB = varX > 0 ? Math.max(-0.92, Math.min(0.92, covXY / varX)) : 0;
  const cB = meanY - phiB * meanX;
  let sseB = 0;
  for (let t = 1; t < nD; t++) {
    const e = dy[t] - (cB + phiB * dy[t - 1]);
    sseB += e * e;
  }
  const aiccB = m > 4 ? computeAicc(sseB, m, 2) : Infinity;

  // Candidate C: ARIMA(0,1,1) without drift: dy[t] = e[t] + theta1 * e[t-1]
  let bestTheta = 0;
  let bestSseC = Infinity;
  let bestLastErrC = 0;
  for (let th = -0.9; th <= 0.9001; th += 0.05) {
    let ePrev = 0;
    let sse = 0;
    for (let t = 0; t < nD; t++) {
      const e = dy[t] - th * ePrev;
      if (t >= 1) sse += e * e; // common window t>=1 for apples-to-apples AICc
      ePrev = e;
    }
    if (sse < bestSseC) {
      bestSseC = sse;
      bestTheta = Number(th.toFixed(2));
      bestLastErrC = ePrev;
    }
  }
  const aiccC = computeAicc(bestSseC, m, 1);

  const lastY = y[T - 1];
  const lastDy = dy[nD - 1];

  if (aiccC <= aiccA && aiccC <= aiccB) {
    const sigma = Math.sqrt(bestSseC / Math.max(1, m - 1));
    return {
      modelId: 'arima',
      modelName: 'ARIMA(0,1,1) parsimonioso',
      shortName: 'ARIMA',
      family: 'Box-Jenkins (AICc)',
      fittedDescription: `ARIMA(0,1,1): θ₁ = ${bestTheta.toFixed(2)}`,
      intervalFormula: 'IC(h) = ŷ ± z · σ · √(1 + (h − 1)·(1 + θ₁)²)',
      residualSigma: sigma,
      predictStep: h => lastY + bestTheta * bestLastErrC + (h - 1) * 0, // E[dy_{T+1}] = theta*e_T, E[dy_{T+k>1}] = 0
      seStep: h => {
        const w = 1 + bestTheta;
        return sigma * Math.sqrt(1 + (h - 1) * w * w);
      }
    };
  }

  const useDrift = aiccB < aiccA;
  const phi = useDrift ? phiB : phiA;
  const c = useDrift ? cB : 0;
  const sse = useDrift ? sseB : sseA;
  const dfLoss = useDrift ? 2 : 1;
  const sigma = Math.sqrt(sse / Math.max(1, m - dfLoss));

  return {
    modelId: 'arima',
    modelName: useDrift ? 'ARIMA(1,1,0) con deriva' : 'ARIMA(1,1,0) parsimonioso',
    shortName: 'ARIMA',
    family: 'Box-Jenkins (AICc)',
    fittedDescription: useDrift
      ? `ARIMA(1,1,0)+c: φ₁ = ${phi.toFixed(2)}, c = ${c.toFixed(2)}`
      : `ARIMA(1,1,0): φ₁ = ${phi.toFixed(2)}`,
    intervalFormula: 'IC(h) = ŷ ± z · σ · √(Σ_{j=0}^{h-1} ψ_j²), ψ_j = Σ_{k=0}^j φ₁^k',
    residualSigma: sigma,
    predictStep: h => {
      let yCur = lastY;
      let dCur = lastDy;
      for (let s = 1; s <= h; s++) {
        dCur = c + phi * dCur;
        yCur += dCur;
      }
      return yCur;
    },
    seStep: h => {
      let acc = 0;
      let psi = 0;
      for (let j = 0; j < h; j++) {
        psi += Math.pow(phi, j);
        acc += psi * psi;
      }
      return sigma * Math.sqrt(acc);
    }
  };
}

// 6. Standard Theta Method (Assimakopoulos & Nikolopoulos 2000; Hyndman & Billah 2003 SES with drift)
function fitTheta(y: number[]): FitOutput {
  const T = y.length;
  // OLS linear trend on y[0..T-1]
  const tMean = (T - 1) / 2;
  const yMean = y.reduce((a, b) => a + b, 0) / T;
  let num = 0;
  let den = 0;
  for (let t = 0; t < T; t++) {
    num += (t - tMean) * (y[t] - yMean);
    den += (t - tMean) * (t - tMean);
  }
  const bOls = den > 0 ? num / den : 0;
  const aOls = yMean - bOls * tMean;

  // Theta-2 line: Z_t(2) = 2 * y_t - (aOls + bOls * t)
  const z2 = y.map((val, t) => 2 * val - (aOls + bOls * t));

  // Fit SES(alpha) on Z_t(2) minimizing in-sample SSE of Z_t(2)
  const alphas = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
  let bestAlpha = 0.5;
  let bestSseCombined = Infinity;
  let bestLevel = y[T - 1];

  for (const alpha of alphas) {
    let levelZ2 = z2[0];
    let sseY = 0;
    for (let t = 1; t < T; t++) {
      // 1-step ahead Theta prediction at time t: 0.5 * (Z_t(0) + levelZ2_{t-1})
      const z0t = aOls + bOls * t;
      const predY = 0.5 * (z0t + levelZ2);
      const errY = y[t] - predY;
      sseY += errY * errY;
      levelZ2 = alpha * z2[t] + (1 - alpha) * levelZ2;
    }
    if (sseY < bestSseCombined) {
      bestSseCombined = sseY;
      bestAlpha = alpha;
      bestLevel = levelZ2;
    }
  }

  const sigma = Math.sqrt(bestSseCombined / Math.max(1, T - 2));
  return {
    modelId: 'theta',
    modelName: 'Método Theta (θ = 0 y θ = 2)',
    shortName: 'Theta',
    family: 'Descomposición Theta',
    fittedDescription: `α = ${bestAlpha.toFixed(2)}, pendiente b_OLS = ${bOls.toFixed(2)}`,
    intervalFormula: 'IC(h) = ŷ ± z · σ · √(1 + (h − 1)·α²) (forma SES con deriva)',
    residualSigma: sigma,
    predictStep: h => {
      const z0h = aOls + bOls * (T - 1 + h);
      return 0.5 * (z0h + bestLevel);
    },
    seStep: h => sigma * Math.sqrt(1 + (h - 1) * bestAlpha * bestAlpha)
  };
}

type FitterFn = (y: number[]) => FitOutput;

const MODEL_FITTERS: FitterFn[] = [
  fitNaive,
  fitDrift,
  fitHolt,
  fitDampedHolt,
  fitArima,
  fitTheta
];

function evaluateSeriesModels(
  series: SeriesPoint[],
  minTrainWindow: number,
  horizon = 3
): {
  models: ModelEvaluationResult[];
  winner: ModelEvaluationResult;
  beatsNaiveAny: boolean;
  naiveInSampleMae: number;
  cvYearsRange: string;
  holdoutYearsRange: string;
} {
  const N = series.length;
  const values = series.map(p => p.value);
  const years = series.map(p => p.year);

  // In-sample Naive 1-step MAE for MASE denominator (Hyndman & Koehler 2006)
  let inSampleDiffSum = 0;
  for (let i = 1; i < N; i++) {
    inSampleDiffSum += Math.abs(values[i] - values[i - 1]);
  }
  const naiveInSampleMae = N > 1 ? inSampleDiffSum / (N - 1) : 1;

  // Expanding Rolling-Origin CV (identical evaluation windows t = minTrainWindow .. N-1)
  const foldYears = years.slice(minTrainWindow);
  const cvYearsRange =
    foldYears.length > 0 ? `${foldYears[0]}–${foldYears[foldYears.length - 1]}` : 'N/D';

  // Naive fold absolute errors as exact reference
  const naiveFoldErrors: FoldErrorDetail[] = [];
  for (let t = minTrainWindow; t < N; t++) {
    const trainY = values.slice(0, t);
    const actual = values[t];
    const pred = fitNaive(trainY).predictStep(1);
    const err = actual - pred;
    naiveFoldErrors.push({
      year: years[t],
      actual,
      predicted: pred,
      error: err,
      absError: Math.abs(err),
      naiveAbsError: Math.abs(err),
      beatsNaive: false
    });
  }
  const naiveCvMae =
    naiveFoldErrors.reduce((s, f) => s + f.absError, 0) / Math.max(1, naiveFoldErrors.length);
  const naiveCvRmse = Math.sqrt(
    naiveFoldErrors.reduce((s, f) => s + f.error * f.error, 0) / Math.max(1, naiveFoldErrors.length)
  );

  // Static 2-year holdout (train [0..N-3], forecast h=1,2 on [N-2, N-1])
  const holdoutTrainY = values.slice(0, Math.max(4, N - 2));
  const holdoutTestY = values.slice(holdoutTrainY.length);
  const holdoutYearsRange =
    holdoutTestY.length > 0
      ? `${years[holdoutTrainY.length]}–${years[N - 1]}`
      : 'N/D';
  const naiveHoldoutFit = fitNaive(holdoutTrainY);
  const naiveHoldoutErrs = holdoutTestY.map((yVal, idx) => yVal - naiveHoldoutFit.predictStep(idx + 1));
  const naiveHoldoutMae =
    naiveHoldoutErrs.reduce((s, e) => s + Math.abs(e), 0) / Math.max(1, naiveHoldoutErrs.length);

  const lastYearNum = parseInt(years[N - 1], 10);

  const results: ModelEvaluationResult[] = MODEL_FITTERS.map((fitter, mIdx) => {
    const foldErrors: FoldErrorDetail[] = [];

    for (let t = minTrainWindow; t < N; t++) {
      const trainY = values.slice(0, t);
      const actual = values[t];
      const fit = fitter(trainY);
      const pred = fit.predictStep(1);
      const err = actual - pred;
      const absErr = Math.abs(err);
      const naiveAbs = naiveFoldErrors[t - minTrainWindow].absError;

      foldErrors.push({
        year: years[t],
        actual,
        predicted: pred,
        error: err,
        absError: absErr,
        naiveAbsError: naiveAbs,
        beatsNaive: absErr < naiveAbs
      });
    }

    const cvMae = foldErrors.reduce((s, f) => s + f.absError, 0) / Math.max(1, foldErrors.length);
    const cvRmse = Math.sqrt(
      foldErrors.reduce((s, f) => s + f.error * f.error, 0) / Math.max(1, foldErrors.length)
    );
    const cvMase = naiveInSampleMae > 0 ? cvMae / naiveInSampleMae : 0;

    const improvementVsNaiveMaePct =
      naiveCvMae > 0 ? ((naiveCvMae - cvMae) / naiveCvMae) * 100 : 0;
    const improvementVsNaiveRmsePct =
      naiveCvRmse > 0 ? ((naiveCvRmse - cvRmse) / naiveCvRmse) * 100 : 0;

    const foldMaeSd = sampleSd(foldErrors.map(f => f.absError));
    const foldsBeatingNaive = foldErrors.filter(f => f.beatsNaive).length;

    // Static 2-year holdout
    const holdoutFit = fitter(holdoutTrainY);
    const hErrs = holdoutTestY.map((yVal, idx) => yVal - holdoutFit.predictStep(idx + 1));
    const holdout2Mae = hErrs.reduce((s, e) => s + Math.abs(e), 0) / Math.max(1, hErrs.length);
    const holdout2Rmse = Math.sqrt(
      hErrs.reduce((s, e) => s + e * e, 0) / Math.max(1, hErrs.length)
    );
    const holdout2ImprovementPct =
      naiveHoldoutMae > 0 ? ((naiveHoldoutMae - holdout2Mae) / naiveHoldoutMae) * 100 : 0;

    // Full-series fit for h = 1..horizon projections
    const fullFit = fitter(values);
    const projections: ForecastPoint[] = [];
    for (let h = 1; h <= horizon; h++) {
      const point = fullFit.predictStep(h);
      const se = fullFit.seStep(h);
      projections.push({
        year: String(lastYearNum + h),
        horizon: h,
        point,
        lower80: Math.max(0, point - Z_80 * se),
        upper80: point + Z_80 * se,
        lower95: Math.max(0, point - Z_95 * se),
        upper95: point + Z_95 * se
      });
    }

    return {
      modelId: fullFit.modelId,
      modelName: fullFit.modelName,
      shortName: fullFit.shortName,
      family: fullFit.family,
      cvMae: mIdx === 0 ? naiveCvMae : cvMae,
      cvRmse: mIdx === 0 ? naiveCvRmse : cvRmse,
      cvMase,
      improvementVsNaiveMaePct: mIdx === 0 ? 0 : improvementVsNaiveMaePct,
      improvementVsNaiveRmsePct: mIdx === 0 ? 0 : improvementVsNaiveRmsePct,
      foldMaeSd,
      foldsBeatingNaive,
      foldsTotal: foldErrors.length,
      holdout2Mae,
      holdout2Rmse,
      holdout2ImprovementPct: mIdx === 0 ? 0 : holdout2ImprovementPct,
      foldErrors,
      fittedDescription: fullFit.fittedDescription,
      intervalFormula: fullFit.intervalFormula,
      residualSigma: fullFit.residualSigma,
      projections,
      rank: 0
    };
  });

  // Sort strictly by CV RMSE (primary out-of-sample criterion), tie-break by CV MAE, then Naive first on exact ties
  const ranked = [...results].sort((a, b) => {
    if (Math.abs(a.cvRmse - b.cvRmse) > 1e-9) return a.cvRmse - b.cvRmse;
    if (Math.abs(a.cvMae - b.cvMae) > 1e-9) return a.cvMae - b.cvMae;
    if (a.modelId === 'naive') return -1;
    if (b.modelId === 'naive') return 1;
    return 0;
  });
  ranked.forEach((m, idx) => {
    m.rank = idx + 1;
  });

  const winner = ranked[0];
  const beatsNaiveAny = ranked.some(
    m => m.modelId !== 'naive' && (m.cvRmse < naiveCvRmse - 1e-9 || m.cvMae < naiveCvMae - 1e-9)
  );

  return {
    models: ranked,
    winner,
    beatsNaiveAny,
    naiveInSampleMae,
    cvYearsRange,
    holdoutYearsRange
  };
}

export function buildAllForecastAudits(data: FullHealthData): Record<ForecastIndicatorKey, IndicatorForecastAudit> {
  const qSeries = data.regional.quirurgica.series;
  const cSeries = data.regional.consultas.series;
  const pSeries = data.regional.pruebas.series;

  const specs: {
    key: ForecastIndicatorKey;
    label: string;
    unit: string;
    sourceDataset: string;
    cutoffNote: string;
    series: SeriesPoint[];
  }[] = [
    {
      key: 'quirurgica_pacientes',
      label: 'Total Pacientes en Lista Quirúrgica (LEQ_Global)',
      unit: 'pacientes',
      sourceDataset: 'LEQ_Global (datos.comunidad.madrid)',
      cutoffNote: 'Corte anual oficial a 31 de diciembre (2015–2025)',
      series: qSeries
        .filter(e => e.totalPacientes !== undefined && e.totalPacientes !== null)
        .map(e => ({ year: e.year, value: e.totalPacientes as number }))
    },
    {
      key: 'quirurgica_demora',
      label: 'Demora Media Estructural Quirúrgica (LEQ_Global)',
      unit: 'días',
      sourceDataset: 'LEQ_Global (datos.comunidad.madrid)',
      cutoffNote: 'Corte anual oficial a 31 de diciembre (2015–2025)',
      series: qSeries
        .filter(e => e.demoraMedia !== undefined && e.demoraMedia !== null)
        .map(e => ({ year: e.year, value: e.demoraMedia as number }))
    },
    {
      key: 'consultas_demora',
      label: 'Demora Media Estructural Consultas Externas (LECE_Global)',
      unit: 'días',
      sourceDataset: 'LECE_Global (datos.comunidad.madrid)',
      cutoffNote: 'Corte anual oficial a 31 de diciembre (2015–2024)',
      series: cSeries
        .filter(e => e.demoraMedia !== undefined && e.demoraMedia !== null)
        .map(e => ({ year: e.year, value: e.demoraMedia as number }))
    },
    {
      key: 'pruebas_demora',
      label: 'Demora Media Estructural Pruebas Diagnósticas (LEPD_Global)',
      unit: 'días',
      sourceDataset: 'LEPD_Global (datos.comunidad.madrid)',
      cutoffNote: 'Corte anual oficial a 31 de diciembre (2015–2024)',
      series: pSeries
        .filter(e => e.demoraMedia !== undefined && e.demoraMedia !== null)
        .map(e => ({ year: e.year, value: e.demoraMedia as number }))
    }
  ];

  const output = {} as Record<ForecastIndicatorKey, IndicatorForecastAudit>;

  for (const spec of specs) {
    let missingGaps = 0;
    for (let i = 1; i < spec.series.length; i++) {
      const diff = parseInt(spec.series[i].year, 10) - parseInt(spec.series[i - 1].year, 10);
      if (diff !== 1) missingGaps += Math.max(0, diff - 1);
    }

    const minTrainWindow = 4;
    const evalOut = evaluateSeriesModels(spec.series, minTrainWindow, 3);

    output[spec.key] = {
      key: spec.key,
      label: spec.label,
      unit: spec.unit,
      sourceDataset: spec.sourceDataset,
      cutoffNote: spec.cutoffNote,
      historical: spec.series,
      seriesAudit: {
        n: spec.series.length,
        startYear: spec.series[0]?.year ?? '',
        endYear: spec.series[spec.series.length - 1]?.year ?? '',
        periodicity: 'Anual (corte único 31 de diciembre)',
        missingGaps,
        hasArtificialPoints: false,
        naiveInSampleMae: evalOut.naiveInSampleMae
      },
      minTrainWindow,
      cvYearsRange: evalOut.cvYearsRange,
      holdoutYearsRange: evalOut.holdoutYearsRange,
      models: evalOut.models,
      winner: evalOut.winner,
      beatsNaiveAny: evalOut.beatsNaiveAny
    };
  }

  return output;
}
