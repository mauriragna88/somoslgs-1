import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUser } from '@/lib/supabase/server'
import { logAudit } from '@/lib/security'
import { notifyCustomerPaymentVerified } from '@/lib/whatsapp'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()

    // Get order with customer info
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, order_customers(name, phone)')
      .eq('id', params.id)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
    }

    // Verify business ownership separately
    const { data: business } = await supabase
      .from('businesses')
      .select('owner_id, name, whatsapp')
      .eq('id', order.business_id)
      .single()

    if (!business || business.owner_id !== user.id) {
      return NextResponse.json({ error: 'No tienes permiso para verificar este pago' }, { status: 403 })
    }

    // Validate: must be transfer payment
    if (order.payment_method !== 'transfer') {
      return NextResponse.json({ error: 'Este pedido no es pago por transferencia' }, { status: 400 })
    }

    // Validate: must have proof uploaded
    if (!order.payment_receipt_url) {
      return NextResponse.json({ error: 'El cliente aun no ha subido comprobante de pago' }, { status: 400 })
    }

    // Validate: must be in pending_verification status
    if (order.payment_status !== 'pending_verification') {
      return NextResponse.json({ error: 'Este pago ya fue procesado' }, { status: 400 })
    }

    // Update payment status to verified
    const { error: updateError } = await supabase
      .from('orders')
      .update({ payment_status: 'verified' })
      .eq('id', params.id)

    if (updateError) {
      return NextResponse.json({ error: 'Error al verificar el pago' }, { status: 500 })
    }

    // Audit log
    logAudit({
      userId: user.id,
      action: 'payment.verified',
      resource: 'order',
      resourceId: params.id,
      details: { order_number: order.order_number, total: order.total },
    })

    // WhatsApp notification to customer (fire-and-forget)
    const customer = (order.order_customers as any)?.[0]
    if (customer?.phone) {
      notifyCustomerPaymentVerified({
        id: params.id,
        order_number: order.order_number,
        total: order.total,
        business_id: order.business_id,
        customer: { name: customer.name, phone: customer.phone },
        business: { name: business.name, whatsapp: business.whatsapp },
      })
    }

    return NextResponse.json({ success: true, message: 'Pago verificado correctamente' })

  } catch (error) {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
