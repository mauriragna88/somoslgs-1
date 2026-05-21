import Link from 'next/link'
import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import BannerDisplay from '@/components/ads/BannerDisplay'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Categorías de Negocios en Lagos de Moreno',
  description: 'Explora todas las categorías de negocios en Lagos de Moreno: restaurantes, tiendas, servicios, profesionales y más.',
  openGraph: {
    title: 'Categorías de Negocios | SomosLagos',
    description: 'Explora todas las categorías de negocios en Lagos de Moreno.',
    url: 'https://www.somoslagos.com.mx/categorias',
  },
}

interface Category {
  id: string
  name: string
  icon: string | null
  slug: string
}

export default async function CategoriasPage() {
  const supabase = createClient()

  // Get all categories with business count in 2 queries (instead of N+1)
  const [{ data: categories }, { data: businessCounts }] = await Promise.all([
    supabase
      .from('categories')
      .select('id, name, icon, slug')
      .is('parent_id', null)
      .order('display_order') as unknown as Promise<{ data: Category[] | null }>,
    supabase
      .from('businesses')
      .select('category_id')
      .eq('is_active', true) as unknown as Promise<{ data: { category_id: string }[] | null }>,
  ])

  // Count businesses per category in memory (0 extra queries)
  const countMap = new Map<string, number>()
  ;(businessCounts || []).forEach((b) => {
    if (b.category_id) {
      countMap.set(b.category_id, (countMap.get(b.category_id) || 0) + 1)
    }
  })

  const categoriesWithCount = (categories || [])
    .map((cat) => ({
      ...cat,
      businessCount: countMap.get(cat.id) || 0,
    }))
    .filter((cat) => cat.businessCount > 0)
    .sort((a, b) => b.businessCount - a.businessCount)

  return (
    <main className="min-h-screen pueblo-shell">
      {/* Header */}
      <div className="bg-gradient-to-b from-pueblo-crema via-pueblo-crema/80 to-transparent border-b border-pueblo-canteraLight/30 py-8">
        <div className="container mx-auto px-4">
          <span className="pueblo-eyebrow text-xs font-bold px-3 py-1 rounded-full inline-block mb-3">Explorar</span>
          <h1 className="text-2xl md:text-3xl font-bold text-pueblo-noche mb-2">Categorias</h1>
          <p className="text-pueblo-terracotta/70">
            Explora negocios por categoria en Lagos de Moreno
          </p>
        </div>
      </div>

      {/* Banner: Categories Top */}
      <div className="container mx-auto px-4 pt-6">
        <BannerDisplay placement="categories_top" />
      </div>

      {/* Categories Grid */}
      <div className="container mx-auto px-4 py-10">
        {categoriesWithCount.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {categoriesWithCount.map((category) => (
              <Link
                key={category.id}
                href={`/categorias/${category.slug}`}
                className="pueblo-card rounded-2xl hover:shadow-pueblo transition-all p-6 text-center group hover:-translate-y-1"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-pueblo-canteraLight/50 to-pueblo-barroco/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-3xl">{category.icon || '📁'}</span>
                </div>
                <h3 className="font-bold text-pueblo-noche mb-1 group-hover:text-pueblo-cantera transition-colors text-sm">
                  {category.name}
                </h3>
                <p className="text-xs text-pueblo-terracotta/60">
                  {category.businessCount} negocio{category.businessCount !== 1 ? 's' : ''}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-pueblo-canteraLight/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-5xl">📁</span>
            </div>
            <h2 className="text-2xl font-bold text-pueblo-noche mb-2">No hay categorias</h2>
            <p className="text-pueblo-terracotta/60">
              Las categorias se agregaran pronto
            </p>
          </div>
        )}
      </div>

      {/* CTA Banner */}
      <div className="container mx-auto px-4 pb-10">
        <div className="bg-gradient-to-r from-pueblo-noche via-pueblo-terracotta to-pueblo-cantera rounded-2xl p-8 text-center text-pueblo-crema relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-pueblo-barroco/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative">
            <h2 className="text-2xl font-bold mb-2">¿No encuentras lo que buscas?</h2>
            <p className="text-pueblo-crema/80 mb-6">
              Prueba nuestra busqueda avanzada
            </p>
            <Link
              href="/buscar"
              className="inline-block px-8 py-3 bg-pueblo-barroco text-pueblo-noche font-bold rounded-full hover:bg-pueblo-barroco/90 transition-colors shadow-pueblo-soft"
            >
              Ir a Busqueda
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
