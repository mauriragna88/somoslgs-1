import { BANNED_WORDS } from '@/lib/constants'

/**
 * Normaliza texto: quita acentos, lowercase
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

/**
 * Revisa título y descripción contra lista de palabras prohibidas.
 * Retorna ok:true si pasa, ok:false con razón si contiene palabras prohibidas.
 */
export function moderateText(
  title: string,
  description: string
): { ok: boolean; reason?: string } {
  const combined = normalize(`${title} ${description}`)
  const words = combined.split(/\s+/)

  for (const banned of BANNED_WORDS) {
    const normalizedBanned = normalize(banned)
    if (words.some(word => word === normalizedBanned || word.includes(normalizedBanned))) {
      return {
        ok: false,
        reason: `Tu publicación contiene una palabra no permitida: "${banned}". Por favor revisa las reglas de publicación.`,
      }
    }
  }

  return { ok: true }
}

/**
 * Verifica si un artículo ha expirado
 */
export function isListingExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false
  return new Date(expiresAt) < new Date()
}
