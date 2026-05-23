import { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import BusinessCard from '@/components/shared/BusinessCard'
import PremiumSlider from '@/components/shared/PremiumSlider'

export const revalidate = 1800

export const metadata: Metadata = {
  title: 'Descubre Negocios en Lagos de Moreno',
  description: 'Conoce los mejores negocios de Lagos de Moreno. Restaurantes, tiendas, servicios y mas, todos en un solo lugar.',
  openGraph: {
    title: 'Descubre Negocios | SomosLagos',
    description: 'Conoce los mejores negocios de Lagos de Moreno.',
    url: 'https://www.somoslagos.com.mx/descubre',
  },
}

interface DiscoverBusiness {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  cover_url: string | null
  address: string
  neighborhood: string | null
  subscription_tier: string
  is_featured: boolean
  business_hours: any
  rating: number
  total_reviews: number
  created_at: string
  category: { name: string; icon: string } | null
  business_photos: { image_url: string }[]
}

export default async function DescubrePage() {
  const supabase = createClient()

  const { data: businesses } = await supabase
    .from('businesses')
    .select(`
      id, name, slug, description, logo_url, cover_url, address, neighborhood,
      subscription_tier, is_featured, business_hours, rating, total_reviews, created_at,
      category:categories(name, icon),
      business_photos(image_url)
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(50) as { data: DiscoverBusiness[] | null }

  const all = businesses || []

  // Separate by tier
  const avanzado = all.filter(b => b.subscription_tier === 'avanzado')
  const pro = all.filter(b => b.subscription_tier === 'pro')
  const gratis = all.filter(b => b.subscription_tier === 'gratis')

  // Get newest businesses (last 2 weeks, any tier)
  const twoWeeksAgo = new Date()
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
  const newest = all.filter(b => new Date(b.created_at) > twoWeeksAgo)

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 py-12 md:py-16 text-center">
          <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-sm font-semibold rounded-full mb-4">Explora</span>
          <h1 className="text-3xl md:text-4xl font-bold text-secondary mb-3">
            Descubre Negocios en Lagos
          </h1>
          <p className="text-gray-500 max-w-lg mx-auto">
            Conoce lo mejor que Lagos de Moreno tiene para ofrecer
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-10 max-w-6xl">
        {/* Nuevos */}
        {newest.length > 0 && (
          <section className="mb-14">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">&#127382;</span>
              <h2 className="text-2xl font-bold text-secondary">Nuevos en SomosLagos</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {newest.map(b => (
                <BusinessCard key={b.id} business={b} />
              ))}
            </div>
          </section>
        )}

        {/* Avanzado — Slider + Large Cards */}
        {avanzado.length > 0 && (
          <section className="mb-14">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">&#11088;</span>
              <h2 className="text-2xl font-bold text-secondary">Negocios Verificados</h2>
            </div>
            <PremiumSlider businesses={avanzado} />
            {avanzado.length > 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {avanzado.map(b => (
                  <BusinessCard key={b.id} business={b} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Pro — Horizontal Cards */}
        {pro.length > 0 && (
          <section className="mb-14">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">&#127942;</span>
              <h2 className="text-2xl font-bold text-secondary">Negocios Pro</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {pro.map(b => (
                <BusinessCard key={b.id} business={b} />
              ))}
            </div>
          </section>
        )}

        {/* Gratis */}
        {gratis.length > 0 && (
          <section className="mb-14">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">&#128205;</span>
              <h2 className="text-2xl font-bold text-secondary">Todos los Negocios</h2>
            </div>
            <p className="text-gray-400 text-sm mb-5">Encuentra de todo en Lagos de Moreno — conoce lo que ofrecen</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {gratis.map(b => (
                <BusinessCard key={b.id} business={b} />
              ))}
            </div>
          </section>
        )}

        {all.length === 0 && (
          <div className="text-center py-20">
            <span className="text-5xl block mb-4">&#127978;</span>
            <p className="text-gray-500 text-lg mb-2">Aun no hay negocios registrados</p>
            <Link href="/registrar-negocio" className="text-primary font-semibold hover:underline">
              Se el primero en registrarte
            </Link>
          </div>
        )}

        {/* CTA */}
        <section className="text-center py-12 mt-4">
          <div className="bg-gradient-to-br from-secondary to-primary/90 rounded-3xl p-8 md:p-12">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              &iquest;Tienes un negocio en Lagos?
            </h2>
            <p className="text-white/80 mb-6 max-w-md mx-auto">
              Registrate gratis y aparece aqui para que miles de personas te encuentren
            </p>
            <Link
              href="/registrar-negocio"
              className="inline-block bg-accent hover:bg-accent-dark text-secondary px-8 py-3 rounded-full font-bold text-lg transition-all hover:scale-105"
            >
              Registrar mi Negocio GRATIS
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}