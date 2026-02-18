'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface AdminSidebarProps {
  userName: string
}

export default function AdminSidebar({ userName }: AdminSidebarProps) {
  const pathname = usePathname()

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: '📊' },
    { href: '/admin/negocios', label: 'Negocios', icon: '🏪' },
    { href: '/admin/usuarios', label: 'Usuarios', icon: '👥' },
    { href: '/admin/pagos', label: 'Pagos', icon: '💳' },
    { href: '/admin/categorias', label: 'Categorías', icon: '📂' },
  ]

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <Link href="/admin" className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">S</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Admin Panel</h1>
            <p className="text-xs text-gray-500">SomosLagos</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3 px-4 py-3">
          <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-semibold">
            {userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">{userName}</p>
            <p className="text-xs text-gray-500">Administrador</p>
          </div>
        </div>
        <Link
          href="/"
          className="block w-full px-4 py-2 text-sm text-center text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          ← Volver al sitio
        </Link>
      </div>
    </div>
  )
}
