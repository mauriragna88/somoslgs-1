'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function CheckoutError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Error en checkout:', error)
  }, [error])

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl font-bold text-primary mb-4">Error</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Error en el proceso de pago
        </h1>
        <p className="text-gray-600 mb-4">
          Ocurrio un error durante el proceso de pago. No te preocupes, no se
          realizo ningun cargo a tu cuenta.
        </p>
        <p className="text-gray-500 text-sm mb-8">
          Puedes intentar de nuevo o regresar al inicio para seguir explorando.
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
    </main>
  )
}
