import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'
export const alt = 'Directorio de negocios en Lagos de Moreno'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const SUFFIX = '-en-lagos-de-moreno'

export default async function OgImage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const fallback = (
    <div style={{ width: '100%', height: '100%', background: '#FAFAF8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, fontWeight: 800, color: '#1F2937', fontFamily: 'system-ui' }}>
      SomosLagos
    </div>
  )

  if (!slug.endsWith(SUFFIX)) {
    return new ImageResponse(fallback, { ...size })
  }

  const categorySlug = slug.slice(0, -SUFFIX.length)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const { data: category } = await supabase
    .from('categories')
    .select('id, name, icon')
    .eq('slug', categorySlug)
    .single() as { data: { id: string; name: string; icon: string } | null }

  if (!category) return new ImageResponse(fallback, { ...size })

  const { count } = await supabase
    .from('businesses')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)
    .eq('category_id', category.id)

  const bizCount = count ?? 0

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
        {/* Background glow */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 80% 20%, rgba(255,107,53,0.08) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(245,185,66,0.08) 0%, transparent 50%)',
          }}
        />

        {/* Left coral bar */}
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

        {/* Content */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '72px 80px 64px 88px',
            width: '100%',
            height: '100%',
          }}
        >
          {/* Top label */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              width: 'fit-content',
              padding: '6px 18px',
              borderRadius: 100,
              background: 'rgba(255,107,53,0.1)',
              border: '1px solid rgba(255,107,53,0.2)',
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 700, color: '#FF6B35', letterSpacing: '1px' }}>
              SOMOSLAGOS · DIRECTORIO LOCAL
            </span>
          </div>

          {/* Main headline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 72, fontWeight: 900, color: '#1F2937', lineHeight: 1.05, letterSpacing: '-2px' }}>
              {category.name}
            </div>
            <div style={{ fontSize: 36, fontWeight: 500, color: '#6B7280', lineHeight: 1.2 }}>
              en Lagos de Moreno, Jalisco
            </div>
            {bizCount > 0 && (
              <div style={{ display: 'flex', marginTop: 8 }}>
                <div
                  style={{
                    padding: '8px 20px',
                    borderRadius: 100,
                    background: 'linear-gradient(135deg,#FF6B35,#F5B942)',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#fff',
                    boxShadow: '0 4px 14px rgba(255,107,53,0.3)',
                  }}
                >
                  {bizCount} {bizCount === 1 ? 'negocio registrado' : 'negocios registrados'}
                </div>
              </div>
            )}
          </div>

          {/* Bottom branding */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'linear-gradient(135deg,#FF6B35,#F5B942)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                fontWeight: 900,
                color: '#fff',
              }}
            >
              S
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 24, fontWeight: 800, color: '#1F2937' }}>SomosLagos</span>
              <span style={{ fontSize: 15, color: '#9CA3AF' }}>El directorio del Pueblo Mágico · somoslagos.com.mx</span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
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
