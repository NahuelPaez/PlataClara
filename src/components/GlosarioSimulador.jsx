import { useState } from 'react'

/**
 * Glosario desplegable para simuladores.
 * Props:
 *   titulo: string  — título del glosario (default "Glosario")
 *   terminos: [{ term, def }]
 */
export default function GlosarioSimulador({ titulo = 'Glosario', terminos = [] }) {
  const [open, setOpen] = useState(false)
  if (!terminos.length) return null
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-sm font-medium text-slate-700"
      >
        <span>📖 {titulo}</span>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-4 py-4 bg-white border-t border-slate-100 space-y-3 text-sm text-slate-600">
          {terminos.map((t, i) => (
            <div key={i} className={i > 0 ? 'border-t border-slate-50 pt-3' : ''}>
              <p className="font-semibold text-slate-700 mb-1">{t.term}</p>
              <p className="leading-relaxed">{t.def}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
