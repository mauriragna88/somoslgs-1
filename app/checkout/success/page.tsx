import Link from 'next/link'

interface SuccessPageProps {
  searchParams: Promise<{
    order_number?: string
    slug?: string
  }>
}

export default async function CheckoutSuccessPage({
  searchParams,
}: SuccessPageProps) {
  const { order_number, slug } = await searchParams

  return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: 'var(--ivory)' }}>
      <div className="bg-white rounded-2xl p-8 text-center max-w-md mx-4" style={{ boxShadow: 'var(--shadow-card)' }}>
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--ink)' }}>
          ¡Pago Exitoso!
        </h1>
        <p className="mb-2" style={{ color: 'var(--muted)' }}>Tu pedido ha sido confirmado</p>

        {order_number && (
          <>
            <p className="text-sm mb-1" style={{ color: 'var(--muted)' }}>Tu número de pedido:</p>
            <p className="text-3xl font-bold mb-6" style={{ color: 'var(--coral)' }}>
              {order_number}
            </p>
          </>
        )}

        <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
          El negocio recibirá tu pedido y te contactará pronto. Tu pago ha sido
          verificado automáticamente.
        </p>

        <div className="space-y-3">
          {slug && (
            <Link
              href={`/negocios/${slug}`}
              className="block w-full py-3 text-white font-bold rounded-lg transition-colors text-center"
              style={{ background: 'var(--coral)' }}
            >
              Volver al Negocio
            </Link>
          )}
          <Link
            href="/"
            className="block w-full py-3 font-bold rounded-lg transition-colors text-center"
            style={{ background: 'var(--cream)', color: 'var(--ink)' }}
          >
            Ir al Inicio
          </Link>
        </div>
      </div>
    </main>
  )
}
