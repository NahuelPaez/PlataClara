import { useState, useEffect, useRef } from 'react'

const ACCESOS = [
  { label: '📊 Comparar Tasas',       href: '#donde-rinde-mas', desc: 'Quién paga más'        },
  { label: '🧮 Simuladores',          href: '#simuladores',     desc: 'Calculá rendimientos'  },
  { label: '📚 Educación Financiera', href: '#educacion',       desc: 'Qué es cada producto'  },
  { label: '📥 Descargar Excel',      href: '#descargables',    desc: 'Planillas gratis'      },
]

function scrollTo(e, href) {
  e.preventDefault()
  document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' })
}

// ── Hoja-billete ─────────────────────────────────────────────────
function LeafBill({ cx, cy, rot, prog, w = 70, h = 39, shade = 0 }) {
  if (prog <= 0) return null
  const sc = Math.min(1, prog)

  const PALETTES = [
    ['#14532d', '#166534', '#86efac'],
    ['#15803d', '#16a34a', '#bbf7d0'],
    ['#065f46', '#047857', '#6ee7b7'],
    ['#1a4731', '#1e7a45', '#a7f3d0'],
  ]
  const [bg, mid, hi] = PALETTES[shade % 4]

  return (
    <g transform={`translate(${cx},${cy}) rotate(${rot}) scale(${sc})`} opacity={Math.pow(sc, 0.35)}>
      {/* Sombra */}
      <rect x={-w/2+2.5} y={-h/2+3.5} width={w} height={h} rx="3.5" fill="#000" opacity="0.22" />
      {/* Cuerpo del billete */}
      <rect x={-w/2} y={-h/2} width={w} height={h} rx="3.5" fill={bg} />
      {/* Banda superior más clara */}
      <rect x={-w/2} y={-h/2} width={w} height={h*0.43} rx="3" fill={mid} opacity="0.52" />
      {/* Marco interior */}
      <rect x={-w/2+2.5} y={-h/2+2.5} width={w-5} height={h-5} rx="2.2"
            fill="none" stroke={hi} strokeWidth="0.9" opacity="0.44" />
      {/* Sellos ovalados */}
      <ellipse cx={-w*0.28} cy={0} rx={w*0.115} ry={h*0.33} fill={hi} opacity="0.14" />
      <ellipse cx={ w*0.28} cy={0} rx={w*0.115} ry={h*0.33} fill={hi} opacity="0.14" />
      {/* Denominación esquinas */}
      <text x={-w*0.31} y={-h*0.21} textAnchor="middle" fontSize="4.2" fontWeight="700"
            fill={hi} opacity="0.55" fontFamily="monospace">$100</text>
      <text x={ w*0.31} y={-h*0.21} textAnchor="middle" fontSize="4.2" fontWeight="700"
            fill={hi} opacity="0.55" fontFamily="monospace">$100</text>
      {/* Texto central $ARS */}
      <text x={0} y="2.8" textAnchor="middle" fontSize={w < 48 ? "6" : "8.5"}
            fontWeight="900" fill={hi} fontFamily="Inter,system-ui,sans-serif" opacity="0.9">$ARS</text>
      {/* Reflejo superior */}
      <rect x={-w/2} y={-h/2} width={w} height={h*0.25} rx="3.5" fill="rgba(255,255,255,0.14)" />
    </g>
  )
}

// ── Sol naciente ──────────────────────────────────────────────────
function RisingSun({ fillPct }) {
  const pct    = Math.max(0, Math.min(100, fillPct))
  const sunY   = 500 - (pct / 100) * 640       // 500 (bajo tierra) → -140 (alto)
  const opacity = Math.min(1, Math.max(0, (pct - 8) / 22))
  const risen  = pct > 62

  return (
    <svg viewBox="0 -200 280 600" className="w-64 h-[500px]" aria-hidden="true">
      <defs>
        <radialGradient id="sunCore" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#fffde7" />
          <stop offset="45%"  stopColor="#fde68a" />
          <stop offset="100%" stopColor="#f59e0b" />
        </radialGradient>
        <radialGradient id="sunHalo" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="rgba(251,191,36,0.38)" />
          <stop offset="65%"  stopColor="rgba(251,191,36,0.1)"  />
          <stop offset="100%" stopColor="rgba(251,191,36,0)"    />
        </radialGradient>
      </defs>

      <g transform={`translate(140, ${sunY})`} opacity={opacity}>
        {/* Halo difuso */}
        <circle r="76" fill="url(#sunHalo)" />

        {/* Rayos que rotan lentamente */}
        <g>
          <animateTransform attributeName="transform" type="rotate"
            from="0" to="360" dur="44s" repeatCount="indefinite" />
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i * 30) * Math.PI / 180
            return (
              <line key={i}
                x1={Math.cos(a) * 52} y1={Math.sin(a) * 52}
                x2={Math.cos(a) * 70} y2={Math.sin(a) * 70}
                stroke="#fbbf24" strokeWidth="3.2" strokeLinecap="round" opacity="0.72" />
            )
          })}
        </g>

        {/* Cuerpo del sol */}
        <circle r="46" fill="url(#sunCore)" />

        {/* Reflejo */}
        <ellipse cx="-12" cy="-13" rx="13" ry="7.5" fill="rgba(255,255,255,0.28)" />

        {/* Pulso suave cuando está arriba */}
        {risen && (
          <circle r="46" fill="none" stroke="#fde68a" strokeWidth="3" opacity="0">
            <animate attributeName="r"       values="46;66;46"   dur="3.2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.45;0;0.45" dur="3.2s" repeatCount="indefinite" />
          </circle>
        )}
      </g>
    </svg>
  )
}

// ── Planta de dinero ──────────────────────────────────────────────
function MoneyPlant({ fillPct }) {
  const pct = Math.max(0, Math.min(100, fillPct))
  const p = (start, range = 12) => Math.min(1, Math.max(0, (pct - start) / range))

  // El tallo se revela desde abajo hacia arriba conforme scrollea
  const stemReveal = p(0, 26)
  const stemClipY  = 362 - stemReveal * 340  // se mueve de 362 → 22

  return (
    <svg viewBox="0 -200 280 600" className="w-64 h-[500px] drop-shadow-2xl select-none" aria-hidden="true">
      <defs>
        <linearGradient id="stemG" x1="0.2" y1="0" x2="0.8" y2="0">
          <stop offset="0%"   stopColor="#14532d" />
          <stop offset="35%"  stopColor="#16a34a" />
          <stop offset="65%"  stopColor="#22c55e" />
          <stop offset="100%" stopColor="#15803d" />
        </linearGradient>
        <radialGradient id="soilG" cx="50%" cy="35%" r="60%">
          <stop offset="0%"   stopColor="#5c3a1a" />
          <stop offset="100%" stopColor="#2a1608" />
        </radialGradient>
        <radialGradient id="soilTopG" cx="50%" cy="25%" r="55%">
          <stop offset="0%"   stopColor="#6f4c22" />
          <stop offset="100%" stopColor="#3d2410" />
        </radialGradient>
        <radialGradient id="shadowG" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="rgba(0,0,0,0.38)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)"    />
        </radialGradient>
        <clipPath id="stemClip">
          <rect x="0" y={stemClipY} width="280" height="400" />
        </clipPath>
      </defs>

      {/* ── SOMBRA EN EL PISO ── */}
      <ellipse cx="140" cy="394" rx="118" ry="11" fill="url(#shadowG)" />

      {/* ══════════════════════════════════
          SUELO FÉRTIL (más ancho)
      ══════════════════════════════════ */}
      {/* Capa trasera (profundidad) */}
      <ellipse cx="140" cy="381" rx="116" ry="21" fill="#180b04" />
      {/* Cuerpo principal del suelo */}
      <ellipse cx="140" cy="373" rx="112" ry="18" fill="url(#soilG)" />
      {/* Superficie */}
      <ellipse cx="140" cy="365" rx="106" ry="14" fill="url(#soilTopG)" />
      {/* Efecto húmedo en el centro */}
      <ellipse cx="128" cy="362" rx="30" ry="5.5" fill="rgba(255,170,60,0.06)" />

      {/* Piedras y textura */}
      <ellipse cx={ 80} cy="363" rx="5.5" ry="2.5" fill="#8b5e30" opacity="0.60" />
      <ellipse cx="104" cy="358" rx="3.5" ry="1.8" fill="#9b6c38" opacity="0.55" />
      <ellipse cx="153" cy="358" rx="4.2" ry="2"   fill="#8b5e30" opacity="0.65" />
      <ellipse cx="178" cy="363" rx="5"   ry="2.3" fill="#7a4c26" opacity="0.68" />
      <ellipse cx="200" cy="358" rx="3.2" ry="1.6" fill="#9b6c38" opacity="0.55" />
      <circle  cx="118" cy="360" r="2"   fill="#6b4020" opacity="0.46" />
      <circle  cx="162" cy="355" r="1.8" fill="#7a4c26" opacity="0.46" />

      {/* Pequeños brotes de pasto — izquierda */}
      <path d="M 38 370 Q 30 356 26 342"  stroke="#4ade80" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M 44 368 Q 41 353 47 339"  stroke="#22c55e" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M 32 372 Q 22 360 20 349"  stroke="#16a34a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Florecita izquierda */}
      <circle cx="26" cy="341" r="3.8" fill="#fde68a" opacity="0.7" />
      <circle cx="26" cy="341" r="2"   fill="#f59e0b" />

      {/* Pequeños brotes de pasto — derecha */}
      <path d="M 242 370 Q 250 356 254 342" stroke="#4ade80" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M 236 368 Q 239 353 233 339" stroke="#22c55e" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M 248 372 Q 258 360 260 349" stroke="#16a34a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Florecita derecha */}
      <circle cx="254" cy="341" r="3.8" fill="#fde68a" opacity="0.7" />
      <circle cx="254" cy="341" r="2"   fill="#f59e0b" />

      {/* ══════════════════════════════════
          TALLO PRINCIPAL — crece con scroll
      ══════════════════════════════════ */}
      {/* Halo de luz */}
      <path d="M 140 362 C 135 324 148 284 140 244 C 132 204 150 164 140 124 C 130 84 142 54 140 24"
            fill="none" stroke="rgba(74,222,128,0.16)" strokeWidth="20" strokeLinecap="round"
            clipPath="url(#stemClip)" />
      {/* Tallo */}
      <path d="M 140 362 C 135 324 148 284 140 244 C 132 204 150 164 140 124 C 130 84 142 54 140 24"
            fill="none" stroke="url(#stemG)" strokeWidth="9" strokeLinecap="round"
            clipPath="url(#stemClip)" />
      {/* Reflejo lateral */}
      <path d="M 138 362 C 133 324 146 284 138 244 C 130 204 148 164 138 124 C 128 84 140 54 138 24"
            fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2.8" strokeLinecap="round"
            clipPath="url(#stemClip)" />

      {/* ══════════════════════════════════
          PECÍOLOS (mini-tallos de cada hoja)
      ══════════════════════════════════ */}
      {p(16,5) > 0 && <path d="M 139 308 Q 118 304 110 301" fill="none" stroke="#15803d" strokeWidth="3.2" strokeLinecap="round" opacity={p(16,5)} />}
      {p(20,5) > 0 && <path d="M 141 274 Q 163 270 170 268" fill="none" stroke="#15803d" strokeWidth="3.2" strokeLinecap="round" opacity={p(20,5)} />}
      {p(30,5) > 0 && <path d="M 138 234 Q 117 230 109 228" fill="none" stroke="#15803d" strokeWidth="2.9" strokeLinecap="round" opacity={p(30,5)} />}
      {p(34,5) > 0 && <path d="M 142 200 Q 165 196 172 194" fill="none" stroke="#15803d" strokeWidth="2.9" strokeLinecap="round" opacity={p(34,5)} />}
      {p(44,5) > 0 && <path d="M 137 162 Q 117 158 111 156" fill="none" stroke="#15803d" strokeWidth="2.6" strokeLinecap="round" opacity={p(44,5)} />}
      {p(48,5) > 0 && <path d="M 142 128 Q 163 124 169 122" fill="none" stroke="#15803d" strokeWidth="2.6" strokeLinecap="round" opacity={p(48,5)} />}
      {p(58,5) > 0 && <path d="M 136 90  Q 117  86 113  84" fill="none" stroke="#15803d" strokeWidth="2.3" strokeLinecap="round" opacity={p(58,5)} />}
      {p(62,5) > 0 && <path d="M 141 57  Q 161  53 165  51" fill="none" stroke="#15803d" strokeWidth="2.3" strokeLinecap="round" opacity={p(62,5)} />}
      {p(70,5) > 0 && <path d="M 140 27  Q 140  20 140  16" fill="none" stroke="#15803d" strokeWidth="2"   strokeLinecap="round" opacity={p(70,5)} />}

      {/* ══════════════════════════════════
          HOJAS-BILLETE — aparecen de abajo a arriba
          Nivel 1: pct 18-30  (grandes)
          Nivel 2: pct 30-46
          Nivel 3: pct 44-60
          Nivel 4: pct 58-74
          Brote:   pct 70-82
      ══════════════════════════════════ */}

      {/* Nivel 1 — base, las más grandes */}
      <LeafBill cx={82}  cy={302} rot={-40} prog={p(18,12)} shade={0} w={78} h={44} />
      <LeafBill cx={200} cy={268} rot={ 36} prog={p(22,12)} shade={2} w={78} h={44} />

      {/* Nivel 2 */}
      <LeafBill cx={77}  cy={228} rot={-46} prog={p(32,12)} shade={1} w={68} h={38} />
      <LeafBill cx={204} cy={194} rot={ 42} prog={p(36,12)} shade={3} w={68} h={38} />

      {/* Nivel 3 */}
      <LeafBill cx={79}  cy={156} rot={-50} prog={p(46,12)} shade={2} w={62} h={35} />
      <LeafBill cx={202} cy={122} rot={ 46} prog={p(50,12)} shade={0} w={62} h={35} />

      {/* Nivel 4 — más pequeñas, arriba */}
      <LeafBill cx={82}  cy={ 84} rot={-48} prog={p(60,12)} shade={3} w={53} h={30} />
      <LeafBill cx={197} cy={ 51} rot={ 43} prog={p(64,12)} shade={1} w={53} h={30} />

      {/* Brote en la punta */}
      <LeafBill cx={140} cy={ 22} rot={ -4} prog={p(72,10)} shade={2} w={38} h={22} />

      {/* ══════════════════════════════════
          DESTELLOS dorados (después de crecer)
      ══════════════════════════════════ */}
      {pct > 68 && (
        <>
          <circle cx={ 52} cy={280} r="2.5" fill="#fbbf24" opacity="0">
            <animate attributeName="opacity" values="0;0.85;0" dur="2.2s" repeatCount="indefinite" begin="0s" />
          </circle>
          <circle cx={228} cy={244} r="2"   fill="#fbbf24" opacity="0">
            <animate attributeName="opacity" values="0;0.85;0" dur="2.8s" repeatCount="indefinite" begin="0.6s" />
          </circle>
          <circle cx={ 58} cy={148} r="1.8" fill="#86efac" opacity="0">
            <animate attributeName="opacity" values="0;0.7;0"  dur="3.1s" repeatCount="indefinite" begin="1.1s" />
          </circle>
          <circle cx={222} cy={112} r="2.2" fill="#fbbf24" opacity="0">
            <animate attributeName="opacity" values="0;0.8;0"  dur="2.5s" repeatCount="indefinite" begin="1.7s" />
          </circle>
          <circle cx={100} cy={ 62} r="1.6" fill="#86efac" opacity="0">
            <animate attributeName="opacity" values="0;0.75;0" dur="3.4s" repeatCount="indefinite" begin="0.3s" />
          </circle>
          <circle cx={178} cy={ 38} r="2"   fill="#fbbf24" opacity="0">
            <animate attributeName="opacity" values="0;0.8;0"  dur="2s"   repeatCount="indefinite" begin="0.9s" />
          </circle>
        </>
      )}
    </svg>
  )
}

// ── Hero section ──────────────────────────────────────────────────
export default function Hero() {
  const [fillPct, setFillPct] = useState(0)
  const sectionRef = useRef(null)

  useEffect(() => {
    function onScroll() {
      const el = sectionRef.current
      if (!el) return
      const h = el.offsetHeight
      const pct = Math.min(100, Math.max(0, (window.scrollY - 10) / (h * 0.55)) * 100)
      setFillPct(pct)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <section
      id="hero"
      ref={sectionRef}
      className="relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0a5c60 0%, #0d7377 55%, #14a0a6 100%)' }}
    >
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-10 pointer-events-none"
           style={{ background: '#f59e0b' }} />
      <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full opacity-10 pointer-events-none"
           style={{ background: '#10b981' }} />

      <div className="relative max-w-6xl mx-auto px-4 pt-20 pb-24 md:pt-28 md:pb-32">
        <div className="flex items-end gap-4 md:gap-8">

          <div className="flex-1 min-w-0 flex flex-col justify-center pb-4">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white text-sm font-medium px-4 py-1.5 rounded-full mb-6 self-start">
              <span>🇦🇷</span>
              <span>Finanzas personales en argentino</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight mb-5">
              Tu plata,{' '}
              <span className="text-amber-300">más clara</span>{' '}
              que nunca.
            </h1>
            <p className="text-lg md:text-xl text-white/80 max-w-xl mb-10 leading-relaxed">
              Aprendé qué es cada instrumento financiero, simulá cuánto podés ganar
              y comparás las tasas de los principales bancos y billeteras de Argentina.
              Sin jerga, sin vueltas.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl">
              {ACCESOS.map(a => (
                <a key={a.href} href={a.href} onClick={e => scrollTo(e, a.href)}
                   className="flex flex-col items-center justify-center gap-1 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-4 text-white transition-all duration-200 group text-center w-full">
                  <span className="font-semibold text-sm group-hover:scale-105 transition-transform">{a.label}</span>
                  <span className="text-xs text-white/60">{a.desc}</span>
                </a>
              ))}
            </div>
          </div>

          <div className="hidden lg:block flex-shrink-0 mr-10 translate-y-4">
            <div className="relative w-64 h-[500px]" style={{ isolation: 'isolate' }}>
              {/* Sol — detrás del árbol */}
              <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
                <RisingSun fillPct={fillPct} />
              </div>
              {/* Árbol — delante */}
              <div className="relative" style={{ zIndex: 1 }}>
                <MoneyPlant fillPct={fillPct} />
              </div>
            </div>
          </div>

        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
        <svg viewBox="0 0 1440 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path d="M0 48L1440 48L1440 20C1200 44 960 56 720 44C480 32 240 8 0 20L0 48Z" fill="#f8faf8" />
        </svg>
      </div>
    </section>
  )
}
