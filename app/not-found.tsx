import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl mb-6">🔍</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          Pagina no encontrada
        </h1>
        <p className="text-gray-600 mb-8">
          La pagina que buscas no existe o fue movida.
          Regresa al inicio para explorar negocios en Lagos de Moreno.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="px-8 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition-colors"
          >
            Ir al Inicio
          </Link>
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
