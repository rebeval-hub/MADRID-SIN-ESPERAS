/**
 * Unified Spanish numeric formatting across MADRID SIN ESPERAS:
 * - Dot ('.') as thousands separator (applied consistently to every 3 digits, including 4-digit numbers).
 * - Comma (',') as decimal separator.
 * - Preserves original underlying numeric values without rounding intermediate math.
 */

function addThousandsDots(intStr: string): string {
  return intStr.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function formatEsNumber(
  value: number | null | undefined,
  decimals?: number,
  options?: { signed?: boolean; fallback?: string }
): string {
  const fallback = options?.fallback ?? 'N/D';
  if (value === null || value === undefined || Number.isNaN(value) || !Number.isFinite(value)) {
    return fallback;
  }

  const isNeg = value < 0;
  const absVal = Math.abs(value);

  let fixedStr: string;
  if (decimals !== undefined) {
    fixedStr = absVal.toFixed(decimals);
  } else {
    // Preserve natural decimal precision (up to 4 decimals, trimming trailing zeros)
    fixedStr = Number(absVal.toFixed(4)).toString();
  }

  const [intPart, decPart] = fixedStr.split('.');
  const formattedInt = addThousandsDots(intPart);
  const signPrefix = isNeg ? '-' : options?.signed ? '+' : '';

  if (decPart !== undefined && decPart.length > 0) {
    return `${signPrefix}${formattedInt},${decPart}`;
  }
  return `${signPrefix}${formattedInt}`;
}

export function formatEsInt(
  value: number | null | undefined,
  options?: { signed?: boolean; fallback?: string }
): string {
  if (value === null || value === undefined || Number.isNaN(value) || !Number.isFinite(value)) {
    return options?.fallback ?? 'N/D';
  }
  return formatEsNumber(Math.round(value), 0, options);
}

export function formatEsDec(
  value: number | null | undefined,
  decimals = 1,
  options?: { signed?: boolean; fallback?: string }
): string {
  return formatEsNumber(value, decimals, options);
}

export function formatEsAuto(
  value: number | null | undefined,
  maxDecimals = 2,
  options?: { signed?: boolean; fallback?: string }
): string {
  if (value === null || value === undefined || Number.isNaN(value) || !Number.isFinite(value)) {
    return options?.fallback ?? 'N/D';
  }
  const isNeg = value < 0;
  const absVal = Math.abs(value);
  const rounded = Number(absVal.toFixed(maxDecimals));
  const [intPart, decPart] = rounded.toString().split('.');
  const formattedInt = addThousandsDots(intPart);
  const signPrefix = isNeg ? '-' : options?.signed ? '+' : '';
  return decPart ? `${signPrefix}${formattedInt},${decPart}` : `${signPrefix}${formattedInt}`;
}
