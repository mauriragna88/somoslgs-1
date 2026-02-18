import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { getUser } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import OrderStatusBadge from '@/components/dashboard/OrderStatusBadge'

interface OrderItem {
  id: string
  product_name: string
  quantity: number
  unit_price: number
  subtotal: number
}

interface Order {
  id: string
  order_number: string
  status: string
  payment_method: string
  payment_status: string
  delivery_type: string
  subtotal: number
  delivery_fee: number
  service_fee: number
  total: number
  notes: string | null
  created_at: string
  business: { name: string; slug: string; logo_url: string | null; whatsapp: string | null } | null
  order_items: OrderItem[]
}

export default async function MisPedidosPage() {
  const user = await getUser()
  if (!user) {
    redirect('/login?ref=mis-pedidos')
  }

  const supabase = createClient()

  const { data: orders } = await supabase
    .from('orders')
    .select(`
      id, order_number, status, payment_method, payment_status,
      delivery_type, subtotal, delivery_fee, service_fee, total,
      notes, created_at,
      business:businesses(name, slug, logo_url, whatsapp),
      order_items(id, product_name, quantity, unit_price, subtotal)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false }) as unknown as { data: Order[] | null }

  const activeStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivering']
  const activeOrders = orders?.filter(o => activeStatuses.includes(o.status)) || []
  const pastOrders = orders?.filter(o => !activeStatuses.includes(o.status)) || []

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-secondary mb-2">Mis Pedidos</h1>
        <p className="text-gray-500 mb-8">Historial de todos tus pedidos</p>

        {!orders || orders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <span className="text-6xl block mb-4">📦</span>
            <h2 className="text-xl font-bold text-secondary mb-2">No tienes pedidos aun</h2>
            <p className="text-gray-500 mb-6">Explora negocios locales y haz tu primer pedido</p>
            <Link
              href="/buscar"
              className="inline-flex items-center px-6 py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-full transition-colors"
            >
              Explorar negocios
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Active Orders */}
            {activeOrders.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-secondary mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                  Pedidos activos ({activeOrders.length})
                </h2>
                <div className="space-y-4">
                  {activeOrders.map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
              </section>
            )}

            {/* Past Orders */}
            {pastOrders.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-secondary mb-4">
                  Pedidos anteriores ({pastOrders.length})
                </h2>
                <div className="space-y-4">
                  {pastOrders.map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  )
}

function OrderCard({ order }: { order: Order }) {
  const paymentLabel: Record<string, string> = {
    cash: 'Efectivo',
    transfer: 'Transferencia',
    card: 'Tarjeta',
    mercadopago: 'MercadoPago',
  }

  const isPaid = ['paid', 'verified'].includes(order.payment_status)
  const isPending = ['pending', 'pending_verification'].includes(order.payment_status)
  const isCompleted = order.status === 'completed'
  const isCancelled = order.status === 'cancelled'

  // Card border color based on payment/order status
  const borderColor = isPaid || isCompleted
    ? 'border-l-4 border-l-green-500'
    : isCancelled
    ? 'border-l-4 border-l-red-500'
    : isPending
    ? 'border-l-4 border-l-yellow-500'
    : 'border-l-4 border-l-blue-500'

  // Payment status badge
  const paymentBadge = isPaid
    ? { text: 'Pagado', bg: 'bg-green-100 text-green-700', icon: '✅' }
    : order.payment_status === 'pending_verification'
    ? { text: 'En verificacion', bg: 'bg-blue-100 text-blue-700', icon: '🔄' }
    : order.payment_status === 'failed'
    ? { text: 'Pago fallido', bg: 'bg-red-100 text-red-700', icon: '❌' }
    : order.payment_status === 'refunded'
    ? { text: 'Reembolsado', bg: 'bg-gray-100 text-gray-700', icon: '↩' }
    : { text: 'Pago pendiente', bg: 'bg-yellow-100 text-yellow-700', icon: '⏳' }

  const whatsappMessage = encodeURIComponent(
    `Hola! Tengo el pedido #${order.order_number} por ${formatCurrency(order.total)}. Me gustaria coordinar el pago/entrega.`
  )

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden ${borderColor}`}>
      {/* Header */}
      <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100">
        <div className="flex items-center gap-3">
          {order.business?.logo_url ? (
            <Image
              src={order.business.logo_url}
              alt={order.business.name || ''}
              width={40}
              height={40}
              className="w-10 h-10 rounded-lg object-cover"
            />
          ) : (
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <span className="text-primary font-bold">
                {order.business?.name?.[0]?.toUpperCase() || '?'}
              </span>
            </div>
          )}
          <div>
            {order.business ? (
              <Link
                href={`/negocios/${order.business.slug}`}
                className="font-semibold text-secondary hover:text-primary transition-colors"
              >
                {order.business.name}
              </Link>
            ) : (
              <span className="font-semibold text-secondary">Negocio</span>
            )}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>{order.order_number}</span>
              <span>·</span>
              <span>{formatDateTime(order.created_at)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <OrderStatusBadge status={order.status} />
        </div>
      </div>

      {/* Items */}
      <div className="p-4 sm:p-6">
        <div className="space-y-2 mb-4">
          {order.order_items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-gray-700">
                {item.quantity}x {item.product_name}
              </span>
              <span className="text-gray-500">{formatCurrency(item.subtotal)}</span>
            </div>
          ))}
        </div>

        {/* Totals breakdown */}
        <div className="space-y-1 pt-3 border-t border-gray-100 text-sm">
          <div className="flex justify-between text-gray-500">
            <span>Subtotal</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
          {order.delivery_fee > 0 && (
            <div className="flex justify-between text-gray-500">
              <span>Envio</span>
              <span>{formatCurrency(order.delivery_fee)}</span>
            </div>
          )}
          {order.service_fee > 0 && (
            <div className="flex justify-between text-gray-500">
              <span>Servicio</span>
              <span>{formatCurrency(order.service_fee)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-secondary text-base pt-1">
            <span>Total</span>
            <span>{formatCurrency(order.total)}</span>
          </div>
        </div>

        {/* Status badges */}
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${paymentBadge.bg}`}>
            {paymentBadge.icon} {paymentBadge.text}
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            order.payment_method === 'cash' ? 'bg-green-50 text-green-700' :
            order.payment_method === 'transfer' ? 'bg-blue-50 text-blue-700' :
            'bg-purple-50 text-purple-700'
          }`}>
            {paymentLabel[order.payment_method] || order.payment_method}
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            {order.delivery_type === 'delivery' ? '🚚 Entrega a domicilio' : '🏪 Recoger en local'}
          </span>
        </div>

        {/* Action buttons */}
        {!isCancelled && !isCompleted && (
          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-100">
            {/* WhatsApp contact */}
            {order.business?.whatsapp && (
              <a
                href={`https://wa.me/52${order.business.whatsapp}?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <span>💬</span> Contactar Negocio
              </a>
            )}
            {/* Re-order */}
            {order.business?.slug && (
              <Link
                href={`/negocios/${order.business.slug}`}
                className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg transition-colors"
              >
                <span>🔄</span> Volver a Pedir
              </Link>
            )}
          </div>
        )}

        {/* Completed/Cancelled message */}
        {isCompleted && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <p className="text-sm text-green-600 font-medium">✅ Pedido completado</p>
              {order.business?.slug && (
                <Link
                  href={`/negocios/${order.business.slug}`}
                  className="text-sm text-primary hover:underline font-medium"
                >
                  Volver a pedir
                </Link>
              )}
            </div>
          </div>
        )}
        {isCancelled && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-red-600 font-medium">❌ Pedido cancelado</p>
          </div>
        )}
      </div>
    </div>
  )
}
