import type { Metadata } from 'next'
import CategoryLanding from '@/components/seo/CategoryLanding'

export const metadata: Metadata = {
  title: 'Cafeterías para desayunar y café en Lagos de Moreno | SomosLagos',
  description:
    'Las mejores cafeterías en Lagos de Moreno, Jalisco: café de especialidad, desayunos, panadería y lugares para trabajar. Horarios, ubicación y contacto.',
  keywords: [
    'cafeterías en lagos de moreno',
    'desayunos en lagos de moreno',
    'café en lagos de moreno',
    'donde desayunar en lagos de moreno',
    'cafeterías pueblo magico jalisco',
  ],
  alternates: { canonical: 'https://www.somoslagos.com.mx/cafeterias' },
  openGraph: {
    title: 'Cafeterías para desayunar y café en Lagos de Moreno | SomosLagos',
    description: 'Las mejores cafeterías en Lagos de Moreno, Pueblo Mágico de Jalisco.',
    url: 'https://www.somoslagos.com.mx/cafeterias',
    type: 'website',
    locale: 'es_MX',
  },
}

export default function CafeteriasPage() {
  return (
    <CategoryLanding
      config={{
        slug: 'cafeterias',
        keyword: 'Cafeterías',
        title: 'Cafeterías para desayunar y café en Lagos de Moreno, Jalisco',
        h1: 'Cafeterías y lugares para desayunar en Lagos de Moreno',
        eyebrow: 'Guía de cafeterías',
        emoji: '☕',
        description:
          'Directorio de cafeterías en Lagos de Moreno, Jalisco. Café de especialidad, desayunos, panadería y espacios para trabajar.',
        intro: [
          'Empezar el día en Lagos de Moreno tiene su propio ritual. Las <strong>cafeterías</strong> del <strong>Pueblo Mágico</strong> ofrecen <strong>café de especialidad</strong>, <strong>desayunos tradicionale</strong>s como chilaquiles y molletes, y <strong>pan de casa</strong> recién horneado. Son el lugar perfecto para desayunar bajo los portales del centro histórico.',
          'En SomosLagos encuentras las <strong>cafeterías mejor valoradas</strong> de Lagos de Moreno, con sus <strong>horarios de apertura</strong>, <strong>ubicación exacta</strong> y <strong>WhatsApp directo</strong> para pedir a domicilio o reservar mesa. Algunas también tienen <strong>internet y espacio</strong> para trabajar, ideales para el trabajo remoto en un entorno con encanto.',
        ],
        categorySlugs: ['cafeterias', 'cafes', 'desayunos'],
        schemaType: 'CafeOrCoffeeShop',
        schemaCuisine: 'Café y desayunos',
      }}
    />
  )
}
