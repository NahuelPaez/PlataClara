/**
 * scrape-tasas.js
 * Actualiza tasas de plazo fijo bancarias desde api.argentinadatos.com
 * y scrapea billeteras desde comparatasas.ar
 * Uso: node scripts/scrape-tasas.js
 */

import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { chromium } from 'playwright'

const __dirname = dirname(fileURLToPath(import.meta.url))
const TASAS_PATH = join(__dirname, '../src/data/tasas.json')

// Mapeo entidad BCRA → id en tasas.json
const BANCO_MAP = [
  { patron: 'nacion argentina', id: 'nacion' },
  { patron: 'santander', id: 'santander' },
  { patron: 'galicia', id: 'galicia' },
  { patron: 'bbva', id: 'bbva' },
  { patron: 'icbc', id: 'icbc' },
  { patron: 'supervielle', id: 'supervielle' },
  { patron: 'brubank', id: 'brubank' },
]

// Mapeo billeteras en comparatasas → id en tasas.json
const BILLETERA_MAP = [
  { patron: 'mercado pago', id: 'mercadopago', producto: 'cuenta_remunerada' },
  { patron: 'uala', id: 'uala', producto: 'cuenta_remunerada' },
  { patron: 'naranja', id: 'naranjax', producto: 'cuenta_remunerada' },
  { patron: 'lemon', id: 'lemon', producto: 'cuenta_remunerada' },
  { patron: 'carrefour', id: 'carrefour', producto: 'cuenta_remunerada' },
  { patron: 'fiwind', id: 'fiwind', producto: 'cuenta_remunerada' },
]

function normalizar(s) {
  return String(s).toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function encontrarBanco(entidad) {
  const norm = normalizar(entidad)
  return BANCO_MAP.find(b => norm.includes(b.patron))
}

// ─── Fuente 1: argentinadatos.com → tasas de plazo fijo bancarias ─────────────
async function fetchTasasPlazofijo() {
  console.log('📥 Fetching tasas plazo fijo desde argentinadatos.com...')
  const res = await fetch('https://api.argentinadatos.com/v1/finanzas/tasas/plazoFijo')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()

  const resultado = {} // { [id]: tna }

  for (const item of data) {
    const match = encontrarBanco(item.entidad)
    if (!match) continue
    const tna = item.tnaClientes ?? item.tnaNoClientes
    if (tna == null) continue
    // La API devuelve decimales: 0.19 = 19%
    resultado[match.id] = Math.round(tna * 100 * 100) / 100
  }

  console.log(`   ✅ ${Object.keys(resultado).length} bancos encontrados`)
  return resultado
}

// ─── Fuente 2: comparatasas.ar → tasas de billeteras ─────────────────────────
async function fetchTasasBilleteras() {
  console.log('📥 Scrapeando billeteras desde comparatasas.ar...')
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  })

  let payload = null
  context.on('response', async (response) => {
    if (response.url().includes('_payload.json') && response.url().includes('plazos-fijos') && !response.url().includes('uva')) {
      try { payload = await response.json() } catch {}
    }
  })

  const page = await context.newPage()
  try {
    await page.goto('https://comparatasas.ar/plazos-fijos', { waitUntil: 'networkidle', timeout: 30000 })
  } catch { /* timeout ok, igual capturamos el payload */ }
  await browser.close()

  if (!payload) {
    console.log('   ⚠️  No se pudo obtener payload de billeteras — se mantienen valores actuales')
    return {}
  }

  const resultado = {}
  // El payload de Nuxt viene en data.data o similar — intentamos extraer arrays con tasas
  const candidatos = extraerArrays(payload)

  for (const item of candidatos) {
    const nombre = item.entidad || item.nombre || item.name || item.banco || ''
    if (!nombre || typeof nombre !== 'string') continue
    const norm = normalizar(nombre)
    const match = BILLETERA_MAP.find(b => norm.includes(b.patron))
    if (!match) continue

    const tna = item.tna || item.tnaClientes || item.tasa || item.rate
    if (!tna) continue
    const tnaNum = parseFloat(String(tna).replace(',', '.'))
    if (isNaN(tnaNum) || tnaNum < 1 || tnaNum > 200) continue

    resultado[match.id] = { producto: match.producto, tna: tnaNum }
  }

  console.log(`   ✅ ${Object.keys(resultado).length} billeteras encontradas`)
  return resultado
}

function extraerArrays(obj, depth = 0) {
  if (depth > 6) return []
  if (Array.isArray(obj)) {
    if (obj.length > 0 && typeof obj[0] === 'object') return obj
    return []
  }
  if (obj && typeof obj === 'object') {
    for (const val of Object.values(obj)) {
      const found = extraerArrays(val, depth + 1)
      if (found.length > 0) return found
    }
  }
  return []
}

// ─── Fuente 3: Precios dólar oficial por banco (Playwright) ──────────────────
async function fetchDolarBancos() {
  console.log('📥 Scrapeando precios dólar oficial por banco...')
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  })

  const resultado = {} // { [id]: venta }

  // Parsea formato argentino: "1.080,50" → 1080.50
  function parseAR(s) {
    if (!s) return null
    const clean = String(s).replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '')
    const n = parseFloat(clean)
    return n > 100 && n < 100000 ? Math.round(n * 100) / 100 : null
  }

  // ── BNA ──
  try {
    const page = await context.newPage()
    await page.goto('https://www.bna.com.ar', { waitUntil: 'domcontentloaded', timeout: 25000 })
    const rawVenta = await page.evaluate(() => {
      // BNA tiene una tabla .cotizacion o similar con filas de monedas
      const tables = Array.from(document.querySelectorAll('table'))
      for (const table of tables) {
        const rows = Array.from(table.querySelectorAll('tr'))
        for (const row of rows) {
          const cells = Array.from(row.querySelectorAll('td'))
          if (cells.length < 2) continue
          const label = cells[0].textContent.trim().toLowerCase()
          if (label.includes('dólar') || label.includes('dolar') || label.includes('u.s.a')) {
            // Compra = cells[1], Venta = cells[2]
            return cells[2]?.textContent?.trim() ?? cells[1]?.textContent?.trim() ?? null
          }
        }
      }
      return null
    })
    const precio = parseAR(rawVenta)
    if (precio) {
      resultado['nacion'] = precio
      console.log(`   ✅ BNA dólar venta: $${precio}`)
    } else {
      console.log('   ⚠️  BNA: no se encontró el precio del dólar')
    }
    await page.close()
  } catch (e) {
    console.log(`   ⚠️  BNA: ${e.message}`)
  }

  // ── Santander ──
  try {
    const page = await context.newPage()
    await page.goto(
      'https://www.santander.com.ar/personas/productos/inversiones/cotizacion-moneda-extranjera.html',
      { waitUntil: 'domcontentloaded', timeout: 25000 }
    )
    const rawVenta = await page.evaluate(() => {
      const tables = Array.from(document.querySelectorAll('table'))
      for (const table of tables) {
        const rows = Array.from(table.querySelectorAll('tr'))
        for (const row of rows) {
          const cells = Array.from(row.querySelectorAll('td'))
          if (cells.length < 2) continue
          const label = cells[0].textContent.trim().toLowerCase()
          if (label.includes('dólar') || label.includes('dolar') || label.includes('usd')) {
            return cells[2]?.textContent?.trim() ?? cells[1]?.textContent?.trim() ?? null
          }
        }
      }
      return null
    })
    const precio = parseAR(rawVenta)
    if (precio) {
      resultado['santander'] = precio
      console.log(`   ✅ Santander dólar venta: $${precio}`)
    } else {
      console.log('   ⚠️  Santander: no se encontró el precio del dólar')
    }
    await page.close()
  } catch (e) {
    console.log(`   ⚠️  Santander: ${e.message}`)
  }

  // ── BBVA ──
  try {
    const page = await context.newPage()
    await page.goto(
      'https://www.bbva.com.ar/personas/productos/inversiones/cotizacion-moneda-extranjera.html',
      { waitUntil: 'domcontentloaded', timeout: 25000 }
    )
    const rawVenta = await page.evaluate(() => {
      const tables = Array.from(document.querySelectorAll('table'))
      for (const table of tables) {
        const rows = Array.from(table.querySelectorAll('tr'))
        for (const row of rows) {
          const cells = Array.from(row.querySelectorAll('td'))
          if (cells.length < 2) continue
          const label = cells[0].textContent.trim().toLowerCase()
          if (label.includes('dólar') || label.includes('dolar') || label.includes('usd')) {
            return cells[2]?.textContent?.trim() ?? cells[1]?.textContent?.trim() ?? null
          }
        }
      }
      return null
    })
    const precio = parseAR(rawVenta)
    if (precio) {
      resultado['bbva'] = precio
      console.log(`   ✅ BBVA dólar venta: $${precio}`)
    } else {
      console.log('   ⚠️  BBVA: no se encontró el precio del dólar')
    }
    await page.close()
  } catch (e) {
    console.log(`   ⚠️  BBVA: ${e.message}`)
  }

  // ── Galicia ──
  // Galicia es un SPA — intentamos capturar una respuesta de API interna
  try {
    const page = await context.newPage()
    let galiciaVenta = null

    page.on('response', async (response) => {
      const url = response.url()
      if (galiciaVenta) return
      if (
        (url.includes('cotizacion') || url.includes('exchange') || url.includes('tipo-cambio') || url.includes('dolar'))
        && response.headers()['content-type']?.includes('json')
      ) {
        try {
          const body = await response.json()
          const text = JSON.stringify(body)
          const match = text.match(/"venta"\s*:\s*([\d.,]+)/)
          if (match) galiciaVenta = match[1]
        } catch {}
      }
    })

    await page.goto('https://www.bancogalicia.com/cotizaciones', {
      waitUntil: 'domcontentloaded', timeout: 20000
    })
    await page.waitForTimeout(3000)

    // Fallback: buscar en el DOM
    if (!galiciaVenta) {
      galiciaVenta = await page.evaluate(() => {
        const tables = Array.from(document.querySelectorAll('table'))
        for (const table of tables) {
          const rows = Array.from(table.querySelectorAll('tr'))
          for (const row of rows) {
            const cells = Array.from(row.querySelectorAll('td'))
            if (cells.length < 2) continue
            const label = cells[0].textContent.trim().toLowerCase()
            if (label.includes('dólar') || label.includes('dolar') || label.includes('usd')) {
              return cells[2]?.textContent?.trim() ?? cells[1]?.textContent?.trim() ?? null
            }
          }
        }
        return null
      })
    }

    const precio = parseAR(galiciaVenta)
    if (precio) {
      resultado['galicia'] = precio
      console.log(`   ✅ Galicia dólar venta: $${precio}`)
    } else {
      console.log('   ⚠️  Galicia: no se encontró el precio del dólar (app-only)')
    }
    await page.close()
  } catch (e) {
    console.log(`   ⚠️  Galicia: ${e.message}`)
  }

  // Nota: Ualá y Brubank solo exponen precios desde sus apps móviles — se omiten
  console.log(`   → ${Object.keys(resultado).length} banco(s) con precio dólar scraped`)
  await browser.close()
  return resultado
}

// ─── Actualizar tasas.json ────────────────────────────────────────────────────
function actualizarJson(tasasBancos, tasasBilleteras, dolarBancos) {
  const json = JSON.parse(readFileSync(TASAS_PATH, 'utf-8'))
  let actualizados = 0

  for (const entidad of json.entidades) {
    // Bancos: actualizar plazo_fijo_30 y plazo_fijo_60 con la tasa del día
    const tnaBanco = tasasBancos[entidad.id]
    if (tnaBanco !== undefined) {
      for (const prod of entidad.productos) {
        if (prod.id === 'plazo_fijo_30' || prod.id === 'plazo_fijo_60') {
          if (prod.tna !== tnaBanco) {
            console.log(`  📝 ${entidad.nombre} / ${prod.nombre}: ${prod.tna}% → ${tnaBanco}%`)
            prod.tna = tnaBanco
            actualizados++
          }
        }
      }
    }

    // Billeteras: actualizar cuenta_remunerada
    const datosBilletera = tasasBilleteras[entidad.id]
    if (datosBilletera) {
      const prod = entidad.productos.find(p => p.id === datosBilletera.producto)
      if (prod && prod.tna !== datosBilletera.tna) {
        console.log(`  📝 ${entidad.nombre} / ${prod.nombre}: ${prod.tna}% → ${datosBilletera.tna}%`)
        prod.tna = datosBilletera.tna
        actualizados++
      }
    }

    // Dólar oficial por banco
    const dolarVenta = dolarBancos[entidad.id]
    if (dolarVenta !== undefined) {
      if (entidad.dolar_oficial_venta !== dolarVenta) {
        console.log(`  📝 ${entidad.nombre} / dólar oficial venta: ${entidad.dolar_oficial_venta} → $${dolarVenta}`)
        entidad.dolar_oficial_venta = dolarVenta
        actualizados++
      }
    }
  }

  const hoy = new Date().toISOString().split('T')[0]
  json.lastUpdated = hoy
  writeFileSync(TASAS_PATH, JSON.stringify(json, null, 2), 'utf-8')
  console.log(`\n✅ tasas.json actualizado — ${actualizados} cambio(s) — fecha: ${hoy}`)
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 Actualizando tasas...\n')
  const [tasasBancos, tasasBilleteras, dolarBancos] = await Promise.all([
    fetchTasasPlazofijo(),
    fetchTasasBilleteras(),
    fetchDolarBancos(),
  ])
  actualizarJson(tasasBancos, tasasBilleteras, dolarBancos)
}

main().catch(err => {
  console.error('❌ Error:', err.message)
  process.exit(1)
})
