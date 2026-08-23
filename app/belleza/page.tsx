import type { Metadata } from 'next'
import CategoryLanding from '@/components/seo/CategoryLanding'

export const metadata: Metadata = {
  title: 'Belleza y cuidado personal en Lagos de Moreno | SomosLagos',
  description:
    'Salones de belleza, barberías, uñas, spa y estética en Lagos de Moreno, Jalisco. Tratamientos, maquillaje profesional y cuidado personal con contacto directo.',
  keywords: [
    'belleza en lagos de moreno',
    'salones de belleza lagos de moreno',
    'barberías lagos de moreno',
    'uñas y nail salon lagos de moreno',
    'spa lagos de moreno',
    'estética lagos de moreno',
  ],
  alternates: { canonical: 'https://www.somoslagos.com.mx/belleza' },
  openGraph: {
    title: 'Belleza y cuidado personal en Lagos de Moreno | SomosLagos',
    description: 'Salones de belleza, barberías, uñas y spa en Lagos de Moreno, Pueblo Mágico de Jalisco.',
    url: 'https://www.somoslagos.com.mx/belleza',
    type: 'website',
    locale: 'es_MX',
  },
}

export default function BellezaPage() {
  return (
    <CategoryLanding
      config={{
        slug: 'belleza',
        keyword: 'Belleza y cuidado personal',
        title: 'Belleza y cuidado personal en Lagos de Moreno, Jalisco',
        h1: 'Salones de belleza, barberías y estética en Lagos de Moreno',
        eyebrow: 'Guía de belleza',
        emoji: '💅',
        description:
          'Directorio de belleza y cuidado personal en Lagos de Moreno, Jalisco. Salones, barberías, uñas, spa y estética.',
        intro: [
          'Lucir bien se ha vuelto más fácil en Lagos de Moreno. Los <strong>salones de belleza</strong>, <strong>barberías</strong>, <strong>estudios de uñas</strong> y <strong>spas</strong> del <strong>Pueblo Mágico</strong> ofrecen servicios profesionales con productos de calidad, desde <strong>cortes y color</strong> hasta <strong>maquillaje profesional</strong> y <strong>tratamientos faciales</strong>.',
          'En SomosLagos encuentras los <strong>mejores negocios de belleza</strong> de Lagos de Moreno, con sus <strong>horarios</strong>, <strong>ubicación exacta</strong> y <strong>WhatsApp directo</strong> para agendar tu cita. Muchos ofrecen <strong>promociones</strong> y atienden a domicilio para eventos y bodas.',
        ],
        categorySlugs: ['belleza', 'esteticas', 'barberias', 'unas-nail-salon', 'maquillaje-profesional', 'spa', 'cuidado-piel', 'cejas-pestanas', 'tatuajes-piercings'],
        schemaType: 'BeautySalon',
        heroImage: '/tourism/museo-arte-sacro.jpg',
      }}
    />
  )
}
