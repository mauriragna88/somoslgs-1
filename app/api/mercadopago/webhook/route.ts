import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHmac } from 'crypto'
import { getMercadoPagoPayment, PLATFORM_COMMISSION_RATE } from '@/lib/mercadopago'
import { decryptIfPresent } from '@/lib/encryption'
import { logAudit } from '@/lib/security'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

function verifyWebhookSignature(
  xSignature: string | null,
  xRequestId: string | null,
  dataId: string
): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET
  if (!secret) {
    console.warn('MERCADOPAGO_WEBHOOK_SECRET not configured - signature not verified')
    return process.env.NODE_ENV === 'development'
  }
  if (!xSignature) return false

  // Parse x-signature header: "ts=...,v1=..."
  const parts: Record<string, string> = {}
  xSignature.split(',').forEach((part) => {
    const [key, value] = part.split('=', 2)
    if (key && value) parts[key.trim()] = value.trim()
  })

  const ts = parts['ts']
  const v1 = parts['v1']
  if (!ts || !v1) return false

  // Build the manifest string
  const manifest = `id:${dataId};request-id:${xRequestId || ''};ts:${ts};`
  const computed = createHmac('sha256', secret).update(manifest).digest('hex')

  // Constant-time comparison
  if (computed.length !== v1.length) return false
  let result = 0
  for (let i = 0; i < computed.length; i++) {
    result |= computed.charCodeAt(i) ^ v1.charCodeAt(i)
  }
  return result === 0
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // MercadoPago sends type and action
    const { type, action, data } = body

    // Only process payment notifications
    if (type !== 'payment' || !data?.id) {
      return NextResponse.json({ received: true })
    }

    // Verify signature
    const xSignature = request.headers.get('x-signature')
    const xRequestId = request.headers.get('x-request-id')

    if (!verifyWebhookSignature(xSignature, xRequestId, String(data.id))) {
      console.error('MercadoPago webhook: invalid signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // Fetch payment details from MercadoPago
    let payment
    try {
      payment = await getMercadoPagoPayment(String(data.id))
    } catch {
      return NextResponse.json(
        { error: 'Could not fetch payment' },
        { status: 400 }
      )
    }

    const metadata = payment.metadata || {}
    const supabase = getSupabaseAdmin()

    // If direct mode, re-fetch with business's token
    if (metadata.payment_mode === 'direct' && metadata.business_id) {
      const { data: biz } = await supabase
        .from('businesses')
        .select('mercadopago_access_token')
        .eq('id', metadata.business_id)
        .single()

      if (biz?.mercadopago_access_token) {
        const decryptedToken = decryptIfPresent(biz.mercadopago_access_token)
        if (decryptedToken) {
          try {
            payment = await getMercadoPagoPayment(String(data.id), decryptedToken)
          } catch {
            // Fall through with platform-fetched payment
          }
        }
      }
    }

    if (payment.status === 'approved') {
      if (metadata.type === 'subscription') {
        const { business_id, tier, months, user_id } = metadata

        // Create approved transaction record
        await supabase.from('transactions').insert({
          business_id,
          user_id: user_id || null,
          amount: payment.transaction_amount,
          currency: 'MXN',
          subscription_tier: tier,
          subscription_months: parseInt(months) || 1,
          payment_method: 'mercadopago',
          status: 'approved',
          proof_notes: `MercadoPago Payment: ${data.id}`,
        })

        // Activate subscription
        const monthsNum = parseInt(months) || 1
        const expiresAt = new Date()
        expiresAt.setMonth(expiresAt.getMonth() + monthsNum)

        await supabase
          .from('businesses')
          .update({
            subscription_tier: tier,
            subscription_status: 'active',
            subscription_expires_at: expiresAt.toISOString(),
            is_active: true,
            status: 'active',
          })
          .eq('id', business_id)

        logAudit({
          action: 'mercadopago_subscription_paid',
          resource: 'business',
          resourceId: business_id,
          details: {
            mp_payment_id: String(data.id),
            tier,
            months: monthsNum,
            amount: payment.transaction_amount,
          },
        })
      } else if (metadata.type === 'order') {
        const { order_id, payment_mode } = metadata
        const amount = payment.transaction_amount

        await supabase
          .from('orders')
          .update({ payment_status: 'verified' })
          .eq('id', order_id)

        const commission = payment_mode === 'platform'
          ? Math.round(amount * PLATFORM_COMMISSION_RATE * 100) / 100
          : 0

        logAudit({
          action: 'mercadopago_order_paid',
          resource: 'order',
          resourceId: order_id,
          details: {
            mp_payment_id: String(data.id),
            payment_mode: payment_mode || 'platform',
            amount,
            platform_commission: commission,
            business_receives: Math.round((amount - commission) * 100) / 100,
          },
        })
      }
    } else if (payment.status === 'rejected') {
      if (metadata.type === 'order' && metadata.order_id) {
        await supabase
          .from('orders')
          .update({ payment_status: 'failed' })
          .eq('id', metadata.order_id)
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('MercadoPago webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
