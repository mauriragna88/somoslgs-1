import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// Generate WhatsApp link for a new order notification
function generateOrderWhatsAppLink(
  phone: string,
  orderNumber: string,
  customerName: string,
  total: number,
  orderId: string
): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://directoriolagos.com'
  const orderLink = `${baseUrl}/dashboard/pedidos/${orderId}`

  const message = encodeURIComponent(
    `🔔 *¡NUEVO PEDIDO!*\n\n` +
    `📦 Pedido: #${orderNumber}\n` +
    `👤 Cliente: ${customerName}\n` +
    `💰 Total: $${total.toFixed(2)} MXN\n\n` +
    `👉 *Acepta el pedido aquí:*\n${orderLink}\n\n` +
    `⏰ Responde rápido para no perder la venta.`
  )

  // Clean phone number and add Mexico country code if needed
  const cleanPhone = phone.replace(/\D/g, '')
  const fullPhone = cleanPhone.startsWith('52') ? cleanPhone : `52${cleanPhone}`

  return `https://wa.me/${fullPhone}?text=${message}`
}

// API to send WhatsApp notification (creates a record for tracking)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { order_id, business_id, type = 'new_order' } = body

    const supabase = getSupabaseAdmin()

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        id, order_number, total, status,
        order_customers(name, phone)
      `)
      .eq('id', order_id)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
    }

    // Get business with owner info
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select(`
        id, name, whatsapp, phone,
        owner:profiles(full_name, phone)
      `)
      .eq('id', business_id)
      .single()

    if (businessError || !business) {
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })
    }

    // Determine which phone to use (business whatsapp > business phone > owner phone)
    const notifyPhone = business.whatsapp || business.phone || (business.owner as any)?.phone

    if (!notifyPhone) {
      return NextResponse.json({
        error: 'No hay número de teléfono configurado para notificaciones'
      }, { status: 400 })
    }

    const customer = (order.order_customers as any)?.[0]
    const customerName = customer?.name || 'Cliente'

    // Generate WhatsApp link
    const whatsappLink = generateOrderWhatsAppLink(
      notifyPhone,
      order.order_number,
      customerName,
      order.total,
      order.id
    )

    // Log the notification attempt
    await supabase
      .from('notifications')
      .insert({
        business_id,
        order_id,
        type,
        channel: 'whatsapp',
        recipient_phone: notifyPhone,
        status: 'pending',
        message_preview: `Nuevo pedido #${order.order_number} - $${order.total}`,
      })
      .select()
      .single()

    return NextResponse.json({
      success: true,
      whatsapp_link: whatsappLink,
      phone: notifyPhone,
    })

  } catch (error) {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
