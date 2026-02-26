'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface AdminSidebarProps {
  userName: string
}

export default function AdminSidebar({ userName }: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  const handleLogout = async () => {
    if (!confirm('¿Seguro que quieres cerrar sesion?')) return
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  // Close sidebar on route change
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: '📊' },
    { href: '/admin/negocios', label: 'Negocios', icon: '🏪' },
    { href: '/admin/usuarios', label: 'Usuarios', icon: '👥' },
    { href: '/admin/pagos', label: 'Pagos', icon: '💳' },
    { href: '/admin/categorias', label: 'Categorías', icon: '📂' },
    { href: '/admin/publicidad', label: 'Publicidad', icon: '📢' },
  ]

  const sidebarContent = (
    <>
      {/* Header */}
      <div className="p-5 border-b border-slate-700/50 flex items-center justify-between">
        <Link href="/admin" className="flex items-center space-x-3">
          <Image
            src="/logo.png"
            alt="SomosLagos"
            width={36}
            height={36}
            className="w-9 h-9"
          />
          <div>
            <h1 className="text-base font-bold text-white">Admin Panel</h1>
            <p className="text-xs text-slate-400">SomosLagos</p>
          </div>
        </Link>
        {/* Close button - mobile only */}
        <button
          aria-label="Cerrar menu"
          onClick={() => setIsOpen(false)}
          className="lg:hidden p-2 text-slate-400 hover:text-white"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              className={`flex items-center space-x-3 px-4 py-2.5 rounded-xl transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg shadow-primary/20'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-slate-700/50">
        <div className="flex items-center space-x-3 px-3 py-3">
          <div className="w-9 h-9 bg-gradient-to-br from-accent to-accent-dark text-secondary rounded-full flex items-center justify-center font-bold text-xs">
            {userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{userName}</p>
            <p className="text-xs text-slate-400">Administrador</p>
          </div>
        </div>
        <Link
          href="/"
          className="block w-full px-4 py-2 text-sm text-center text-slate-300 hover:bg-white/5 hover:text-white rounded-lg transition-colors"
        >
          ← Volver al sitio
        </Link>
        <button
          onClick={handleLogout}
          className="block w-full px-4 py-2 mt-1 text-sm text-center text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors"
        >
          Cerrar Sesion
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 bg-white rounded-lg shadow-md border border-gray-200"
        aria-label="Abrir menú"
      >
        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar - desktop: always visible, mobile: slide-in */}
      <div
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-secondary border-r border-slate-700/50 flex flex-col
          transform transition-transform duration-200 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {sidebarContent}
      </div>
    </>
  )
}
