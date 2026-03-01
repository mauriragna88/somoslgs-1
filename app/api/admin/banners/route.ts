import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import type { Banner } from '@/types/database.types'
import { z } from 'zod'
import { BANNER_PLACEMENTS } from '@/lib/constants'

const bannerSchema = z.object({
  title: z.string().min(2, 'Título muy corto').max(100),
  image_url: z.string().url('URL de imagen inválida'),
  link_url: z.string().url().nullable().optional(),
  placement: z.enum(Object.keys(BANNER_PLACEMENTS) as [string, ...string[]]),
  is_active: z.boolean().default(true),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().nullable().optional(),
}).refine(
  (data) => !data.end_date || !data.start_date || new Date(data.end_date) > new Date(data.start_date),
  { message: 'La fecha de fin debe ser posterior a la de inicio', path: ['end_date'] }
)

export async function GET() {
  try {
    const supabaseServer = createClient()

    // Verify admin
    const { data: { user } } = await supabaseServer.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { data: profile } = await supabaseServer
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single() as { data: { role: string } | null }

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const supabase = createServiceClient()
    const { data: banners, error } = await supabase
      .from('banners')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(banners as Banner[])
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabaseServer = createClient()

    // Verify admin
    const { data: { user } } = await supabaseServer.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { data: profile } = await supabaseServer
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single() as { data: { role: string } | null }

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const validated = bannerSchema.parse(body)

    const supabase = createServiceClient()
    const { data: banner, error } = await supabase
      .from('banners')
      .insert({
        title: validated.title,
        image_url: validated.image_url,
        link_url: validated.link_url || null,
        placement: validated.placement,
        is_active: validated.is_active,
        start_date: validated.start_date || new Date().toISOString(),
        end_date: validated.end_date || null,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(banner)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
