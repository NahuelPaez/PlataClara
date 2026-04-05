import Cartera from '../simuladores/Cartera'

export default function CarteraSection() {
  return (
    <section id="cartera" className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <p className="text-sm font-semibold text-primary-500 uppercase tracking-widest mb-2">
            Armá tu cartera
          </p>
          <h2 className="section-title">Diseñá tu cartera diversificada</h2>
          <p className="section-subtitle">
            Distribuí tu capital entre distintos activos y calculá el rendimiento
            promedio ponderado y el riesgo total de tu cartera.
          </p>
        </div>

        <div className="card">
          <Cartera />
        </div>
      </div>
    </section>
  )
}
