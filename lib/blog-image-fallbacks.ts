export const BLOG_IMAGE_FALLBACKS = [
  '/tourism/centro-historico.jpg',
  '/tourism/jardin-constituyentes.jpg',
  '/tourism/teatro-rosas-moreno.jpg',
  '/tourism/callelagos1.jpg',
  '/tourism/panoramica-lagos.jpg',
  '/tourism/parroquia-asuncion.jpg',
  '/tourism/puente-rio.jpg',
  '/tourism/dia-muertos.jpg',
] as const

export function resolveBlogImage(featuredImageUrl: string | null | undefined, index: number) {
  if (featuredImageUrl) return featuredImageUrl
  return BLOG_IMAGE_FALLBACKS[index % BLOG_IMAGE_FALLBACKS.length]
}
