import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { isBusinessOpen } from '@/lib/constants'
import type { BusinessHours } from '@/lib/constants'

interface BusinessRow {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  cover_url: string | null
  address: string | null
  subscription_tier: string
  is_featured: boolean
  business_hours: BusinessHours | null
  rating: number
  total_reviews: number
  category: { name: string; icon: string } | null
  business_photos: { image_url: string }[]
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

    const openNow = ((data ?? []) as BusinessRow[])
      .filter(biz => isBusinessOpen(biz.business_hours) === true)
      .slice(0, 6)

    return NextResponse.json(openNow)
  } catch {
    return NextResponse.json([])
  }
}
