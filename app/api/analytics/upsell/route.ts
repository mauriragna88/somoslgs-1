import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const supabase = createServiceClient()

    await supabase.from('audit_logs').insert({
      action: 'upsell_click',
      details: { business_name: body.business_name || 'unknown' },
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
