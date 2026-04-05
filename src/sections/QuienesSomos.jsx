import { useState } from 'react'

export default function QuienesSomos() {
  const [mensaje, setMensaje] = useState('')
  const [enviado, setEnviado] = useState(false)

  function handleEnviar(e) {
    e.preventDefault()
    if (!mensaje.trim()) return
    window.location.href = `mailto:hola.plataclara@gmail.com?subject=Mensaje desde PlataClara&body=${encodeURIComponent(mensaje)}`
    setEnviado(true)
    setMensaje('')
  }

  return (
    <section id="nosotros" className="py-16 bg-white">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-primary-500 uppercase tracking-widest mb-2">
            Quiénes Somos
          </p>
          <h2 className="section-title text-center">Finanzas para todos, sin vueltas</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="card">
            <div className="text-3xl mb-4">🎯</div>
            <h3 className="font-bold text-slate-800 text-lg mb-3">Nuestra misión</h3>
            <p className="text-slate-600 leading-relaxed text-sm">
              Democratizar la educación financiera en Argentina. Queremos que cualquier persona,
              sin importar su nivel de conocimiento, pueda entender qué hacer con su dinero,
              comparar opciones y tomar mejores decisiones financieras.
            </p>
          </div>
          <div className="card">
            <div className="text-3xl mb-4">💡</div>
            <h3 className="font-bold text-slate-800 text-lg mb-3">Por qué lo creamos</h3>
            <p className="text-slate-600 leading-relaxed text-sm">
              En Argentina hay mucha información dispersa y difícil de comparar.
              Decidimos crear un lugar simple donde cualquier persona pueda entender
              sus opciones y simular rendimientos antes de tomar decisiones.
            </p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-10">
          <div className="flex items-start gap-4">
            <span className="text-2xl flex-shrink-0">⚠️</span>
            <div>
              <h4 className="font-bold text-amber-800 mb-2">Aviso legal importante</h4>
              <p className="text-sm text-amber-700 leading-relaxed">
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

        <div className="card">
          <h3 className="font-bold text-slate-800 text-lg mb-1">Contacto</h3>
          <p className="text-sm text-slate-500 mb-4">
            ¿Te quedó alguna duda? ¿Querés que agreguemos algo? Mandanos tu mensaje, leemos todo.
          </p>
          {enviado ? (
            <p className="text-sm text-emerald-600 font-medium">¡Gracias! Tu cliente de correo se abrió con el mensaje listo para enviar.</p>
          ) : (
            <form onSubmit={handleEnviar} className="flex flex-col sm:flex-row gap-3">
              <textarea
                className="input-field flex-1 resize-none text-sm"
                rows={3}
                placeholder="Escribí tu mensaje acá..."
                value={mensaje}
                onChange={e => setMensaje(e.target.value)}
              />
              <button
                type="submit"
                disabled={!mensaje.trim()}
                className="btn-primary self-end sm:self-stretch px-6 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
              >
                Enviar
              </button>
            </form>
          )}
        </div>

        <div className="mt-12 pt-8 border-t border-slate-100 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="text-2xl">🪙</span>
            <span className="text-xl font-bold text-primary-600">
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
