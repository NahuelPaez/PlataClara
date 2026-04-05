/**
 * Formatea un número como pesos argentinos.
 * formatARS(1234567.89) → "$1.234.567,89"
 */
export function formatARS(n, decimals = 2) {
  if (n === null || n === undefined || isNaN(n)) return '—'
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n)
}

/**
 * Formatea un número como dólares.
 * formatUSD(1234.5) → "U$S 1.234,50"
 */
export function formatUSD(n, decimals = 2) {
  if (n === null || n === undefined || isNaN(n)) return '—'
  return 'U$S ' + new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n)
}

/**
 * Formatea un número como porcentaje.
 * formatPct(67.5) → "67,5%"
 */
export function formatPct(n, decimals = 1) {
  if (n === null || n === undefined || isNaN(n)) return '—'
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n) + '%'
}

/**
 * Formatea un número entero con separadores de miles.
 * formatNum(1234567) → "1.234.567"
 */
export function formatNum(n, decimals = 0) {
  if (n === null || n === undefined || isNaN(n)) return '—'
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n)
}

/**
 * Calcula la TEA a partir de la TNA y cantidad de períodos de capitalización por año.
 * calcularTEA(40, 365) → 49.15  (capitalización diaria)
 * calcularTEA(40, 12) → 46.93   (capitalización mensual)
 */
export function calcularTEA(tna, periodos = 365) {
  if (!tna || isNaN(tna)) return null
  return (Math.pow(1 + tna / 100 / periodos, periodos) - 1) * 100
}

/**
 * Calcula el interés ganado en un plazo fijo simple (sin reinversión).
 * @param {number} monto - Capital inicial en pesos
 * @param {number} tna - Tasa nominal anual en %
 * @param {number} dias - Días del plazo
 * @returns {{ interes: number, total: number }}
 */
export function calcularPlazoFijo(monto, tna, dias) {
  const interes = monto * (tna / 100 / 365) * dias
  return {
    interes: interes,
    total: monto + interes,
  }
}

/**
 * Calcula el rendimiento de una cuenta remunerada con capitalización diaria.
 * @param {number} monto
 * @param {number} tna - TNA en %
 * @param {number} dias
 * @returns {{ interes: number, total: number, serie: Array<{dia, saldo}> }}
 */
export function calcularCuentaRemunerada(monto, tna, dias) {
  const tasaDiaria = tna / 100 / 365
  const serie = []
  let saldo = monto
  for (let d = 0; d <= dias; d++) {
    serie.push({ dia: d, saldo: Math.round(saldo) })
    saldo *= (1 + tasaDiaria)
  }
  const total = monto * Math.pow(1 + tasaDiaria, dias)
  return {
    interes: total - monto,
    total,
    serie,
  }
}

/**
 * Calcula evolución de un FCI con capitalización mensual.
 * @param {number} monto
 * @param {number} tna - TNA en %
 * @param {number} meses
 * @returns {{ interes: number, total: number, serie: Array<{mes, saldo}> }}
 */
export function calcularFCI(monto, tna, meses) {
  const tasaMensual = tna / 100 / 12
  const serie = []
  let saldo = monto
  for (let m = 0; m <= meses; m++) {
    serie.push({ mes: m, saldo: Math.round(saldo) })
    if (m < meses) saldo *= (1 + tasaMensual)
  }
  return {
    interes: saldo - monto,
    total: saldo,
    serie,
  }
}

/**
 * Calcula interés compuesto con aportes mensuales.
 * @param {number} pv - Capital inicial
 * @param {number} pmt - Aporte mensual
 * @param {number} tna - TNA en %
 * @param {number} anios - Años de inversión
 * @returns {{ totalAportado: number, totalIntereses: number, total: number, serie: Array }}
 */
export function calcularInteresCompuesto(pv, pmt, tna, anios) {
  const r = tna / 100 / 12
  const serie = []
  let saldo = pv
  let totalAportado = pv

  for (let y = 0; y <= anios; y++) {
    serie.push({
      anio: y,
      aportado: Math.round(totalAportado),
      intereses: Math.round(saldo - totalAportado),
      total: Math.round(saldo),
    })
    if (y < anios) {
      for (let m = 0; m < 12; m++) {
        saldo = saldo * (1 + r) + pmt
        totalAportado += pmt
      }
    }
  }

  return {
    totalAportado,
    totalIntereses: saldo - totalAportado,
    total: saldo,
    serie,
  }
}

/**
 * Calcula la tasa real usando la ecuación de Fisher.
 * @param {number} tna - TNA nominal en %
 * @param {number} inflacionMensual - Inflación mensual esperada en %
 * @returns {{ tasaRealMensual: number, tasaRealAnual: number, ganaPerdePoder: boolean }}
 */
export function calcularTasaReal(tna, inflacionMensual) {
  const tasaNominalMensual = tna / 100 / 12
  const inflMensual = inflacionMensual / 100
  const tasaRealMensual = (1 + tasaNominalMensual) / (1 + inflMensual) - 1
  const tasaRealAnual = (Math.pow(1 + tasaRealMensual, 12) - 1) * 100
  return {
    tasaRealMensual: tasaRealMensual * 100,
    tasaRealAnual,
    ganaPoder: tasaRealMensual > 0,
  }
}

/**
 * Parsea un número de un input string (acepta coma o punto como decimal).
 */
export function parseInput(str) {
  if (!str && str !== 0) return 0
  return parseFloat(String(str).replace(/\./g, '').replace(',', '.')) || 0
}
