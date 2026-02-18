'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Error en admin:', error)
  }, [error])

  return (
    <div className="flex items-center justify-center py-20 px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl font-bold text-primary mb-4">Error</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Error en el panel de administracion
        </h1>
        <p className="text-gray-600 mb-8">
          Ocurrio un error al cargar el panel de administracion. Intenta
          refrescar la pagina o vuelve a intentarlo.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={reset}
            className="px-8 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition-colors"
          >
            Intentar de nuevo
          </button>
          <Link
            href="/"
            className="px-8 py-3 bg-white hover:bg-gray-100 text-gray-700 font-bold rounded-lg border border-gray-200 transition-colors"
          >
            Ir al Inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
