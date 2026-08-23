'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DASHBOARD_NAV_TIERS } from '@/lib/constants'

interface Business {
  id: string
  name: string
  logo_url: string | null
  business_type?: 'productos' | 'servicios' | 'ambos'
  subscription_tier?: string
}

interface BusinessSidebarProps {
  userName: string
  businesses: Business[]
  pendingOrdersCount?: number
}

export default function BusinessSidebar({ userName, businesses, pendingOrdersCount = 0 }: BusinessSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  const handleLogout = async () => {
    if (!confirm('¿Seguro que quieres cerrar sesión?')) return
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const [selectedBusinessId, setSelectedBusinessIdState] = useState<string>(
    businesses.length > 0 ? businesses[0].id : ''
  )

  useEffect(() => {
    const cookieValue = document.cookie
      .split('; ')
      .find(row => row.startsWith('selected_business_id='))
      ?.split('=')[1]
    if (cookieValue && businesses.some(b => b.id === cookieValue)) {
      setSelectedBusinessIdState(cookieValue)
    }
  }, [businesses])

  useEffect(() => { setIsOpen(false) }, [pathname])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const setSelectedBusinessId = (id: string) => {
    setSelectedBusinessIdState(id)
    document.cookie = `selected_business_id=${id}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`
    window.location.reload()
  }

  const selectedBusiness = businesses.find(b => b.id === selectedBusinessId) || businesses[0]
  const bType = selectedBusiness?.business_type || 'productos'
  const tier = selectedBusiness?.subscription_tier || 'gratis'
  const catalogLabel = bType === 'servicios' ? 'Servicios' : bType === 'ambos' ? 'Productos y Servicios' : 'Productos'
  const catalogIcon = bType === 'servicios' ? '🔧' : '📦'

  const allNavItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊', key: 'dashboard' },
    { href: '/dashboard/productos', label: catalogLabel, icon: catalogIcon, key: 'productos' },
    { href: '/dashboard/pedidos', label: 'Pedidos', icon: '🛒', key: 'pedidos' },
    { href: '/dashboard/estadisticas', label: 'Estadísticas', icon: '📈', key: 'estadisticas' },
    { href: '/dashboard/mi-negocio', label: 'Mi Negocio', icon: '🏪', key: 'mi-negocio' },
  ]

  const allowedKeys = DASHBOARD_NAV_TIERS[tier] || DASHBOARD_NAV_TIERS.gratis
  const navItems = allNavItems.filter(item => allowedKeys.includes(item.key))
  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const sidebarContent = (
    <>
      {/* Header */}
      <div className="p-5 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <Link href="/dashboard" className="flex items-center gap-3">
          <div
            className="rounded-lg overflow-hidden flex-shrink-0 ring-1"
            style={{ width: 44, height: 29, background: '#FBF0E5', '--tw-ring-color': 'rgba(255,255,255,0.15)' } as React.CSSProperties}
          >
            <Image src="/logo-symbol.png" alt="SomosLagos" width={44} height={29} className="object-cover" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white" style={{ fontFamily: 'var(--display)' }}>Mi Dashboard</h1>
            <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.45)' }}>SomosLagos</p>
          </div>
        </Link>
        <button aria-label="Cerrar menu" onClick={() => setIsOpen(false)} className="lg:hidden p-1.5 rounded-lg" style={{ color: 'rgba(255,255,255,0.5)' }}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Business Selector */}
      {businesses.length > 0 && (
        <div className="p-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <label className="block text-[11px] font-semibold uppercase tracking-widest px-1 mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Negocio activo
          </label>
          <select
            value={selectedBusinessId || ''}
            onChange={(e) => setSelectedBusinessId(e.target.value)}
            className="w-full px-3 py-2 text-sm text-white focus:outline-none"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10 }}
          >
            {businesses.map((business) => (
              <option key={business.id} value={business.id} style={{ background: '#1F2937', color: 'white' }}>
                {business.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              className="flex items-center gap-3 py-2.5 rounded-xl transition-all text-sm font-medium"
              style={isActive
                ? { background: 'rgba(255,107,53,0.14)', color: 'var(--coral)', borderLeft: '3px solid var(--coral)', paddingLeft: 13, paddingRight: 16 }
                : { color: 'rgba(255,255,255,0.65)', paddingLeft: 16, paddingRight: 16 }
              }
            >
              <span className="text-base">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.key === 'pedidos' && pendingOrdersCount > 0 && (
                <span className="min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold text-white flex items-center justify-center" style={{ background: '#ef4444' }}>
                  {pendingOrdersCount > 99 ? '99+' : pendingOrdersCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-3 px-3 py-3 mb-1">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,var(--coral),var(--gold))' }}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{userName}</p>
            <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.45)' }}>Dueño de Negocio</p>
          </div>
        </div>
        <Link href="/" className="block w-full px-4 py-2 text-sm text-center rounded-xl transition-colors" style={{ color: 'rgba(255,255,255,0.55)' }}>
          ← Volver al sitio
        </Link>
        <button onClick={handleLogout} className="block w-full px-4 py-2 mt-0.5 text-sm text-center rounded-xl transition-colors" style={{ color: '#f87171' }}>
          Cerrar Sesión
        </button>
      </div>
    </>
  )

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 rounded-xl shadow-lg"
        aria-label="Abrir menú"
        style={{ background: 'var(--ink)', border: '1px solid rgba(255,255,255,0.12)' }}
      >
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {isOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/60 z-40" onClick={() => setIsOpen(false)} />
      )}

      <div
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 flex flex-col transform transition-transform duration-200 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{ background: 'var(--ink)', borderRight: '1px solid rgba(255,255,255,0.06)' }}
      >
        {sidebarContent}
      </div>
    </>
  )
}
