import type { Metadata } from 'next'
import CategoryLanding from '@/components/seo/CategoryLanding'

export const metadata: Metadata = {
  title: 'Hoteles y hospedaje en Lagos de Moreno, Jalisco | SomosLagos',
  description:
    'Hoteles, posadas y hospedaje en Lagos de Moreno, Jalisco. Dónde dormir en el Pueblo Mágico cerca del centro histórico, con ubicación y contacto directo.',
  keywords: [
    'hoteles en lagos de moreno',
    'hospedaje en lagos de moreno',
    'donde dormir en lagos de moreno',
    'hoteles centro lagos de moreno',
    'posadas pueblo magico jalisco',
  ],
  alternates: { canonical: 'https://www.somoslagos.com.mx/hoteles' },
  openGraph: {
    title: 'Hoteles y hospedaje en Lagos de Moreno | SomosLagos',
    description: 'Hoteles, posadas y hospedaje en Lagos de Moreno, Pueblo Mágico de Jalisco.',
    url: 'https://www.somoslagos.com.mx/hoteles',
    type: 'website',
    locale: 'es_MX',
  },
}

export default function HotelesPage() {
  return (
    <CategoryLanding
      config={{
        slug: 'hoteles',
        keyword: 'Hoteles',
        title: 'Hoteles y hospedaje en Lagos de Moreno, Jalisco',
        h1: 'Hoteles y hospedaje en Lagos de Moreno, Jalisco',
        eyebrow: 'Guía de hospedaje',
        emoji: '🏨',
        description:
          'Directorio de hoteles, posadas y hospedaje en Lagos de Moreno, Jalisco. Dónde dormir cerca del centro histórico.',
        intro: [
          'Visitar Lagos de Moreno, <strong>Pueblo Mágico</strong>, merece quedarse a disfrutarlo. Los <strong>hoteles</strong> y <strong>posadas</strong> del centro histórico te permiten despertar frente a la <strong>arquitectura barroca</strong>, caminar al <strong>Jardín Constituyentes</strong> al atardecer y vivir la ciudad como un local.',
          'En SomosLagos encuentras opciones de <strong>hospedaje</strong> para todos los gustos: desde <strong>hoteles boutique</strong> en casonas coloniales hasta <strong>posadas familiares</strong> y <strong>hostales</strong>. Cada uno muestra su <strong>ubicación en el mapa</strong>, <strong>teléfono de contacto</strong> y <strong>WhatsApp directo</strong> para reservar sin intermediarios.',
        ],
        categorySlugs: ['hospedaje', 'hoteles', 'posadas'],
        schemaType: 'Hotel',
      }}
    />
  )
}
