import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { getUser } from '@/lib/supabase/server'
import { logAudit } from '@/lib/security'
import { sendPaymentApprovedEmail } from '@/lib/email/send'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const supabaseServer = createServerClient()

    // Verify admin
    const { data: profile } = await supabaseServer
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single() as { data: { role: string } | null }

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Use service role client for admin operations (bypass RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', params.id)
      .single()

    if (transactionError || !transaction) {
      return NextResponse.json({ error: 'Transacción no encontrada' }, { status: 404 })
    }

    if (transaction.status !== 'pending') {
      return NextResponse.json({
        error: 'Esta transacción ya fue procesada'
      }, { status: 400 })
    }

    // Update transaction to approved
    const { error: updateError } = await supabase
      .from('transactions')
      .update({
        status: 'approved',
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      })
      .eq('id', params.id)

    if (updateError) {
      return NextResponse.json({ error: 'Error al aprobar el pago' }, { status: 500 })
    }

    // The trigger "activate_subscription_on_payment" will automatically
    // update the business status and dates

    // Audit log
    logAudit({
      userId: user.id,
      action: 'approve_subscription_payment',
      resource: 'transaction',
      resourceId: params.id,
      details: { business_id: transaction.business_id, amount: transaction.amount },
    })

    // Send approval email to owner
    try {
      const { data: business } = await supabase
        .from('businesses')
        .select('name, subscription_tier, subscription_expires_at, owner_id')
        .eq('id', transaction.business_id)
        .single()

      if (business?.owner_id) {
        const { data: ownerProfile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', business.owner_id)
          .single()

        if (ownerProfile?.email) {
          await sendPaymentApprovedEmail({
            ownerName: ownerProfile.full_name,
            ownerEmail: ownerProfile.email,
            businessName: business.name,
            plan: business.subscription_tier,
            expiresAt: business.subscription_expires_at
              ? new Date(business.subscription_expires_at).toLocaleDateString('es-MX', {
                  day: 'numeric', month: 'long', year: 'numeric'
                })
              : 'Sin fecha',
          })
        }
      }
    } catch {
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Pago aprobado y suscripción activada'
    })
  } catch (error) {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
