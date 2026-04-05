import { descargarPlanillaCompleta } from '../utils/excel'

const HOJAS = [
  {
    icono: '📋',
    nombre: 'Presupuesto Personal',
    descripcion: 'Planificá tus ingresos y gastos mes a mes con fórmulas automáticas. Separados en fijos, variables y ahorro. 12 meses en una sola hoja.',
    color: 'bg-blue-50 border-blue-100',
    iconColor: 'text-blue-500',
  },
  {
    icono: '💳',
    nombre: 'Control de Gastos',
    descripcion: 'Categorizá tus gastos del mes y compará contra tu presupuesto. Con fórmulas de diferencia y % ahorrado.',
    color: 'bg-amber-50 border-amber-100',
    iconColor: 'text-amber-500',
  },
  {
    icono: '📈',
    nombre: 'Tracker de Inversiones',
    descripcion: 'Registrá cada inversión con fecha, monto, rendimiento y estado. Llevá el control de toda tu cartera en un solo lugar.',
    color: 'bg-violet-50 border-violet-100',
    iconColor: 'text-violet-500',
  },
]

export default function Descargables() {
  return (
    <section id="descargables" className="py-16 bg-slate-50">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-10">
          <p className="text-sm font-semibold text-primary-500 uppercase tracking-widest mb-2">
            Descargables en Excel
          </p>
          <h2 className="section-title">Herramientas gratis para ordenar tu plata</h2>
          <p className="section-subtitle">
            Un solo archivo Excel con tres hojas listas para usar, con estilos y fórmulas incluidas.
            Sin registrarte, sin pagar, sin trampa.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-stretch">
          {/* Cards */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-5">
            {HOJAS.map((h, i) => (
              <div key={i} className={`card flex flex-col gap-3 border ${h.color} hover:shadow-md transition-shadow`}>
                <div className="flex items-center gap-3">
                  <div className={`text-3xl ${h.iconColor}`}>{h.icono}</div>
                  <h3 className="font-bold text-slate-800 text-sm leading-tight">{h.nombre}</h3>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed flex-1">{h.descripcion}</p>
              </div>
            ))}
          </div>

          {/* Botón único */}
          <div className="flex lg:flex-col items-center justify-center gap-3 lg:w-56 shrink-0">
            <button
              onClick={() => descargarPlanillaCompleta()}
              className="flex flex-col items-center justify-center gap-3 w-full btn-primary rounded-2xl py-8 px-6 text-center"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span className="font-bold text-base leading-tight">Descargar Excel completo</span>
              <span className="text-xs opacity-80">3 hojas · gratis</span>
            </button>
            <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 w-full">
              <span className="text-emerald-500 text-base leading-none mt-0.5">■</span>
              <p className="text-xs text-emerald-800 leading-snug">
                Las celdas en <strong>verde</strong> son las que tenés que completar vos.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-2xl border border-slate-100 p-6 text-center">
          <p className="text-sm text-slate-500">
            💡 <strong>¿Querés más plantillas?</strong> Estamos trabajando en nuevas herramientas.
            Escribinos a <a href="mailto:hola.plataclara@gmail.com" className="text-primary-500 hover:underline">hola.plataclara@gmail.com</a> con tu sugerencia.
          </p>
        </div>
      </div>
    </section>
  )
}
