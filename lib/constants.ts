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
export const SUBSCRIPTION_TIERS = ['gratis', 'emprendedor', 'pro', 'avanzado'] as const

export type SubscriptionTier = (typeof SUBSCRIPTION_TIERS)[number]

// Orden numerico de tiers (para ordenar en busqueda)
export const TIER_ORDER: Record<string, number> = {
  gratis: 1,
  emprendedor: 2,
  pro: 3,
  avanzado: 4,
}

// Tiers de suscripcion que permiten recibir pedidos
export const ORDER_ENABLED_TIERS: readonly string[] = ['pro', 'avanzado']

// Tiers que permiten estadísticas
export const STATS_ENABLED_TIERS: readonly string[] = ['avanzado']

// Tiers que aparecen destacados
export const FEATURED_TIERS: readonly string[] = ['avanzado']

// Tiers que permiten WhatsApp clickeable en pagina publica
export const WHATSAPP_ENABLED_TIERS: readonly string[] = ['gratis', 'emprendedor', 'pro', 'avanzado']

// Tiers que permiten mapa interactivo en pagina publica
export const MAP_ENABLED_TIERS: readonly string[] = ['gratis', 'emprendedor', 'pro', 'avanzado']

// Tiers que permiten redes sociales en pagina publica
export const SOCIAL_LINKS_TIERS: readonly string[] = ['emprendedor', 'pro', 'avanzado']

// Tiers que permiten portada (cover image) en pagina publica
export const COVER_ENABLED_TIERS: readonly string[] = ['emprendedor', 'pro', 'avanzado']

// Tiers con acceso a productos en dashboard
export const PRODUCTS_ENABLED_TIERS: readonly string[] = ['pro', 'avanzado']

// Items de navegacion del dashboard por tier
export const DASHBOARD_NAV_TIERS: Record<string, readonly string[]> = {
  gratis: ['dashboard', 'mi-negocio'],
  emprendedor: ['dashboard', 'mi-negocio'],
  pro: ['dashboard', 'productos', 'pedidos', 'mi-negocio'],
  avanzado: ['dashboard', 'productos', 'pedidos', 'estadisticas', 'mi-negocio'],
}

// Limite de fotos en galeria por plan
export const GALLERY_PHOTO_LIMITS: Record<SubscriptionTier, number> = {
  gratis: 3,
  emprendedor: 8,
  pro: 15,
  avanzado: 20,
}

// --- Precios de planes (para mostrar en UI) ---
export const PLAN_PRICES: Record<SubscriptionTier, number> = {
  gratis: 0,
  emprendedor: 60,
  pro: 120,
  avanzado: 180,
}

export const PLAN_DAILY_PRICES: Record<SubscriptionTier, string> = {
  gratis: 'Gratis',
  emprendedor: '$2',
  pro: '$4',
  avanzado: '$6',
}

// --- Precios de publicidad ---
export const AD_PRICES = {
  weekly: 200,   // $200/semana
  monthly: 500,  // $500/mes
  quarterly: 1200, // $1,200/trimestre
  dailyFrom: 17,  // "desde $17 al día"
} as const

// --- Marketplace ---
export const MARKETPLACE_PHOTO_LIMIT = 8
export const MARKETPLACE_FREE_PHOTO_LIMIT = 4
export const MARKETPLACE_LISTING_DAYS = 30
export const MARKETPLACE_FEATURED_PRICE = 15 // MXN por 7 días
export const MARKETPLACE_FEATURED_DAYS = 7

export const MARKETPLACE_CONDITIONS = {
  nuevo: 'Nuevo',
  seminuevo: 'Seminuevo',
  usado: 'Usado',
} as const

export const MARKETPLACE_PRICE_TYPES = {
  fijo: 'Precio fijo',
  negociable: 'Negociable',
  gratis: 'Gratis',
  intercambio: 'Intercambio',
} as const

export const MARKETPLACE_REPORT_REASONS = {
  spam: 'Spam o publicación repetida',
  fraude: 'Posible fraude o estafa',
  contenido_inapropiado: 'Contenido inapropiado',
  articulo_prohibido: 'Artículo prohibido',
  otro: 'Otro motivo',
} as const

export const BANNED_WORDS = [
  'arma', 'armas', 'pistola', 'rifle', 'escopeta', 'municion', 'balas',
  'droga', 'drogas', 'marihuana', 'mota', 'coca', 'cristal', 'meta',
  'pornografia', 'porno', 'xxx', 'escort', 'sexo',
  'falsificado', 'pirata', 'clonado', 'replica',
  'organo', 'organos', 'rinon',
] as const

// --- Publicidad / Banners ---
export const BANNER_PLACEMENTS = [
  'home_top', 'home_middle', 'home_left', 'home_right',
  'search_top', 'search_sidebar', 'search_inline', 'business_sidebar', 'categories_top',
  'marketplace_top', 'marketplace_sidebar'
] as const

export type BannerPlacement = (typeof BANNER_PLACEMENTS)[number]

export const BANNER_PLACEMENT_LABELS: Record<BannerPlacement, string> = {
  home_top: 'Inicio - Superior',
  home_middle: 'Inicio - Medio',
  home_left: 'Inicio - Lateral Izquierdo',
  home_right: 'Inicio - Lateral Derecho',
  search_top: 'Búsqueda - Superior',
  search_sidebar: 'Búsqueda - Lateral',
  search_inline: 'Búsqueda - Tarjeta Patrocinada',
  business_sidebar: 'Negocio - Lateral',
  categories_top: 'Categorías - Superior',
  marketplace_top: 'Marketplace - Superior',
  marketplace_sidebar: 'Marketplace - Lateral',
}
