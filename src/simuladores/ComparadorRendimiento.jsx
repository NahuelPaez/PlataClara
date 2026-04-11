import { useState, useEffect } from 'react'
import tasasData from '../data/tasas.json'
import { formatARS, formatPct, calcularPlazoFijo } from '../utils/formatters'

const PRODUCTOS_DISPONIBLES = [
  { id: 'cuenta_remunerada', label: 'Liquidez inmediata', dias: 30 },
  { id: 'plazo_fijo_30',     label: 'Plazo Fijo 30 días', dias: 30 },
]

// Entidades cuya tasa de liquidez inmediata viene 100% del FCI "otros" de argentinadatos
// (no tienen cuenta remunerada separada — el FCI ES su producto principal)
const OTROS_MAP = {
  'NARANJA X':      'naranjax',
  'CARREFOUR BANCO':'carrefour',
  'FIWIND':         'fiwind',
  'UALA':           'uala',
  'SUPERVIELLE':    'supervielle',
}

// Mapeo nombre API BCRA → id entidad en tasas.json
const PF_MAP = {
  'BANCO DE LA NACION ARGENTINA':                                    'nacion',
  'BANCO SANTANDER ARGENTINA S.A.':                                  'santander',
  'BANCO DE GALICIA Y BUENOS AIRES S.A.':                            'galicia',
  'BANCO BBVA ARGENTINA S.A.':                                       'bbva',
  'INDUSTRIAL AND COMMERCIAL BANK OF CHINA (ARGENTINA) S.A.U.':     'icbc',
  'BANCO DEL SOL S.A.':                                              'brubank',
  'UALA':                                                            'uala',
}

export default function ComparadorRendimiento() {
  const [productoId, setProductoId] = useState('cuenta_remunerada')
  const [monto, setMonto]           = useState(100000)
  const [montoDisplay, setMontoDisplay] = useState('100.000')
  const [resultados, setResultados] = useState([])
  const [otrosLive, setOtrosLive]   = useState({})  // liquidez inmediata
  const [pfLive, setPfLive]         = useState({})  // plazo fijo 30d
  const [liveTs, setLiveTs]         = useState(null)

  // Fetch tasas en vivo desde argentinadatos
  useEffect(() => {
    // 1. Billeteras y algunos bancos: endpoint /otros (liquidez inmediata)
    const fetchOtros = fetch('https://api.argentinadatos.com/v1/finanzas/fci/otros/ultimo')
      .then(r => r.json())
      .then(data => {
        const live = {}
        const hoy = new Date()
        data.forEach(item => {
          const id = OTROS_MAP[item.fondo]
          if (!id || !(item.tna > 0)) return
          const diasStale = item.fecha
            ? Math.round((hoy - new Date(item.fecha)) / 86400000)
            : 999
          if (diasStale > 30) return  // dato viejo — cae al fallback JSON
          live[id] = Math.round(item.tna * 10000) / 100  // 0.23 → 23.00
        })
        return live
      })
      .catch(() => ({}))

    // 2. Fondos money market de bancos: endpoint /mercadoDinero (VCP delta → TNA)
    const MDINERO_MAP = {
      'Fima Premium - Clase A':   'galicia',
      'Super Ahorro $ - Clase A': 'santander',
      'Mercado Fondo - Clase A':  'mercadopago',
    }
    const fetchMD = Promise.all([
      fetch('https://api.argentinadatos.com/v1/finanzas/fci/mercadoDinero/ultimo').then(r => r.json()),
      fetch('https://api.argentinadatos.com/v1/finanzas/fci/mercadoDinero/penultimo').then(r => r.json()),
    ])
      .then(([ultimo, penultimo]) => {
        const live = {}
        Object.entries(MDINERO_MAP).forEach(([nombre, id]) => {
          const u = ultimo.find(d => d.fondo === nombre)
          const p = penultimo.find(d => d.fondo === nombre)
          if (u?.vcp && p?.vcp && p.vcp > 0) {
            // Misma fórmula que comparatasas: TNA lineal con días reales
            const days = u.fecha && p.fecha
              ? Math.max(1, Math.round(Math.abs(new Date(u.fecha) - new Date(p.fecha)) / 86400000))
              : 1
            const n = (u.vcp - p.vcp) / p.vcp / days
            const tna = n * 365 * 100
            if (tna > 5 && tna < 100) live[id] = Math.round(tna * 100) / 100
          }
        })
        return live
      })
      .catch(() => ({}))

    // 3. Plazo fijo 30d: endpoint BCRA vía argentinadatos
    const fetchPF = fetch('https://api.argentinadatos.com/v1/finanzas/tasas/plazoFijo')
      .then(r => r.json())
      .then(data => {
        const live = {}
        data.forEach(item => {
          const id = PF_MAP[item.entidad]
          if (id && item.tnaClientes > 0) {
            live[id] = Math.round(item.tnaClientes * 10000) / 100  // 0.22 → 22.00
          }
        })
        return live
      })
      .catch(() => ({}))

    Promise.all([fetchOtros, fetchMD, fetchPF]).then(([otros, mdinero, pf]) => {
      setOtrosLive({ ...otros, ...mdinero })
      setPfLive(pf)
      setLiveTs(new Date())
    })
  }, [])

  function handleMontoChange(raw) {
    const digits = raw.replace(/[^\d]/g, '')
    const num = parseInt(digits) || 0
    setMontoDisplay(num === 0 ? '' : num.toLocaleString('es-AR'))
    setMonto(num)
  }

  function calcular(productoIdActual = productoId, montoActual = monto) {
    const prod = PRODUCTOS_DISPONIBLES.find(p => p.id === productoIdActual)
    const filas = []

    tasasData.entidades.forEach(entidad => {
      let tna   = null
      let notas = ''

      if (productoIdActual === 'cuenta_remunerada') {
        // 1. Tasa live del API si está disponible para esta entidad
        const liveTna = otrosLive[entidad.id]

        // 2. Cuenta remunerada del JSON (lo que el usuario ve al abrir la app)
        const cr = entidad.productos.find(p => p.id === 'cuenta_remunerada')

        // 3. FCI MM con T+0, solo para entidades SIN cuenta remunerada propia
        const fciT0 = !cr
          ? entidad.productos.find(p =>
              p.id === 'fci_mm' &&
              p.notas && (p.notas.includes('mismo día') || p.notas.toLowerCase().includes('inmediata'))
            )
          : null

        if (liveTna) {
          // API live disponible → usarla
          tna   = liveTna
          notas = cr?.notas || ''
        } else if (cr) {
          // Sin API live: usar cuenta remunerada del JSON
          tna   = cr.tna
          notas = cr.notas
        } else if (fciT0) {
          // Banco sin CR pero con FCI T+0 (Galicia, BBVA, Santander)
          tna   = fciT0.tna
          notas = ''
        }
      } else if (productoIdActual === 'plazo_fijo_30') {
        // Tasa live BCRA si disponible, sino JSON
        const liveTna = pfLive[entidad.id]
        const p = entidad.productos.find(p => p.id === 'plazo_fijo_30')
        if (liveTna) {
          tna   = liveTna
          notas = p?.notas || ''
        } else if (p) {
          tna   = p.tna
          notas = p.notas
        }
      } else {
        const p = entidad.productos.find(p => p.id === productoIdActual)
        if (p) { tna = p.tna; notas = p.notas }
      }

      if (tna) {
        const r = calcularPlazoFijo(montoActual, tna, prod.dias)
        const isLiveCR = productoIdActual === 'cuenta_remunerada' && !!otrosLive[entidad.id]
        const isLivePF = productoIdActual === 'plazo_fijo_30'     && !!pfLive[entidad.id]
        filas.push({
          entidad: entidad.nombre,
          tipo: entidad.tipo,
          emoji: entidad.emoji,
          tna,
          interes: r.interes,
          total: r.total,
          notas,
          isLive: isLiveCR || isLivePF,
        })
      }
    })

    filas.sort((a, b) => b.tna - a.tna)
    setResultados(filas)
  }

  useEffect(() => { calcular() }, [productoId, monto, otrosLive, pfLive])

  const prodActual = PRODUCTOS_DISPONIBLES.find(p => p.id === productoId)
  const prodLabel  = prodActual?.label
  const hayLive    = (productoId === 'cuenta_remunerada' && Object.keys(otrosLive).length > 0)
                  || (productoId === 'plazo_fijo_30'     && Object.keys(pfLive).length > 0)

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-700">
        <strong>¿Dónde rinde más mi plata?</strong> Ingresá un monto, elegí el producto,
        y te mostramos cuánto ganarías en cada entidad, ordenado de mayor a menor rendimiento.
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-600 block mb-1">Producto</label>
          <select
            className="input-field"
            value={productoId}
            onChange={e => setProductoId(e.target.value)}
          >
            {PRODUCTOS_DISPONIBLES.map(p => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-600 block mb-1">Monto</label>
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              className="input-field pr-8"
              value={montoDisplay}
              placeholder="100.000"
              onChange={e => handleMontoChange(e.target.value)}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none">$</span>
          </div>
        </div>
      </div>

      <div>
        {resultados.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-6">No hay datos para este producto todavía.</p>
        ) : (
          <>
            <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                    <th className="text-left px-4 py-3 w-8">#</th>
                    <th className="text-left px-4 py-3">Entidad</th>
                    <th className="text-right px-4 py-3">TNA</th>
                    <th className="text-right px-4 py-3">Interés ganado (mensual)</th>
                    <th className="text-right px-4 py-3">Total</th>
                    {productoId === 'cuenta_remunerada' && <th className="text-left px-4 py-3 hidden md:table-cell">Notas</th>}
                  </tr>
                </thead>
                <tbody>
                  {resultados.map((r, i) => (
                    <tr
                      key={r.entidad}
                      className={`border-t border-slate-50 ${i < 3 ? 'bg-primary-50/40' : 'hover:bg-slate-50'} transition-colors`}
                    >
                      <td className="px-4 py-3 font-bold text-slate-400">
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 font-medium text-slate-800">
                          <span>{r.emoji}</span>
                          <div>
                            <span>{r.entidad}</span>
                            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${r.tipo === 'banco' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                              {r.tipo}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-primary-600">{formatPct(r.tna)}</td>
                      <td className="px-4 py-3 text-right text-emerald-600 font-semibold">{formatARS(r.interes)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-700">{formatARS(r.total)}</td>
                      {productoId === 'cuenta_remunerada' && <td className="px-4 py-3 text-slate-400 text-xs hidden md:table-cell">{r.notas}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-slate-400 mt-3 text-center">
              Verificá siempre las tasas vigentes antes de operar.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
