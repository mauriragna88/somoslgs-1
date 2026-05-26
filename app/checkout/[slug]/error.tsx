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
    <main className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--ivory)' }}>
      <div className="text-center max-w-md">
        <div className="text-6xl font-bold mb-4" style={{ color: 'var(--coral)' }}>Error</div>
        <h1 className="text-2xl font-bold mb-3" style={{ color: 'var(--ink)' }}>
          Error en el proceso de pago
        </h1>
        <p className="mb-4" style={{ color: 'var(--muted)' }}>
          Ocurrio un error durante el proceso de pago. No te preocupes, no se
          realizo ningun cargo a tu cuenta.
        </p>
        <p className="text-sm mb-8" style={{ color: 'var(--muted)' }}>
          Puedes intentar de nuevo o regresar al inicio para seguir explorando.
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
            href="/"
            className="px-8 py-3 bg-white hover:bg-gray-100 font-bold rounded-lg border transition-colors"
            style={{ color: 'var(--ink)', borderColor: 'var(--hairline)' }}
          >
            Ir al Inicio
          </Link>
        </div>
      </div>
    </main>
  )
}
