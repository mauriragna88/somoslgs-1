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
  const supabase = await createClient()

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
    <main className="min-h-screen bg-surface">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 py-8">
        <div className="container mx-auto px-4">
          <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-sm font-semibold rounded-full mb-3">Explorar</span>
          <h1 className="text-2xl md:text-3xl font-bold text-secondary mb-2">Categorias</h1>
          <p className="text-gray-500">
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
                className="bg-white rounded-2xl hover:shadow-xl transition-all p-6 text-center group border border-gray-100 hover:border-transparent hover:-translate-y-1"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-3xl">{category.icon || '📁'}</span>
                </div>
                <h3 className="font-bold text-secondary mb-1 group-hover:text-primary transition-colors text-sm">
                  {category.name}
                </h3>
                <p className="text-xs text-gray-400">
                  {category.businessCount} negocio{category.businessCount !== 1 ? 's' : ''}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-100">
              <span className="text-5xl">📁</span>
            </div>
            <h2 className="text-2xl font-bold text-secondary mb-2">No hay categorias</h2>
            <p className="text-gray-500">
              Las categorias se agregaran pronto
            </p>
          </div>
        )}
      </div>

      {/* CTA Banner */}
      <div className="container mx-auto px-4 pb-10">
        <div className="bg-gradient-to-r from-secondary via-secondary-light to-primary rounded-2xl p-8 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative">
            <h2 className="text-2xl font-bold mb-2">¿No encuentras lo que buscas?</h2>
            <p className="text-white/80 mb-6">
              Prueba nuestra busqueda avanzada
            </p>
            <Link
              href="/buscar"
              className="inline-block px-8 py-3 bg-accent text-secondary font-bold rounded-full hover:bg-accent-dark transition-colors shadow-lg"
            >
              Ir a Busqueda
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}

