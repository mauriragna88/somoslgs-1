export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getUser, getUserProfile } from '@/lib/supabase/server'
import ProfileForm from '@/components/profile/ProfileForm'

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ completa?: string; next?: string }> }) {
  const user = await getUser()
  if (!user) {
    redirect('/login')
  }

  const profile = await getUserProfile()
  if (!profile) {
    redirect('/login')
  }

  const params = await searchParams

  // getUserProfile returns { id, role, full_name, email, phone }
  // We need created_at too, so we'll use the auth user's created_at
  const profileData = {
    id: profile.id,
    full_name: profile.full_name,
    email: profile.email,
    phone: profile.phone,
    role: profile.role,
    created_at: user.created_at,
  }

  return (
    <main className="min-h-screen" style={{ background: 'var(--ivory)' }}>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--display)', color: 'var(--ink)' }}>Configuracion</h1>
        <p className="mb-8" style={{ color: 'var(--muted)' }}>Administra tu cuenta y preferencias</p>

        <ProfileForm
          profile={profileData}
          completa={params.completa === 'true'}
          nextUrl={params.next}
        />
      </div>
    </main>
  )
}
