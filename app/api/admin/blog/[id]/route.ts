import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabaseServer = createClient()

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
    const supabase = createServiceClient()

    // If publishing for the first time, set published_at
    const updateData: any = {
      ...body,
      updated_at: new Date().toISOString(),
    }

    if (body.status === 'published' && !body.published_at) {
      // Check if it was already published
      const { data: existing } = await supabase
        .from('blog_posts')
        .select('published_at')
        .eq('id', params.id)
        .single()

      if (!existing?.published_at) {
        updateData.published_at = new Date().toISOString()
      }
    }

    const { data: post, error } = await supabase
      .from('blog_posts')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(post)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabaseServer = createClient()

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
    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', params.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
