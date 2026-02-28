import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { BlogPost } from '@/types/database.types'

export async function GET() {
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
    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(posts as BlogPost[])
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
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
    const { title, slug, excerpt, content, featured_image_url, category, tags, status } = body

    if (!title || !slug || !content) {
      return NextResponse.json({ error: 'Faltan campos requeridos (titulo, slug, contenido)' }, { status: 400 })
    }

    const supabase = createServiceClient()
    const { data: post, error } = await supabase
      .from('blog_posts')
      .insert({
        author_id: user.id,
        title,
        slug,
        excerpt: excerpt || null,
        content,
        featured_image_url: featured_image_url || null,
        category: category || 'general',
        tags: tags || null,
        status: status || 'draft',
        published_at: status === 'published' ? new Date().toISOString() : null,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(post)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
