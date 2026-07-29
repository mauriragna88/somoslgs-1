import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { localPageId, businessId, clickType } = body as {
      localPageId: string
      businessId: string
      clickType?: string
    }

    if (!localPageId || !businessId) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    }

    const supabase = await createClient()

    // Insertar el click (campos por migration; cast para tipos de Supabase)
    const { error: insertError } = await (supabase as never as {
      from: (t: string) => {
        insert: (v: Record<string, unknown>) => Promise<{ error: { message?: string } | null }>
      }
    }).from('local_page_clicks').insert({
      local_page_id: localPageId,
      business_id: businessId,
      click_type: clickType || 'profile_view',
    })

    if (insertError) {
      console.error('Click log error:', insertError.message)
      // No fallar si la tabla no existe aun
      return NextResponse.json({ success: false, skipped: true })
    }

    // Incrementar contador
    await (supabase.rpc('increment_local_page_clicks', { p_id: localPageId } as never) as unknown as Promise<{ error: unknown }>)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Click API error:', err)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
