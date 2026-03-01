import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { checkRateLimit, getClientIP } from '@/lib/security'

export async function POST(request: Request) {
  try {
    // Rate limiting to prevent metric inflation
    const ip = getClientIP(request)
    const rateCheck = checkRateLimit(`banner-track:${ip}`, 60, 60000) // 60 tracks per minute
    if (!rateCheck.allowed) {
      return NextResponse.json({ success: true }) // Silent fail, don't reveal rate limiting
    }

    const { bannerId, type } = await request.json()

    if (!bannerId || !type || !['impression', 'click'].includes(type)) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }

    // Validate bannerId format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(bannerId)) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }

    const supabase = createServiceClient()
    const column = type === 'click' ? 'clicks' : 'impressions'

    // Get current value and increment
    const { data: banner } = await supabase
      .from('banners')
      .select(column)
      .eq('id', bannerId)
      .single()

    if (!banner) {
      return NextResponse.json({ error: 'Banner no encontrado' }, { status: 404 })
    }

    const currentValue = (banner as Record<string, number>)[column] || 0

    await supabase
      .from('banners')
      .update({ [column]: currentValue + 1 })
      .eq('id', bannerId)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
