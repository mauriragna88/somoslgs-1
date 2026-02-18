/**
 * Constantes compartidas de la aplicacion SomosLagos
 */

// Tiers de suscripcion que permiten recibir pedidos
export const ORDER_ENABLED_TIERS: readonly string[] = ['ventas', 'delivery', 'premium']

// Tiers de suscripcion disponibles
export const SUBSCRIPTION_TIERS = ['basico', 'ventas', 'delivery', 'premium'] as const

export type SubscriptionTier = (typeof SUBSCRIPTION_TIERS)[number]

// Limite de fotos en galeria por plan
export const GALLERY_PHOTO_LIMITS: Record<SubscriptionTier, number> = {
  basico: 10,
  ventas: 15,
  delivery: 15,
  premium: 20,
}
