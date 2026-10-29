import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

interface SuccessPageProps {
  searchParams: Promise<{
    order_number?: string
    slug?: string
  }>
}

type CheckoutOrder = {
  order_number: string
  payment_status: string | null
  status: string | null
  business: { slug: string } | null
}

export default async function CheckoutSuccessPage({
  searchParams,
}: SuccessPageProps) {
  const { order_number, slug } = await searchParams
  let order: CheckoutOrder | null = null

  // The result URL is not proof of payment. Only expose a result for the
  // authenticated owner of an order, then derive copy from payment_status.
  if (order_number) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data } = await supabase
        .from('orders')
        .select('order_number, payment_status, status, business:businesses(slug)')
        .eq('order_number', order_number)
        .eq('user_id', user.id)
        .maybeSingle() as unknown as { data: CheckoutOrder | null }

      if (data && (!slug || data.business?.slug === slug)) {
        order = data
      }
    }
  }

  const paymentVerified = order?.payment_status === 'verified'
  const orderReceived = Boolean(order)
  const businessSlug = order?.business?.slug

  const heading = paymentVerified
    ? 'Pago confirmado'
    : orderReceived
      ? 'Pedido recibido'
      : 'No pudimos confirmar este pedido'

  const description = paymentVerified
    ? 'El pago fue verificado y el negocio recibió tu pedido.'
    : orderReceived
      ? 'El pedido fue registrado. El estado del pago se actualizará cuando se confirme por el método elegido.'
      : 'Inicia sesión con la cuenta que hizo el pedido o revisa tus pedidos para confirmar su estado.'

  return (
    <main className="min-h-screen flex items-center justify-center sl-checkout-success-v2" style={{ background: 'var(--ivory)' }}>
      <div className="bg-white rounded-2xl p-8 text-center max-w-md mx-4" style={{ boxShadow: 'var(--shadow-card)' }}>
        <div className="sl-checkout-result-mark mb-4" aria-hidden="true">{paymentVerified ? '✓' : orderReceived ? '·' : '?'}</div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--ink)' }}>
          {heading}
        </h1>
        <p className="mb-2" style={{ color: 'var(--muted)' }}>{description}</p>

        {order && (
          <>
            <p className="text-sm mb-1" style={{ color: 'var(--muted)' }}>Número de pedido:</p>
            <p className="text-3xl font-bold mb-6" style={{ color: 'var(--coral)' }}>
              {order.order_number}
            </p>
          </>
        )}

        <div className="space-y-3 mt-6">
          {businessSlug && (
            <Link
              href={`/negocios/${businessSlug}`}
              className="block w-full py-3 text-white font-bold rounded-lg transition-colors text-center"
              style={{ background: 'var(--coral)' }}
            >
              Volver al negocio
            </Link>
          )}
          {orderReceived ? (
            <Link
              href="/mis-pedidos"
              className="block w-full py-3 font-bold rounded-lg transition-colors text-center"
              style={{ background: 'var(--cream)', color: 'var(--ink)' }}
            >
              Ver mis pedidos
            </Link>
          ) : (
            <Link
              href="/login"
              className="block w-full py-3 font-bold rounded-lg transition-colors text-center"
              style={{ background: 'var(--cream)', color: 'var(--ink)' }}
            >
              Iniciar sesión
            </Link>
          )}
        </div>
      </div>
    </main>
  )
}
