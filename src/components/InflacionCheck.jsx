import { useState } from 'react'
import { calcularTasaReal } from '../utils/formatters'

const INFLACION_REF = 3.2

export default function InflacionCheck({ tna }) {
  const [display, setDisplay]     = useState(String(INFLACION_REF))
  const [inflacion, setInflacion] = useState(INFLACION_REF)

  function handleInput(raw) {
    const withDot = raw.replace(/,/g, '.')
    const cleaned = withDot.replace(/[^\d.]/g, '')
    setDisplay(withDot)
    setInflacion(parseFloat(cleaned) || 0)
  }

  const resultado = inflacion > 0 ? calcularTasaReal(tna, inflacion) : null

  return (
    <div className={`rounded-2xl border p-4 text-sm ${
      resultado?.ganaPoder
        ? 'bg-green-50 border-green-200'
        : 'bg-red-50 border-red-200'
    }`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="font-semibold text-slate-700">
            {resultado?.ganaPoder ? '✅ Le ganás a la inflación' : '⚠️ No le ganás a la inflación'}
          </span>
          {resultado && (
            <span className={`ml-2 text-xs ${resultado.ganaPoder ? 'text-green-700' : 'text-red-700'}`}>
              Tasa real mensual: <strong>{resultado.tasaRealMensual >= 0 ? '+' : ''}{resultado.tasaRealMensual.toFixed(2)}%</strong>
              {' · '}
              Anual: <strong>{resultado.tasaRealAnual >= 0 ? '+' : ''}{resultado.tasaRealAnual.toFixed(1)}%</strong>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-500">Inflación mensual estimada:</span>
          <div className="relative">
            <input
              type="text"
              inputMode="decimal"
              value={display}
              onChange={e => handleInput(e.target.value)}
              className="w-20 rounded-lg border border-slate-200 bg-white pl-2 pr-6 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">%</span>
          </div>
          <button
            onClick={() => { setDisplay(String(INFLACION_REF)); setInflacion(INFLACION_REF) }}
            className="text-xs px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            INDEC {INFLACION_REF}%
          </button>
        </div>
      </div>
    </div>
  )
}
