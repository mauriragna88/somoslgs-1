/**
 * Constantes compartidas de la aplicacion SomosLagos
 */

// --- Horarios de negocio ---
export interface DayHours {
  open: string | null  // "09:00"
  close: string | null // "18:00"
  closed: boolean
}

export interface BusinessHours {
  weekdays: DayHours  // Lunes a Viernes
  saturday: DayHours
  sunday: DayHours
}

export const DEFAULT_BUSINESS_HOURS: BusinessHours = {
  weekdays: { open: '09:00', close: '18:00', closed: false },
  saturday: { open: '09:00', close: '14:00', closed: false },
  sunday: { open: null, close: null, closed: true },
}

/**
 * Determina si un negocio esta abierto ahora.
 * Retorna null si no tiene horarios configurados (no mostrar badge).
 */
export function isBusinessOpen(hours: BusinessHours | null | undefined): boolean | null {
  if (!hours) return null

  // Obtener hora actual en Mexico City
  const now = new Date()
  const mexicoTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Mexico_City' }))
  const day = mexicoTime.getDay() // 0=domingo, 1=lunes, ..., 6=sabado
  const currentMinutes = mexicoTime.getHours() * 60 + mexicoTime.getMinutes()

  let schedule: DayHours
  if (day === 0) {
    schedule = hours.sunday
  } else if (day === 6) {
    schedule = hours.saturday
  } else {
    schedule = hours.weekdays
  }

  if (schedule.closed || !schedule.open || !schedule.close) return false

  const [openH, openM] = schedule.open.split(':').map(Number)
  const [closeH, closeM] = schedule.close.split(':').map(Number)
  const openMinutes = openH * 60 + openM
  const closeMinutes = closeH * 60 + closeM

  return currentMinutes >= openMinutes && currentMinutes < closeMinutes
}

// Tiers de suscripcion disponibles
export const SUBSCRIPTION_TIERS = ['gratis', 'pro', 'avanzado'] as const

export type SubscriptionTier = (typeof SUBSCRIPTION_TIERS)[number]

// Tiers de suscripcion que permiten recibir pedidos
export const ORDER_ENABLED_TIERS: readonly string[] = ['pro', 'avanzado']

// Tiers que permiten estadísticas
export const STATS_ENABLED_TIERS: readonly string[] = ['avanzado']

// Tiers que aparecen destacados
export const FEATURED_TIERS: readonly string[] = ['avanzado']

// Limite de fotos en galeria por plan
export const GALLERY_PHOTO_LIMITS: Record<SubscriptionTier, number> = {
  gratis: 5,
  pro: 15,
  avanzado: 20,
}
