export const dynamic = 'force-dynamic'

import Image from 'next/image'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { ORDER_ENABLED_TIERS } from '@/lib/constants'
import OrderStatusBadge from '@/components/dashboard/OrderStatusBadge'
import UpdateOrderStatus from '@/components/dashboard/UpdateOrderStatus'
import VerifyPaymentButton from '@/components/dashboard/VerifyPaymentButton'
import RejectPaymentButton from '@/components/dashboard/RejectPaymentButton'
import BankDataAlert from '@/components/dashboard/BankDataAlert'

interface PedidosBusiness {
  id: string
  name: string
  subscription_tier: string
  bank_clabe: string | null
}

interface OrderItem {
  id: string
  product_name: string
  quantity: number
  subtotal: number
}

interface OrderCustomer {
  name: string
  phone: string
  email: string | null
  delivery_address: string | null
}

interface Order {
  id: string
  order_number: string
  status: string
  total: number
  subtotal: number
  delivery_fee: number
  service_fee: number
  delivery_type: string
  payment_method: string
  payment_status: string
  payment_receipt_url: string | null
  notes: string | null
  created_at: string
  order_items: OrderItem[]
  order_customers: OrderCustomer[]
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: { filter?: string }
}) {
  const user = await getUser()
  if (!user) {
    redirect('/login')
  }

  const activeFilter = searchParams.filter || 'all'

  const cookieStore = await cookies()
  const selectedBusinessId = cookieStore.get('selected_business_id')?.value

  const supabase = createClient()

  // Get user's businesses
  const { data: businesses } = await supabase
    .from('businesses')
    .select('id, name, subscription_tier, bank_clabe')
    .eq('owner_id', user.id)
    .eq('is_active', true) as { data: PedidosBusiness[] | null }

  if (!businesses || businesses.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No tienes negocios registrados.</p>
      </div>
    )
  }

  // Determine which business to show orders for
  const currentBusinessId = selectedBusinessId && businesses.some(b => b.id === selectedBusinessId)
    ? selectedBusinessId
    : businesses[0].id

  const currentBusiness = businesses.find(b => b.id === currentBusinessId)!

  // Check if business can receive orders
  const canReceiveOrders = ORDER_ENABLED_TIERS.includes(currentBusiness.subscription_tier)

  if (!canReceiveOrders) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: 'var(--display)', color: 'var(--ink)' }}>Pedidos</h1>
        <div className="rounded-2xl p-6 text-center" style={{ background: 'var(--cream)', border: '1px solid rgba(245,185,66,0.3)' }}>
          <span className="text-4xl mb-4 block">📦</span>
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--ink)' }}>
            Función no disponible en tu plan
          </h2>
          <p className="mb-4" style={{ color: 'var(--muted)' }}>
            Para recibir pedidos en línea necesitas el plan <strong>Pro</strong> ($120 MXN/mes) o superior.
          </p>
          <a
            href="/dashboard/suscripcion"
            className="inline-flex items-center px-6 py-3 text-white font-semibold rounded-xl transition-colors"
            style={{ background: 'var(--coral)' }}
          >
            Actualizar Plan
          </a>
        </div>
      </div>
    )
  }

  // Get orders for this business
  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items(*),
      order_customers(*)
    `)
    .eq('business_id', currentBusinessId)
    .order('created_at', { ascending: false }) as unknown as { data: Order[] | null; error: any }

  // error is handled gracefully - empty results shown

  const allOrders = orders || []

  // Calculate stats - exclude unpaid card orders from pending count
  const pendingOrders = allOrders.filter(o =>
    o.status === 'pending' && o.payment_status !== 'awaiting_payment'
  ).length
  const unpaidCardOrders = allOrders.filter(o =>
    o.payment_method === 'card' && o.payment_status === 'awaiting_payment'
  ).length
  const pendingPaymentVerification = allOrders.filter(o =>
    o.payment_method === 'transfer' && o.payment_status === 'pending_verification'
  ).length
  const todayOrders = allOrders.filter(o => {
    const orderDate = new Date(o.created_at).toDateString()
    const today = new Date().toDateString()
    return orderDate === today
  }).length
  const totalRevenue = allOrders
    .filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + o.total, 0)

  // Apply filter - by default hide unpaid card orders from "all" and "pending"
  const paidOrders = allOrders.filter(o => o.payment_status !== 'awaiting_payment')
  const ordersList = activeFilter === 'all'
    ? paidOrders
    : activeFilter === 'pending_verification'
    ? allOrders.filter(o => o.payment_method === 'transfer' && o.payment_status === 'pending_verification')
    : activeFilter === 'pending'
    ? paidOrders.filter(o => o.status === 'pending')
    : activeFilter === 'unpaid_card'
    ? allOrders.filter(o => o.payment_method === 'card' && o.payment_status === 'awaiting_payment')
    : paidOrders

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--display)', color: 'var(--ink)' }}>Pedidos</h1>
        <span className="text-sm" style={{ color: 'var(--muted)' }}>
          {currentBusiness.name}
        </span>
      </div>

      {/* Bank Data Alert */}
      <BankDataAlert
        businessId={currentBusiness.id}
        hasBankData={!!currentBusiness.bank_clabe}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-4" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
              <span className="text-xl">⏳</span>
            </div>
            <div>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>Pendientes</p>
              <p className="text-xl font-bold text-yellow-600">{pendingOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <span className="text-xl">📱</span>
            </div>
            <div>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>Por Verificar</p>
              <p className="text-xl font-bold text-blue-600">{pendingPaymentVerification}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <span className="text-xl">📋</span>
            </div>
            <div>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>Pedidos Hoy</p>
              <p className="text-xl font-bold text-purple-600">{todayOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <span className="text-xl">💰</span>
            </div>
            <div>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>Ingresos</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <a
          href="/dashboard/pedidos"
          className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
            activeFilter === 'all'
              ? 'text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
          style={activeFilter === 'all' ? { background: 'var(--coral)' } : { boxShadow: 'var(--shadow-card)' }}
        >
          Todos ({paidOrders.length})
        </a>
        <a
          href="/dashboard/pedidos?filter=pending"
          className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
            activeFilter === 'pending'
              ? 'bg-yellow-500 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
          style={activeFilter !== 'pending' ? { boxShadow: 'var(--shadow-card)' } : {}}
        >
          Pendientes ({pendingOrders})
        </a>
        <a
          href="/dashboard/pedidos?filter=pending_verification"
          className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
            activeFilter === 'pending_verification'
              ? 'bg-blue-500 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
          style={activeFilter !== 'pending_verification' ? { boxShadow: 'var(--shadow-card)' } : {}}
        >
          📱 Por Verificar Pago ({pendingPaymentVerification})
        </a>
        {unpaidCardOrders > 0 && (
          <a
            href="/dashboard/pedidos?filter=unpaid_card"
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              activeFilter === 'unpaid_card'
                ? 'bg-red-500 text-white'
                : 'bg-white text-red-600 hover:bg-red-50 border border-red-200'
            }`}
          >
            ⚠️ Sin pagar ({unpaidCardOrders})
          </a>
        )}
      </div>

      {/* Orders List */}
      {ordersList.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center" style={{ boxShadow: 'var(--shadow-card)' }}>
          <span className="text-6xl mb-4 block">📦</span>
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--ink)' }}>No hay pedidos aún</h2>
          <p style={{ color: 'var(--muted)' }}>
            Los pedidos que recibas aparecerán aquí
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {ordersList.map((order) => {
            const customer = order.order_customers?.[0]
            const items = order.order_items || []

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl overflow-hidden"
                style={{ boxShadow: 'var(--shadow-card)' }}
              >
                {/* Order Header */}
                <div className="p-4" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-bold" style={{ color: 'var(--ink)' }}>#{order.order_number}</p>
                      <p className="text-xs sm:text-sm" style={{ color: 'var(--muted)' }}>
                        {new Date(order.created_at).toLocaleString('es-MX', {
                          dateStyle: 'short',
                          timeStyle: 'short'
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg sm:text-xl font-bold" style={{ color: 'var(--coral)' }}>{formatCurrency(order.total)}</p>
                      <p className="text-xs sm:text-sm" style={{ color: 'var(--muted)' }}>
                        {order.delivery_type === 'delivery' ? '🚚 Entrega' : '🏪 Recoger'}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <OrderStatusBadge status={order.status} />
                    {/* Payment method badge */}
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      order.payment_method === 'cash'
                        ? 'bg-green-100 text-green-700'
                        : order.payment_method === 'transfer'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {order.payment_method === 'cash' ? '💵 Efectivo' : order.payment_method === 'transfer' ? '📱 Transferencia' : '💳 Tarjeta'}
                    </span>
                    {/* Payment status badge */}
                    {order.payment_method === 'transfer' && (
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        order.payment_status === 'verified'
                          ? 'bg-green-100 text-green-700'
                          : order.payment_status === 'pending_verification'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {order.payment_status === 'verified'
                          ? '✓ Verificado'
                          : order.payment_status === 'pending_verification'
                          ? '⏳ Por verificar'
                          : '⚠️ Sin comprobante'
                        }
                      </span>
                    )}
                    {order.payment_method === 'card' && (
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        order.payment_status === 'verified'
                          ? 'bg-green-100 text-green-700'
                          : order.payment_status === 'awaiting_payment'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {order.payment_status === 'verified'
                          ? '✓ Pagado'
                          : order.payment_status === 'awaiting_payment'
                          ? '⚠️ No pagado'
                          : '⏳ Pendiente'
                        }
                      </span>
                    )}
                  </div>
                </div>

                {/* Order Content */}
                <div className="p-4 grid md:grid-cols-3 gap-4">
                  {/* Customer Info */}
                  <div>
                    <h4 className="font-semibold mb-2" style={{ color: 'var(--ink)' }}>Cliente</h4>
                    {customer ? (
                      <div className="text-sm space-y-1" style={{ color: 'var(--muted)' }}>
                        <p>{customer.name}</p>
                        <p>📞 {customer.phone}</p>
                        {customer.email && <p>✉️ {customer.email}</p>}
                        {customer.delivery_address && (
                          <p>📍 {customer.delivery_address}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm" style={{ color: 'var(--muted)' }}>Sin información</p>
                    )}
                  </div>

                  {/* Items */}
                  <div>
                    <h4 className="font-semibold mb-2" style={{ color: 'var(--ink)' }}>Productos</h4>
                    <div className="text-sm space-y-1" style={{ color: 'var(--muted)' }}>
                      {items.map((item: any) => (
                        <p key={item.id}>
                          {item.quantity}x {item.product_name} - {formatCurrency(item.subtotal)}
                        </p>
                      ))}
                    </div>
                    {order.notes && (
                      <div className="mt-2 p-2 bg-yellow-50 rounded text-sm">
                        <strong>Notas:</strong> {order.notes}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div>
                    <h4 className="font-semibold mb-2" style={{ color: 'var(--ink)' }}>Acciones</h4>
                    <UpdateOrderStatus
                      orderId={order.id}
                      currentStatus={order.status}
                      customerPhone={customer?.phone}
                      customerName={customer?.name}
                      orderNumber={order.order_number}
                      deliveryType={order.delivery_type}
                      deliveryAddress={customer?.delivery_address}
                    />
                  </div>
                </div>

                {/* Payment Receipt for Transfer */}
                {order.payment_method === 'transfer' && order.payment_receipt_url && (
                  <div className="px-4 py-3 bg-blue-50 border-t border-blue-100">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">📎</span>
                        <div>
                          <p className="font-medium text-blue-800">Comprobante de Transferencia</p>
                          <p className="text-sm text-blue-600">
                            {order.payment_status === 'verified' ? '✅ Pago verificado' : '⏳ Pendiente de verificación'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={order.payment_receipt_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          👁️ Ver Comprobante
                        </a>
                        {order.payment_status !== 'verified' && order.payment_status !== 'failed' && (
                          <>
                            <VerifyPaymentButton orderId={order.id} />
                            <RejectPaymentButton orderId={order.id} />
                          </>
                        )}
                        {order.payment_status === 'failed' && (
                          <span className="px-3 py-2 bg-red-100 text-red-700 text-sm font-medium rounded-lg">
                            Pago Rechazado
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Preview image */}
                    <div className="mt-3">
                      <Image
                        src={order.payment_receipt_url}
                        alt="Comprobante de pago"
                        width={400}
                        height={192}
                        className="max-h-48 rounded-lg border border-blue-200 object-contain"
                      />
                    </div>
                  </div>
                )}

                {/* Warning: Transfer without receipt */}
                {order.payment_method === 'transfer' && !order.payment_receipt_url && (
                  <div className="px-4 py-3 bg-yellow-50 border-t border-yellow-100">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">⚠️</span>
                      <p className="text-sm text-yellow-800">
                        El cliente seleccionó transferencia pero no subió comprobante
                      </p>
                    </div>
                  </div>
                )}

                {/* Totals */}
                <div className="px-4 py-3" style={{ background: 'var(--cream)', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                  <div className="flex flex-wrap justify-end gap-x-4 gap-y-1 text-xs sm:text-sm" style={{ color: 'var(--muted)' }}>
                    <span>Subtotal: {formatCurrency(order.subtotal)}</span>
                    <span>Envío: {formatCurrency(order.delivery_fee)}</span>
                    <span>Servicio: {formatCurrency(order.service_fee)}</span>
                    <span className="font-bold">Total: {formatCurrency(order.total)}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
