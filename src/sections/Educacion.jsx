import { useState } from 'react'
import ProductCard from '../components/ProductCard'
import productos from '../data/productos.json'

const CATEGORIAS = [
  { id: 'todas',    label: 'Todos'       },
  { id: 'ahorro',   label: '💰 Ahorro'   },
  { id: 'inversion',label: '📈 Inversión' },
  { id: 'dolar',    label: '💵 Dólar'    },
]

export default function Educacion() {
  const [cat, setCat] = useState('ahorro')

  const filtrados = cat === 'todas'
    ? productos
    : productos.filter(p => p.categoria === cat)

  return (
    <section id="educacion" className="bg-slate-50 py-6">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-primary-500 uppercase tracking-widest mb-1">
            Educación Financiera
          </p>
          <h2 className="section-title">Antes de invertir o ahorrar, entendé qué es cada cosa</h2>
          <p className="section-subtitle">
            Cada sección explica el producto en lenguaje simple: qué es, para quién sirve
            y qué nivel de riesgo tiene. Sin términos complicados.
          </p>

          {/* Filtros */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIAS.map(c => (
              <button
                key={c.id}
                onClick={() => setCat(c.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                  cat === c.id ? 'tab-active' : 'tab-inactive'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid de productos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtrados.map(p => (
            <ProductCard key={p.id} producto={p} />
          ))}
        </div>
      </div>
    </section>
  )
}
