'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

export default function Footer() {
  const pathname = usePathname()

  // Hide footer on dashboard and admin pages
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
    return null
  }

  return (
    <footer className="bg-secondary">
      {/* Top accent line */}
      <div className="h-1 bg-gradient-to-r from-primary via-accent to-warm"></div>
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <Image
                src="/logo.png"
                alt="SomosLagos"
                width={40}
                height={40}
                className="w-10 h-10"
              />
              <span className="text-lg font-bold text-white">SomosLagos</span>
            </div>
            <p className="text-sm text-slate-400 max-w-md mb-4">
              La plataforma digital de Lagos de Moreno. Conectamos negocios locales con su comunidad.
            </p>
            <p className="text-xs text-slate-500">
              www.somoslagos.com.mx
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm">Explorar</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/buscar" className="text-slate-400 hover:text-accent transition-colors">Buscar negocios</Link></li>
              <li><Link href="/categorias" className="text-slate-400 hover:text-accent transition-colors">Categorias</Link></li>
            </ul>
          </div>

          {/* For Business */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm">Para negocios</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/registrar-negocio" className="text-slate-400 hover:text-accent transition-colors">Registrar negocio</Link></li>
              <li><Link href="/login" className="text-slate-400 hover:text-accent transition-colors">Iniciar sesion</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-700/50 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} SomosLagos. Todos los derechos reservados.
          </p>

          {/* Devogatec credit */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Desarrollado por</span>
            <Image
              src="/logod.jpg"
              alt="Devogatec"
              width={24}
              height={24}
              className="w-6 h-6 rounded"
            />
            <span className="text-xs text-slate-400 font-medium">Devogatec</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
