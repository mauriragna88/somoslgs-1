import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUser } from '@/lib/supabase/server'
import { logAudit } from '@/lib/security'
import { notifyCustomerOrderUpdate } from '@/lib/whatsapp'
import { z } from 'zod'

const updateOrderSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'preparing', 'ready', 'delivering', 'completed', 'cancelled']).optional(),
  rejection_reason: z.string().optional(),
  estimated_delivery_time: z.string().optional(),
})

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()

    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(*),
        order_customers(*),
        businesses(name, whatsapp, owner_id)
      `)
      .eq('id', params.id)
      .single()

    if (error || !order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
    }

    // Verify user is the order owner, business owner, or admin
    const isOrderOwner = order.user_id === user.id
    // @ts-ignore
    const isBusinessOwner = order.businesses?.owner_id === user.id

    if (!isOrderOwner && !isBusinessOwner) {
      // Check if admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      // @ts-ignore
      if (profile?.role !== 'admin') {
        return NextResponse.json({ error: 'No tienes permiso para ver este pedido' }, { status: 403 })
      }
    }

    return NextResponse.json({ order })

  } catch (error) {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateOrderSchema.parse(body)

    const supabase = getSupabaseAdmin()

    // Get order and verify ownership (separate queries to avoid join issues)
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, order_customers(name, phone, delivery_address)')
      .eq('id', params.id)
      .single()

    if (orderError || !order) {
      console.error('Order not found:', orderError)
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
    }

    // Verify business ownership separately
    const { data: business, error: bizError } = await supabase
      .from('businesses')
      .select('owner_id, name, whatsapp')
      .eq('id', order.business_id)
      .single()

    if (bizError || !business) {
      console.error('Business not found:', bizError)
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })
    }

    if (business.owner_id !== user.id) {
      return NextResponse.json({ error: 'No tienes permiso para modificar este pedido' }, { status: 403 })
    }

    // Build update object
    const updateData: Record<string, any> = {}

    if (validatedData.status) {
      updateData.status = validatedData.status

      // Set timestamps based on status
      const now = new Date().toISOString()
      if (validatedData.status === 'confirmed') {
        updateData.confirmed_at = now
      } else if (validatedData.status === 'completed') {
        updateData.completed_at = now
      } else if (validatedData.status === 'cancelled') {
        updateData.cancelled_at = now
        if (validatedData.rejection_reason) {
          updateData.rejection_reason = validatedData.rejection_reason
        }
      }
    }

    if (validatedData.estimated_delivery_time) {
      updateData.estimated_delivery_time = validatedData.estimated_delivery_time
    }

    // Update order
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      console.error('Order update error:', updateError)
      return NextResponse.json({ error: 'Error al actualizar el pedido' }, { status: 500 })
    }

    const customer = (order.order_customers as any)?.[0]

    // Send WhatsApp notification to customer on status change (fire-and-forget)
    if (validatedData.status) {
      notifyCustomerOrderUpdate(
        {
          id: params.id,
          order_number: order.order_number,
          total: order.total,
          business_id: order.business_id,
          delivery_type: order.delivery_type,
          customer: customer ? {
            name: customer.name,
            phone: customer.phone,
            delivery_address: customer.delivery_address,
          } : undefined,
          business: { name: business.name, whatsapp: business.whatsapp },
        },
        validatedData.status
      )

      // Audit log for status changes
      logAudit({
        userId: user.id,
        action: 'order.status_changed',
        resource: 'order',
        resourceId: params.id,
        details: { from: order.status, to: validatedData.status, order_number: order.order_number },
      })
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      customer: customer ? {
        name: customer.name,
        phone: customer.phone,
        delivery_address: customer.delivery_address,
      } : null,
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error('Server error updating order:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
