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
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-sm p-8 text-center max-w-md mx-4">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          ¡Pago Exitoso!
        </h1>
        <p className="text-gray-600 mb-2">Tu pedido ha sido confirmado</p>

        {order_number && (
          <>
            <p className="text-sm text-gray-500 mb-1">Tu número de pedido:</p>
            <p className="text-3xl font-bold text-primary mb-6">
              {order_number}
            </p>
          </>
        )}

        <p className="text-sm text-gray-500 mb-6">
          El negocio recibirá tu pedido y te contactará pronto. Tu pago ha sido
          verificado automáticamente.
        </p>

        <div className="space-y-3">
          {slug && (
            <Link
              href={`/negocios/${slug}`}
              className="block w-full py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition-colors text-center"
            >
              Volver al Negocio
            </Link>
          )}
          <Link
            href="/"
            className="block w-full py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-lg transition-colors text-center"
          >
            Ir al Inicio
          </Link>
        </div>
      </div>
    </main>
  )
}
