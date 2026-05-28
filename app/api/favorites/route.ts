import { NextRequest, NextResponse } from 'next/server'
import { getUser, createClient } from '@/lib/supabase/server'

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json([], { status: 401 })

  const supabase = await createClient()
  const { data } = await (supabase as any)
    .from('user_favorites')
    .select('business_id')
    .eq('user_id', user.id)

  return NextResponse.json((data || []).map((r: any) => r.business_id))
}

export async function POST(request: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { business_id } = await request.json()
  if (!business_id) return NextResponse.json({ error: 'business_id requerido' }, { status: 400 })

  const supabase = await createClient() as any

  const { data: existing } = await supabase
    .from('user_favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('business_id', business_id)
    .single()

  if (existing) {
    await supabase
      .from('user_favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('business_id', business_id)
    return NextResponse.json({ action: 'removed' })
  }

  await supabase
    .from('user_favorites')
    .insert({ user_id: user.id, business_id })
  return NextResponse.json({ action: 'added' })
}
