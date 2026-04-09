import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { getUser } from '@/lib/supabase/server'
import { logAudit } from '@/lib/security'
import { z } from 'zod'
import { sendPaymentRejectedEmail } from '@/lib/email/send'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

const rejectSchema = z.object({
  reason: z.string().min(10, 'La razón debe tener al menos 10 caracteres'),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { reason } = rejectSchema.parse(body)

    const supabaseServer = await createServerClient()

    // Verify admin
    const { data: profile } = await supabaseServer
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single() as { data: { role: string } | null }

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Use admin client for mutations
    const supabase = getSupabaseAdmin()

    // Get transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .single()

    if (transactionError || !transaction) {
      return NextResponse.json({ error: 'Transacción no encontrada' }, { status: 404 })
    }

    if (transaction.status !== 'pending') {
      return NextResponse.json({
        error: 'Esta transacción ya fue procesada'
      }, { status: 400 })
    }

    // Update transaction to rejected
    const { error: updateError } = await supabase
      .from('transactions')
      .update({
        status: 'rejected',
        rejection_reason: reason,
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) {
      return NextResponse.json({ error: 'Error al rechazar el pago' }, { status: 500 })
    }

    // Audit log
    logAudit({
      userId: user.id,
      action: 'reject_subscription_payment',
      resource: 'transaction',
      resourceId: id,
      details: { reason },
    })

    // Send rejection email to owner
    try {
      const { data: business } = await supabase
        .from('businesses')
        .select('name, owner_id')
        .eq('id', transaction.business_id)
        .single()

      if (business?.owner_id) {
        const { data: ownerProfile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', business.owner_id)
          .single()

        if (ownerProfile?.email) {
          await sendPaymentRejectedEmail({
            ownerName: ownerProfile.full_name,
            ownerEmail: ownerProfile.email,
            businessName: business.name,
            reason,
          })
        }
      }
    } catch {
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Pago rechazado. Se notificará al usuario.'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}


