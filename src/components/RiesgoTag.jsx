const CONFIG = {
  bajo:  { label: 'Riesgo Bajo',  bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  medio: { label: 'Riesgo Medio', bg: 'bg-amber-100',   text: 'text-amber-700',   dot: 'bg-amber-500'   },
  alto:  { label: 'Riesgo Alto',  bg: 'bg-red-100',     text: 'text-red-700',     dot: 'bg-red-500'     },
}

export default function RiesgoTag({ riesgo, size = 'sm' }) {
  const c = CONFIG[riesgo] || CONFIG.medio
  const textSize = size === 'xs' ? 'text-xs' : 'text-xs font-medium'
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${c.bg} ${c.text} ${textSize}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  )
}
