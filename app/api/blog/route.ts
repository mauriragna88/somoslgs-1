import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import type { BlogPost } from '@/types/database.types'

export async function GET(request: NextRequest) {
  try {
    const category = request.nextUrl.searchParams.get('category')
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20')
    const slug = request.nextUrl.searchParams.get('slug')

    const supabase = createServiceClient()

    // Single post by slug
    if (slug) {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('status', 'published')
        .eq('slug', slug)
        .single()

      if (error) throw error
      return NextResponse.json(data as BlogPost)
    }

    // List posts
    let query = supabase
      .from('blog_posts')
      .select('*')
      .eq('status', 'published')

    if (category) {
      query = query.eq('category', category)
    }

    const { data: posts, error } = await query
      .order('published_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return NextResponse.json((posts as BlogPost[]) || [])
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
