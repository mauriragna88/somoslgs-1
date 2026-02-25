import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import type { Banner } from '@/types/database.types'

export async function GET(request: NextRequest) {
  try {
    const placement = request.nextUrl.searchParams.get('placement')

    if (!placement) {
      return NextResponse.json({ error: 'placement requerido' }, { status: 400 })
    }

    const supabase = createServiceClient()
    const now = new Date().toISOString()

    const { data: banners, error } = await supabase
      .from('banners')
      .select('*')
      .eq('placement', placement)
      .eq('is_active', true)
      .lte('start_date', now)
      .or(`end_date.is.null,end_date.gte.${now}`)
      .limit(1)

    if (error) throw error

    return NextResponse.json((banners as Banner[]) || [])
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
