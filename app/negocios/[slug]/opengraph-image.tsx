import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'
export const alt = 'Negocio en SomosLagos'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OgImage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const { data: biz } = await supabase
    .from('businesses')
    .select('name, description, logo_url, cover_url, address, rating, total_reviews, category:categories(name, icon)')
    .eq('slug', slug)
    .eq('is_active', true)
    .single() as { data: {
      name: string
      description: string | null
      logo_url: string | null
      cover_url: string | null
      address: string | null
      rating: number
      total_reviews: number
      category: { name: string; icon: string } | null
    } | null }

  const name = biz?.name ?? 'SomosLagos'
  const category = biz?.category?.name ?? 'Negocio local'
  const description = biz?.description
    ? biz.description.slice(0, 120) + (biz.description.length > 120 ? '…' : '')
    : `${category} en Lagos de Moreno, Jalisco`
  const address = biz?.address?.slice(0, 50) ?? 'Lagos de Moreno, Jalisco'
  const rating = biz?.rating ?? 0
  const reviews = biz?.total_reviews ?? 0
  const logoUrl = biz?.logo_url ?? null
  const coverUrl = biz?.cover_url ?? null

  const stars = rating > 0
    ? '★'.repeat(Math.round(Math.min(rating, 5))) + '☆'.repeat(5 - Math.round(Math.min(rating, 5)))
    : null

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          background: '#FAFAF8',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Cover as blurred background */}
        {coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            width={1200}
            height={630}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.12,
            }}
            alt=""
          />
        )}

        {/* Gradient overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, rgba(250,250,248,0.97) 0%, rgba(250,246,240,0.94) 100%)',
          }}
        />

        {/* Left coral accent bar */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 8,
            background: 'linear-gradient(180deg, #FF6B35, #F5B942)',
          }}
        />

        {/* Main content */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '56px 72px 56px 80px',
            width: '100%',
            height: '100%',
          }}
        >
          {/* Top section: logo + name + category */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 36 }}>
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                width={120}
                height={120}
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 20,
                  objectFit: 'cover',
                  flexShrink: 0,
                  boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
                }}
                alt={name}
              />
            ) : (
              <div
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 20,
                  background: 'linear-gradient(135deg,#FF6B35,#F5B942)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontSize: 52,
                  color: '#fff',
                  fontWeight: 800,
                }}
              >
                {name.charAt(0).toUpperCase()}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
              {/* Category chip */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  width: 'fit-content',
                  padding: '4px 14px',
                  borderRadius: 100,
                  background: 'rgba(255,107,53,0.1)',
                  border: '1px solid rgba(255,107,53,0.2)',
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600, color: '#FF6B35', letterSpacing: '0.5px' }}>
                  {category.toUpperCase()}
                </span>
              </div>

              {/* Business name */}
              <div
                style={{
                  fontSize: name.length > 30 ? 44 : 54,
                  fontWeight: 800,
                  color: '#1F2937',
                  lineHeight: 1.1,
                  letterSpacing: '-1px',
                }}
              >
                {name}
              </div>

              {/* Rating */}
              {stars && reviews > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 22, color: '#F5B942', letterSpacing: 1 }}>{stars}</span>
                  <span style={{ fontSize: 18, color: '#6B7280', fontWeight: 500 }}>
                    {rating.toFixed(1)} · {reviews} {reviews === 1 ? 'reseña' : 'reseñas'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Middle: Description */}
          <div
            style={{
              fontSize: 22,
              color: '#4B5563',
              lineHeight: 1.55,
              maxWidth: 900,
              borderLeft: '3px solid rgba(255,107,53,0.3)',
              paddingLeft: 20,
            }}
          >
            {description}
          </div>

          {/* Bottom: Address + SomosLagos branding */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {/* Address */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18, color: '#9CA3AF' }}>📍</span>
              <span style={{ fontSize: 18, color: '#9CA3AF' }}>{address}</span>
            </div>

            {/* SomosLagos brand */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg,#FF6B35,#F5B942)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 26,
                  fontWeight: 900,
                  color: '#fff',
                  boxShadow: '0 4px 14px rgba(255,107,53,0.35)',
                }}
              >
                S
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: '#1F2937' }}>SomosLagos</span>
                <span style={{ fontSize: 14, color: '#9CA3AF' }}>Directorio · Lagos de Moreno · Pueblo Mágico</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom coral gradient bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 6,
            background: 'linear-gradient(90deg, #FF6B35 0%, #F5B942 100%)',
          }}
        />
      </div>
    ),
    { ...size },
  )
}
