import { Resend } from 'resend'

let _resend: Resend | null = null

export function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY || '')
  }
  return _resend
}

export const EMAIL_FROM = process.env.EMAIL_FROM || 'SomosLagos <notificaciones@somoslagos.com.mx>'
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@somoslagos.com.mx'
