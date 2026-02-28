'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import SmartSearch from '@/components/SmartSearch'
import type { User } from '@supabase/supabase-js'

interface Profile {
  full_name: string
  role: string
}

export default function Header() {
  const router = useRouter()
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
  }, [])

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
          <div className="hidden md:block flex-1 max-w-md mx-8">
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

          {/* Mobile: Search + Hamburger */}
          <div className="flex items-center space-x-2 md:hidden">
            <Link
              href="/buscar"
              aria-label="Buscar"
              className="p-2 text-gray-600 hover:text-primary rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </Link>
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

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white/95 backdrop-blur-lg">
          <div className="container mx-auto px-4 py-4 space-y-3">
            {/* Mobile Search */}
            <SmartSearch variant="mobile" onNavigate={() => setMobileMenuOpen(false)} />

            {/* Mobile Nav Links */}
            <nav className="space-y-1">
              <Link
                href="/categorias"
                className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Categorias
              </Link>
              <Link
                href="/buscar"
                className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Explorar Negocios
              </Link>
              <Link
                href="/marketplace"
                className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Marketplace
              </Link>
              {user && (
                <Link
                  href="/mis-pedidos"
                  className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Mis Pedidos
                </Link>
              )}
            </nav>

            {/* Mobile Auth */}
            <div className="border-t border-gray-100 pt-3">
              {loading ? (
                <div className="h-10 bg-gray-100 animate-pulse rounded-lg"></div>
              ) : user && profile ? (
                <div className="space-y-1">
                  <div className="flex items-center px-4 py-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-dark text-white rounded-full flex items-center justify-center text-xs font-semibold mr-3">
                      {getInitials(profile.full_name)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{profile.full_name}</p>
                      <p className="text-xs text-gray-500 capitalize">{profile.role.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <Link
                    href={getDashboardLink()}
                    className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {profile.role === 'admin' ? '⚙️ Admin Panel' :
                     profile.role === 'business_owner' ? '📊 Mi Dashboard' :
                     '👤 Mi Perfil'}
                  </Link>
                  {profile.role === 'customer' && (
                    <Link
                      href="/registrar-negocio"
                      className="block px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary/5 rounded-lg transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      ✨ Registra tu Negocio GRATIS
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    🚪 Cerrar Sesion
                  </button>
                </div>
              ) : (
                <div className="flex space-x-3">
                  <Link
                    href="/login"
                    className="flex-1 text-center px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Entrar
                  </Link>
                  <Link
                    href="/registro"
                    className="flex-1 text-center px-4 py-2.5 text-sm font-semibold bg-primary hover:bg-primary-dark text-white rounded-xl transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Registrarse
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
