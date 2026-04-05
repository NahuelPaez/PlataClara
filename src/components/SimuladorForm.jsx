import { useState } from 'react'

/** Detecta si el campo es un monto monetario por su unidad */
function isMoney(field) {
  return field.unit === '$' || field.unit === 'U$S'
}

/** Convierte un valor numérico a su representación de display */
function toDisplay(field, value) {
  if (isMoney(field)) {
    const n = Math.round(Number(value) || 0)
    return n === 0 ? '' : n.toLocaleString('es-AR')
  }
  if (value === '' || value === null || value === undefined) return ''
  return String(value)
}

/**
 * SimuladorForm — formulario genérico para todos los simuladores.
 *
 * fields: Array de objetos con:
 *   { id, label, type: 'number'|'select'|'range', unit?, defaultValue,
 *     min?, max?, step?, options?, hint?, hintAction?: { label, value } }
 *
 * hintAction: botón inline junto al label para setear un valor sugerido
 *   (usado en el campo de inflación para mostrar la referencia INDEC)
 *
 * onCalculate: (values: Record<string, number|string>) => void
 */
export default function SimuladorForm({ fields, onCalculate, submitLabel = 'Calcular' }) {
  const initValues = () => Object.fromEntries(fields.map(f => [f.id, f.defaultValue]))
  const initDisplay = () => Object.fromEntries(fields.map(f => [f.id, toDisplay(f, f.defaultValue)]))

  const [values, setValues] = useState(initValues)
  const [display, setDisplay] = useState(initDisplay)

  function resetForm() {
    setValues(initValues())
    setDisplay(initDisplay())
  }

  /** Setea un campo desde código externo (ej. botón hintAction) */
  function setFieldValue(id, val) {
    const field = fields.find(f => f.id === id)
    setValues(prev => ({ ...prev, [id]: val }))
    setDisplay(prev => ({ ...prev, [id]: field ? toDisplay(field, val) : String(val) }))
  }

  function handleMoneyInput(id, raw) {
    // Solo dígitos, sin decimales
    const digits = raw.replace(/[^\d]/g, '')
    const num = parseInt(digits) || 0
    const formatted = num === 0 ? '' : num.toLocaleString('es-AR')
    setDisplay(prev => ({ ...prev, [id]: formatted }))
    setValues(prev => ({ ...prev, [id]: num }))
  }

  function handleNumberInput(id, raw) {
    // Convierte coma en punto para que el simulador lea bien
    const withDot = raw.replace(/,/g, '.')
    // Solo permite: dígitos, un punto decimal, signo negativo inicial
    const cleaned = withDot.replace(/[^\d.-]/g, '')
    setDisplay(prev => ({ ...prev, [id]: withDot }))
    setValues(prev => ({ ...prev, [id]: parseFloat(cleaned) || 0 }))
  }

  function handleSelectChange(id, val) {
    setValues(prev => ({ ...prev, [id]: val }))
    setDisplay(prev => ({ ...prev, [id]: val }))
  }

  function handleRangeChange(id, val) {
    const n = Number(val)
    setValues(prev => ({ ...prev, [id]: n }))
    setDisplay(prev => ({ ...prev, [id]: String(n) }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    onCalculate(values)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {fields.map(field => (
          <div key={field.id} className="flex flex-col gap-1">
            {/* Label + botón hintAction (si aplica) */}
            <div className="flex items-center justify-between gap-2 min-h-[1.5rem]">
              <label className="text-sm font-medium text-slate-600">{field.label}</label>
              {field.hintAction && (
                <button
                  type="button"
                  onClick={() => setFieldValue(field.id, field.hintAction.value)}
                  className="text-xs text-primary-500 hover:text-primary-700 font-medium transition-colors whitespace-nowrap border border-primary-200 hover:border-primary-400 px-2 py-0.5 rounded-full"
                >
                  {field.hintAction.label}
                </button>
              )}
            </div>

            {field.type === 'select' ? (
              <select
                className="input-field"
                value={values[field.id]}
                onChange={e => handleSelectChange(field.id, e.target.value)}
              >
                {field.options.map(opt => (
                  <option key={opt.value ?? opt} value={opt.value ?? opt}>
                    {opt.label ?? opt}
                  </option>
                ))}
              </select>

            ) : field.type === 'range' ? (
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={field.min ?? 0}
                  max={field.max ?? 100}
                  step={field.step ?? 1}
                  value={values[field.id]}
                  onChange={e => handleRangeChange(field.id, e.target.value)}
                  className="flex-1 accent-primary-500"
                />
                <span className="text-sm font-semibold text-primary-600 w-16 text-right">
                  {values[field.id]}{field.unit ?? ''}
                </span>
              </div>

            ) : (
              /* Campo numérico: texto con formato */
              <div className="relative">
                <input
                  type="text"
                  inputMode={isMoney(field) ? 'numeric' : 'decimal'}
                  className={`input-field ${field.unitSelect ? 'pr-24' : 'pr-14'}`}
                  value={display[field.id] ?? ''}
                  placeholder={isMoney(field) ? '0' : String(field.defaultValue ?? '')}
                  onChange={e => {
                    if (isMoney(field)) {
                      handleMoneyInput(field.id, e.target.value)
                    } else {
                      handleNumberInput(field.id, e.target.value)
                    }
                  }}
                />
                {field.unitSelect ? (
                  <select
                    className="absolute right-0 top-0 h-full px-2 pr-1 text-sm text-slate-500 bg-transparent border-l border-slate-200 rounded-r-xl focus:outline-none cursor-pointer"
                    value={field.unitSelect.value}
                    onChange={e => field.unitSelect.onChange(e.target.value)}
                  >
                    {field.unitSelect.options.map(o => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                ) : field.unit && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none select-none">
                    {field.unit}
                  </span>
                )}
              </div>
            )}

            {field.hint && <p className="text-xs text-slate-400">{field.hint}</p>}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 mt-2">
        <button type="submit" className="btn-primary">
          {submitLabel}
        </button>
        <button
          type="button"
          onClick={resetForm}
          className="btn-secondary text-sm flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Restablecer
        </button>
      </div>
    </form>
  )
}
