import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUser } from '@/lib/supabase/server'
import { logAudit } from '@/lib/security'
import { notifyCustomerPaymentRejected } from '@/lib/whatsapp'
import { z } from 'zod'

const rejectSchema = z.object({
  reason: z.string().min(5, 'El motivo debe tener al menos 5 caracteres'),
})

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

    const body = await request.json()
    const { reason } = rejectSchema.parse(body)

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
      return NextResponse.json({ error: 'No tienes permiso para rechazar este pago' }, { status: 403 })
    }

    // Validate: must be transfer payment
    if (order.payment_method !== 'transfer') {
      return NextResponse.json({ error: 'Este pedido no es pago por transferencia' }, { status: 400 })
    }

    // Validate: must be in pending_verification status
    if (order.payment_status !== 'pending_verification') {
      return NextResponse.json({ error: 'Este pago ya fue procesado' }, { status: 400 })
    }

    // Update payment status to failed and add rejection reason
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        payment_status: 'failed',
        notes: order.notes
          ? `${order.notes}\n\n--- PAGO RECHAZADO ---\nMotivo: ${reason}`
          : `--- PAGO RECHAZADO ---\nMotivo: ${reason}`,
      })
      .eq('id', params.id)

    if (updateError) {
      return NextResponse.json({ error: 'Error al rechazar el pago' }, { status: 500 })
    }

    // Audit log
    logAudit({
      userId: user.id,
      action: 'payment.rejected',
      resource: 'order',
      resourceId: params.id,
      details: { reason, order_number: order.order_number },
    })

    // WhatsApp notification to customer (fire-and-forget)
    const customer = (order.order_customers as any)?.[0]
    if (customer?.phone) {
      notifyCustomerPaymentRejected(
        {
          id: params.id,
          order_number: order.order_number,
          total: order.total,
          business_id: order.business_id,
          customer: { name: customer.name, phone: customer.phone },
          business: { name: business.name, whatsapp: business.whatsapp },
        },
        reason
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Pago rechazado. El cliente debe subir un nuevo comprobante.'
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
