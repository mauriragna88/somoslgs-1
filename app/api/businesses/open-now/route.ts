import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function isOpenNow(businessHours: unknown): boolean {
  if (!businessHours || typeof businessHours !== 'object') return false
  const bh = businessHours as Record<string, { open: string | null; close: string | null; closed?: boolean }>

  const mexicoTime = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Mexico_City' }))
  const day = mexicoTime.getDay()
  const currentMin = mexicoTime.getHours() * 60 + mexicoTime.getMinutes()

  const key = day === 0 ? 'sunday' : day === 6 ? 'saturday' : 'weekdays'
  const slot = bh[key]
  if (!slot || slot.closed || !slot.open || !slot.close) return false

  const [oh, om] = slot.open.split(':').map(Number)
  const [ch, cm] = slot.close.split(':').map(Number)
  return currentMin >= oh * 60 + om && currentMin < ch * 60 + cm
}

export async function GET() {
  try {
    const supabase = await createClient()

    const { data } = await supabase
      .from('businesses')
      .select(`
        id, name, slug, description, logo_url, cover_url, address,
        subscription_tier, is_featured, business_hours, rating, total_reviews,
        category:categories(name, icon),
        business_photos(image_url)
      `)
      .eq('is_active', true)
      .not('business_hours', 'is', null)
      .order('is_featured', { ascending: false })
      .order('subscription_tier', { ascending: false })
      .limit(80)

    const openNow = (data ?? [])
      .filter(biz => isOpenNow(biz.business_hours))
      .slice(0, 6)

    return NextResponse.json(openNow)
  } catch {
    return NextResponse.json([])
  }
}
