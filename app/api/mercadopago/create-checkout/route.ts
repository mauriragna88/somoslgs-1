import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUser } from '@/lib/supabase/server'
import { createMercadoPagoPreference, isMercadoPagoConfigured } from '@/lib/mercadopago'
import { decryptIfPresent } from '@/lib/encryption'
import { z } from 'zod'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

const subscriptionCheckoutSchema = z.object({
  type: z.literal('subscription'),
  business_id: z.string().uuid(),
  tier: z.enum(['pro', 'avanzado']),
  amount: z.number().positive(),
  months: z.number().int().positive().default(1),
})

const orderCheckoutSchema = z.object({
  type: z.literal('order'),
  order_id: z.string().uuid(),
  order_number: z.string(),
  amount: z.number().positive(),
  customer_name: z.string(),
  customer_email: z.string().email().optional(),
  customer_phone: z.string(),
  business_name: z.string(),
  business_slug: z.string(),
  business_id: z.string().uuid(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const webhookUrl = `${baseUrl}/api/mercadopago/webhook`

    if (body.type === 'subscription') {
      // Subscription payment - always uses platform key
      if (!isMercadoPagoConfigured()) {
        return NextResponse.json(
          { error: 'MercadoPago no disponible en este momento' },
          { status: 503 }
        )
      }

      const user = await getUser()
      if (!user) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
      }

      const data = subscriptionCheckoutSchema.parse(body)
      const supabase = getSupabaseAdmin()

      // Verify user owns this business
      const { data: business } = await supabase
        .from('businesses')
        .select('owner_id, name')
        .eq('id', data.business_id)
        .single()

      if (!business || business.owner_id !== user.id) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }

      // Get user profile for payer info
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email, phone')
        .eq('id', user.id)
        .single()

      const tierLabel = data.tier.charAt(0).toUpperCase() + data.tier.slice(1)

      const result = await createMercadoPagoPreference({
        items: [
          {
            title: `Plan ${tierLabel} - SomosLagos (${data.months} mes${data.months > 1 ? 'es' : ''})`,
            unit_price: data.amount,
            quantity: 1,
          },
        ],
        payer: {
          name: profile?.full_name || 'Cliente SomosLagos',
          email: profile?.email || 'noreply@somoslagos.com.mx',
          phone: profile?.phone ? { number: profile.phone } : undefined,
        },
        metadata: {
          type: 'subscription',
          business_id: data.business_id,
          tier: data.tier,
          months: String(data.months),
          user_id: user.id,
        },
        backUrls: {
          success: `${baseUrl}/dashboard/pago?mercadopago=success`,
          failure: `${baseUrl}/dashboard/pago?mercadopago=failed`,
        },
        notificationUrl: webhookUrl,
      })

      return NextResponse.json({
        init_point: result.initPoint,
        preference_id: result.preferenceId,
      })
    } else if (body.type === 'order') {
      // Order payment - no auth required (guests can pay)
      const data = orderCheckoutSchema.parse(body)
      const supabase = getSupabaseAdmin()

      // Look up the business's payment settings
      const { data: businessSettings } = await supabase
        .from('businesses')
        .select('payment_mode, mercadopago_access_token')
        .eq('id', data.business_id)
        .single()

      // Determine which access token to use
      const paymentMode = businessSettings?.payment_mode || 'platform'
      let businessAccessToken: string | undefined

      if (paymentMode === 'direct' && businessSettings?.mercadopago_access_token) {
        businessAccessToken = decryptIfPresent(businessSettings.mercadopago_access_token) || undefined
      }

      // If direct mode but no key, and no platform key either, reject
      if (paymentMode === 'direct' && !businessAccessToken) {
        return NextResponse.json(
          { error: 'El negocio no ha configurado su cuenta de MercadoPago' },
          { status: 400 }
        )
      }

      if (paymentMode === 'platform' && !isMercadoPagoConfigured()) {
        return NextResponse.json(
          { error: 'MercadoPago no disponible en este momento' },
          { status: 503 }
        )
      }

      const result = await createMercadoPagoPreference({
        items: [
          {
            title: `Pedido ${data.order_number} - ${data.business_name}`,
            unit_price: data.amount,
            quantity: 1,
          },
        ],
        payer: {
          name: data.customer_name,
          email: data.customer_email || `guest-${Date.now()}@somoslagos.com.mx`,
          phone: data.customer_phone ? { number: data.customer_phone } : undefined,
        },
        metadata: {
          type: 'order',
          order_id: data.order_id,
          business_id: data.business_id,
          business_slug: data.business_slug,
          order_number: data.order_number,
          payment_mode: paymentMode,
        },
        backUrls: {
          success: `${baseUrl}/checkout/success?order_number=${data.order_number}&slug=${data.business_slug}`,
          failure: `${baseUrl}/checkout/${data.business_slug}?payment=failed`,
        },
        notificationUrl: webhookUrl,
        accessToken: businessAccessToken,
      })

      return NextResponse.json({
        init_point: result.initPoint,
        preference_id: result.preferenceId,
      })
    } else {
      return NextResponse.json(
        { error: 'Tipo de pago no válido' },
        { status: 400 }
      )
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    console.error('MercadoPago create checkout error:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
