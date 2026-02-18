import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUser, isAdmin } from '@/lib/supabase/server'

const categories = [
  // Comida y Bebidas
  { name: 'Restaurantes', slug: 'restaurantes', icon: '🍽️', display_order: 1 },
  { name: 'Comida Rápida', slug: 'comida-rapida', icon: '🍔', display_order: 2 },
  { name: 'Taquerías', slug: 'taquerias', icon: '🌮', display_order: 3 },
  { name: 'Cafeterías', slug: 'cafeterias', icon: '☕', display_order: 4 },
  { name: 'Panaderías', slug: 'panaderias', icon: '🥖', display_order: 5 },
  { name: 'Bares y Cantinas', slug: 'bares-cantinas', icon: '🍺', display_order: 6 },
  { name: 'Cocinas Económicas', slug: 'cocinas-economicas', icon: '🍲', display_order: 7 },
  { name: 'Marisquerías', slug: 'marisquerias', icon: '🦐', display_order: 8 },
  { name: 'Pizzerías', slug: 'pizzerias', icon: '🍕', display_order: 9 },
  { name: 'Heladerías y Postres', slug: 'heladerias-postres', icon: '🍦', display_order: 10 },
  // Tiendas y Comercio
  { name: 'Abarrotes y Tiendas', slug: 'abarrotes-tiendas', icon: '🏪', display_order: 11 },
  { name: 'Ropa y Moda', slug: 'ropa-moda', icon: '👗', display_order: 12 },
  { name: 'Zapaterías', slug: 'zapaterias', icon: '👟', display_order: 13 },
  { name: 'Farmacias', slug: 'farmacias', icon: '💊', display_order: 14 },
  { name: 'Ferreterías', slug: 'ferreterias', icon: '🔧', display_order: 15 },
  { name: 'Papelerías', slug: 'papelerias', icon: '📚', display_order: 16 },
  { name: 'Mueblerías', slug: 'mueblerias', icon: '🛋️', display_order: 17 },
  { name: 'Electrónica y Celulares', slug: 'electronica-celulares', icon: '📱', display_order: 18 },
  { name: 'Joyerías', slug: 'joyerias', icon: '💍', display_order: 19 },
  // Alimentos Frescos
  { name: 'Carnicerías', slug: 'carnicerias', icon: '🥩', display_order: 20 },
  { name: 'Tortillerías', slug: 'tortillerias', icon: '🫓', display_order: 21 },
  { name: 'Fruterías y Verdulerías', slug: 'fruterias-verdulerias', icon: '🍎', display_order: 22 },
  { name: 'Cremería y Lácteos', slug: 'cremeria-lacteos', icon: '🧀', display_order: 23 },
  { name: 'Pollerías', slug: 'pollerias', icon: '🍗', display_order: 24 },
  // Salud y Belleza
  { name: 'Estéticas y Barberías', slug: 'esteticas-barberias', icon: '✂️', display_order: 25 },
  { name: 'Clínicas y Consultorios', slug: 'clinicas-consultorios', icon: '🏥', display_order: 26 },
  { name: 'Dentistas', slug: 'dentistas', icon: '🦷', display_order: 27 },
  { name: 'Ópticas', slug: 'opticas', icon: '👓', display_order: 28 },
  { name: 'Spa y Masajes', slug: 'spa-masajes', icon: '💆', display_order: 29 },
  { name: 'Gimnasios', slug: 'gimnasios', icon: '💪', display_order: 30 },
  // Servicios
  { name: 'Moto-mandados y Mensajería', slug: 'motomandados-mensajeria', icon: '🏍️', display_order: 31 },
  { name: 'Talleres Mecánicos', slug: 'talleres-mecanicos', icon: '🔧', display_order: 32 },
  { name: 'Refaccionarias', slug: 'refaccionarias', icon: '🚗', display_order: 33 },
  { name: 'Lavanderías', slug: 'lavanderias', icon: '🧺', display_order: 34 },
  { name: 'Veterinarias', slug: 'veterinarias', icon: '🐾', display_order: 35 },
  { name: 'Floristerías', slug: 'floristerias', icon: '🌸', display_order: 36 },
  { name: 'Cerrajerías', slug: 'cerrajerias', icon: '🔑', display_order: 37 },
  { name: 'Tintorerías', slug: 'tintorerias', icon: '👔', display_order: 38 },
  // Profesional
  { name: 'Servicios Profesionales', slug: 'servicios-profesionales', icon: '💼', display_order: 39 },
  { name: 'Contadores y Abogados', slug: 'contadores-abogados', icon: '📋', display_order: 40 },
  { name: 'Fotografía y Video', slug: 'fotografia-video', icon: '📷', display_order: 41 },
  { name: 'Constructoras y Materiales', slug: 'constructoras-materiales', icon: '🏗️', display_order: 42 },
  { name: 'Imprentas y Diseño', slug: 'imprentas-diseno', icon: '🖨️', display_order: 43 },
  // Entretenimiento y Educación
  { name: 'Hoteles y Hospedaje', slug: 'hoteles-hospedaje', icon: '🏨', display_order: 44 },
  { name: 'Eventos y Fiestas', slug: 'eventos-fiestas', icon: '🎉', display_order: 45 },
  { name: 'Escuelas y Cursos', slug: 'escuelas-cursos', icon: '🎓', display_order: 46 },
  { name: 'Deportes y Recreación', slug: 'deportes-recreacion', icon: '⚽', display_order: 47 },
  // Otros
  { name: 'Gasolineras', slug: 'gasolineras', icon: '⛽', display_order: 48 },
  { name: 'Funerarias', slug: 'funerarias', icon: '🕊️', display_order: 49 },
  { name: 'Otros', slug: 'otros', icon: '📦', display_order: 50 },
]

export async function POST() {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const admin = await isAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Solo administradores' }, { status: 403 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // First check existing categories to avoid duplicates
    const { data: existing } = await supabase
      .from('categories')
      .select('slug')

    const existingSlugs = new Set((existing || []).map((c: any) => c.slug))
    const newCategories = categories.filter(c => !existingSlugs.has(c.slug))

    if (newCategories.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Todas las categorías ya existen',
        count: 0,
      })
    }

    const { data, error } = await supabase
      .from('categories')
      .insert(newCategories)
      .select()

    if (error) {
      console.error('Seed categories error:', error)
      return NextResponse.json({ error: 'Error al crear categorias' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `${data?.length || 0} categorías nuevas insertadas (${existingSlugs.size} ya existían)`,
      count: data?.length || 0,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
