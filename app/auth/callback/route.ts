import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.delete({ name, ...options })
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Check if this user has a profile, if not create one (first-time OAuth login)
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      )

      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .single()

      if (!existingProfile) {
        // Create profile for new OAuth user (upsert to prevent race condition on double-click)
        const metadata = data.user.user_metadata
        await supabaseAdmin.from('profiles').upsert({
          id: data.user.id,
          email: data.user.email || '',
          full_name: metadata?.full_name || metadata?.name || 'Usuario',
          phone: metadata?.phone || null,
          role: 'customer',
        }, { onConflict: 'id' })

        // New user without phone → redirect to complete profile
        if (!metadata?.phone) {
          const completeUrl = new URL('/profile', origin)
          completeUrl.searchParams.set('completa', 'true')
          if (next !== '/') {
            completeUrl.searchParams.set('next', next)
          }
          return NextResponse.redirect(completeUrl.toString())
        }
      }

      // Determine redirect based on role
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role, phone')
        .eq('id', data.user.id)
        .single()

      // Existing user without phone → redirect to complete profile
      if (!profile?.phone) {
        const completeUrl = new URL('/profile', origin)
        completeUrl.searchParams.set('completa', 'true')
        if (next !== '/') {
          completeUrl.searchParams.set('next', next)
        }
        return NextResponse.redirect(completeUrl.toString())
      }

      if (next !== '/') {
        return NextResponse.redirect(`${origin}${next}`)
      }

      if (profile?.role === 'admin') {
        return NextResponse.redirect(`${origin}/admin`)
      } else if (profile?.role === 'business_owner') {
        return NextResponse.redirect(`${origin}/dashboard`)
      }

      return NextResponse.redirect(`${origin}/`)
    }
  }

  // If there's an error or no code, redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=oauth`)
}
