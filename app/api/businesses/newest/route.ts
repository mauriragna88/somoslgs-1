import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data } = await supabase
      .from('businesses')
      .select(`
        id, name, slug, description, logo_url, cover_url, address,
        subscription_tier, is_featured, business_hours, rating, total_reviews, created_at,
        category:categories(name, icon),
        business_photos(image_url)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(6)

    return NextResponse.json(data ?? [])
  } catch {
    return NextResponse.json([])
  }
}
