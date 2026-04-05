import RiesgoTag from './RiesgoTag'
import { formatARS } from '../utils/formatters'

export default function ProductCard({ producto }) {
  const { icono, nombre, descripcion, paraQuien, riesgo, desdeARS, ventajas, simulador, disponibleEn } = producto

  function handleSimular() {
    if (!simulador) return
    window.dispatchEvent(new CustomEvent('setSimulador', { detail: simulador }))
    document.getElementById('simuladores')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="card flex flex-col gap-4 hover:shadow-md transition-shadow duration-200 group">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{icono}</span>
          <div>
            <h3 className="font-bold text-slate-800 text-base leading-tight">{nombre}</h3>
            {desdeARS !== null && desdeARS !== undefined && (
              <p className="text-xs text-slate-400 mt-0.5">
                Desde {desdeARS === 1 ? 'cualquier monto' : formatARS(desdeARS, 0)}
              </p>
            )}
          </div>
        </div>
        <RiesgoTag riesgo={riesgo} size="xs" />
      </div>

      {/* Descripción */}
      <p className="text-sm text-slate-600 leading-relaxed">{descripcion}</p>

      {/* Para quién */}
      <div className="bg-slate-50 rounded-xl px-4 py-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">¿Para quién?</p>
        <p className="text-sm text-slate-700">{paraQuien}</p>
      </div>

      {/* Ventajas */}
      <ul className="space-y-1.5">
        {ventajas.slice(0, 3).map((v, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
            <span className="text-success mt-0.5 text-base leading-none flex-shrink-0">✓</span>
            {v}
          </li>
        ))}
      </ul>

      {/* Disponible en */}
      {disponibleEn?.length > 0 && (
        <p className="text-xs text-slate-400">
          Disponible en: {disponibleEn.join(' · ')}
        </p>
      )}

      {/* Footer */}
      {simulador && (
        <div className="mt-auto pt-2">
          <button
            onClick={handleSimular}
            className="w-full btn-primary text-sm py-2"
          >
            Simular rendimiento →
          </button>
        </div>
      )}
    </div>
  )
}
