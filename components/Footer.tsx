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
            <p className="text-xs text-slate-500 mb-4">
              www.somoslagos.com.mx
            </p>
            {/* Social - SomosLagos Facebook */}
            <a
              href="https://www.facebook.com/profile.php?id=61588240258457"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-slate-400 hover:text-accent transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              <span className="text-xs font-medium">Facebook</span>
            </a>
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
          <a
            href="https://www.facebook.com/devogatec/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <span className="text-xs text-slate-500">Desarrollado por</span>
            <Image
              src="/logod.jpg"
              alt="Devogatec"
              width={24}
              height={24}
              className="w-6 h-6 rounded"
            />
            <span className="text-xs text-slate-400 font-medium">Devogatec</span>
          </a>
        </div>
      </div>
    </footer>
  )
}
