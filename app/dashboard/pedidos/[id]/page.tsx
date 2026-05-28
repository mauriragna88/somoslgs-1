export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import OrderActions from '@/components/dashboard/OrderActions'

interface OrderItem {
  id: string
  product_name: string
  quantity: number
  unit_price: number
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
  payment_method: string
  payment_status: string
  payment_receipt_url: string | null
  delivery_type: string
  subtotal: number
  delivery_fee: number
  service_fee: number
  discount: number
  total: number
  notes: string | null
  rejection_reason: string | null
  estimated_delivery_time: string | null
  created_at: string
  confirmed_at: string | null
  completed_at: string | null
  cancelled_at: string | null
  order_items: OrderItem[]
  order_customers: OrderCustomer[]
}

const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
  confirmed: { label: 'Confirmado', color: 'bg-blue-100 text-blue-800', icon: '✅' },
  preparing: { label: 'Preparando', color: 'bg-orange-100 text-orange-800', icon: '👨‍🍳' },
  ready: { label: 'Listo', color: 'bg-green-100 text-green-800', icon: '📦' },
  delivering: { label: 'En camino', color: 'bg-purple-100 text-purple-800', icon: '🚗' },
  completed: { label: 'Completado', color: 'bg-green-100 text-green-800', icon: '🎉' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800', icon: '❌' },
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getUser()
  if (!user) {
    redirect('/login')
  }

  const cookieStore = await cookies()
  const selectedBusinessId = cookieStore.get('selected_business_id')?.value

  const supabase = await createClient()

  // Get user's businesses
  const { data: businesses } = await supabase
    .from('businesses')
    .select('id, name, whatsapp')
    .eq('owner_id', user.id)
    .eq('is_active', true) as { data: { id: string; name: string; whatsapp: string | null }[] | null }

  if (!businesses || businesses.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No tienes negocios registrados.</p>
      </div>
    )
  }

  // Get order with details
  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items(*),
      order_customers(*)
    `)
    .eq('id', id)
    .single() as { data: Order | null; error: any }

  if (error || !order) {
    notFound()
  }

  // Verify order belongs to one of user's businesses
  const { data: orderBusinessCheck } = await supabase
    .from('orders')
    .select('business_id')
    .eq('id', id)
    .single() as { data: { business_id: string } | null }

  if (!orderBusinessCheck || !businesses.some(b => b.id === orderBusinessCheck.business_id)) {
    notFound()
  }

  const currentBusiness = businesses.find(b => b.id === orderBusinessCheck.business_id)
  const customer = order.order_customers[0]
  const status = statusConfig[order.status] || statusConfig.pending

  // Generate WhatsApp messages
  const getWhatsAppLink = (message: string) => {
    if (!customer?.phone) return null
    return `https://wa.me/52${customer.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
  }

  const confirmMessage = `¡Hola ${customer?.name}! 🎉\n\nTu pedido #${order.order_number} ha sido *confirmado*.\n\nEstamos preparándolo. Te avisaremos cuando esté listo.\n\n¡Gracias por tu preferencia!`

  const readyMessage = `¡Hola ${customer?.name}! 📦\n\nTu pedido #${order.order_number} está *listo*.\n\n${order.delivery_type === 'delivery' ? 'Pronto estará en camino a tu dirección.' : 'Puedes pasar a recogerlo cuando gustes.'}\n\n¡Gracias!`

  const deliveringMessage = `¡Hola ${customer?.name}! 🚗\n\nTu pedido #${order.order_number} está *en camino*.\n\nLlegará pronto a: ${customer?.delivery_address || 'tu dirección'}\n\n¡Gracias por tu preferencia!`

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Button */}
      <Link
        href="/dashboard/pedidos"
        className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        ← Volver a pedidos
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
        <div className={`p-6 ${order.status === 'pending' ? 'bg-gradient-to-r from-yellow-400 to-orange-400' : 'bg-gray-50'}`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-4xl">{status.icon}</span>
                <div>
                  <h1 className={`text-2xl font-bold ${order.status === 'pending' ? 'text-white' : 'text-gray-900'}`}>
                    Pedido #{order.order_number}
                  </h1>
                  <p className={order.status === 'pending' ? 'text-white/80' : 'text-gray-500'}>
                    {new Date(order.created_at).toLocaleString('es-MX', {
                      dateStyle: 'long',
                      timeStyle: 'short',
                    })}
                  </p>
                </div>
              </div>
            </div>
            <span className={`px-4 py-2 rounded-full font-bold text-lg ${status.color}`}>
              {status.label}
            </span>
          </div>
        </div>

        {/* Pending Order Alert */}
        {order.status === 'pending' && (
          <div className="p-6 bg-yellow-50 border-b border-yellow-200">
            <div className="flex items-center gap-4">
              <span className="text-5xl animate-bounce">🔔</span>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-yellow-800">¡Nuevo Pedido!</h2>
                <p className="text-yellow-700">
                  Este pedido está esperando tu confirmación. Acéptalo para comenzar a prepararlo.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">👤 Información del Cliente</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Nombre:</span>
                <span className="font-medium">{customer?.name || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Teléfono:</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{customer?.phone || 'N/A'}</span>
                  {customer?.phone && (
                    <a
                      href={`https://wa.me/52${customer.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600"
                    >
                      💬
                    </a>
                  )}
                </div>
              </div>
              {customer?.email && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium">{customer.email}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Tipo de entrega:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  order.delivery_type === 'delivery'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {order.delivery_type === 'delivery' ? '🚗 A domicilio' : '🏪 Recoger en tienda'}
                </span>
              </div>
              {customer?.delivery_address && (
                <div className="pt-3 border-t border-gray-200">
                  <span className="text-gray-600 block mb-1">Dirección de entrega:</span>
                  <p className="font-medium bg-gray-50 p-3 rounded-lg">{customer.delivery_address}</p>
                </div>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">📦 Productos</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {order.order_items.map((item) => (
                <div key={item.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 bg-[rgba(255,107,53,0.1)] text-[#FF6B35] rounded-full flex items-center justify-center font-bold">
                      {item.quantity}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">{item.product_name}</p>
                      <p className="text-sm text-gray-500">{formatCurrency(item.unit_price)} c/u</p>
                    </div>
                  </div>
                  <span className="font-bold text-gray-900">{formatCurrency(item.subtotal)}</span>
                </div>
              ))}
            </div>
            {/* Totals */}
            <div className="p-4 bg-gray-50 space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              {order.delivery_fee > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Envío:</span>
                  <span>{formatCurrency(order.delivery_fee)}</span>
                </div>
              )}
              {order.service_fee > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Servicio:</span>
                  <span>{formatCurrency(order.service_fee)}</span>
                </div>
              )}
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Descuento:</span>
                  <span>-{formatCurrency(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-gray-300">
                <span>Total:</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3">📝 Notas del Cliente</h2>
              <p className="text-gray-700 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                {order.notes}
              </p>
            </div>
          )}
        </div>

        {/* Sidebar - Actions */}
        <div className="space-y-6">
          {/* Payment Info */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">💳 Pago</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Método:</span>
                <span className="font-medium">
                  {order.payment_method === 'cash' ? '💵 Efectivo' :
                   order.payment_method === 'transfer' ? '🏦 Transferencia' :
                   '💳 Tarjeta'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Estado:</span>
                <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                  order.payment_status === 'verified' ? 'bg-green-100 text-green-800' :
                  order.payment_status === 'pending_verification' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {order.payment_status === 'verified' ? '✅ Pagado' :
                   order.payment_status === 'pending_verification' ? '⏳ Por verificar' :
                   '⏳ Pendiente'}
                </span>
              </div>
              {order.payment_receipt_url && (
                <div className="pt-3 border-t border-gray-200">
                  <a
                    href={order.payment_receipt_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#FF6B35] hover:underline text-sm"
                  >
                    📄 Ver comprobante de pago
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <OrderActions
            orderId={order.id}
            currentStatus={order.status}
            customerPhone={customer?.phone}
            customerName={customer?.name}
            orderNumber={order.order_number}
            deliveryType={order.delivery_type}
            deliveryAddress={customer?.delivery_address}
          />

          {/* Timeline */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">📅 Historial</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full mt-1.5"></div>
                <div>
                  <p className="font-medium text-gray-900">Pedido recibido</p>
                  <p className="text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleString('es-MX')}
                  </p>
                </div>
              </div>
              {order.confirmed_at && (
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mt-1.5"></div>
                  <div>
                    <p className="font-medium text-gray-900">Pedido confirmado</p>
                    <p className="text-sm text-gray-500">
                      {new Date(order.confirmed_at).toLocaleString('es-MX')}
                    </p>
                  </div>
                </div>
              )}
              {order.completed_at && (
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full mt-1.5"></div>
                  <div>
                    <p className="font-medium text-gray-900">Pedido completado</p>
                    <p className="text-sm text-gray-500">
                      {new Date(order.completed_at).toLocaleString('es-MX')}
                    </p>
                  </div>
                </div>
              )}
              {order.cancelled_at && (
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full mt-1.5"></div>
                  <div>
                    <p className="font-medium text-gray-900">Pedido cancelado</p>
                    <p className="text-sm text-gray-500">
                      {new Date(order.cancelled_at).toLocaleString('es-MX')}
                    </p>
                    {order.rejection_reason && (
                      <p className="text-sm text-red-600 mt-1">
                        Razón: {order.rejection_reason}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

