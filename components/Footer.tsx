'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

const FOOTER_LINKS = {
  explorar: [
    { label: 'Buscar negocios', href: '/buscar' },
    { label: 'Que hacer', href: '/que-hacer-en-lagos-de-moreno' },
    { label: 'Comer en Lagos', href: '/categorias/comida' },
    { label: 'Categorias', href: '/categorias' },
    { label: 'Descubre Lagos', href: '/descubre' },
  ],
  negocios: [
    { label: 'Registrar mi negocio', href: '/registrar-negocio' },
    { label: 'Para negocios', href: '/para-negocios' },
    { label: 'Iniciar sesion', href: '/login' },
    { label: 'Marketplace', href: '/marketplace' },
  ],
  legal: [
    { label: 'Términos y condiciones', href: '/terminos' },
    { label: 'Aviso de privacidad', href: '/aviso-de-privacidad' },
  ],
}

const ZONAS = [
  { label: 'Centro', slug: encodeURIComponent('Centro') },
  { label: 'San Francisco', slug: encodeURIComponent('San Francisco') },
  { label: 'La Loma', slug: encodeURIComponent('La Loma') },
  { label: 'Obregón', slug: encodeURIComponent('Obregón') },
  { label: 'Jardines del Parque', slug: encodeURIComponent('Jardines del Parque') },
  { label: 'Valle del Campestre', slug: encodeURIComponent('Valle del Campestre') },
  { label: '8 de Julio', slug: encodeURIComponent('8 de Julio') },
]

function FacebookIcon() {
  return (
    <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function YouTubeIcon() {
  return (
    <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )
}

export default function Footer() {
  const pathname = usePathname()

  // Hide footer on dashboard and admin pages
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
    return null
  }

  return (
    <footer className="pt-16 pb-8" style={{ background: '#0F172A' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Main grid */}
        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-10 pb-12 border-b"
          style={{ borderColor: 'rgba(255,253,248,0.08)' }}
        >
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div
                className="rounded-full overflow-hidden flex-shrink-0 ring-1"
                style={{
                  width: 36,
                  height: 36,
                  background: '#FBF0E5',
                  '--tw-ring-color': 'rgba(255,253,248,0.15)',
                } as React.CSSProperties}
              >
                <Image
                  src="/logo-symbol.png"
                  alt="SomosLagos"
                  width={36}
                  height={36}
                  className="object-cover"
                />
              </div>
              <span
                className="text-white font-bold text-lg"
                style={{ fontFamily: 'var(--display)' }}
              >
                Somos<span style={{ color: 'var(--coral)' }}>Lagos</span>
              </span>
            </Link>
            <p
              className="text-sm mb-6 leading-relaxed"
              style={{ color: 'rgba(255,253,248,0.55)' }}
            >
              La plataforma del Pueblo Mágico de Lagos de Moreno, Jalisco.
            </p>
            {/* Social icons */}
            <div className="flex gap-2">
              <a
                href="https://www.facebook.com/profile.php?id=61588240258457"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:text-white"
                style={{
                  background: 'rgba(255,253,248,0.07)',
                  color: 'rgba(255,253,248,0.55)',
                  border: '1px solid rgba(255,253,248,0.08)',
                }}
              >
                <FacebookIcon />
              </a>
              <a
                href="https://instagram.com/somoslagos"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:text-white"
                style={{
                  background: 'rgba(255,253,248,0.07)',
                  color: 'rgba(255,253,248,0.55)',
                  border: '1px solid rgba(255,253,248,0.08)',
                }}
              >
                <InstagramIcon />
              </a>
              <a
                href="https://x.com/somoslagos"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X (Twitter)"
                className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:text-white"
                style={{
                  background: 'rgba(255,253,248,0.07)',
                  color: 'rgba(255,253,248,0.55)',
                  border: '1px solid rgba(255,253,248,0.08)',
                }}
              >
                <XIcon />
              </a>
              <a
                href="https://youtube.com/@somoslagos"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:text-white"
                style={{
                  background: 'rgba(255,253,248,0.07)',
                  color: 'rgba(255,253,248,0.55)',
                  border: '1px solid rgba(255,253,248,0.08)',
                }}
              >
                <YouTubeIcon />
              </a>
            </div>
          </div>

          {/* Explorar */}
          <div>
            <h5
              className="text-[11px] font-semibold uppercase tracking-[0.08em] mb-4"
              style={{ color: 'rgba(255,253,248,0.4)', fontFamily: 'var(--display)' }}
            >
              Explorar
            </h5>
            <ul className="space-y-2.5">
              {FOOTER_LINKS.explorar.map(l => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm transition-colors hover:text-white"
                    style={{ color: 'rgba(255,253,248,0.60)' }}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Negocios */}
          <div>
            <h5
              className="text-[11px] font-semibold uppercase tracking-[0.08em] mb-4"
              style={{ color: 'rgba(255,253,248,0.4)', fontFamily: 'var(--display)' }}
            >
              Negocios
            </h5>
            <ul className="space-y-2.5">
              {FOOTER_LINKS.negocios.map(l => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm transition-colors hover:text-white"
                    style={{ color: 'rgba(255,253,248,0.60)' }}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h5
              className="text-[11px] font-semibold uppercase tracking-[0.08em] mb-4"
              style={{ color: 'rgba(255,253,248,0.4)', fontFamily: 'var(--display)' }}
            >
              Legal
            </h5>
            <ul className="space-y-2.5">
              {FOOTER_LINKS.legal.map(l => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm transition-colors hover:text-white"
                    style={{ color: 'rgba(255,253,248,0.60)' }}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Zonas chips */}
        <div className="py-8 border-b" style={{ borderColor: 'rgba(255,253,248,0.06)' }}>
          <p
            className="text-[10px] uppercase tracking-widest mb-3 font-semibold"
            style={{ color: 'rgba(255,253,248,0.3)', fontFamily: 'var(--display)' }}
          >
            Negocios por zona
          </p>
          <div className="flex flex-wrap gap-2">
            {ZONAS.map(z => (
              <Link
                key={z.slug}
                href={`/negocios-en/${z.slug}`}
                className="text-xs px-3 py-1.5 rounded-full transition-colors hover:text-white"
                style={{
                  background: 'rgba(255,253,248,0.06)',
                  color: 'rgba(255,253,248,0.55)',
                  border: '1px solid rgba(255,253,248,0.08)',
                }}
              >
                {z.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-[12px]"
          style={{ color: 'rgba(255,253,248,0.4)' }}
        >
          <span>© 2026 SomosLagos · Hecho con 💛 en Lagos de Moreno, Jal.</span>
          <span>Pueblo mágico · México</span>
        </div>

      </div>
    </footer>
  )
}
