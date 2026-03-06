const LOGO_URL = 'https://www.somoslagos.com.mx/images/logo-somoslagos.png'
const PRIMARY_COLOR = '#0F766E'
const SITE_URL = 'https://www.somoslagos.com.mx'

function layout(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td align="center" style="padding:24px 0;">
              <a href="${SITE_URL}" style="text-decoration:none;color:${PRIMARY_COLOR};font-size:24px;font-weight:bold;">
                SomosLagos
              </a>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="background-color:#ffffff;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding:24px 0;color:#9ca3af;font-size:12px;">
              <p style="margin:0 0 8px;">SomosLagos - Directorio de Negocios de Lagos de Moreno</p>
              <p style="margin:0;">
                <a href="${SITE_URL}" style="color:#9ca3af;">www.somoslagos.com.mx</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function button(text: string, url: string): string {
  return `
  <table cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr>
      <td style="background-color:${PRIMARY_COLOR};border-radius:8px;padding:12px 32px;">
        <a href="${url}" style="color:#ffffff;text-decoration:none;font-weight:bold;font-size:16px;">${text}</a>
      </td>
    </tr>
  </table>`
}

function infoRow(label: string, value: string): string {
  return `
  <tr>
    <td style="padding:8px 12px;color:#6b7280;font-size:14px;border-bottom:1px solid #f3f4f6;">${label}</td>
    <td style="padding:8px 12px;color:#111827;font-size:14px;font-weight:600;border-bottom:1px solid #f3f4f6;">${value}</td>
  </tr>`
}

function infoTable(rows: { label: string; value: string }[]): string {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;border-radius:8px;margin:16px 0;">
    ${rows.map(r => infoRow(r.label, r.value)).join('')}
  </table>`
}

// ============================================================
// TEMPLATES
// ============================================================

/** Email 1: Bienvenida al registrar cuenta + negocio */
export function welcomeBusinessEmail(data: {
  ownerName: string
  businessName: string
  plan: string
  email: string
}) {
  const planPrices: Record<string, string> = {
    gratis: 'Gratis', emprendedor: '$60', pro: '$120', avanzado: '$180'
  }
  return {
    subject: `Bienvenido a SomosLagos - Confirma tus datos`,
    html: layout(`
      <h1 style="color:#111827;font-size:24px;margin:0 0 8px;">Bienvenido a SomosLagos</h1>
      <p style="color:#6b7280;font-size:16px;margin:0 0 24px;">
        Hola ${data.ownerName}, tu negocio ha sido registrado exitosamente.
      </p>
      <h2 style="color:#111827;font-size:18px;margin:0 0 12px;">Datos de tu negocio</h2>
      ${infoTable([
        { label: 'Negocio', value: data.businessName },
        { label: 'Plan', value: data.plan.charAt(0).toUpperCase() + data.plan.slice(1) },
        { label: 'Precio', value: `${planPrices[data.plan] || '$80'} MXN/mes` },
        { label: 'Email', value: data.email },
      ])}
      <p style="color:#6b7280;font-size:14px;margin:16px 0 0;">
        Para activar tu negocio en el directorio, completa el pago de tu suscripcion.
      </p>
      ${button('Completar Pago', `${SITE_URL}/dashboard/pago`)}
      <p style="color:#9ca3af;font-size:12px;margin:16px 0 0;">
        Si tienes dudas, respondenos a este correo.
      </p>
    `),
  }
}

/** Email 2: Negocio ligado a dueno (desde admin) */
export function businessLinkedEmail(data: {
  ownerName: string
  businessName: string
  plan: string
}) {
  return {
    subject: `Tu negocio ${data.businessName} ya esta en SomosLagos`,
    html: layout(`
      <h1 style="color:#111827;font-size:24px;margin:0 0 8px;">Tu negocio esta listo</h1>
      <p style="color:#6b7280;font-size:16px;margin:0 0 24px;">
        Hola ${data.ownerName}, el equipo de SomosLagos ha vinculado tu negocio a tu cuenta.
      </p>
      ${infoTable([
        { label: 'Negocio', value: data.businessName },
        { label: 'Plan', value: data.plan.charAt(0).toUpperCase() + data.plan.slice(1) },
      ])}
      <p style="color:#6b7280;font-size:14px;margin:16px 0 0;">
        Ya puedes acceder a tu panel de administracion para gestionar tu negocio.
      </p>
      ${button('Ir a mi Dashboard', `${SITE_URL}/dashboard`)}
    `),
  }
}

/** Email 3: Notificacion al admin de nuevo pago por verificar */
export function paymentReceivedAdminEmail(data: {
  businessName: string
  ownerName: string
  amount: number
  plan: string
  paymentMethod: string
}) {
  const methodLabel = data.paymentMethod === 'agreement' ? 'Acuerdo' : 'Transferencia'
  return {
    subject: `Nuevo pago por verificar - ${data.businessName}`,
    html: layout(`
      <h1 style="color:#111827;font-size:24px;margin:0 0 8px;">Nuevo Pago Recibido</h1>
      <p style="color:#6b7280;font-size:16px;margin:0 0 24px;">
        Se ha registrado un nuevo pago que requiere tu verificacion.
      </p>
      ${infoTable([
        { label: 'Negocio', value: data.businessName },
        { label: 'Dueno', value: data.ownerName },
        { label: 'Plan', value: data.plan.charAt(0).toUpperCase() + data.plan.slice(1) },
        { label: 'Monto', value: `$${data.amount.toLocaleString('es-MX')} MXN` },
        { label: 'Metodo', value: methodLabel },
      ])}
      ${button('Revisar en Admin', `${SITE_URL}/admin`)}
    `),
  }
}

/** Email 4: Pago aprobado - notificar al dueno */
export function paymentApprovedEmail(data: {
  ownerName: string
  businessName: string
  plan: string
  expiresAt: string
}) {
  return {
    subject: `Pago confirmado - Tu negocio ${data.businessName} esta activo`,
    html: layout(`
      <div style="text-align:center;margin-bottom:24px;">
        <span style="font-size:48px;">&#10003;</span>
      </div>
      <h1 style="color:#111827;font-size:24px;margin:0 0 8px;text-align:center;">Pago Confirmado</h1>
      <p style="color:#6b7280;font-size:16px;margin:0 0 24px;text-align:center;">
        Hola ${data.ownerName}, tu pago ha sido aprobado y tu negocio ya esta visible en el directorio.
      </p>
      ${infoTable([
        { label: 'Negocio', value: data.businessName },
        { label: 'Plan', value: data.plan.charAt(0).toUpperCase() + data.plan.slice(1) },
        { label: 'Activo hasta', value: data.expiresAt },
      ])}
      ${button('Ver mi Negocio', `${SITE_URL}/dashboard`)}
    `),
  }
}

/** Email 5: Pago rechazado - notificar al dueno */
export function paymentRejectedEmail(data: {
  ownerName: string
  businessName: string
  reason?: string
}) {
  return {
    subject: `Hay un problema con tu pago - ${data.businessName}`,
    html: layout(`
      <h1 style="color:#111827;font-size:24px;margin:0 0 8px;">Pago No Aprobado</h1>
      <p style="color:#6b7280;font-size:16px;margin:0 0 24px;">
        Hola ${data.ownerName}, lamentamos informarte que tu pago no pudo ser verificado.
      </p>
      ${data.reason ? `
      <div style="background-color:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin:16px 0;">
        <p style="color:#991b1b;font-size:14px;margin:0;"><strong>Motivo:</strong> ${data.reason}</p>
      </div>` : ''}
      <p style="color:#6b7280;font-size:14px;margin:16px 0;">
        Puedes intentar nuevamente realizando otro pago desde tu dashboard.
      </p>
      ${button('Reintentar Pago', `${SITE_URL}/dashboard/pago`)}
      <p style="color:#9ca3af;font-size:12px;margin:16px 0 0;">
        Si crees que esto es un error, respondenos a este correo.
      </p>
    `),
  }
}

/** Email: Bienvenida al crear cuenta (sin negocio aun) */
export function welcomeAccountEmail(data: {
  name: string
}) {
  return {
    subject: 'Bienvenido a SomosLagos',
    html: layout(`
      <div style="text-align:center;margin-bottom:24px;">
        <span style="font-size:48px;">&#128075;</span>
      </div>
      <h1 style="color:#111827;font-size:24px;margin:0 0 8px;text-align:center;">Bienvenido a SomosLagos</h1>
      <p style="color:#6b7280;font-size:16px;margin:0 0 24px;text-align:center;">
        Hola ${data.name}, tu cuenta ha sido creada exitosamente.
      </p>
      <p style="color:#6b7280;font-size:14px;margin:0 0 16px;">
        Ahora puedes registrar tu negocio en el directorio de Lagos de Moreno y empezar a recibir clientes.
      </p>
      <div style="background-color:#f0fdfa;border:1px solid #99f6e4;border-radius:8px;padding:16px;margin:16px 0;">
        <p style="color:#0f766e;font-size:14px;margin:0;font-weight:bold;">Que puedes hacer:</p>
        <ul style="color:#0f766e;font-size:14px;margin:8px 0 0;padding-left:20px;">
          <li>Registrar tu negocio</li>
          <li>Elegir un plan que se adapte a tus necesidades</li>
          <li>Aparecer en el directorio y recibir clientes</li>
        </ul>
      </div>
      ${button('Registrar mi Negocio', `${SITE_URL}/registrar-negocio`)}
      <p style="color:#9ca3af;font-size:12px;margin:16px 0 0;">
        Si tienes dudas, respondenos a este correo o contactanos por WhatsApp.
      </p>
    `),
  }
}

/** Email 6: Acuerdo de pago registrado - notificar al admin */
export function agreementRegisteredAdminEmail(data: {
  businessName: string
  ownerName: string
  ownerPhone: string
  ownerEmail: string
  amount: number
  plan: string
}) {
  return {
    subject: `Nuevo acuerdo de pago - ${data.businessName}`,
    html: layout(`
      <h1 style="color:#111827;font-size:24px;margin:0 0 8px;">Nuevo Acuerdo de Pago</h1>
      <p style="color:#6b7280;font-size:16px;margin:0 0 24px;">
        Un cliente quiere acordar el pago en persona. Contactalo para coordinar.
      </p>
      ${infoTable([
        { label: 'Negocio', value: data.businessName },
        { label: 'Dueno', value: data.ownerName },
        { label: 'Email', value: data.ownerEmail },
        { label: 'Telefono', value: data.ownerPhone || 'No proporcionado' },
        { label: 'Plan', value: data.plan.charAt(0).toUpperCase() + data.plan.slice(1) },
        { label: 'Monto', value: `$${data.amount.toLocaleString('es-MX')} MXN` },
      ])}
      ${button('Ver en Admin', `${SITE_URL}/admin`)}
    `),
  }
}
