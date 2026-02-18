import { getResend, EMAIL_FROM, ADMIN_EMAIL } from './resend'
import {
  welcomeAccountEmail,
  welcomeBusinessEmail,
  businessLinkedEmail,
  paymentReceivedAdminEmail,
  paymentApprovedEmail,
  paymentRejectedEmail,
  agreementRegisteredAdminEmail,
} from './templates'

async function sendEmail(to: string, subject: string, html: string) {
  // Skip in development unless explicitly enabled
  if (process.env.ENABLE_EMAILS !== 'true') {
    console.log(`[Email Skip] To: ${to} | Subject: ${subject}`)
    return
  }

  try {
    const { error } = await getResend().emails.send({
      from: EMAIL_FROM,
      replyTo: ADMIN_EMAIL,
      to,
      subject,
      html,
    })
    if (error) {
      console.error('[Email Error]', error)
    }
  } catch (err) {
    console.error('[Email Error]', err)
  }
}

// ============================================================
// PUBLIC FUNCTIONS - Use these in API routes
// ============================================================

/** 0. Bienvenida al crear cuenta */
export async function sendWelcomeAccountEmail(data: {
  name: string
  email: string
}) {
  const { subject, html } = welcomeAccountEmail({ name: data.name })
  await sendEmail(data.email, subject, html)
}

/** 1. Bienvenida al registrar negocio */
export async function sendWelcomeEmail(data: {
  ownerName: string
  ownerEmail: string
  businessName: string
  plan: string
}) {
  const { subject, html } = welcomeBusinessEmail({
    ownerName: data.ownerName,
    businessName: data.businessName,
    plan: data.plan,
    email: data.ownerEmail,
  })
  await sendEmail(data.ownerEmail, subject, html)
}

/** 2. Negocio ligado a dueno desde admin */
export async function sendBusinessLinkedEmail(data: {
  ownerName: string
  ownerEmail: string
  businessName: string
  plan: string
}) {
  const { subject, html } = businessLinkedEmail({
    ownerName: data.ownerName,
    businessName: data.businessName,
    plan: data.plan,
  })
  await sendEmail(data.ownerEmail, subject, html)
}

/** 3. Notificar al admin que llego un pago por verificar */
export async function sendPaymentReceivedToAdmin(data: {
  businessName: string
  ownerName: string
  amount: number
  plan: string
  paymentMethod: string
}) {
  const { subject, html } = paymentReceivedAdminEmail(data)
  await sendEmail(ADMIN_EMAIL, subject, html)
}

/** 4. Pago aprobado - notificar al dueno */
export async function sendPaymentApprovedEmail(data: {
  ownerName: string
  ownerEmail: string
  businessName: string
  plan: string
  expiresAt: string
}) {
  const { subject, html } = paymentApprovedEmail({
    ownerName: data.ownerName,
    businessName: data.businessName,
    plan: data.plan,
    expiresAt: data.expiresAt,
  })
  await sendEmail(data.ownerEmail, subject, html)
}

/** 5. Pago rechazado - notificar al dueno */
export async function sendPaymentRejectedEmail(data: {
  ownerName: string
  ownerEmail: string
  businessName: string
  reason?: string
}) {
  const { subject, html } = paymentRejectedEmail({
    ownerName: data.ownerName,
    businessName: data.businessName,
    reason: data.reason,
  })
  await sendEmail(data.ownerEmail, subject, html)
}

/** 6. Acuerdo de pago registrado - notificar al admin */
export async function sendAgreementToAdmin(data: {
  businessName: string
  ownerName: string
  ownerPhone: string
  ownerEmail: string
  amount: number
  plan: string
}) {
  const { subject, html } = agreementRegisteredAdminEmail(data)
  await sendEmail(ADMIN_EMAIL, subject, html)
}
