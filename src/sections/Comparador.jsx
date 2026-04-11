import { useState, useEffect } from 'react'
import tasasData from '../data/tasas.json'
import { formatPct, calcularTEA } from '../utils/formatters'

const PRODUCTOS_DISPLAY = [
  { id: 'cuenta_remunerada', label: 'Liquidez inmediata' },
  { id: 'plazo_fijo_30',     label: 'Plazo Fijo 30 días' },
  { id: 'plazo_fijo_uva',    label: 'Plazo Fijo UVA' },
  { id: 'plazo_fijo_usd',    label: 'Plazo Fijo USD' },
]

// Bancos: plazo fijo rates desde BCRA vía argentinadatos
const BCRA_MAP = {
  'BANCO DE LA NACION ARGENTINA': 'nacion',
  'BANCO SANTANDER ARGENTINA S.A.': 'santander',
  'BANCO DE GALICIA Y BUENOS AIRES S.A.': 'galicia',
  'BANCO BBVA ARGENTINA S.A.': 'bbva',
  'INDUSTRIAL AND COMMERCIAL BANK OF CHINA': 'icbc',
  'BANCO SUPERVIELLE S.A.': 'supervielle',
  'BRUBANK S.A.U.': 'brubank',
}

// Billeteras: cuenta remunerada y FCI desde VCP de argentinadatos (CAFCI)
// Para MP, la CR está respaldada directamente por el FCI → VCP aplica a ambos
// Para Ualá y Lemon, la CR tiene tasa declarada propia → VCP solo aplica a fci_mm
const FCI_MAP = {
  'Mercado Fondo - Clase A':         { id: 'mercadopago', productos: ['cuenta_remunerada', 'fci_mm'] },
  'Ualintec Ahorro Pesos - Clase A': { id: 'uala',        productos: ['fci_mm'] },
  'Fima Premium - Clase P':          { id: 'lemon',       productos: ['fci_mm'] },
}

// Billeteras sin FCI en CAFCI: Naranja X, Belo, Carrefour, Fiwind
// Tasas desde argentinadatos /fci/otros/ultimo
const OTROS_MAP = {
  'NARANJA X':      'naranjax',
  'BELO':           'belo',
  'CARREFOUR BANCO':'carrefour',
  'FIWIND':         'fiwind',
}

const PRODUCTOS_LIVE_BANCO = new Set(['plazo_fijo_30'])
const PRODUCTOS_LIVE_FCI   = new Set(['cuenta_remunerada', 'fci_mm'])
const PRODUCTOS_LIVE_OTROS = new Set(['cuenta_remunerada'])

function calcularTNAdesdeVCP(vcpActual, vcpAnterior, fechaActual, fechaAnterior) {
  const dias = (new Date(fechaActual) - new Date(fechaAnterior)) / 86400000
  if (!dias || dias <= 0) return null
  const retornoDiario = (vcpActual - vcpAnterior) / vcpAnterior / dias
  return Math.round(retornoDiario * 365 * 10000) / 100
}

export default function Comparador() {
  const [productoId, setProductoId] = useState('cuenta_remunerada')
  const [bancosLive, setBancosLive]   = useState({})  // entityId → tna30
  const [fciLive,    setFciLive]      = useState({})  // entityId → { productoId: tna }
  const [otrosLive,  setOtrosLive]    = useState({})  // entityId → tna
  const [fetchedAt,  setFetchedAt]    = useState(null)
  const [fetchError, setFetchError]   = useState(false)

  // 1. Tasas de plazo fijo bancario (BCRA)
  useEffect(() => {
    fetch('https://api.argentinadatos.com/v1/finanzas/tasas/plazoFijo')
      .then(r => r.json())
      .then(data => {
        const map = {}
        data.forEach(item => {
          const id = BCRA_MAP[item.entidad]
          if (id && item.tnaClientes != null) {
            map[id] = Math.round(item.tnaClientes * 1000) / 10
          }
        })
        setBancosLive(map)
        setFetchedAt(new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }))
      })
      .catch(() => setFetchError(true))
  }, [])

  // 3. Tasas de billeteras sin FCI (Naranja X, Belo, Carrefour, Fiwind) desde /fci/otros/ultimo
  useEffect(() => {
    fetch('https://api.argentinadatos.com/v1/finanzas/fci/otros/ultimo')
      .then(r => r.json())
      .then(data => {
        const map = {}
        data.forEach(item => {
          const id = OTROS_MAP[item.fondo]
          if (id && item.tna != null && item.tna > 0) {
            map[id] = Math.round(item.tna * 10000) / 100
          }
        })
        setOtrosLive(map)
      })
      .catch(() => {})
  }, [])

  // 2. Tasas de billeteras (FCI) calculadas desde VCP
  useEffect(() => {
    Promise.all([
      fetch('https://api.argentinadatos.com/v1/finanzas/fci/mercadoDinero/ultimo').then(r => r.json()),
      fetch('https://api.argentinadatos.com/v1/finanzas/fci/mercadoDinero/penultimo').then(r => r.json()),
    ]).then(([ultimo, penultimo]) => {
      const map = {}
      ultimo.forEach(fondoActual => {
        const mapping = FCI_MAP[fondoActual.fondo]
        if (!mapping) return
        const fondoAnterior = penultimo.find(p => p.fondo === fondoActual.fondo)
        if (!fondoAnterior?.vcp || !fondoActual.vcp) return
        const tna = calcularTNAdesdeVCP(fondoActual.vcp, fondoAnterior.vcp, fondoActual.fecha, fondoAnterior.fecha)
        if (tna == null) return
        if (!map[mapping.id]) map[mapping.id] = {}
        mapping.productos.forEach(p => { map[mapping.id][p] = tna })
      })
      setFciLive(map)
    }).catch(() => {})
  }, [])

  const esLiveBanco = PRODUCTOS_LIVE_BANCO.has(productoId) && Object.keys(bancosLive).length > 0
  const esLiveFCI   = PRODUCTOS_LIVE_FCI.has(productoId)   && Object.keys(fciLive).length > 0
  const esLiveOtros = PRODUCTOS_LIVE_OTROS.has(productoId) && Object.keys(otrosLive).length > 0
  const hayAlgoLive = esLiveBanco || esLiveFCI || esLiveOtros

  const rows = []
  tasasData.entidades.forEach(entidad => {
    const prod = entidad.productos.find(p => p.id === productoId)
    if (!prod) return

    let tna = prod.tna
    let esDatoLive = false

    // Plazo fijo 30d: tasa BCRA en vivo
    if (productoId === 'plazo_fijo_30' && bancosLive[entidad.id] != null) {
      tna = bancosLive[entidad.id]
      esDatoLive = true
    }
    // Cuenta remunerada: live VCP solo para MP (cuya CR es el FCI)
    if (productoId === 'cuenta_remunerada' && fciLive[entidad.id]?.['cuenta_remunerada'] != null) {
      tna = fciLive[entidad.id]['cuenta_remunerada']
      esDatoLive = true
    }
    // Billeteras sin FCI en CAFCI (Naranja X, Belo, Carrefour, Fiwind)
    if (productoId === 'cuenta_remunerada' && otrosLive[entidad.id] != null) {
      tna = otrosLive[entidad.id]
      esDatoLive = true
    }

    rows.push({
      id: entidad.id,
      nombre: entidad.nombre,
      tipo: entidad.tipo,
      emoji: entidad.emoji,
      tna,
      tea: prod.tea ?? (tna ? calcularTEA(tna, 365) : null),
      moneda: prod.moneda,
      notas: prod.notas,
      plazo_min: prod.plazo_min,
      plazo_max: prod.plazo_max,
      esDatoLive,
    })
  })

  rows.sort((a, b) => {
    if (a.tna === null) return 1
    if (b.tna === null) return -1
    return b.tna - a.tna
  })

  const isUVA = productoId === 'plazo_fijo_uva'

  return (
    <section id="comparador" className="py-8 bg-slate-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <p className="text-sm font-semibold text-primary-500 uppercase tracking-widest mb-2">
            Comparador de Tasas
          </p>
          <h2 className="section-title">¿Quién paga más por tu plata?</h2>
          <p className="section-subtitle">
            Comparamos las tasas de los principales bancos y billeteras de Argentina,
            ordenadas de mayor a menor.
          </p>

          <div className="flex flex-wrap items-center gap-2 mt-3">
            {hayAlgoLive ? (
              <span className="inline-flex items-center gap-1.5 text-xs bg-green-50 border border-green-200 text-green-700 px-3 py-1.5 rounded-full font-medium">
                🟢 Datos en tiempo real
                {fetchedAt && <span className="opacity-70">· {fetchedAt}</span>}
              </span>
            ) : fetchError ? (
              <span className="inline-flex items-center gap-1.5 text-xs bg-red-50 border border-red-200 text-red-600 px-3 py-1.5 rounded-full font-medium">
                ⚠️ Sin conexión a la API — mostrando datos guardados
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1.5 rounded-full font-medium">
                🕐 Verificado el {new Date(tasasData.lastUpdated + 'T00:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            )}
            <span className="text-xs text-slate-400">— Verificá siempre en el sitio oficial antes de operar</span>
          </div>

          <div className="flex flex-wrap gap-2 mt-4 mb-2">
            {PRODUCTOS_DISPLAY.map(p => {
              const esLive = PRODUCTOS_LIVE_BANCO.has(p.id) || PRODUCTOS_LIVE_FCI.has(p.id) || PRODUCTOS_LIVE_OTROS.has(p.id)
              return (
                <button
                  key={p.id}
                  onClick={() => setProductoId(p.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    productoId === p.id ? 'tab-active' : 'tab-inactive'
                  }`}
                >
                  {p.label}
                  {esLive && (
                    <span className="ml-1.5 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">EN VIVO</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {isUVA && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm text-amber-700 mb-6">
            Los plazos fijos UVA ajustan por inflación (CER). No tienen TNA fija — el rendimiento
            depende de la inflación real del período más un pequeño spread (0.5-1% anual).
          </div>
        )}

        {rows.length === 0 ? (
          <div className="card text-center py-10 text-slate-400">
            No hay datos para este producto todavía.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white text-slate-500 text-xs uppercase tracking-wide border-b border-slate-100">
                  <th className="text-left px-4 py-3 w-8">#</th>
                  <th className="text-left px-4 py-3">Entidad</th>
                  <th className="text-right px-4 py-3">TNA</th>
                  <th className="text-right px-4 py-3 hidden sm:table-cell">TEA</th>
                  <th className="text-center px-4 py-3 hidden md:table-cell">Plazo</th>
                  <th className="text-left px-4 py-3 hidden lg:table-cell">Notas</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr
                    key={r.nombre}
                    className={`border-t border-slate-50 transition-colors ${
                      i === 0 ? 'bg-amber-50/60 hover:bg-amber-50' :
                      i === 1 ? 'bg-slate-50/80 hover:bg-slate-100' :
                      i === 2 ? 'bg-slate-50/40 hover:bg-slate-100' :
                      'hover:bg-slate-50'
                    }`}
                  >
                    <td className="px-4 py-3.5 font-bold text-slate-400 text-base">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{r.emoji}</span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-slate-800">{r.nombre}</p>
                          </div>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                            r.tipo === 'banco'
                              ? 'bg-blue-100 text-blue-600'
                              : 'bg-purple-100 text-purple-600'
                          }`}>
                            {r.tipo}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {r.tna !== null
                        ? <span className="font-bold text-primary-600 text-base">{formatPct(r.tna)}</span>
                        : <span className="font-semibold text-slate-600 text-sm">{r.notas || 'CER + spread'}</span>
                      }
                    </td>
                    <td className="px-4 py-3.5 text-right hidden sm:table-cell text-slate-500">
                      {r.tea !== null ? formatPct(r.tea, 1) : '—'}
                    </td>
                    <td className="px-4 py-3.5 text-center text-slate-500 text-xs hidden md:table-cell">
                      {r.plazo_min === r.plazo_max
                        ? `${r.plazo_min} días`
                        : `${r.plazo_min}-${r.plazo_max} días`
                      }
                    </td>
                    <td className="px-4 py-3.5 text-slate-400 text-xs hidden lg:table-cell">{r.tna !== null ? r.notas : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4">
          <p className="text-xs text-slate-400 text-center">
            Datos en tiempo real: tasas bancarias vía BCRA · billeteras vía CAFCI y argentinadatos.com.
            Confirmá siempre en el sitio oficial antes de operar.
          </p>
        </div>
      </div>
    </section>
  )
}
