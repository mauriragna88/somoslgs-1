import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

const FROM = process.env.EMAIL_FROM || 'SomosLagos <notificaciones@somoslagos.com.mx>'
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://somoslagos.com.mx'

function isEnabled(): boolean {
  return process.env.ENABLE_EMAILS === 'true' && !!process.env.RESEND_API_KEY
}

function getResend(): Resend {
  return new Resend(process.env.RESEND_API_KEY)
}

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

async function getOwnerEmail(businessId: string): Promise<string | null> {
  const supabase = getSupabaseAdmin()
  const { data: biz } = await supabase
    .from('businesses')
    .select('owner_id')
    .eq('id', businessId)
    .single()
  if (!(biz as any)?.owner_id) return null
  const { data: profile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', (biz as any).owner_id)
    .single()
  return (profile as any)?.email ?? null
}

async function getProfileName(userId: string): Promise<string> {
  const { data } = await getSupabaseAdmin()
    .from('profiles')
    .select('full_name')
    .eq('id', userId)
    .single()
  return (data as any)?.full_name || 'Un cliente'
}

// ============================================
// EMAIL WRAPPER (branded layout)
// ============================================

function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>SomosLagos</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:system-ui,-apple-system,'Segoe UI',sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:40px 16px">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;max-width:580px;width:100%;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
        <tr>
          <td style="background:linear-gradient(135deg,#FF6B35 0%,#F5B942 100%);padding:24px 36px">
            <p style="margin:0;font-size:20px;font-weight:800;color:#fff">SomosLagos</p>
            <p style="margin:4px 0 0;font-size:12px;font-weight:600;letter-spacing:1px;color:rgba(255,255,255,0.75);text-transform:uppercase">El Directorio del Pueblo Mágico</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 36px">${content}</td>
        </tr>
        <tr>
          <td style="background:#f9f9f7;padding:18px 36px;border-top:1px solid #ebebeb">
            <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center">
              Lagos de Moreno, Jalisco · <a href="${BASE_URL}" style="color:#FF6B35;text-decoration:none">somoslagos.com.mx</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ============================================
// ORDER EMAIL
// ============================================

interface NewOrderEmailParams {
  businessId: string
  businessName: string
  orderNumber: string
  orderId: string
  customerName: string
  customerPhone: string
  total: number
  deliveryType: string
  items: Array<{ quantity: number; product_name: string; subtotal: number }>
}

export async function sendNewOrderEmail(params: NewOrderEmailParams): Promise<void> {
  try {
    if (!isEnabled()) return

    const ownerEmail = await getOwnerEmail(params.businessId)
    if (!ownerEmail) return

    const orderLink = `${BASE_URL}/dashboard/pedidos/${params.orderId}`

    const itemsHtml = params.items
      .map(
        item => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:14px;color:#374151">${item.quantity}× ${item.product_name}</td>
          <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:14px;color:#374151;text-align:right;white-space:nowrap">$${item.subtotal.toLocaleString('es-MX')}</td>
        </tr>`
      )
      .join('')

    const html = emailWrapper(`
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#1f2937">🔔 ¡Nuevo pedido!</h1>
      <p style="margin:0 0 24px;font-size:15px;color:#6b7280">
        <strong style="color:#1f2937">${params.businessName}</strong> recibió el pedido
        <strong style="color:#FF6B35">#${params.orderNumber}</strong>
      </p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f7;border-radius:10px;padding:16px 20px;margin-bottom:20px">
        <tr><td>
          <p style="margin:0 0 2px;font-size:11px;font-weight:700;letter-spacing:0.5px;color:#9ca3af;text-transform:uppercase">Cliente</p>
          <p style="margin:0;font-size:16px;font-weight:700;color:#1f2937">${params.customerName}</p>
          <p style="margin:4px 0 0;font-size:13px;color:#6b7280">
            ${params.customerPhone} &nbsp;·&nbsp;
            ${params.deliveryType === 'delivery' ? '🚗 A domicilio' : '🏪 Recoger en tienda'}
          </p>
        </td></tr>
      </table>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
        <tr>
          <th style="padding:0 0 8px;text-align:left;font-size:11px;font-weight:700;letter-spacing:0.5px;color:#9ca3af;text-transform:uppercase;border-bottom:2px solid #f3f4f6">Producto</th>
          <th style="padding:0 0 8px;text-align:right;font-size:11px;font-weight:700;letter-spacing:0.5px;color:#9ca3af;text-transform:uppercase;border-bottom:2px solid #f3f4f6">Subtotal</th>
        </tr>
        ${itemsHtml}
        <tr>
          <td style="padding:12px 0 0;font-size:15px;font-weight:800;color:#1f2937">Total</td>
          <td style="padding:12px 0 0;font-size:17px;font-weight:800;color:#FF6B35;text-align:right">$${params.total.toLocaleString('es-MX')} MXN</td>
        </tr>
      </table>

      <p style="text-align:center;margin:28px 0 0">
        <a href="${orderLink}" style="display:inline-block;background:linear-gradient(135deg,#FF6B35,#F5B942);color:#fff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:100px">
          Ver pedido en el dashboard →
        </a>
      </p>
    `)

    await getResend().emails.send({
      from: FROM,
      to: ownerEmail,
      subject: `🔔 Nuevo pedido #${params.orderNumber} de ${params.customerName} — ${params.businessName}`,
      html,
    })
  } catch {
    // Fire-and-forget: never block the main flow
  }
}

// ============================================
// REVIEW EMAIL
// ============================================

interface NewReviewEmailParams {
  businessId: string
  userId: string
  rating: number
  comment: string | null
}

export async function sendNewReviewEmail(params: NewReviewEmailParams): Promise<void> {
  try {
    if (!isEnabled()) return

    const supabase = getSupabaseAdmin()

    const [ownerEmail, reviewerName, bizResult] = await Promise.all([
      getOwnerEmail(params.businessId),
      getProfileName(params.userId),
      supabase.from('businesses').select('name, slug').eq('id', params.businessId).single(),
    ])

    if (!ownerEmail) return

    const businessName = (bizResult.data as any)?.name ?? 'tu negocio'
    const businessSlug = (bizResult.data as any)?.slug ?? ''
    const profileLink = `${BASE_URL}/negocios/${businessSlug}`

    const stars = '★'.repeat(params.rating) + '☆'.repeat(5 - params.rating)
    const starColors: Record<number, string> = {
      1: '#ef4444', 2: '#f97316', 3: '#eab308', 4: '#84cc16', 5: '#22c55e',
    }
    const starColor = starColors[params.rating] || '#F5B942'

    const html = emailWrapper(`
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#1f2937">⭐ Nueva reseña</h1>
      <p style="margin:0 0 24px;font-size:15px;color:#6b7280">
        <strong style="color:#1f2937">${reviewerName}</strong> dejó una reseña en
        <strong style="color:#FF6B35">${businessName}</strong>
      </p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f7;border-radius:10px;padding:20px 24px;margin-bottom:24px">
        <tr><td>
          <p style="margin:0 0 6px;font-size:26px;color:${starColor};letter-spacing:3px">${stars}</p>
          <p style="margin:0;font-size:14px;font-weight:700;color:#1f2937">${params.rating} de 5 estrellas</p>
          ${
            params.comment
              ? `<p style="margin:14px 0 0;font-size:15px;color:#374151;line-height:1.65;border-left:3px solid #FF6B35;padding-left:14px;font-style:italic">"${params.comment}"</p>`
              : ''
          }
        </td></tr>
      </table>

      <p style="text-align:center;margin:28px 0 0">
        <a href="${profileLink}" style="display:inline-block;background:linear-gradient(135deg,#FF6B35,#F5B942);color:#fff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:100px">
          Ver perfil público →
        </a>
      </p>
    `)

    await getResend().emails.send({
      from: FROM,
      to: ownerEmail,
      subject: `⭐ Nueva reseña ${params.rating}/5 en ${businessName} — SomosLagos`,
      html,
    })
  } catch {
    // Fire-and-forget: never block the main flow
  }
}
