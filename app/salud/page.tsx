import type { Metadata } from 'next'
import CategoryLanding from '@/components/seo/CategoryLanding'

export const metadata: Metadata = {
  title: 'Salud y bienestar en Lagos de Moreno: médicos, nutriólogos y más | SomosLagos',
  description:
    'Servicios de salud y bienestar en Lagos de Moreno, Jalisco: médicos, dentistas, nutriólogos, psicólogos, farmacias y centros de salud. Horarios y contacto.',
  keywords: [
    'salud en lagos de moreno',
    'médicos en lagos de moreno',
    'dentistas en lagos de moreno',
    'nutriólogos lagos de moreno',
    'psicólogos lagos de moreno',
    'farmacias lagos de moreno',
  ],
  alternates: { canonical: 'https://www.somoslagos.com.mx/salud' },
  openGraph: {
    title: 'Salud y bienestar en Lagos de Moreno | SomosLagos',
    description: 'Servicios de salud y bienestar en Lagos de Moreno, Pueblo Mágico de Jalisco.',
    url: 'https://www.somoslagos.com.mx/salud',
    type: 'website',
    locale: 'es_MX',
  },
}

export default function SaludPage() {
  return (
    <CategoryLanding
      config={{
        slug: 'salud',
        keyword: 'Salud y bienestar',
        title: 'Salud y bienestar en Lagos de Moreno, Jalisco',
        h1: 'Servicios de salud y bienestar en Lagos de Moreno',
        eyebrow: 'Guía de salud',
        emoji: '⚕️',
        description:
          'Directorio de servicios de salud y bienestar en Lagos de Moreno, Jalisco. Médicos, dentistas, nutriólogos, psicólogos y más.',
        intro: [
          'Cuidar tu salud en Lagos de Moreno es fácil con el directorio de SomosLagos. Encuentra <strong>médicos generales</strong>, <strong>dentistas</strong>, <strong>nutriólogos</strong>, <strong>psicólogos</strong>, <strong>fisioterapeutas</strong> y <strong>farmacias</strong> cerca de tu colonia, con sus <strong>horarios de atención</strong> y <strong>contacto directo por WhatsApp</strong>.',
          'La oferta de <strong>salud y bienestar</strong> del <strong>Pueblo Mágico</strong> combina clínicas modernas con especialistas que entienden a su comunidad. En SomosLagos cada profesional muestra su <strong>ubicación en el mapa</strong>, <strong>teléfono</strong> y <strong>servicios</strong>, para que agendes tu cita sin intermediarios y con total confianza.',
        ],
        categorySlugs: ['salud', 'medicos', 'dentistas', 'farmacias', 'nutriologos', 'psicologos', 'fisioterapia', 'yoga-meditacion'],
        schemaType: 'MedicalClinic',
      }}
    />
  )
}
