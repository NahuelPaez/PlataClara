import { useState } from 'react'

const LINKS = [
  { label: '¿Dónde rinde más mi plata?',  href: '#donde-rinde-mas' },
  { label: 'Simuladores',                 href: '#simuladores'     },
  { label: '¿Cómo funciona cada producto?', href: '#educacion'     },
  { label: 'Plantillas Excel',            href: '#descargables'    },
  { label: 'Nosotros',                    href: '#nosotros'        },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)

  function scrollTo(e, href) {
    e.preventDefault()
    setOpen(false)
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="#hero" onClick={e => scrollTo(e, '#hero')} className="flex items-center gap-2 group">
          <span className="text-2xl">🪙</span>
          <span className="text-xl font-bold text-primary-600 group-hover:text-primary-700 transition-colors">
            Plata<span className="text-accent font-extrabold">Clara</span>
          </span>
        </a>

        {/* Desktop nav */}
        <ul className="hidden md:flex items-center">
          {LINKS.map((link, i) => (
            <li key={link.href} className="flex items-center">
              {i > 0 && <span className="w-px h-4 bg-slate-200 mx-1" />}
              <a
                href={link.href}
                onClick={e => scrollTo(e, link.href)}
                className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors duration-150 whitespace-nowrap"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          onClick={() => setOpen(o => !o)}
          aria-label="Abrir menú"
        >
          {open ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-slate-100 bg-white">
          <ul className="py-2 px-4 space-y-1">
            {LINKS.map(link => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={e => scrollTo(e, link.href)}
                  className="block px-3 py-2.5 text-sm font-medium text-slate-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  )
}
