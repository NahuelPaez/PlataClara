import { useState } from 'react'
import promociones from '../data/promociones.json'

const TIPOS = [
  { id: 'todas',          label: 'Todas' },
  { id: 'bono_bienvenida',label: '🎁 Bono bienvenida' },
  { id: 'cashback',       label: '💸 Cashback' },
  { id: 'beneficio',      label: '⭐ Beneficio especial' },
]

const TIPO_BADGE = {
  bono_bienvenida: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: '🎁 Bono bienvenida' },
  cashback:        { bg: 'bg-blue-100',    text: 'text-blue-700',    label: '💸 Cashback' },
  beneficio:       { bg: 'bg-purple-100',  text: 'text-purple-700',  label: '⭐ Beneficio' },
}

function isVencida(fechaStr) {
  if (!fechaStr) return false
  return new Date(fechaStr) < new Date()
}

export default function Promociones() {
  const [filtro, setFiltro] = useState('todas')

  const filtradas = filtro === 'todas'
    ? promociones
    : promociones.filter(p => p.tipo === filtro)

  return (
    <section id="promociones" className="py-8 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <p className="text-sm font-semibold text-primary-500 uppercase tracking-widest mb-2">
            Ofertas y Promociones
          </p>
          <h2 className="section-title">Aprovechá los bonos y beneficios vigentes</h2>
          <p className="section-subtitle">
            Billeteras y bancos compiten por tus depósitos. Acá reunimos los mejores
            bonos de bienvenida, cashbacks y beneficios actuales.
          </p>

          <div className="flex flex-wrap gap-2">
            {TIPOS.map(t => (
              <button
                key={t.id}
                onClick={() => setFiltro(t.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  filtro === t.id ? 'tab-active' : 'tab-inactive'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtradas.map(promo => {
            const vencida = isVencida(promo.vencimiento)
            const badge = TIPO_BADGE[promo.tipo]
            return (
              <div
                key={promo.id}
                className={`card flex flex-col gap-3 transition-shadow ${
                  vencida ? 'opacity-50 grayscale' : 'hover:shadow-md'
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{promo.emoji}</span>
                    <span className="font-semibold text-slate-700 text-sm">{promo.entidad}</span>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${badge.bg} ${badge.text}`}>
                    {badge.label}
                  </span>
                </div>

                {/* Título y monto */}
                <div>
                  <h3 className="font-bold text-slate-800 text-base">{promo.titulo}</h3>
                  <p className="text-2xl font-extrabold text-accent mt-1">{promo.monto}</p>
                </div>

                {/* Descripción */}
                <p className="text-sm text-slate-600 leading-relaxed flex-1">{promo.descripcion}</p>

                {/* Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                  <span className={`text-xs ${vencida ? 'text-red-400' : 'text-slate-400'}`}>
                    {vencida ? '❌ Vencida' : `⏰ Hasta: ${promo.vencimiento}`}
                  </span>
                  {!vencida && (
                    <span className="text-xs text-primary-500 font-medium cursor-pointer hover:underline">
                      {promo.link_texto} →
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <p className="text-xs text-slate-400 mt-6 text-center">
          Las condiciones de las promociones pueden cambiar. Verificá en el sitio oficial antes de abrir una cuenta.
          PlataClara no tiene relación comercial con ninguna de estas entidades.
        </p>
      </div>
    </section>
  )
}
