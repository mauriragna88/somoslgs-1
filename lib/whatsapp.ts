import { createClient } from '@supabase/supabase-js'

/**
 * SERVICIO DE WHATSAPP - SomosLagos
 *
 * Envía notificaciones automáticas vía Meta WhatsApp Cloud API.
 * Fallback: si no hay credenciales de Meta, guarda notificación
 * en tabla `notifications` con link wa.me generado.
 */

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

function hasMetaCredentials(): boolean {
  return !!(
    process.env.WHATSAPP_API_TOKEN &&
    process.env.WHATSAPP_PHONE_NUMBER_ID
  )
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  // Si ya tiene código de país (52 para México), usarlo tal cual
  if (digits.startsWith('52') && digits.length === 12) return digits
  // Si es número de 10 dígitos, agregar código de país México
  if (digits.length === 10) return `52${digits}`
  return digits
}

export function generateWaMeLink(phone: string, message: string): string {
  return `https://wa.me/${formatPhone(phone)}?text=${encodeURIComponent(message)}`
}

export { formatPhone }

// ============================================
// META CLOUD API
// ============================================

async function sendViaMetaApi(phone: string, message: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: formatPhone(phone),
          type: 'text',
          text: { body: message },
        }),
      }
    )

    return response.ok
  } catch {
    return false
  }
}

// ============================================
// CORE SEND FUNCTION
// ============================================

interface SendWhatsAppOptions {
  phone: string
  message: string
  businessId?: string
  orderId?: string
  userId?: string
  type: string
}

async function sendWhatsApp(opts: SendWhatsAppOptions): Promise<void> {
  const { phone, message, businessId, orderId, userId, type } = opts
  const supabase = getSupabaseAdmin()

  if (hasMetaCredentials()) {
    const sent = await sendViaMetaApi(phone, message)

    await supabase.from('notifications').insert({
      business_id: businessId || null,
      order_id: orderId || null,
      user_id: userId || null,
      type,
      channel: 'whatsapp',
      recipient_phone: phone,
      status: sent ? 'sent' : 'failed',
      message_preview: message.substring(0, 200),
      is_read: false,
    })
  } else {
    // Fallback: save notification with wa.me link for manual sending
    const waLink = generateWaMeLink(phone, message)

    await supabase.from('notifications').insert({
      business_id: businessId || null,
      order_id: orderId || null,
      user_id: userId || null,
      type,
      channel: 'whatsapp',
      recipient_phone: phone,
      status: 'pending_api',
      message_preview: message.substring(0, 200),
      wa_me_link: waLink,
      is_read: false,
    })
  }
}

// ============================================
// TIER-BASED NOTIFICATION
// ============================================

type SubscriptionTier = 'gratis' | 'emprendedor' | 'pro' | 'avanzado'

interface NotifyByTierOptions {
  tier: SubscriptionTier
  phone: string
  message: string
  businessId?: string
  orderId?: string
  userId?: string
  type: string
}

/**
 * Envía notificación según el plan del negocio:
 * - premium/delivery: envío automático vía Meta API (o fallback wa.me)
 * - ventas: guarda notificación con wa_me_link, status pending_manual
 * - basico: no envía notificación WhatsApp (solo teléfono clickeable en UI)
 */
export async function notifyByTier(opts: NotifyByTierOptions): Promise<void> {
  const { tier, phone, message, businessId, orderId, userId, type } = opts
  const supabase = getSupabaseAdmin()

  if (tier === 'avanzado') {
    // Envío automático
    await sendWhatsApp({ phone, message, businessId, orderId, userId, type })
  } else if (tier === 'pro' || tier === 'emprendedor') {
    // Guardar como pending_manual con wa.me link
    const waLink = generateWaMeLink(phone, message)
    await supabase.from('notifications').insert({
      business_id: businessId || null,
      order_id: orderId || null,
      user_id: userId || null,
      type,
      channel: 'whatsapp',
      recipient_phone: phone,
      status: 'pending_manual',
      message_preview: message.substring(0, 200),
      wa_me_link: waLink,
      is_read: false,
    })
  }
  // basico: no notification
}

// ============================================
// NOTIFICATION FUNCTIONS
// ============================================

interface OrderData {
  id: string
  order_number: string
  total: number
  business_id: string
  delivery_type?: string
  subscription_tier?: string
  items?: Array<{ quantity: number; product_name: string; subtotal: number }>
  customer?: { name: string; phone: string; delivery_address?: string }
  business?: { name: string; whatsapp: string }
}

/**
 * Notifica al dueño del negocio sobre un nuevo pedido
 */
export async function notifyBusinessNewOrder(orderData: OrderData): Promise<void> {
  try {
    const businessPhone = orderData.business?.whatsapp
    if (!businessPhone) return

    const orderLink = `${BASE_URL}/dashboard/pedidos/${orderData.id}`
    const customerName = orderData.customer?.name || 'Cliente'

    const itemsList = orderData.items
      ?.map(item => `• ${item.quantity}x ${item.product_name} - $${item.subtotal}`)
      .join('\n') || ''

    const message =
      `🔔 *¡NUEVO PEDIDO!* #${orderData.order_number}\n\n` +
      `👤 Cliente: ${customerName}\n` +
      `📞 Tel: ${orderData.customer?.phone || 'N/A'}\n` +
      `📦 Entrega: ${orderData.delivery_type === 'delivery' ? 'A domicilio' : 'Recoger en tienda'}\n` +
      `${orderData.customer?.delivery_address ? `📍 Dirección: ${orderData.customer.delivery_address}\n` : ''}` +
      `\n*Productos:*\n${itemsList}\n\n` +
      `💰 *Total: $${orderData.total}*\n\n` +
      `👉 *Acepta el pedido aquí:*\n${orderLink}`

    const tier = (orderData.subscription_tier || 'gratis') as SubscriptionTier

    await notifyByTier({
      tier,
      phone: businessPhone,
      message,
      businessId: orderData.business_id,
      orderId: orderData.id,
      type: 'new_order',
    })
  } catch {
    // Fire-and-forget: no bloquea el flujo principal
  }
}

/**
 * Notifica al comprador sobre cambio de estado del pedido
 */
export async function notifyCustomerOrderUpdate(
  orderData: OrderData,
  newStatus: string
): Promise<void> {
  try {
    const customerPhone = orderData.customer?.phone
    if (!customerPhone) return

    const businessName = orderData.business?.name || 'el negocio'
    const statusMessages: Record<string, string> = {
      confirmed: `✅ Tu pedido #${orderData.order_number} ha sido confirmado por ${businessName}. Te avisaremos cuando esté listo.`,
      preparing: `👨‍🍳 Tu pedido #${orderData.order_number} está siendo preparado por ${businessName}.`,
      ready: `📦 Tu pedido #${orderData.order_number} está listo para recoger en ${businessName}.`,
      delivering: `🚗 Tu pedido #${orderData.order_number} va en camino${orderData.customer?.delivery_address ? ` a ${orderData.customer.delivery_address}` : ''}.`,
      completed: `🎉 Tu pedido #${orderData.order_number} ha sido completado. ¡Gracias por tu compra en ${businessName}!`,
      cancelled: `❌ Tu pedido #${orderData.order_number} ha sido cancelado por ${businessName}. Contacta al negocio para más información.`,
    }

    const message = statusMessages[newStatus]
    if (!message) return

    await sendWhatsApp({
      phone: customerPhone,
      message,
      businessId: orderData.business_id,
      orderId: orderData.id,
      type: 'order_update',
    })
  } catch {
    // Fire-and-forget
  }
}

/**
 * Notifica al comprador que su pago fue verificado
 */
export async function notifyCustomerPaymentVerified(
  orderData: OrderData
): Promise<void> {
  try {
    const customerPhone = orderData.customer?.phone
    if (!customerPhone) return

    const message =
      `✅ Tu pago de $${orderData.total} para el pedido #${orderData.order_number} fue verificado correctamente. ` +
      `${orderData.business?.name || 'El negocio'} procesará tu pedido pronto.`

    await sendWhatsApp({
      phone: customerPhone,
      message,
      businessId: orderData.business_id,
      orderId: orderData.id,
      type: 'payment_verified',
    })
  } catch {
    // Fire-and-forget
  }
}

/**
 * Notifica al comprador que su pago fue rechazado
 */
export async function notifyCustomerPaymentRejected(
  orderData: OrderData,
  reason: string
): Promise<void> {
  try {
    const customerPhone = orderData.customer?.phone
    if (!customerPhone) return

    const message =
      `⚠️ Tu pago para el pedido #${orderData.order_number} fue rechazado.\n\n` +
      `Motivo: ${reason}\n\n` +
      `Por favor sube un nuevo comprobante de pago para continuar con tu pedido.`

    await sendWhatsApp({
      phone: customerPhone,
      message,
      businessId: orderData.business_id,
      orderId: orderData.id,
      type: 'payment_rejected',
    })
  } catch {
    // Fire-and-forget
  }
}
