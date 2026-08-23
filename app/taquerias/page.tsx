import type { Metadata } from 'next'
import CategoryLanding from '@/components/seo/CategoryLanding'

export const metadata: Metadata = {
  title: 'Taquerías y dónde comer tacos en Lagos de Moreno, Jalisco | SomosLagos',
  description:
    'Las mejores taquerías para comer tacos en Lagos de Moreno: tacos de birria, al pastor, de guisado y más. Horarios, ubicación, opiniones y WhatsApp directo en el Pueblo Mágico.',
  keywords: [
    'taquerías en lagos de moreno',
    'tacos en lagos de moreno',
    'donde comer tacos en lagos de moreno',
    'tacos de birria lagos de moreno',
    'taquerias jalisco pueblo magico',
  ],
  alternates: { canonical: 'https://www.somoslagos.com.mx/taquerias' },
  openGraph: {
    title: 'Taquerías y dónde comer tacos en Lagos de Moreno | SomosLagos',
    description: 'Las mejores taquerías para comer tacos en Lagos de Moreno, Pueblo Mágico de Jalisco.',
    url: 'https://www.somoslagos.com.mx/taquerias',
    type: 'website',
    locale: 'es_MX',
  },
}

export default function TaqueriasPage() {
  return (
    <CategoryLanding
      config={{
        slug: 'taquerias',
        keyword: 'Taquerías',
        title: 'Taquerías y dónde comer tacos en Lagos de Moreno, Jalisco',
        h1: 'Taquerías y dónde comer los mejores tacos en Lagos de Moreno',
        eyebrow: 'Guía de taquerías',
        emoji: '🌮',
        description:
          'Directorio de taquerías para comer tacos en Lagos de Moreno, Jalisco. Tacos de birria, al pastor, de guisado y más, con horarios y contacto.',
        intro: [
          'Lagos de Moreno es un <strong>Pueblo Mágico</strong> con una tradición tacoera de la que pocos hablan. Aquí las <strong>taquerías</strong> se toman en serio: las <strong>tortillas hechas a mano</strong>, los <strong>tacos de birria</strong> que se deshacen, el <strong>al pastor</strong> con su trompo girando y las <strong>salsas de la casa</strong> son parte de la comida de cada día.',
          'En SomosLagos reunimos las <strong>taquerías mejor valoradas</strong> de Lagos de Moreno, con sus <strong>horarios reales</strong>, <strong>ubicación en el mapa</strong> y <strong>WhatsApp directo</strong> para pedir a domicilio o apartar tu orden. Ya sea que busques tacos de <strong>guisado</strong> para el desayuno, de <strong>tripitas</strong> para el antojo, o un plato de <strong>birria</strong> para compartir en familia, aquí lo encuentras.',
        ],
        categorySlugs: ['taquerias', 'tacos', 'comida'],
        schemaType: 'Restaurant',
        schemaCuisine: 'Mexicana, Tacos',
        heroImage: '/tourism/callelagos1.jpg',
      }}
    />
  )
}
