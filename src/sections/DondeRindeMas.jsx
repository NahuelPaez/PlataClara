import ComparadorRendimiento from '../simuladores/ComparadorRendimiento'

export default function DondeRindeMas() {
  return (
    <section id="donde-rinde-mas" className="py-8 bg-slate-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-5">
          <p className="text-xs font-semibold text-primary-500 uppercase tracking-widest mb-1">
            Comparador
          </p>
          <h2 className="section-title">Tasas y cotización USD oficial</h2>
        </div>

        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3 flex items-start gap-3">
          <span className="text-amber-500 text-lg mt-0.5">⚠️</span>
          <p className="text-sm text-amber-800">
            <strong>Ojo con la inflación.</strong> Con una inflación mensual de ~3-4% (más de 40% anual), muchas de estas tasas no alcanzan para mantener el poder adquisitivo de tu plata. Usá los simuladores para comparar contra la inflación real.
          </p>
        </div>

        <div className="card">
          <ComparadorRendimiento />
        </div>
      </div>
    </section>
  )
}
