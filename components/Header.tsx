'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import SmartSearch from '@/components/SmartSearch'
import type { User } from '@supabase/supabase-js'

interface Profile {
  full_name: string
  role: string
}

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [showMenu, setShowMenu] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [scrolled, setScrolled] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Scroll listener for transparent → frosted glass transition
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)

      if (user) {
        supabase
          .from('profiles')
          .select('full_name, role')
          .eq('id', user.id)
          .single()
          .then(({ data }) => {
            setProfile(data)
            setLoading(false)
          })
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)

      if (session?.user) {
        supabase
          .from('profiles')
          .select('full_name, role')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => {
            setProfile(data)
          })
      } else {
        setProfile(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
    setShowMenu(false)
  }, [pathname])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileMenuOpen])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setShowMenu(false)
    setMobileMenuOpen(false)
    router.push('/')
    router.refresh()
  }

  const getDashboardLink = () => {
    if (profile?.role === 'admin') return '/admin'
    if (profile?.role === 'business_owner') return '/dashboard'
    return '/profile'
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const NAV_LINKS = [
    { label: 'Buscar negocios', href: '/buscar' },
    { label: 'Que hacer', href: '/que-hacer-en-lagos-de-moreno' },
    { label: 'Comer en Lagos', href: '/categorias/comida' },
    { label: 'Registrar mi negocio', href: '/registrar-negocio' },
  ]

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[rgba(255,253,248,0.88)] backdrop-blur-xl shadow-sm py-3'
            : 'bg-transparent py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-6">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 flex-shrink-0">
            <Image
              src="/logo.png"
              alt="SomosLagos"
              width={64}
              height={64}
              className="rounded-xl"
              priority
            />
            <div className="flex flex-col leading-none">
              <span
                className="font-bold tracking-tight"
                style={{ fontFamily: 'var(--display)', color: 'var(--ink)', fontSize: '22px' }}
              >
                Somos<span style={{ color: 'var(--coral)' }}>Lagos</span>
              </span>
              <span
                className="font-semibold uppercase"
                style={{ color: 'var(--muted)', fontSize: '9px', letterSpacing: '0.12em' }}
              >
                Pueblo mágico · MX
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3.5 py-2 rounded-full text-sm font-medium transition-colors hover:bg-black/5"
                style={{ color: 'var(--ink-soft)' }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Auth Actions */}
          <div className="hidden md:flex items-center gap-2">
            {loading ? (
              <div className="w-24 h-9 bg-black/10 animate-pulse rounded-full" />
            ) : user && profile ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-full hover:bg-black/5 transition-colors"
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
                    style={{ background: 'var(--coral)' }}
                  >
                    {getInitials(profile.full_name)}
                  </div>
                  <span className="text-sm font-medium max-w-[100px] truncate" style={{ color: 'var(--ink)' }}>
                    {profile.full_name.split(' ')[0]}
                  </span>
                  <svg
                    className={`w-4 h-4 transition-transform ${showMenu ? 'rotate-180' : ''}`}
                    style={{ color: 'var(--ink-soft)' }}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                    <div
                      className="absolute right-0 mt-2 w-56 py-1 z-50"
                      style={{
                        background: 'white',
                        border: '1px solid var(--hairline)',
                        boxShadow: 'var(--shadow-card)',
                        borderRadius: '16px',
                      }}
                    >
                      <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--hairline)' }}>
                        <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{profile.full_name}</p>
                        <p className="text-xs capitalize" style={{ color: 'var(--muted)' }}>{profile.role.replace('_', ' ')}</p>
                      </div>

                      <Link
                        href={getDashboardLink()}
                        className="flex items-center px-4 py-2.5 text-sm transition-colors hover:bg-black/5"
                        style={{ color: 'var(--ink)' }}
                        onClick={() => setShowMenu(false)}
                      >
                        <span className="mr-3">{profile.role === 'admin' ? '⚙️' : profile.role === 'business_owner' ? '📊' : '👤'}</span>
                        {profile.role === 'admin' ? 'Admin Panel' :
                         profile.role === 'business_owner' ? 'Mi Dashboard' :
                         'Mi Perfil'}
                      </Link>

                      {profile.role === 'customer' && (
                        <Link
                          href="/registrar-negocio"
                          className="flex items-center px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-black/5"
                          style={{ color: 'var(--coral)' }}
                          onClick={() => setShowMenu(false)}
                        >
                          <span className="mr-3">✨</span>
                          Registra tu Negocio GRATIS
                        </Link>
                      )}

                      <Link
                        href="/mis-pedidos"
                        className="flex items-center px-4 py-2.5 text-sm transition-colors hover:bg-black/5"
                        style={{ color: 'var(--ink)' }}
                        onClick={() => setShowMenu(false)}
                      >
                        <span className="mr-3">📦</span>
                        Mis Pedidos
                      </Link>

                      <Link
                        href="/favoritos"
                        className="flex items-center px-4 py-2.5 text-sm transition-colors hover:bg-black/5"
                        style={{ color: 'var(--ink)' }}
                        onClick={() => setShowMenu(false)}
                      >
                        <span className="mr-3">🤍</span>
                        Mis Favoritos
                      </Link>

                      <Link
                        href="/profile"
                        className="flex items-center px-4 py-2.5 text-sm transition-colors hover:bg-black/5"
                        style={{ color: 'var(--ink)' }}
                        onClick={() => setShowMenu(false)}
                      >
                        <span className="mr-3">⚙️</span>
                        Configuracion
                      </Link>

                      <div className="border-t my-1" style={{ borderColor: 'var(--hairline)' }} />

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <span className="mr-3">🚪</span>
                        Cerrar Sesion
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-full text-sm font-medium border transition-colors hover:bg-black/5"
                  style={{ borderColor: 'var(--hairline)', color: 'var(--ink-soft)' }}
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/registrar-negocio"
                  className="px-4 py-2 rounded-full text-sm font-semibold text-white transition-all hover:opacity-90"
                  style={{ background: 'var(--coral)' }}
                >
                  + Registrar negocio
                </Link>
              </>
            )}
          </div>

          {/* Mobile bar */}
          <div className="flex md:hidden items-center gap-2">
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-black/10 animate-pulse" />
            ) : user ? (
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
                style={{ background: 'var(--coral)' }}
              >
                {getInitials(profile?.full_name || '')}
              </button>
            ) : (
              <Link
                href="/registrar-negocio"
                className="px-3.5 py-2 rounded-full text-sm font-semibold text-white"
                style={{ background: 'var(--coral)' }}
              >
                Registrar
              </Link>
            )}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-full hover:bg-black/5 transition-colors"
              style={{ color: 'var(--ink)' }}
              aria-label="Menú"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
              </svg>
            </button>
          </div>

        </div>
      </header>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 bg-black/30 z-[60]"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Drawer panel */}
          <div
            className="md:hidden fixed top-0 right-0 bottom-0 w-[85%] max-w-sm z-[70] shadow-2xl flex flex-col"
            style={{ background: '#FFFDF8' }}
          >
            {/* Drawer header */}
            <div
              className="flex items-center justify-between px-4 py-3 border-b"
              style={{ borderColor: 'var(--hairline)' }}
            >
              <span className="text-lg font-bold" style={{ fontFamily: 'var(--display)', color: 'var(--ink)' }}>
                Somos<span style={{ color: 'var(--coral)' }}>Lagos</span>
              </span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Cerrar menu"
                className="p-2 rounded-full hover:bg-black/5 transition-colors"
                style={{ color: 'var(--ink)' }}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto">
              {/* Auth Section */}
              <div className="px-4 py-4 border-b" style={{ borderColor: 'var(--hairline)' }}>
                <div
                  className="rounded-2xl p-3"
                  style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid var(--hairline)' }}
                >
                  {loading ? (
                    <div className="h-12 bg-black/10 animate-pulse rounded-lg" />
                  ) : user && profile ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white flex-shrink-0"
                          style={{ background: 'var(--coral)' }}
                        >
                          {getInitials(profile.full_name)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: 'var(--ink)' }}>{profile.full_name}</p>
                          <p className="text-xs capitalize" style={{ color: 'var(--muted)' }}>{profile.role.replace('_', ' ')}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          href={getDashboardLink()}
                          className="flex-1 text-center px-3 py-2 text-sm font-semibold text-white rounded-lg transition-colors hover:opacity-90"
                          style={{ background: 'var(--coral)' }}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {profile.role === 'admin' ? '⚙️ Admin Panel' :
                           profile.role === 'business_owner' ? '📊 Mi Dashboard' :
                           '👤 Mi Perfil'}
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="px-3 py-2 text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          Salir
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <Link
                        href="/login"
                        className="flex-1 text-center px-4 py-2.5 text-sm font-semibold rounded-lg border-2 transition-colors hover:bg-black/5"
                        style={{ color: 'var(--coral)', borderColor: 'var(--coral)' }}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Iniciar sesión
                      </Link>
                      <Link
                        href="/registrar-negocio"
                        className="flex-1 text-center px-4 py-2.5 text-sm font-semibold text-white rounded-lg transition-colors hover:opacity-90"
                        style={{ background: 'var(--coral)' }}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Registrar negocio
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Mobile Search */}
              <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--hairline)' }}>
                <SmartSearch variant="mobile" onNavigate={() => setMobileMenuOpen(false)} />
              </div>

              {/* Nav Links */}
              <nav className="py-2">
                <Link
                  href="/categorias"
                  className="flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors hover:bg-black/5"
                  style={{ color: 'var(--ink)' }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="text-lg">📂</span> Explorar
                </Link>
                <Link
                  href="/descubre"
                  className="flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors hover:bg-black/5"
                  style={{ color: 'var(--ink)' }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="text-lg">🏛️</span> Descubre Lagos
                </Link>
                <Link
                  href="/buscar"
                  className="flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors hover:bg-black/5"
                  style={{ color: 'var(--ink)' }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="text-lg">🔍</span> Explorar Negocios
                </Link>
                <Link
                  href="/marketplace"
                  className="flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors hover:bg-black/5"
                  style={{ color: 'var(--ink)' }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="text-lg">🛒</span> Marketplace
                </Link>
                <Link
                  href="/que-hacer-en-lagos-de-moreno"
                  className="flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors hover:bg-black/5"
                  style={{ color: 'var(--ink)' }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="text-lg">🗺️</span> Qué Hacer
                </Link>
                <Link
                  href="/planes"
                  className="flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors hover:bg-black/5"
                  style={{ color: 'var(--ink)' }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="text-lg">💎</span> Planes
                </Link>
                {user && (
                  <>
                    <Link
                      href="/favoritos"
                      className="flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors hover:bg-black/5"
                      style={{ color: 'var(--ink)' }}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span className="text-lg">🤍</span> Mis Favoritos
                    </Link>
                    <Link
                      href="/mis-pedidos"
                      className="flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors hover:bg-black/5"
                      style={{ color: 'var(--ink)' }}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span className="text-lg">📦</span> Mis Pedidos
                    </Link>
                    <Link
                      href="/profile"
                      className="flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors hover:bg-black/5"
                      style={{ color: 'var(--ink)' }}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span className="text-lg">⚙️</span> Configuracion
                    </Link>
                  </>
                )}
                {!loading && !user && (
                  <Link
                    href="/registrar-negocio"
                    className="flex items-center gap-3 px-5 py-3 text-sm font-semibold transition-colors hover:opacity-90"
                    style={{ color: 'var(--coral)' }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="text-lg">✨</span> Registra tu Negocio GRATIS
                  </Link>
                )}
                {user && profile?.role === 'customer' && (
                  <Link
                    href="/registrar-negocio"
                    className="flex items-center gap-3 px-5 py-3 text-sm font-semibold transition-colors hover:opacity-90"
                    style={{ color: 'var(--coral)' }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="text-lg">✨</span> Registra tu Negocio GRATIS
                  </Link>
                )}
                {user && profile?.role === 'admin' && (
                  <>
                    <div className="border-t my-1" style={{ borderColor: 'var(--hairline)' }} />
                    <p className="px-5 py-2 text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>Admin</p>
                    <Link href="/admin/negocios" className="flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors hover:bg-black/5" style={{ color: 'var(--ink)' }} onClick={() => setMobileMenuOpen(false)}>
                      <span className="text-lg">🏪</span> Negocios
                    </Link>
                    <Link href="/admin/usuarios" className="flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors hover:bg-black/5" style={{ color: 'var(--ink)' }} onClick={() => setMobileMenuOpen(false)}>
                      <span className="text-lg">👥</span> Usuarios
                    </Link>
                    <Link href="/admin/pagos" className="flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors hover:bg-black/5" style={{ color: 'var(--ink)' }} onClick={() => setMobileMenuOpen(false)}>
                      <span className="text-lg">💳</span> Pagos
                    </Link>
                    <Link href="/admin/categorias" className="flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors hover:bg-black/5" style={{ color: 'var(--ink)' }} onClick={() => setMobileMenuOpen(false)}>
                      <span className="text-lg">📂</span> Categorias
                    </Link>
                    <Link href="/admin/publicidad" className="flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors hover:bg-black/5" style={{ color: 'var(--ink)' }} onClick={() => setMobileMenuOpen(false)}>
                      <span className="text-lg">📢</span> Publicidad
                    </Link>
                    <Link href="/admin/marketplace" className="flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors hover:bg-black/5" style={{ color: 'var(--ink)' }} onClick={() => setMobileMenuOpen(false)}>
                      <span className="text-lg">🛒</span> Marketplace Admin
                    </Link>
                    <Link href="/admin/blog" className="flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors hover:bg-black/5" style={{ color: 'var(--ink)' }} onClick={() => setMobileMenuOpen(false)}>
                      <span className="text-lg">✍️</span> Blog
                    </Link>
                  </>
                )}
              </nav>
            </div>
          </div>
        </>
      )}
    </>
  )
}
