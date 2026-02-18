'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Footer() {
  const pathname = usePathname()

  // Hide footer on dashboard and admin pages
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
    return null
  }

  return (
    <footer className="bg-secondary text-gray-400 py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-dark rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">S</span>
              </div>
              <span className="text-lg font-bold text-white">SomosLagos</span>
            </div>
            <p className="text-sm text-gray-400 max-w-md mb-4">
              La plataforma digital de Lagos de Moreno. Conectamos negocios locales con su comunidad.
            </p>
            <p className="text-xs text-gray-500">
              www.somoslagos.com.mx
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-white mb-3 text-sm">Explorar</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/buscar" className="hover:text-primary transition-colors">Buscar negocios</Link></li>
              <li><Link href="/categorias" className="hover:text-primary transition-colors">Categorias</Link></li>
            </ul>
          </div>

          {/* For Business */}
          <div>
            <h4 className="font-semibold text-white mb-3 text-sm">Para negocios</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/registrar-negocio" className="hover:text-primary transition-colors">Registrar negocio</Link></li>
              <li><Link href="/login" className="hover:text-primary transition-colors">Iniciar sesion</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700/50 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500">
            SomosLagos v2.0.0 &mdash; Hecho con cariño en Lagos de Moreno
          </p>
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} SomosLagos. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
