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
  const menuRef = useRef<HTMLDivElement>(null)

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

  return (
    <>
    <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
            <Image
              src="/logo.png"
              alt="SomosLagos"
              width={44}
              height={44}
              className="w-10 h-10 md:w-11 md:h-11"
              priority
            />
            <span className="text-xl font-bold hidden sm:inline">
              <span className="text-secondary">Somos</span><span className="text-primary">Lagos</span>
            </span>
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden md:block flex-1 max-w-xs mx-4">
            <SmartSearch variant="header" />
          </div>

          {/* Desktop Nav + Auth */}
          <div className="hidden md:flex items-center space-x-1">
            <Link href="/categorias" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-primary rounded-lg hover:bg-primary/5 transition-colors">
              Categorias
            </Link>
            <Link href="/marketplace" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-primary rounded-lg hover:bg-primary/5 transition-colors">
              Marketplace
            </Link>
            <Link href="/que-hacer-en-lagos-de-moreno" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-primary rounded-lg hover:bg-primary/5 transition-colors">
              Qué Hacer
            </Link>
            <Link href="/planes" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-primary rounded-lg hover:bg-primary/5 transition-colors">
              Planes
            </Link>
            {user && (
              <Link href="/mis-pedidos" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-primary rounded-lg hover:bg-primary/5 transition-colors">
                Mis Pedidos
              </Link>
            )}

            <div className="w-px h-6 bg-gray-200 mx-2"></div>

            {loading ? (
              <div className="w-24 h-9 bg-gray-100 animate-pulse rounded-lg"></div>
            ) : user && profile ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-dark text-white rounded-full flex items-center justify-center text-xs font-semibold">
                    {getInitials(profile.full_name)}
                  </div>
                  <span className="text-sm font-medium text-gray-700 max-w-[100px] truncate">
                    {profile.full_name.split(' ')[0]}
                  </span>
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${showMenu ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)}></div>
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900">{profile.full_name}</p>
                        <p className="text-xs text-gray-500 capitalize">{profile.role.replace('_', ' ')}</p>
                      </div>

                      <Link
                        href={getDashboardLink()}
                        className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
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
                          className="flex items-center px-4 py-2.5 text-sm text-primary font-semibold hover:bg-primary/5 transition-colors"
                          onClick={() => setShowMenu(false)}
                        >
                          <span className="mr-3">✨</span>
                          Registra tu Negocio GRATIS
                        </Link>
                      )}

                      <Link
                        href="/mis-pedidos"
                        className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setShowMenu(false)}
                      >
                        <span className="mr-3">📦</span>
                        Mis Pedidos
                      </Link>

                      <Link
                        href="/profile"
                        className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setShowMenu(false)}
                      >
                        <span className="mr-3">⚙️</span>
                        Configuracion
                      </Link>

                      <div className="border-t border-gray-100 my-1"></div>

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
              <div className="flex items-center space-x-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-primary transition-colors"
                >
                  Entrar
                </Link>
                <Link
                  href="/registro"
                  className="px-5 py-2 text-sm font-semibold bg-gradient-to-r from-primary to-primary-dark text-white rounded-full transition-all shadow-sm hover:shadow-md hover:scale-105"
                >
                  Registrarse
                </Link>
              </div>
            )}
          </div>

          {/* Mobile: Search + Login/Avatar + Hamburger */}
          <div className="flex items-center space-x-1 md:hidden">
            <Link
              href="/buscar"
              aria-label="Buscar"
              className="p-2 text-gray-600 hover:text-primary rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </Link>

            {/* Mobile: Direct login button or user avatar */}
            {!loading && !user && (
              <Link
                href="/login"
                className="px-3 py-1.5 text-xs font-semibold bg-primary text-white rounded-full hover:bg-primary-dark transition-colors"
              >
                Entrar
              </Link>
            )}
            {!loading && user && profile && (
              <Link
                href={getDashboardLink()}
                aria-label="Mi cuenta"
                className="w-8 h-8 bg-gradient-to-br from-primary to-primary-dark text-white rounded-full flex items-center justify-center text-xs font-semibold"
              >
                {getInitials(profile.full_name)}
              </Link>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Cerrar menu' : 'Abrir menu'}
              className="p-2 text-gray-600 hover:text-primary rounded-lg hover:bg-gray-100 transition-colors"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

    </header>

      {/* Mobile Menu - Full screen overlay (outside header to avoid sticky clipping) */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 bg-black/30 z-[60]"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Menu panel */}
          <div className="md:hidden fixed top-0 right-0 bottom-0 w-[85%] max-w-sm bg-white z-[70] shadow-2xl flex flex-col">
            {/* Menu header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
              <span className="text-lg font-bold">
                <span className="text-secondary">Somos</span><span className="text-primary">Lagos</span>
              </span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Cerrar menu"
                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto">
              {/* Auth Section - FIRST so it's always visible */}
              <div className="px-4 py-4 border-b border-gray-100 bg-gray-50/50">
                {loading ? (
                  <div className="h-12 bg-gray-100 animate-pulse rounded-lg"></div>
                ) : user && profile ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-dark text-white rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                        {getInitials(profile.full_name)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{profile.full_name}</p>
                        <p className="text-xs text-gray-500 capitalize">{profile.role.replace('_', ' ')}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={getDashboardLink()}
                        className="flex-1 text-center px-3 py-2 text-sm font-semibold bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
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
                      className="flex-1 text-center px-4 py-2.5 text-sm font-semibold text-primary border-2 border-primary rounded-lg hover:bg-primary/5 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Entrar
                    </Link>
                    <Link
                      href="/registro"
                      className="flex-1 text-center px-4 py-2.5 text-sm font-semibold bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Registrarse
                    </Link>
                  </div>
                )}
              </div>

              {/* Search */}
              <div className="px-4 py-3 border-b border-gray-100">
                <SmartSearch variant="mobile" onNavigate={() => setMobileMenuOpen(false)} />
              </div>

              {/* Nav Links */}
              <nav className="py-2">
                <Link
                  href="/categorias"
                  className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="text-lg">📂</span> Categorias
                </Link>
                <Link
                  href="/buscar"
                  className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="text-lg">🔍</span> Explorar Negocios
                </Link>
                <Link
                  href="/marketplace"
                  className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="text-lg">🛒</span> Marketplace
                </Link>
                <Link
                  href="/que-hacer-en-lagos-de-moreno"
                  className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="text-lg">🏛️</span> Qué Hacer
                </Link>
                <Link
                  href="/planes"
                  className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="text-lg">💎</span> Planes
                </Link>
                {user && (
                  <>
                    <Link
                      href="/mis-pedidos"
                      className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span className="text-lg">📦</span> Mis Pedidos
                    </Link>
                    <Link
                      href="/profile"
                      className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span className="text-lg">⚙️</span> Configuracion
                    </Link>
                  </>
                )}
                {!loading && !user && (
                  <Link
                    href="/registrar-negocio"
                    className="flex items-center gap-3 px-5 py-3 text-sm font-semibold text-primary hover:bg-primary/5 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="text-lg">✨</span> Registra tu Negocio GRATIS
                  </Link>
                )}
                {user && profile?.role === 'customer' && (
                  <Link
                    href="/registrar-negocio"
                    className="flex items-center gap-3 px-5 py-3 text-sm font-semibold text-primary hover:bg-primary/5 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="text-lg">✨</span> Registra tu Negocio GRATIS
                  </Link>
                )}
                {user && profile?.role === 'admin' && (
                  <>
                    <div className="border-t border-gray-200 my-1"></div>
                    <p className="px-5 py-2 text-xs font-semibold text-gray-400 uppercase">Admin</p>
                    <Link href="/admin/negocios" className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setMobileMenuOpen(false)}>
                      <span className="text-lg">🏪</span> Negocios
                    </Link>
                    <Link href="/admin/usuarios" className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setMobileMenuOpen(false)}>
                      <span className="text-lg">👥</span> Usuarios
                    </Link>
                    <Link href="/admin/pagos" className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setMobileMenuOpen(false)}>
                      <span className="text-lg">💳</span> Pagos
                    </Link>
                    <Link href="/admin/categorias" className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setMobileMenuOpen(false)}>
                      <span className="text-lg">📂</span> Categorias
                    </Link>
                    <Link href="/admin/publicidad" className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setMobileMenuOpen(false)}>
                      <span className="text-lg">📢</span> Publicidad
                    </Link>
                    <Link href="/admin/marketplace" className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setMobileMenuOpen(false)}>
                      <span className="text-lg">🛒</span> Marketplace Admin
                    </Link>
                    <Link href="/admin/blog" className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setMobileMenuOpen(false)}>
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
