import type { Metadata } from 'next'
import CategoryLanding from '@/components/seo/CategoryLanding'

export const metadata: Metadata = {
  title: 'Bares y centros nocturnos en Lagos de Moreno | SomosLagos',
  description:
    'Bares, cantinas y centros nocturnos en Lagos de Moreno, Jalisco. Dónde salir de noche en el Pueblo Mágico: cerveza artesanal, música en vivo y ambiente.',
  keywords: [
    'bares en lagos de moreno',
    'centros nocturnos en lagos de moreno',
    'cantinas lagos de moreno',
    'donde salir de noche en lagos de moreno',
    'vida nocturna pueblo magico jalisco',
  ],
  alternates: { canonical: 'https://www.somoslagos.com.mx/bares' },
  openGraph: {
    title: 'Bares y centros nocturnos en Lagos de Moreno | SomosLagos',
    description: 'Bares, cantinas y vida nocturna en Lagos de Moreno, Pueblo Mágico de Jalisco.',
    url: 'https://www.somoslagos.com.mx/bares',
    type: 'website',
    locale: 'es_MX',
  },
}

export default function BaresPage() {
  return (
    <CategoryLanding
      config={{
        slug: 'bares',
        keyword: 'Bares y centros nocturnos',
        title: 'Bares y centros nocturnos en Lagos de Moreno, Jalisco',
        h1: 'Bares y centros nocturnos en Lagos de Moreno',
        eyebrow: 'Guía de vida nocturna',
        emoji: '🍸',
        description:
          'Directorio de bares, cantinas y centros nocturnos en Lagos de Moreno, Jalisco. Dónde salir de noche.',
        intro: [
          'La noche en Lagos de Moreno tiene su propio ritmo. Los <strong>bares</strong> y <strong>cantinas</strong> del <strong>Pueblo Mágico</strong> van desde los clásicos <strong>cantaritos</strong> y cerveza artesanal hasta <strong>música en vivo</strong> en casonas del centro histórico. Después de cenar, la avenida y los portales se llenan de ambiente.',
          'En SomosLagos encuentras los <strong>bares y centros nocturnos</strong> mejor valorados de Lagos de Moreno, con sus <strong>horarios</strong>, <strong>ubicación</strong> y <strong>WhatsApp directo</strong> para reservar mesa o pedir a domicilio. Muchos también ofrecen <strong>botanas</strong> y <strong>antojitos</strong> para acompañar la noche.',
        ],
        categorySlugs: ['bares', 'cantinas', 'centros-nocturnos', 'entretenimiento'],
        schemaType: 'BarOrPub',
      }}
    />
  )
}
