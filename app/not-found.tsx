import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--ivory)' }}>
      <div className="text-center max-w-md">
        <div className="text-8xl mb-6">🔍</div>
        <h1 className="text-4xl font-bold mb-3" style={{ color: 'var(--ink)' }}>
          Pagina no encontrada
        </h1>
        <p className="mb-8" style={{ color: 'var(--muted)' }}>
          La pagina que buscas no existe o fue movida.
          Regresa al inicio para explorar negocios en Lagos de Moreno.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="px-8 py-3 text-white font-bold rounded-lg transition-colors"
            style={{ background: 'var(--coral)' }}
          >
            Ir al Inicio
          </Link>
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
