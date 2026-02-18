/**
 * MercadoPago Checkout Pro client for SomosLagos
 * Uses direct fetch calls to MP API v1
 * Supports per-business access tokens for direct payment mode
 */

const MP_API_URL = 'https://api.mercadopago.com'

/** Platform commission rate for managed payments */
export const PLATFORM_COMMISSION_RATE = 0.015 // 1.5%

interface MercadoPagoItem {
  title: string
  unit_price: number // pesos (e.g., $100.00 MXN)
  quantity: number
  currency_id?: string
}

interface MercadoPagoPayer {
  name: string
  email: string
  phone?: { number: string }
}

interface CreatePreferenceParams {
  items: MercadoPagoItem[]
  payer: MercadoPagoPayer
  metadata: Record<string, string>
  backUrls: {
    success: string
    failure: string
    pending?: string
  }
  notificationUrl?: string
  /** Optional business-specific access token (for direct payment mode) */
  accessToken?: string
}

interface MercadoPagoPreferenceResult {
  preferenceId: string
  initPoint: string
}

export async function createMercadoPagoPreference(
  params: CreatePreferenceParams
): Promise<MercadoPagoPreferenceResult> {
  const token = params.accessToken || process.env.MERCADOPAGO_ACCESS_TOKEN
  if (!token) throw new Error('MERCADOPAGO_ACCESS_TOKEN no está configurado')

  const body: Record<string, any> = {
    items: params.items.map((item) => ({
      title: item.title,
      unit_price: item.unit_price,
      quantity: item.quantity,
      currency_id: item.currency_id || 'MXN',
    })),
    payer: {
      name: params.payer.name,
      email: params.payer.email,
      ...(params.payer.phone ? { phone: { number: params.payer.phone.number } } : {}),
    },
    back_urls: {
      success: params.backUrls.success,
      failure: params.backUrls.failure,
      pending: params.backUrls.pending || params.backUrls.success,
    },
    auto_return: 'approved',
    metadata: params.metadata,
  }

  if (params.notificationUrl) {
    body.notification_url = params.notificationUrl
  }

  const response = await fetch(`${MP_API_URL}/checkout/preferences`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Error desconocido' }))
    throw new Error(
      error.message || 'Error al crear preferencia de MercadoPago'
    )
  }

  const data = await response.json()

  return {
    preferenceId: data.id,
    initPoint: data.init_point,
  }
}

/**
 * Get payment details from MercadoPago
 */
export async function getMercadoPagoPayment(
  paymentId: string,
  accessToken?: string
) {
  const token = accessToken || process.env.MERCADOPAGO_ACCESS_TOKEN
  if (!token) throw new Error('MERCADOPAGO_ACCESS_TOKEN no está configurado')

  const response = await fetch(`${MP_API_URL}/v1/payments/${paymentId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error('Error al consultar pago de MercadoPago')
  }

  return response.json()
}

/**
 * Check if MercadoPago is configured at platform level
 */
export function isMercadoPagoConfigured(): boolean {
  return !!process.env.MERCADOPAGO_ACCESS_TOKEN
}
