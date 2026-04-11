import ExcelJS from 'exceljs/dist/exceljs.bare.min.js'

// ─── helpers de estilo ────────────────────────────────────────────────────────
const NARANJA     = 'FFE8910A'
const NARANJA_HDR = 'FFBF6B00'
const BLANCO      = 'FFFFFFFF'
const GRIS_CLARO  = 'FFD9D9D9'
const VERDE_TC    = 'FFE2EFDA'
const VERDE_INPUT = 'FFE8F5E9'
const AMARILLO_R  = 'FFFFF2CC'

function fill(argb) { return { type:'pattern', pattern:'solid', fgColor:{ argb } } }
function border() {
  const s = { style:'thin', color:{ argb:'FFD9D9D9' } }
  return { top:s, left:s, bottom:s, right:s }
}

async function descargar(wb, fileName) {
  const buffer = await wb.xlsx.writeBuffer()
  const blob   = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url    = URL.createObjectURL(blob)
  const a      = document.createElement('a')
  a.href = url; a.download = `${fileName}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Hoja 1: Presupuesto Personal ────────────────────────────────────────────
function buildPresupuesto(wb) {
  const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  const COLS  = ['B','C','D','E','F','G','H','I','J','K','L','M']
  const PESO  = '"$" #,##0'
  const PCT   = '0%'

  const ws = wb.addWorksheet('Presupuesto Personal')
  ws.columns = [{ width: 36 }, ...Array(12).fill({ width: 10 }), { width: 14 }]

  function estiloDato(r, bg, bold, indent, editable = true) {
    r.eachCell({ includeEmpty: true }, (cell, col) => {
      cell.border = border()
      const isEditable = editable && col >= 2 && col <= 13
      const isTotal    = col === 14
      cell.fill = fill(isEditable ? VERDE_INPUT : isTotal ? GRIS_CLARO : bg)
      cell.font = { bold: isTotal || bold, size: 11, color: { argb: isEditable ? 'FF1B5E20' : 'FF000000' } }
      if (col > 1) { cell.numFmt = PESO; cell.alignment = { horizontal: 'right' } }
      else         { cell.alignment = { horizontal: 'left', indent: indent ? 1 : 0 } }
    })
  }

  function seccion(label) {
    const r = ws.addRow([label])
    const rn = r.number
    ws.mergeCells(`A${rn}:N${rn}`)
    r.getCell(1).fill      = fill(NARANJA)
    r.getCell(1).font      = { bold: true, color: { argb: BLANCO }, size: 11 }
    r.getCell(1).border    = border()
    r.getCell(1).alignment = { horizontal: 'left' }
    r.height = 18
    return rn
  }

  function dato(label, vals, opts = {}) {
    const r  = ws.addRow([label, ...vals, null])
    const rn = r.number
    r.getCell(14).value = { formula: `SUM(B${rn}:M${rn})` }
    estiloDato(r, opts.bg || BLANCO, false, true)
    return rn
  }

  function totalSeccion(label, desde, hasta) {
    const r  = ws.addRow([label, ...COLS.map(() => null), null])
    const rn = r.number
    COLS.forEach((c, i) => { r.getCell(i + 2).value = { formula: `SUM(${c}${desde}:${c}${hasta})` } })
    r.getCell(14).value = { formula: `SUM(N${desde}:N${hasta})` }
    estiloDato(r, GRIS_CLARO, true, false, false)
    r.height = 18
    return rn
  }

  // Título
  const tR = ws.addRow(['PlataClara — Presupuesto Personal'])
  ws.mergeCells(`A${tR.number}:N${tR.number}`)
  tR.getCell(1).font      = { bold: true, size: 14, color: { argb: BLANCO } }
  tR.getCell(1).fill      = fill(NARANJA)
  tR.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }
  tR.height = 24

  ws.addRow([])

  // Headers
  const hR = ws.addRow(['Categoría', ...MESES, 'TOTAL AÑO'])
  hR.eachCell(cell => {
    cell.fill      = fill(NARANJA_HDR)
    cell.font      = { bold: true, color: { argb: BLANCO }, size: 11 }
    cell.border    = border()
    cell.alignment = { horizontal: cell.col === 1 ? 'left' : 'center', vertical: 'middle' }
  })
  hR.height = 18

  // INGRESOS
  seccion('INGRESOS')
  const r_ing1 = dato('Sueldo neto (en mano)', Array(12).fill(0))
  const r_ing2 = dato('Otros ingresos',        Array(12).fill(0))
  const r_tot_ing = totalSeccion('TOTAL INGRESOS', r_ing1, r_ing2)
  ws.addRow([])

  // GASTOS FIJOS
  seccion('GASTOS FIJOS')
  const r_gf1 = dato('Alquiler / expensas',            Array(12).fill(0))
  const r_gf2 = dato('Servicios (luz, gas, internet)', Array(12).fill(0))
  const r_gf3 = dato('Seguro',                         Array(12).fill(0))
  const r_tc1 = dato('Tarjeta de Crédito (ítem 1)', Array(12).fill(50000), { bg: VERDE_TC })
  ws.getRow(r_tc1).getCell(1).note = {
    texts: [
      { font: { bold: true, size: 10 }, text: 'Tip cuotas:\n' },
      { font: { size: 10 }, text: 'Colocá la cuota mensual en cada mes para rastrear hasta cuándo pagás.\n\nEj: heladera $600.000 en 12 cuotas de $50.000 → ingresá $50.000 por mes durante 12 meses.' },
    ],
    anchor: {
      from: { col: 1, colOff: 228600, row: r_tc1 - 1, rowOff: 0 },
      to:   { col: 8, colOff: 0,      row: r_tc1 + 6, rowOff: 0 },
    },
  }
  const r_tc2 = dato('Tarjeta de Crédito (ítem 2)', Array(12).fill(0), { bg: VERDE_TC })
  const r_tc3 = dato('Tarjeta de Crédito (ítem 3)', Array(12).fill(0), { bg: VERDE_TC })
  const r_tc4 = dato('Tarjeta de Crédito (ítem 4)', Array(12).fill(0), { bg: VERDE_TC })
  const r_tc5 = dato('Tarjeta de Crédito (ítem 5)', Array(12).fill(0), { bg: VERDE_TC })
  const r_tot_gf = totalSeccion('TOTAL GASTOS FIJOS', r_gf1, r_tc5)
  ws.addRow([])

  // GASTOS VARIABLES
  seccion('GASTOS VARIABLES')
  const r_gv1 = dato('Supermercado / almacén',     Array(12).fill(0))
  const r_gv2 = dato('Transporte / nafta',         Array(12).fill(0))
  const r_gv3 = dato('Salud y farmacia',           Array(12).fill(0))
  const r_gv4 = dato('Entretenimiento',            Array(12).fill(0))
  const r_gv5 = dato('Ropa / calzado',             Array(12).fill(0))
  const r_gv6 = dato('Suscripciones / tecnología', Array(12).fill(0))
  const r_gv7 = dato('Otros',                      Array(12).fill(0))
  const r_tot_gv = totalSeccion('TOTAL GASTOS VARIABLES', r_gv1, r_gv7)
  ws.addRow([])

  // RESUMEN
  const resumen = [
    { label: 'Total ingresos' },
    { label: 'Total gastos'   },
    { label: 'AHORRO DEL MES', bold: true },
    { label: '% Ahorro',       pct: true  },
  ]
  const resumenRowNums = []
  resumen.forEach(({ label, bold }, idx) => {
    const r  = ws.addRow([label, ...Array(12).fill(null), null])
    const rn = r.number
    resumenRowNums.push(rn)
    if (idx === 0) COLS.forEach((c, i) => { r.getCell(i + 2).value = { formula: `${c}${r_tot_ing}` };                                                                   r.getCell(14).value = { formula: `N${r_tot_ing}` } })
    if (idx === 1) COLS.forEach((c, i) => { r.getCell(i + 2).value = { formula: `${c}${r_tot_gf}+${c}${r_tot_gv}` };                                                    r.getCell(14).value = { formula: `N${r_tot_gf}+N${r_tot_gv}` } })
    if (idx === 2) COLS.forEach((c, i) => { r.getCell(i + 2).value = { formula: `${c}${resumenRowNums[0]}-${c}${resumenRowNums[1]}` };                                   r.getCell(14).value = { formula: `N${resumenRowNums[0]}-N${resumenRowNums[1]}` } })
    if (idx === 3) COLS.forEach((c, i) => { r.getCell(i + 2).value = { formula: `IF(${c}${resumenRowNums[0]}=0,0,${c}${resumenRowNums[2]}/${c}${resumenRowNums[0]})` } })
    r.eachCell({ includeEmpty: true }, (cell, col) => {
      cell.border = border()
      cell.fill   = fill(AMARILLO_R)
      cell.font   = { bold: !!bold, size: 11 }
      if (col > 1) { cell.numFmt = idx === 3 ? PCT : PESO; cell.alignment = { horizontal: 'right' } }
    })
  })
}

// ─── Hoja 2: Control de Gastos ────────────────────────────────────────────────
function buildControlGastos(wb) {
  const PESO = '"$" #,##0'
  const PCT  = '0%'
  const CATS = [
    'Vivienda (alquiler, expensas)',
    'Alimentación',
    'Transporte',
    'Salud y farmacia',
    'Educación',
    'Entretenimiento',
    'Ropa y calzado',
    'Tecnología / suscripciones',
    'Deudas / cuotas',
    'Ahorro e inversión',
    'Otros',
  ]

  const ws = wb.addWorksheet('Control de Gastos')
  ws.columns = [{ width: 34 }, { width: 18 }, { width: 16 }, { width: 18 }]

  function celda(r, col, value, opts = {}) {
    const c = r.getCell(col)
    c.value  = value
    c.border = border()
    c.fill   = fill(opts.bg || BLANCO)
    c.font   = { bold: !!opts.bold, size: 11, color: { argb: opts.color || 'FF000000' } }
    c.alignment = { horizontal: opts.align || 'left' }
    if (opts.fmt) c.numFmt = opts.fmt
    return c
  }

  // Título
  const tR = ws.addRow(['PlataClara — Control de Gastos Mensual'])
  tR.height = 24
  ws.mergeCells(`A${tR.number}:D${tR.number}`)
  tR.getCell(1).fill      = fill(NARANJA)
  tR.getCell(1).font      = { bold: true, size: 14, color: { argb: BLANCO } }
  tR.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }

  ws.addRow([])

  // Mes
  const mR = ws.addRow(['Mes / Año:', ''])
  celda(mR, 1, 'Mes / Año:',  { bold: true })
  celda(mR, 2, '',             { bg: VERDE_INPUT })

  ws.addRow([])

  // Headers
  const hR = ws.addRow(['Categoría', 'Presupuestado ($)', 'Gastado ($)', 'Diferencia ($)'])
  hR.height = 18
  ;[1,2,3,4].forEach(col => {
    hR.getCell(col).fill      = fill(NARANJA_HDR)
    hR.getCell(col).font      = { bold: true, color: { argb: BLANCO }, size: 11 }
    hR.getCell(col).border    = border()
    hR.getCell(col).alignment = { horizontal: col === 1 ? 'left' : 'center' }
  })

  // Datos
  const dataStart = ws.rowCount + 1
  CATS.forEach(cat => {
    const r  = ws.addRow([cat, 0, 0, null])
    const rn = r.number
    r.getCell(4).value = { formula: `B${rn}-C${rn}` }
    celda(r, 1, cat, { bg: BLANCO })
    celda(r, 2, 0,   { bg: VERDE_INPUT, fmt: PESO, align: 'right', color: 'FF1B5E20' })
    celda(r, 3, 0,   { bg: VERDE_INPUT, fmt: PESO, align: 'right', color: 'FF1B5E20' })
    r.getCell(4).border    = border()
    r.getCell(4).fill      = fill(GRIS_CLARO)
    r.getCell(4).numFmt    = PESO
    r.getCell(4).alignment = { horizontal: 'right' }
  })
  const dataEnd = ws.rowCount

  // TOTAL
  const totR = ws.addRow(['TOTAL', null, null, null])
  totR.height = 18
  ;[1,2,3,4].forEach(col => {
    const keys = ['B','C','D']
    totR.getCell(col).value  = col === 1 ? 'TOTAL' : { formula: `SUM(${keys[col-2]}${dataStart}:${keys[col-2]}${dataEnd})` }
    totR.getCell(col).border = border()
    totR.getCell(col).fill   = fill(GRIS_CLARO)
    totR.getCell(col).font   = { bold: true, size: 11 }
    totR.getCell(col).numFmt = col > 1 ? PESO : ''
    totR.getCell(col).alignment = { horizontal: col === 1 ? 'left' : 'right' }
  })

  ws.addRow([])

  // Resumen
  const totRow = totR.number
  const resumen = [
    { label: 'Ingreso del mes:',        val: 0,    editable: true  },
    { label: 'Total gastado:',          fml: `C${totRow}`, editable: false },
    { label: 'Diferencia (ahorro):',    fml: null, editable: false },
    { label: '% del ingreso ahorrado:', fml: null, editable: false, pct: true },
  ]
  const resNums = []
  resumen.forEach(({ label, val, fml, editable, pct }, i) => {
    const r  = ws.addRow([label, null])
    const rn = r.number
    resNums.push(rn)
    const c2 = r.getCell(2)
    if (i === 0) c2.value = 0
    if (i === 1) c2.value = { formula: `C${totRow}` }
    if (i === 2) c2.value = { formula: `B${resNums[0]}-B${resNums[1]}` }
    if (i === 3) c2.value = { formula: `IF(B${resNums[0]}=0,0,B${resNums[2]}/B${resNums[0]})` }
    r.getCell(1).border    = border()
    r.getCell(1).fill      = fill(AMARILLO_R)
    r.getCell(1).font      = { bold: true, size: 11 }
    c2.border    = border()
    c2.fill      = fill(editable ? VERDE_INPUT : AMARILLO_R)
    c2.font      = { size: 11, color: { argb: editable ? 'FF1B5E20' : 'FF000000' } }
    c2.numFmt    = pct ? PCT : PESO
    c2.alignment = { horizontal: 'right' }
  })
}

// ─── Hoja 3: Tracker de Inversiones ──────────────────────────────────────────
function buildTrackerInversiones(wb) {
  const PESO = '"$" #,##0'
  const PCT  = '0.0%'

  const ws = wb.addWorksheet('Tracker de Inversiones')
  const headers = [
    'Fecha entrada', 'Instrumento', 'Entidad / Broker',
    'Monto invertido ($)', 'Moneda', 'TNA / Rend. (%)', 'Fecha vencimiento',
    'Monto al vencimiento ($)', 'Ganancia estimada ($)', 'Estado', 'Notas',
  ]
  ws.columns = [
    { width: 14 }, { width: 22 }, { width: 18 }, { width: 20 },
    { width: 9 },  { width: 14 }, { width: 16 }, { width: 22 },
    { width: 20 }, { width: 12 }, { width: 22 },
  ]

  // Título
  const tR = ws.addRow(['PlataClara — Tracker de Inversiones'])
  tR.height = 24
  ws.mergeCells(`A${tR.number}:K${tR.number}`)
  tR.getCell(1).fill      = fill(NARANJA)
  tR.getCell(1).font      = { bold: true, size: 14, color: { argb: BLANCO } }
  tR.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }

  ws.addRow([])

  // Headers
  const hR = ws.addRow(headers)
  hR.height = 18
  headers.forEach((_, i) => {
    const c = hR.getCell(i + 1)
    c.fill      = fill(NARANJA_HDR)
    c.font      = { bold: true, color: { argb: BLANCO }, size: 11 }
    c.border    = border()
    c.alignment = { horizontal: i === 0 || i === 1 || i === 2 ? 'left' : 'center', wrapText: true }
  })

  // Filas de ejemplo
  const ejemplos = [
    ['01/04/2026', 'Plazo Fijo 30d',   'Galicia',      100000, 'ARS', 0.34, '01/05/2026', 102795, 2795,  'Activo', ''],
    ['01/04/2026', 'Cta. Remunerada',  'Mercado Pago',  50000, 'ARS', 0.29, '-',          '',     '',    'Activo', 'Renueva auto'],
  ]
  ejemplos.forEach(row => {
    const r = ws.addRow(row)
    r.eachCell({ includeEmpty: true }, (cell, col) => {
      cell.border = border()
      cell.fill   = fill(GRIS_CLARO)
      cell.font   = { size: 11, italic: true, color: { argb: 'FF666666' } }
      if (col === 4 || col === 8 || col === 9) { cell.numFmt = PESO; cell.alignment = { horizontal: 'right' } }
      if (col === 6) { cell.numFmt = PCT; cell.alignment = { horizontal: 'right' } }
    })
  })

  // Filas vacías para completar
  for (let i = 0; i < 20; i++) {
    const r = ws.addRow(Array(11).fill(''))
    r.eachCell({ includeEmpty: true }, (cell, col) => {
      cell.border = border()
      cell.fill   = fill(VERDE_INPUT)
      cell.font   = { size: 11, color: { argb: 'FF1B5E20' } }
      if (col === 4 || col === 8 || col === 9) { cell.numFmt = PESO; cell.alignment = { horizontal: 'right' } }
      if (col === 6) { cell.numFmt = PCT; cell.alignment = { horizontal: 'right' } }
    })
  }
}

// ─── Export único: las 3 hojas en un solo archivo ────────────────────────────
export async function descargarPlanillaCompleta() {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'PlataClara'
  buildPresupuesto(wb)
  buildControlGastos(wb)
  buildTrackerInversiones(wb)
  await descargar(wb, 'PlataClara_Herramientas')
}
