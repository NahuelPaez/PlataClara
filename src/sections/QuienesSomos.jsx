import { useState } from 'react'

export default function QuienesSomos() {
  const [nombre, setNombre] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [enviando, setEnviando] = useState(false)

  async function handleEnviar(e) {
    e.preventDefault()
    if (!mensaje.trim()) return
    setEnviando(true)
    try {
      await fetch('https://formspree.io/f/xreorzra', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, mensaje }),
      })
      setEnviado(true)
      setNombre('')
      setMensaje('')
    } catch {
      // silently fail
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section id="nosotros" className="py-8 bg-white">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-6">
          <p className="text-xs font-semibold text-primary-500 uppercase tracking-widest mb-1">
            Quiénes Somos
          </p>
          <h2 className="section-title text-center">Finanzas para todos, sin vueltas</h2>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 mb-4">
          {/* Izquierda: misión + por qué — se estiran para igualar la altura del contacto */}
          <div className="lg:w-5/12 flex flex-col gap-3">
            <div className="card flex-1 flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">🎯</span>
              <div>
                <h3 className="font-bold text-slate-800 text-sm mb-1">Nuestra misión</h3>
                <p className="text-slate-600 leading-normal text-xs">
                  Democratizar la educación financiera en Argentina. Queremos que cualquier persona,
                  sin importar su nivel de conocimiento, pueda entender qué hacer con su dinero,
                  comparar opciones y tomar mejores decisiones financieras.
                </p>
              </div>
            </div>
            <div className="card flex-1 flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">💡</span>
              <div>
                <h3 className="font-bold text-slate-800 text-sm mb-1">Por qué lo creamos</h3>
                <p className="text-slate-600 leading-normal text-xs">
                  En Argentina hay mucha información dispersa y difícil de comparar.
                  Decidimos crear un lugar simple donde cualquier persona pueda entender
                  sus opciones y simular rendimientos antes de tomar decisiones.
                </p>
              </div>
            </div>
          </div>

          {/* Derecha: contacto */}
          <div className="card flex-1 flex flex-col">
            <h3 className="font-bold text-slate-800 text-sm mb-1">Contacto</h3>
            <p className="text-xs text-slate-500 mb-3">
              Sugerencias, dudas o lo que sea. Leemos todo.
            </p>
            {enviado ? (
              <p className="text-sm text-emerald-600 font-medium">¡Gracias por tu mensaje! Te respondemos a la brevedad.</p>
            ) : (
              <form onSubmit={handleEnviar} className="flex flex-col gap-3 flex-1">
                <input
                  type="text"
                  className="input-field text-sm"
                  placeholder="Tu nombre (opcional)"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                />
                <textarea
                  className="input-field resize-none text-sm flex-1"
                  rows={4}
                  placeholder="Escribí tu mensaje acá..."
                  value={mensaje}
                  onChange={e => setMensaje(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  disabled={!mensaje.trim() || enviando}
                  className="btn-primary self-start px-6 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {enviando ? 'Enviando...' : 'Enviar'}
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-4">
          <div className="flex items-start gap-3">
            <span className="text-lg flex-shrink-0">⚠️</span>
            <div>
              <h4 className="font-bold text-amber-800 text-sm mb-1">Aviso legal importante</h4>
              <p className="text-xs text-amber-700 leading-normal">
                <strong>PlataClara es un sitio educativo e informativo.</strong> No somos
                asesores financieros registrados ante la CNV ni brindamos asesoramiento de inversión.
                La información publicada es de carácter general y no considera tu situación
                financiera personal. Los rendimientos simulados son estimativos y no garantizan
                resultados futuros. Antes de tomar decisiones financieras, consultá con un
                asesor certificado.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-slate-100 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-xl">🪙</span>
            <span className="text-base font-bold text-primary-600">
              Plata<span className="text-accent font-extrabold">Clara</span>
            </span>
          </div>
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} PlataClara · Hecho en Argentina 🇦🇷 ·
            Solo con fines educativos · No somos asesores financieros
          </p>
        </div>
      </div>
    </section>
  )
}
