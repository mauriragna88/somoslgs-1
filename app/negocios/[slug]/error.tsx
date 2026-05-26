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
    <main className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--ivory)' }}>
      <div className="text-center max-w-md">
        <div className="text-6xl font-bold mb-4" style={{ color: 'var(--coral)' }}>Error</div>
        <h1 className="text-2xl font-bold mb-3" style={{ color: 'var(--ink)' }}>
          Error al cargar el negocio
        </h1>
        <p className="mb-8" style={{ color: 'var(--muted)' }}>
          No pudimos cargar la informacion de este negocio. Intenta de nuevo o
          busca otro negocio en nuestro directorio.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={reset}
            className="px-8 py-3 text-white font-bold rounded-lg transition-colors"
            style={{ background: 'var(--coral)' }}
          >
            Intentar de nuevo
          </button>
          <Link
            href="/buscar"
            className="px-8 py-3 bg-white hover:bg-gray-100 font-bold rounded-lg border transition-colors"
            style={{ color: 'var(--ink)', borderColor: 'var(--hairline)' }}
          >
            Buscar Negocios
          </Link>
        </div>
      </div>
    </main>
  )
}
