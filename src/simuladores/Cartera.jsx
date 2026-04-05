import { useState } from 'react'
import { formatARS, formatPct } from '../utils/formatters'
import { descargarSimuladorCartera } from '../utils/excel'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

const ACTIVOS = [
  { id: 'cuenta_rem',   nombre: 'Cuenta Remunerada',    rendimiento: 42, riesgo: 'bajo',  color: '#10b981' },
  { id: 'plazo_fijo',   nombre: 'Plazo Fijo',            rendimiento: 40, riesgo: 'bajo',  color: '#0d7377' },
  { id: 'fci_mm',       nombre: 'FCI Money Market',      rendimiento: 43, riesgo: 'bajo',  color: '#14a0a6' },
  { id: 'bonos',        nombre: 'Bonos/ONs',             rendimiento: 55, riesgo: 'medio', color: '#f59e0b' },
  { id: 'cedears',      nombre: 'CEDEARs',               rendimiento: 65, riesgo: 'alto',  color: '#6366f1' },
  { id: 'cripto_stable',nombre: 'Cripto Stablecoins',    rendimiento: 5,  riesgo: 'bajo',  color: '#8b5cf6' },
  { id: 'acciones',     nombre: 'Acciones AR',           rendimiento: 70, riesgo: 'alto',  color: '#ef4444' },
]

const RIESGO_SCORE = { bajo: 1, medio: 2, alto: 3 }
const RIESGO_LABEL = { 1: 'Bajo', 2: 'Medio', 3: 'Alto' }
const RIESGO_COLOR = { 1: 'text-emerald-600', 2: 'text-amber-600', 3: 'text-red-600' }

export default function Cartera() {
  const [pcts, setPcts] = useState(Object.fromEntries(ACTIVOS.map(a => [a.id, 0])))
  const [resultado, setResultado] = useState(null)

  const total = Object.values(pcts).reduce((s, v) => s + v, 0)
  const restante = 100 - total

  function handleSlider(id, val) {
    setPcts(prev => ({ ...prev, [id]: Number(val) }))
    setResultado(null)
  }

  function calcular() {
    if (Math.abs(total - 100) > 0.5) return

    let rendPonderado = 0
    let riesgoPonderado = 0
    const activos = []

    ACTIVOS.forEach(a => {
      const pct = pcts[a.id]
      if (pct > 0) {
        rendPonderado += (pct / 100) * a.rendimiento
        riesgoPonderado += (pct / 100) * RIESGO_SCORE[a.riesgo]
        activos.push({ ...a, porcentaje: pct, peso: pct / 100 * a.rendimiento })
      }
    })

    const riescoLabel = RIESGO_LABEL[Math.round(riesgoPonderado)] || 'Medio'
    setResultado({ rendPonderado, riesgoPonderado, riescoLabel, activos })
  }

  function descargar() {
    if (!resultado) return
    descargarSimuladorCartera(resultado.activos.map(a => ({
      nombre: a.nombre,
      porcentaje: a.porcentaje,
      rendimientoEsperado: a.rendimiento,
    })))
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-700">
        <strong>Armá tu cartera:</strong> Distribuí el 100% de tu inversión entre distintos
        activos usando los sliders. El simulador calcula el rendimiento promedio ponderado
        y el nivel de riesgo de tu cartera combinada.
      </div>

      {/* Sliders */}
      <div className="space-y-4">
        {ACTIVOS.map(a => (
          <div key={a.id} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: a.color }} />
                <span className="text-sm font-medium text-slate-700">{a.nombre}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  a.riesgo === 'bajo' ? 'bg-emerald-100 text-emerald-600' :
                  a.riesgo === 'medio' ? 'bg-amber-100 text-amber-600' :
                  'bg-red-100 text-red-600'
                }`}>{a.rendimiento}% TNA • riesgo {a.riesgo}</span>
              </div>
              <span className="text-sm font-bold text-primary-600 w-12 text-right">{pcts[a.id]}%</span>
            </div>
            <input
              type="range" min={0} max={100} step={5}
              value={pcts[a.id]}
              onChange={e => handleSlider(a.id, e.target.value)}
              className="w-full accent-primary-500"
              style={{ accentColor: a.color }}
            />
          </div>
        ))}
      </div>

      {/* Indicador de total */}
      <div className={`rounded-xl px-4 py-3 text-sm font-medium flex items-center justify-between ${
        Math.abs(total - 100) < 1 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
        total > 100 ? 'bg-red-50 text-red-700 border border-red-100' :
        'bg-amber-50 text-amber-700 border border-amber-100'
      }`}>
        <span>Asignado: <strong>{total}%</strong></span>
        <span>{total > 100 ? '⚠️ Superás el 100%' : total === 100 ? '✅ Perfecto' : `Restante: ${restante}%`}</span>
      </div>

      <button
        className="btn-primary w-full sm:w-auto"
        onClick={calcular}
        disabled={Math.abs(total - 100) > 0.5}
      >
        Calcular cartera
      </button>

      {resultado && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="card bg-primary-50 border-primary-100">
              <p className="text-xs text-primary-600 font-semibold uppercase tracking-wide mb-1">Rendimiento ponderado</p>
              <p className="text-3xl font-extrabold text-primary-700">{formatPct(resultado.rendPonderado)}</p>
              <p className="text-xs text-primary-500 mt-1">TNA promedio de tu cartera</p>
            </div>
            <div className={`card border ${
              resultado.riesgoPonderado <= 1.5 ? 'bg-emerald-50 border-emerald-100' :
              resultado.riesgoPonderado <= 2.3 ? 'bg-amber-50 border-amber-100' :
              'bg-red-50 border-red-100'
            }`}>
              <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${RIESGO_COLOR[Math.round(resultado.riesgoPonderado)]}`}>
                Nivel de riesgo
              </p>
              <p className={`text-3xl font-extrabold ${RIESGO_COLOR[Math.round(resultado.riesgoPonderado)]}`}>
                {resultado.riescoLabel}
              </p>
              <p className="text-xs text-slate-400 mt-1">Score: {resultado.riesgoPonderado.toFixed(1)} / 3</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-4">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={resultado.activos} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="nombre" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v, n) => [v + '%', n]} />
                <Bar dataKey="porcentaje" name="% asignado" radius={[6, 6, 0, 0]}>
                  {resultado.activos.map((a, i) => <Cell key={i} fill={a.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <button onClick={descargar} className="btn-secondary w-full sm:w-auto">
            📥 Descargar cartera en Excel
          </button>
        </div>
      )}
    </div>
  )
}
