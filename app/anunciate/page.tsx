import type { Metadata } from 'next'
import { createPublicClient } from '@/lib/supabase/server'
import { getTrending } from '@/lib/trending'

export const revalidate = 3600

const WHATSAPP =
  'https://wa.me/524741082768?text=' +
  encodeURIComponent('Hola, quiero anunciarme en SomosLagos. ¿Me das informes de los espacios de publicidad?')

export const metadata: Metadata = {
  title: 'Anúnciate en SomosLagos: publicidad local en Lagos de Moreno',
  description:
    'Pon tu negocio frente a quienes buscan restaurantes, servicios y qué hacer en Lagos de Moreno. Espacios de publicidad en la home, búsqueda, categorías y fichas.',
  alternates: { canonical: 'https://www.somoslagos.com.mx/anunciate' },
}

const SPOTS = [
  { name: 'Portada (home)', size: 'Banner ancho 1200 × 300 px', detail: 'Lo primero que ve quien entra al directorio.' },
  { name: 'Resultados de búsqueda', size: 'Banner ancho 1200 × 300 px', detail: 'Aparece cuando la gente busca algo concreto: tacos, hotel, dentista.' },
  { name: 'Categorías', size: 'Banner ancho 1200 × 300 px', detail: 'En la página de la categoría de tu giro, junto a tu competencia.' },
  { name: 'Barra lateral', size: 'Vertical 600 × 900 px', detail: 'Visible en búsquedas, fichas de negocio y marketplace.' },
  { name: 'Marketplace', size: 'Banner ancho 1200 × 300 px', detail: 'Para quien compra y vende en Lagos.' },
]

export default async function AnunciatePage() {
  const [trending, { data: sums }, { count }] = await Promise.all([
    getTrending(revalidate),
    createPublicClient(revalidate).from('businesses').select('total_views').eq('is_active', true).limit(1000),
    createPublicClient(revalidate).from('businesses').select('id', { count: 'exact', head: true }).eq('is_active', true),
  ])
  const totalViews = ((sums ?? []) as { total_views: number | null }[]).reduce((n, b) => n + (b.total_views ?? 0), 0)
  const businessCount = count ?? 0

  return (
    <main className="min-h-screen" style={{ background: '#fbeee3' }}>
      <section className="py-20 md:py-28" style={{ background: 'linear-gradient(160deg,#072d52,#0a4172 70%)', color: '#fbeee3' }}>
        <div className="container mx-auto px-4 max-w-3xl">
          <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: '#e59438' }}>Publicidad local</p>
          <h1 className="text-4xl md:text-6xl font-black" style={{ fontFamily: 'var(--display)', lineHeight: 1.02 }}>
            Anuncia tu negocio donde Lagos <em style={{ fontFamily: 'var(--font-serif), Georgia, serif', fontWeight: 400, color: '#e59438' }}>ya está buscando</em>
          </h1>
          <p className="mt-5 text-lg" style={{ color: 'rgba(251,238,227,0.85)' }}>
            SomosLagos es el directorio de negocios de Lagos de Moreno. Quien entra busca comer, contratar o conocer algo, así que tu anuncio llega a gente con intención de visitar o comprar.
          </p>
          <a
            href={WHATSAPP}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center justify-center px-8 min-h-12 rounded-full font-bold focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ background: '#e59438', color: '#072d52', outlineColor: '#fbeee3' }}
          >
            Pedir informes por WhatsApp
          </a>
        </div>
      </section>

      <section className="py-16" aria-labelledby="nums-title">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 id="nums-title" className="text-2xl md:text-3xl font-black mb-6" style={{ fontFamily: 'var(--display)', color: '#072d52' }}>
            Números reales, sin inflar
          </h2>
          <dl className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl p-6 bg-white" style={{ border: '1px solid rgba(10,65,114,0.12)' }}>
              <dd className="text-4xl font-black tabular-nums" style={{ color: '#d96e33', fontFamily: 'var(--display)' }}>{businessCount.toLocaleString('es-MX')}+</dd>
              <dt className="text-sm mt-1" style={{ color: '#3d4f63' }}>negocios publicados</dt>
            </div>
            <div className="rounded-2xl p-6 bg-white" style={{ border: '1px solid rgba(10,65,114,0.12)' }}>
              <dd className="text-4xl font-black tabular-nums" style={{ color: '#d96e33', fontFamily: 'var(--display)' }}>{totalViews.toLocaleString('es-MX')}</dd>
              <dt className="text-sm mt-1" style={{ color: '#3d4f63' }}>visitas acumuladas a fichas de negocio</dt>
            </div>
            <div className="rounded-2xl p-6 bg-white" style={{ border: '1px solid rgba(10,65,114,0.12)' }}>
              <dd className="text-xl font-black" style={{ color: '#d96e33', fontFamily: 'var(--display)' }}>
                {trending.categories.slice(0, 3).map(c => c.name).join(', ') || 'Restaurantes'}
              </dd>
              <dt className="text-sm mt-1" style={{ color: '#3d4f63' }}>categorías más visitadas</dt>
            </div>
          </dl>
          <p className="text-sm mt-4" style={{ color: '#3d4f63' }}>
            Cada visita se cuenta una vez por persona cada 30 minutos y no incluye robots. Te compartimos las impresiones y clics de tu anuncio.
          </p>
        </div>
      </section>

      <section className="pb-16" aria-labelledby="spots-title">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 id="spots-title" className="text-2xl md:text-3xl font-black mb-6" style={{ fontFamily: 'var(--display)', color: '#072d52' }}>
            Dónde puede aparecer tu anuncio
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {SPOTS.map(s => (
              <li key={s.name} className="rounded-2xl p-5 bg-white" style={{ border: '1px solid rgba(10,65,114,0.12)' }}>
                <strong className="block" style={{ color: '#072d52' }}>{s.name}</strong>
                <span className="block text-sm mt-1" style={{ color: '#3d4f63' }}>{s.detail}</span>
                <span className="inline-block mt-3 text-xs font-bold px-3 py-1 rounded-full" style={{ background: 'rgba(217,110,51,0.12)', color: '#d96e33' }}>
                  {s.size}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="pb-24" aria-labelledby="how-title">
        <div className="container mx-auto px-4 max-w-4xl rounded-3xl p-8 md:p-10" style={{ background: '#072d52', color: '#fbeee3' }}>
          <h2 id="how-title" className="text-2xl md:text-3xl font-black mb-5" style={{ fontFamily: 'var(--display)' }}>Cómo funciona</h2>
          <ol className="grid gap-4 md:grid-cols-3">
            <li><strong style={{ color: '#e59438' }}>1. Nos escribes</strong><br />Cuéntanos qué quieres promocionar y en qué espacio.</li>
            <li><strong style={{ color: '#e59438' }}>2. Preparamos tu banner</strong><br />Tú lo mandas listo o te ayudamos a armarlo.</li>
            <li><strong style={{ color: '#e59438' }}>3. Mides resultados</strong><br />Te decimos cuántas veces se vio y cuántos clics recibió.</li>
          </ol>
          <a
            href={WHATSAPP}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center justify-center px-8 min-h-12 rounded-full font-bold focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ background: '#e59438', color: '#072d52', outlineColor: '#fbeee3' }}
          >
            Cotizar mi anuncio
          </a>
        </div>
      </section>
    </main>
  )
}
