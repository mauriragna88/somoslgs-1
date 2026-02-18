import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUser } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/security'
import { ORDER_ENABLED_TIERS } from '@/lib/constants'
import { notifyBusinessNewOrder } from '@/lib/whatsapp'
import { z } from 'zod'

const orderItemSchema = z.object({
  product_id: z.string().uuid(),
  product_name: z.string(),
  quantity: z.number().int().min(1),
  unit_price: z.number().min(0),
  subtotal: z.number().min(0),
})

const orderSchema = z.object({
  business_id: z.string().uuid(),
  items: z.array(orderItemSchema).min(1),
  delivery_type: z.enum(['pickup', 'delivery']),
  customer_name: z.string().min(2),
  customer_phone: z.string().min(10),
  customer_email: z.string().email().optional(),
  delivery_address: z.string().optional(),
  notes: z.string().optional(),
  payment_method: z.enum(['cash', 'card', 'transfer']).default('cash'),
  payment_receipt_url: z.string().url().optional(),
})

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `ORD-${timestamp}-${random}`
}

export async function POST(request: Request) {
  try {
    // Rate limit: 5 orders per 10 minutes per IP (prevents spam from guests)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const { allowed, remaining } = checkRateLimit(`order:${ip}`, 5, 600000)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Demasiados pedidos. Intenta de nuevo en unos minutos.' },
        { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining) } }
      )
    }

    const body = await request.json()
    const validatedData = orderSchema.parse(body)

    const supabase = getSupabaseAdmin()

    // Get the authenticated user (optional - guests can order too)
    const user = await getUser()

    // Verify business exists and accepts orders
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, name, subscription_tier, whatsapp, is_active')
      .eq('id', validatedData.business_id)
      .single()

    if (businessError || !business) {
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })
    }

    if (!business.is_active) {
      return NextResponse.json({ error: 'Este negocio no está activo' }, { status: 400 })
    }

    // Check if business plan allows orders
    if (!ORDER_ENABLED_TIERS.includes(business.subscription_tier)) {
      return NextResponse.json({
        error: 'Este negocio no tiene habilitada la recepción de pedidos'
      }, { status: 400 })
    }

    // Calculate totals
    const subtotal = validatedData.items.reduce((sum, item) => sum + item.subtotal, 0)
    const deliveryFee = validatedData.delivery_type === 'delivery' ? 30 : 0 // Basic flat fee
    const serviceFee = Math.round(subtotal * 0.05) // 5% service fee
    const total = subtotal + deliveryFee + serviceFee

    // Create order
    const orderNumber = generateOrderNumber()
    // Card payments start as 'awaiting_payment' until webhook confirms
    const paymentStatus = validatedData.payment_receipt_url
      ? 'pending_verification'
      : validatedData.payment_method === 'card'
      ? 'awaiting_payment'
      : 'pending'

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        user_id: user?.id || null,
        business_id: validatedData.business_id,
        subtotal,
        delivery_fee: deliveryFee,
        service_fee: serviceFee,
        discount: 0,
        total,
        status: 'pending',
        payment_method: validatedData.payment_method,
        payment_status: paymentStatus,
        payment_receipt_url: validatedData.payment_receipt_url || null,
        delivery_type: validatedData.delivery_type,
        notes: validatedData.notes,
      })
      .select()
      .single()

    if (orderError) {
      return NextResponse.json({ error: 'Error al crear el pedido' }, { status: 500 })
    }

    // Create order items
    const orderItems = validatedData.items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.subtotal,
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      // Rollback order if items fail
      await supabase.from('orders').delete().eq('id', order.id)
      return NextResponse.json({ error: 'Error al crear los productos del pedido' }, { status: 500 })
    }

    // Store customer info
    const { error: customerError } = await supabase
      .from('order_customers')
      .insert({
        order_id: order.id,
        name: validatedData.customer_name,
        phone: validatedData.customer_phone,
        email: validatedData.customer_email,
        delivery_address: validatedData.delivery_address,
      })

    if (customerError) {
      // Continue anyway, order is still valid
    }

    // Create in-app notification for real-time updates
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    await supabase
      .from('notifications')
      .insert({
        business_id: validatedData.business_id,
        order_id: order.id,
        type: 'new_order',
        channel: 'in_app',
        status: 'sent',
        is_read: false,
        message_preview: `Nuevo pedido #${orderNumber} de ${validatedData.customer_name} - $${total}`,
      })

    const orderLink = `${baseUrl}/dashboard/pedidos/${order.id}`

    // Send automated WhatsApp notification to business owner (fire-and-forget)
    notifyBusinessNewOrder({
      id: order.id,
      order_number: orderNumber,
      total,
      business_id: validatedData.business_id,
      delivery_type: validatedData.delivery_type,
      items: validatedData.items,
      customer: {
        name: validatedData.customer_name,
        phone: validatedData.customer_phone,
        delivery_address: validatedData.delivery_address,
      },
      business: {
        name: business.name,
        whatsapp: business.whatsapp,
      },
    })

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        order_number: orderNumber,
        total,
        business_name: business.name,
        business_whatsapp: business.whatsapp,
        dashboard_order_url: orderLink,
      }
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('business_id')
    const status = searchParams.get('status')

    if (!businessId) {
      return NextResponse.json({ error: 'business_id requerido' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    // Verify user owns this business
    const { data: business } = await supabase
      .from('businesses')
      .select('owner_id')
      .eq('id', businessId)
      .single()

    if (!business || business.owner_id !== user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Get orders with customer info
    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items(*),
        order_customers(*)
      `)
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data: orders, error } = await query

    if (error) {
      return NextResponse.json({ error: 'Error al obtener pedidos' }, { status: 500 })
    }

    return NextResponse.json({ orders })

  } catch (error) {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
