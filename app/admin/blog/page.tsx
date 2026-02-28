import { redirect } from 'next/navigation'
import { isAdmin, createServiceClient } from '@/lib/supabase/server'
import BlogPostsTable from '@/components/admin/BlogPostsTable'
import type { BlogPost } from '@/types/database.types'

export const dynamic = 'force-dynamic'

export default async function BlogAdminPage() {
  const admin = await isAdmin()
  if (!admin) redirect('/')

  const supabase = createServiceClient()
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <BlogPostsTable initialPosts={(posts as BlogPost[]) || []} />
    </div>
  )
}
