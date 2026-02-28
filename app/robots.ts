import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard/*',
        '/admin/*',
        '/api/*',
        '/checkout/*',
        '/auth/*',
        '/profile',
        '/mis-pedidos',
        '/marketplace/mis-articulos',
        '/marketplace/publicar',
        '/marketplace/editar/*',
      ],
    },
    sitemap: 'https://www.somoslagos.com.mx/sitemap.xml',
  }
}
