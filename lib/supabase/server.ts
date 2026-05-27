import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database.types'

// Custom fetch that bypasses Next.js Data Cache
const noCacheFetch = (url: RequestInfo | URL, options?: RequestInit) =>
  fetch(url, { ...options, cache: 'no-store' })

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: noCacheFetch,
      },
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // El método `set` se llama desde un Server Component.
            // Esto se puede ignorar si tienes middleware refrescando sesiones del usuario.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // El método `delete` se llama desde un Server Component.
            // Esto se puede ignorar si tienes middleware refrescando sesiones del usuario.
          }
        },
      },
    }
  )
}

// Verificar si el usuario está autenticado (server-side)
export async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Obtener perfil completo del usuario con role
export async function getUserProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single() as unknown as {
      data: { id: string; role: string; full_name: string; email: string; phone: string | null } | null
      error: any
    }

  if (error) {
    console.error('Error fetching profile:', error)
    return null
  }

  return profile
}

// Verificar si el usuario es admin
export async function isAdmin() {
  const profile = await getUserProfile()
  return profile?.role === 'admin'
}

// Verificar si el usuario es dueño de negocio
export async function isBusinessOwner() {
  const profile = await getUserProfile()
  return profile?.role === 'business_owner'
}

// Verificar si el usuario tiene acceso a un negocio específico
export async function hasBusinessAccess(businessId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return false

  // Si es admin, tiene acceso a todo
  if (await isAdmin()) return true

  // Si es business owner, verificar que sea dueño de ese negocio
  const { data: business } = await supabase
    .from('businesses')
    .select('owner_id')
    .eq('id', businessId)
    .single() as unknown as { data: { owner_id: string } | null }

  return business?.owner_id === user.id
}

// Service role client for admin operations (bypasses RLS, no cache)
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        fetch: noCacheFetch,
      },
    }
  )
}

