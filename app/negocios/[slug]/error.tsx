'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function NegocioError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Error en pagina de negocio:', error)
  }, [error])

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl font-bold text-primary mb-4">Error</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Error al cargar el negocio
        </h1>
        <p className="text-gray-600 mb-8">
          No pudimos cargar la informacion de este negocio. Intenta de nuevo o
          busca otro negocio en nuestro directorio.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={reset}
            className="px-8 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition-colors"
          >
            Intentar de nuevo
          </button>
          <Link
            href="/buscar"
            className="px-8 py-3 bg-white hover:bg-gray-100 text-gray-700 font-bold rounded-lg border border-gray-200 transition-colors"
          >
            Buscar Negocios
          </Link>
        </div>
      </div>
    </main>
  )
}
