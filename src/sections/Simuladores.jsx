import { useState, useEffect } from 'react'
import CuentaRemunerada    from '../simuladores/CuentaRemunerada'
import PlazoFijo           from '../simuladores/PlazoFijo'
import FCI                 from '../simuladores/FCI'
import Caucion             from '../simuladores/Caucion'
import Bonos               from '../simuladores/Bonos'
import InteresCompuesto    from '../simuladores/InteresCompuesto'

const GRUPOS = [
  {
    riesgo: 'Riesgo bajo',
    color: 'text-green-600',
    dot: 'bg-green-500',
    simuladores: [
      { id: 'cuenta_remunerada', label: '💰 Cta. Remunerada', component: CuentaRemunerada },
      { id: 'plazo_fijo_pesos',   label: '🏦 Plazo Fijo $',     component: () => <PlazoFijo initialTipo="pesos" /> },
      { id: 'plazo_fijo_uva',    label: '📈 Plazo Fijo UVA',   component: () => <PlazoFijo initialTipo="uva" /> },
      { id: 'plazo_fijo_usd',    label: '💵 Plazo Fijo USD',   component: () => <PlazoFijo initialTipo="usd" /> },
      { id: 'fci',               label: '📊 FCI',              component: FCI },
      { id: 'caucion',           label: '🤝 Caución',          component: Caucion },
    ],
  },
  {
    riesgo: 'Riesgo medio',
    color: 'text-amber-600',
    dot: 'bg-amber-500',
    simuladores: [
      { id: 'bonos',   label: '📜 Bonos / ONs', component: Bonos },
    ],
  },
]

const HERRAMIENTA = { id: 'interes_compuesto', label: '📈 Interés compuesto', component: InteresCompuesto }

const ALL = [...GRUPOS.flatMap(g => g.simuladores), HERRAMIENTA]

export default function Simuladores() {
  const [active, setActive] = useState(ALL[0].id)

  useEffect(() => {
    function handler(e) { setActive(e.detail) }
    window.addEventListener('setSimulador', handler)
    return () => window.removeEventListener('setSimulador', handler)
  }, [])

  const ActiveComponent = ALL.find(s => s.id === active)?.component || CuentaRemunerada
  const activeLabel     = ALL.find(s => s.id === active)?.label

  return (
    <section id="simuladores" className="py-8 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-semibold text-primary-500 uppercase tracking-widest mb-1">
            Simuladores
          </p>
          <h2 className="section-title">Calculá cuánto podés ganar</h2>
          <p className="section-subtitle">
            Calculá cuánto podés ganar con cada producto de inversión.
          </p>
        </div>

        {/* Selector agrupado por riesgo — desktop */}
        <div className="hidden md:block mb-6 space-y-3">
          {GRUPOS.map(grupo => (
            <div key={grupo.riesgo} className="flex items-center gap-3">
              <span className={`flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap w-28 ${grupo.color}`}>
                <span className={`w-2 h-2 rounded-full ${grupo.dot}`} />
                {grupo.riesgo}
              </span>
              <div className="flex flex-wrap gap-2">
                {grupo.simuladores.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setActive(s.id)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                      active === s.id ? 'tab-active' : 'tab-inactive'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Herramienta separada */}
          <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-400 whitespace-nowrap w-28">Herramienta</span>
            <button
              onClick={() => setActive(HERRAMIENTA.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                active === HERRAMIENTA.id ? 'tab-active' : 'tab-inactive'
              }`}
            >
              {HERRAMIENTA.label}
            </button>
          </div>
        </div>

        {/* Selector — dropdown en mobile */}
        <div className="md:hidden mb-6">
          <select
            className="input-field text-base"
            value={active}
            onChange={e => setActive(e.target.value)}
          >
            {GRUPOS.map(grupo => (
              <optgroup key={grupo.riesgo} label={grupo.riesgo}>
                {grupo.simuladores.map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </optgroup>
            ))}
            <optgroup label="Herramienta">
              <option value={HERRAMIENTA.id}>{HERRAMIENTA.label}</option>
            </optgroup>
          </select>
        </div>

        {/* Simulador activo */}
        <div className="card">
          <h3 className="text-lg font-bold text-slate-700 mb-5 text-center">
            {activeLabel}
          </h3>
          <ActiveComponent key={active} />
        </div>
      </div>
    </section>
  )
}
