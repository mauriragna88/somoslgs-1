import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHmac } from 'crypto'
import { getConektaOrder, PLATFORM_COMMISSION_RATE } from '@/lib/conekta'
import { decryptIfPresent } from '@/lib/encryption'
import { logAudit } from '@/lib/security'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  const webhookKey = process.env.CONEKTA_WEBHOOK_KEY
  if (!webhookKey) {
    // If no key configured, log warning but allow in development
    console.warn('CONEKTA_WEBHOOK_KEY not configured - webhook signature not verified')
    return process.env.NODE_ENV === 'development'
  }
  if (!signature) return false

  const computed = createHmac('sha256', webhookKey).update(rawBody).digest('hex')
  // Constant-time comparison to prevent timing attacks
  if (computed.length !== signature.length) return false
  let result = 0
  for (let i = 0; i < computed.length; i++) {
    result |= computed.charCodeAt(i) ^ signature.charCodeAt(i)
  }
  return result === 0
}

export async function POST(request: Request) {
  try {
    // Read raw body for signature verification
    const rawBody = await request.text()

    // Verify webhook signature
    const signature = request.headers.get('digest') || request.headers.get('x-webhook-signature')
    if (!verifyWebhookSignature(rawBody, signature)) {
      console.error('Conekta webhook: invalid signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const body = JSON.parse(rawBody)

    // Only process order.paid events
    if (body.type !== 'order.paid') {
      return NextResponse.json({ received: true })
    }

    const conektaOrderId = body.data?.object?.id
    if (!conektaOrderId) {
      return NextResponse.json({ error: 'Bad request' }, { status: 400 })
    }

    // Get metadata from webhook payload to determine which key to use
    const webhookMetadata = body.data?.object?.metadata || {}
    const supabase = getSupabaseAdmin()

    // If the order was created with a business's own key (direct mode),
    // we need to use that key to verify the order
    let verifyApiKey: string | undefined
    if (webhookMetadata.payment_mode === 'direct' && webhookMetadata.business_id) {
      const { data: biz } = await supabase
        .from('businesses')
        .select('conekta_private_key')
        .eq('id', webhookMetadata.business_id)
        .single()
      verifyApiKey = decryptIfPresent(biz?.conekta_private_key) || undefined
    }

    // Verify the order exists and is paid by calling Conekta API
    let conektaOrder
    try {
      conektaOrder = await getConektaOrder(conektaOrderId, verifyApiKey)
    } catch {
      return NextResponse.json(
        { error: 'Could not verify order' },
        { status: 400 }
      )
    }

    if (conektaOrder.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Order not paid' }, { status: 400 })
    }

    const metadata = conektaOrder.metadata || {}

    if (metadata.type === 'subscription') {
      const { business_id, tier, months, user_id } = metadata

      // Create approved transaction record
      await supabase.from('transactions').insert({
        business_id,
        user_id: user_id || null,
        amount: conektaOrder.amount / 100, // centavos → pesos
        currency: 'MXN',
        subscription_tier: tier,
        subscription_months: parseInt(months) || 1,
        payment_method: 'conekta',
        status: 'approved',
        proof_notes: `Conekta Order: ${conektaOrderId}`,
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
        action: 'conekta_subscription_paid',
        resource: 'business',
        resourceId: business_id,
        details: {
          conekta_order_id: conektaOrderId,
          tier,
          months: monthsNum,
          amount: conektaOrder.amount / 100,
        },
      })
    } else if (metadata.type === 'order') {
      const { order_id, payment_mode } = metadata
      const amountPesos = conektaOrder.amount / 100

      // Mark order payment as verified
      await supabase
        .from('orders')
        .update({ payment_status: 'verified' })
        .eq('id', order_id)

      // Calculate commission for platform-managed payments
      const commission = payment_mode === 'platform'
        ? Math.round(amountPesos * PLATFORM_COMMISSION_RATE * 100) / 100
        : 0

      logAudit({
        action: 'conekta_order_paid',
        resource: 'order',
        resourceId: order_id,
        details: {
          conekta_order_id: conektaOrderId,
          payment_mode: payment_mode || 'platform',
          amount: amountPesos,
          platform_commission: commission,
          business_receives: Math.round((amountPesos - commission) * 100) / 100,
        },
      })
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Conekta webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
