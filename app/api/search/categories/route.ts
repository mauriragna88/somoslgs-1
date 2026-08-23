import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

/* GET /api/search/categories — categorías populares para el buscador
   (sugerencias rápidas cuando el usuario enfoca el buscador sin escribir) */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const limitParam = searchParams.get('limit') || '8'

  const supabase = createServiceClient()

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, icon, slug')
    .is('parent_id', null)
    .not('slug', 'like', '__hidden__%')
    .order('display_order')
    .limit(Math.min(parseInt(limitParam, 10) || 8, 12))

  return NextResponse.json(categories || [])
}
