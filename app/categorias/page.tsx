import Link from 'next/link'
import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

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

  const categoriesWithCount = (categories || []).map((cat) => ({
    ...cat,
    businessCount: countMap.get(cat.id) || 0,
  }))

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Categorías</h1>
          <p className="text-gray-600">
            Explora negocios por categoría en Lagos de Moreno
          </p>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="container mx-auto px-4 py-8">
        {categoriesWithCount.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {categoriesWithCount.map((category) => (
              <Link
                key={category.id}
                href={`/buscar?categoria=${category.id}`}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-6 text-center group"
              >
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-4xl">{category.icon || '📁'}</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-primary transition-colors">
                  {category.name}
                </h3>
                <p className="text-sm text-gray-500">
                  {category.businessCount} negocio{category.businessCount !== 1 ? 's' : ''}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-5xl">📁</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No hay categorías</h2>
            <p className="text-gray-600">
              Las categorías se agregarán pronto
            </p>
          </div>
        )}
      </div>

      {/* CTA Banner */}
      <div className="container mx-auto px-4 pb-8">
        <div className="bg-gradient-to-r from-primary to-primary-dark rounded-xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-2">¿No encuentras lo que buscas?</h2>
          <p className="text-white/90 mb-6">
            Prueba nuestra búsqueda avanzada o contáctanos
          </p>
          <Link
            href="/buscar"
            className="inline-block px-8 py-3 bg-white text-primary font-semibold rounded-lg hover:bg-gray-100 transition-colors"
          >
            Ir a Búsqueda
          </Link>
        </div>
      </div>
    </main>
  )
}
