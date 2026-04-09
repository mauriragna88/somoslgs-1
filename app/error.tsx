'use client'

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl font-bold text-primary mb-4">Oops</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Algo salio mal
        </h1>
        <p className="text-gray-600 mb-8">
          Ocurrio un error inesperado. Por favor intenta de nuevo o regresa al
          inicio.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={reset}
            className="px-8 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition-colors"
          >
            Intentar de nuevo
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="px-8 py-3 bg-white hover:bg-gray-100 text-gray-700 font-bold rounded-lg border border-gray-200 transition-colors"
          >
            Ir al Inicio
          </button>
        </div>
      </div>
    </main>
  )
}
