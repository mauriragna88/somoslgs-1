import { createServiceClient } from '@/lib/supabase/server'
import EventsGrid from './EventsGrid'
import type { SiteEvent } from '@/types/database.types'

export const revalidate = 3600

const FALLBACK_EVENTS: SiteEvent[] = [
  {
    id: 'fallback-1',
    name: 'Feria de Lagos',
    month_code: 'AGO',
    dates: '1 – 15 Agosto',
    description: 'La fiesta más grande del año. Charrería, música en vivo, artesanías, gastronomía y el desfile más colorido del Bajío. Un evento que marca a Lagos para siempre.',
    category: 'Tradición',
    category_color: '#FF6B35',
    image_src: '/tourism/danza-matachines.jpg',
    image_alt: 'Feria de Lagos de Moreno — Danza de Matachines',
    is_upcoming: true,
    col_span: 'md:col-span-1',
    row_span: 'md:row-span-2',
    display_order: 1,
    is_active: true,
    created_at: '',
    updated_at: '',
  },
  {
    id: 'fallback-2',
    name: 'Día de Muertos',
    month_code: 'NOV',
    dates: '1 – 2 Nov',
    description: 'Ofrendas, cempasúchil y danzas que honran a quienes ya no están. El centro histórico se transforma en un altar vivo.',
    category: 'Tradición',
    category_color: '#D946EF',
    image_src: '/tourism/dia-muertos.jpg',
    image_alt: 'Día de Muertos en Lagos de Moreno',
    is_upcoming: false,
    col_span: 'md:col-span-1',
    row_span: 'md:row-span-1',
    display_order: 2,
    is_active: true,
    created_at: '',
    updated_at: '',
  },
  {
    id: 'fallback-3',
    name: 'Aniversario de la Ciudad',
    month_code: 'MAR',
    dates: '21 Marzo',
    description: 'Lagos celebra su fundación en 1563 con eventos culturales, conciertos y una ciudad que se viste de orgullo.',
    category: 'Cultural',
    category_color: '#F5B942',
    image_src: '/tourism/centro-historico.jpg',
    image_alt: 'Centro histórico de Lagos de Moreno',
    is_upcoming: false,
    col_span: 'md:col-span-1',
    row_span: 'md:row-span-1',
    display_order: 3,
    is_active: true,
    created_at: '',
    updated_at: '',
  },
  {
    id: 'fallback-4',
    name: 'Calles Decembrinas',
    month_code: 'DIC',
    dates: 'Todo Diciembre',
    description: 'En diciembre Lagos se transforma. Luces, nacimientos, ponche y buñuelos llenan cada rincón del centro histórico.',
    category: 'Familiar',
    category_color: '#22B8CF',
    image_src: '/tourism/callelagos1.jpg',
    image_alt: 'Callejones de Lagos en diciembre',
    is_upcoming: false,
    col_span: 'md:col-span-2',
    row_span: 'md:row-span-1',
    display_order: 4,
    is_active: true,
    created_at: '',
    updated_at: '',
  },
  {
    id: 'fallback-5',
    name: 'Semana Santa',
    month_code: 'ABR',
    dates: 'Semana Santa',
    description: 'Procesiones y representaciones que llenan de devoción el corazón de Lagos. Una de las más emotivas de todo Jalisco.',
    category: 'Religioso',
    category_color: '#C86B4A',
    image_src: '/tourism/turismo-religioso.jpg',
    image_alt: 'Turismo religioso en Lagos de Moreno',
    is_upcoming: false,
    col_span: 'md:col-span-1',
    row_span: 'md:row-span-1',
    display_order: 5,
    is_active: true,
    created_at: '',
    updated_at: '',
  },
  {
    id: 'fallback-6',
    name: 'Haciendas de los Altos',
    month_code: '365',
    dates: 'Todo el año',
    description: 'Las haciendas históricas de los Altos de Jalisco: arquitectura colonial, tequila artesanal y paisajes que enamoran.',
    category: 'Turismo',
    category_color: '#22C55E',
    image_src: '/tourism/panoramica-lagos.jpg',
    image_alt: 'Panorámica de Lagos de Moreno',
    is_upcoming: false,
    col_span: 'md:col-span-1',
    row_span: 'md:row-span-1',
    display_order: 6,
    is_active: true,
    created_at: '',
    updated_at: '',
  },
]

export default async function EventsSection() {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  const events: SiteEvent[] = (!error && data && data.length > 0)
    ? (data as SiteEvent[])
    : FALLBACK_EVENTS

  return <EventsGrid events={events} />
}
