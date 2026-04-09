export const BLOG_IMAGE_FALLBACKS = [
  '/tourism/teatro-rosas-moreno.jpg',
  '/tourism/puente-rio.jpg',
] as const

export function resolveBlogImage(featuredImageUrl: string | null | undefined, index: number) {
  return BLOG_IMAGE_FALLBACKS[index] ?? featuredImageUrl ?? null
}
