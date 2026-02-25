import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { bannerId, type } = await request.json()

    if (!bannerId || !type || !['impression', 'click'].includes(type)) {
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
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
