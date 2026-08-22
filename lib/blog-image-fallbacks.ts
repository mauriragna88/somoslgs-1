export const BLOG_IMAGE_FALLBACKS = [
  '/tourism/centro-historico.jpg',
  '/tourism/jardin-constituyentes.jpg',
  '/tourism/teatro-rosas-moreno.jpg',
  '/tourism/callelagos1.jpg',
  '/tourism/panoramica-lagos.jpg',
  '/tourism/parroquia-asuncion.jpg',
  '/tourism/puente-rio.jpg',
  '/tourism/dia-muertos.jpg',
  '/tourism/calvario-panoramica.jpg',
  '/tourism/calvario.jpg',
  '/tourism/calvario1.jpg',
  '/tourism/calvario2.jpg',
  '/tourism/casa-cultura.jpg',
  '/tourism/danza-matachines.jpg',
  '/tourism/museo-arte-sacro.jpg',
  '/tourism/palacio-municipal.jpg',
  '/tourism/parroquia.jpeg',
  '/tourism/puente-panoramica.jpg',
  '/tourism/puente.jpeg',
  '/tourism/puente2.jpg',
  '/tourism/teatro.jpg',
  '/tourism/templo-calvario.jpg',
  '/tourism/turismo-religioso.jpg',
] as const

export function resolveBlogImage(featuredImageUrl: string | null | undefined, index: number) {
  if (featuredImageUrl) return featuredImageUrl
  return BLOG_IMAGE_FALLBACKS[index % BLOG_IMAGE_FALLBACKS.length]
}
