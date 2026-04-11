import { useEffect, useRef, useState } from 'react'
import Navbar         from './components/Navbar'
import Hero           from './sections/Hero'
import Educacion      from './sections/Educacion'
import Simuladores    from './sections/Simuladores'
import DondeRindeMas  from './sections/DondeRindeMas'
import Descargables   from './sections/Descargables'
import QuienesSomos   from './sections/QuienesSomos'

const BILLS = ['💵', '💵', '💵', '💸', '💵']

function useScrollBills() {
  const lastY = useRef(window.scrollY)
  const throttle = useRef(false)

  useEffect(() => {
    function spawnBill(y) {
      const bill = document.createElement('span')
      bill.textContent = BILLS[Math.floor(Math.random() * BILLS.length)]

      // Aparece pegado al borde derecho, en la posición vertical del scroll
      const size = 20 + Math.random() * 14
      const angle = -30 + Math.random() * 60          // rotación inicial
      const tx = -(80 + Math.random() * 120)           // vuela hacia la izquierda
      const ty = -60 + Math.random() * 120             // sube o baja aleatoriamente

      bill.style.cssText = `
        position: fixed;
        right: 18px;
        top: ${y}px;
        font-size: ${size}px;
        pointer-events: none;
        z-index: 9999;
        opacity: 1;
        transform: rotate(${angle}deg);
        transition: transform 0.7s ease-out, opacity 0.7s ease-out, top 0.7s ease-out;
        will-change: transform, opacity, top;
      `
      document.body.appendChild(bill)

      // Forzar reflow para que la transición arranque
      bill.getBoundingClientRect()

      bill.style.transform = `translate(${tx}px, ${ty}px) rotate(${angle + (Math.random() > 0.5 ? 180 : -180)}deg)`
      bill.style.opacity = '0'
      bill.style.top = `${y + ty}px`

      setTimeout(() => bill.remove(), 750)
    }

    function onScroll() {
      if (throttle.current) return
      throttle.current = true

      const currentY = window.scrollY
      const delta = Math.abs(currentY - lastY.current)
      lastY.current = currentY

      // Cuántos billetes según velocidad de scroll
      const count = Math.min(Math.floor(delta / 40) + 1, 4)
      const viewportH = window.innerHeight

      for (let i = 0; i < count; i++) {
        // Posición Y aleatoria dentro del viewport visible
        const y = Math.random() * viewportH
        setTimeout(() => spawnBill(y), i * 60)
      }

      setTimeout(() => { throttle.current = false }, 80)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
}

export default function App() {
  useScrollBills()
  const [showTop, setShowTop] = useState(false)

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="min-h-screen bg-warm font-sans">
      <Navbar />
      <main>
        <Hero />
        <DondeRindeMas />
        <Simuladores />
        <Educacion />
        <Descargables />
        <QuienesSomos />
      </main>

      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-50 bg-primary-600 hover:bg-primary-700 text-white rounded-full w-11 h-11 flex items-center justify-center shadow-lg transition-colors"
          aria-label="Ir arriba"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      )}
    </div>
  )
}
