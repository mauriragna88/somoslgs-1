import { createServiceClient } from '@/lib/supabase/server'

const BOT_UA = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|curl|wget|headless|lighthouse/i

/** Normaliza el termino para agrupar busquedas iguales ("Tacos " y "tacos" cuentan como una). */
export function normalizeSearchTerm(raw: string): string | null {
  const term = raw.toLowerCase().replace(/\s+/g, ' ').trim().slice(0, 80)
  if (term.length < 2) return null
  // No guardar nada que parezca dato personal (correo, telefono)
  if (term.includes('@') || /\d{6,}/.test(term.replace(/[\s-]/g, ''))) return null
  return term
}

/** Registra una busqueda enviada. Nunca debe romper la pagina. */
export async function logSearch(rawTerm: string, results: number, userAgent: string | null) {
  try {
    if (userAgent && BOT_UA.test(userAgent)) return
    const term = normalizeSearchTerm(rawTerm)
    if (!term) return
    const supabase = createServiceClient()
    await supabase.from('search_queries').insert({ term, results })
  } catch {
    // silencioso: el registro es opcional
  }
}
