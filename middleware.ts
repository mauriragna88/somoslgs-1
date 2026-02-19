import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const ALLOWED_ORIGINS = [
  'https://www.somoslagos.com.mx',
  'https://somoslagos.com.mx',
  'http://localhost:3000',
]

export async function middleware(request: NextRequest) {
  // CORS validation for API routes
  const origin = request.headers.get('origin')
  const path = request.nextUrl.pathname

  if (path.startsWith('/api/')) {
    // Allow webhooks without origin (server-to-server)
    if (path.startsWith('/api/conekta/webhook') || path.startsWith('/api/mercadopago/webhook') || path.startsWith('/api/notifications/whatsapp')) {
      // Webhooks come from external servers, no origin header
    } else if (origin && !ALLOWED_ORIGINS.includes(origin)) {
      return NextResponse.json({ error: 'No permitido' }, { status: 403 })
    }

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      const preflightResponse = new NextResponse(null, { status: 204 })
      preflightResponse.headers.set('Access-Control-Allow-Origin', origin || ALLOWED_ORIGINS[0])
      preflightResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
      preflightResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      preflightResponse.headers.set('Access-Control-Max-Age', '86400')
      return preflightResponse
    }
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Set CORS headers on API responses
  if (path.startsWith('/api/') && origin && ALLOWED_ORIGINS.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Refrescar sesión si existe
  const { data: { user } } = await supabase.auth.getUser()

  // Rutas protegidas que requieren autenticación
  const protectedRoutes = ['/dashboard', '/admin', '/profile', '/mis-pedidos']
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route))

  // Rutas solo para admin
  const adminRoutes = ['/admin']
  const isAdminRoute = adminRoutes.some(route => path.startsWith(route))

  // Rutas solo para business owners
  const businessRoutes = ['/dashboard']
  const isBusinessRoute = businessRoutes.some(route => path.startsWith(route))

  // Si es ruta protegida y no hay usuario, redirigir a login
  if (isProtectedRoute && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Si es ruta de admin, verificar que sea admin
  if (isAdminRoute && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // Si es ruta de business owner, verificar que sea business owner o admin
  if (isBusinessRoute && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'business_owner' && profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // Si está en login/register y ya está autenticado, redirigir según role
  // EXCEPT if they have ref=registrar-negocio parameter
  if ((path === '/login' || path === '/registro') && user) {
    const ref = request.nextUrl.searchParams.get('ref')

    // If coming from registrar-negocio, allow them to continue
    if (ref === 'registrar-negocio') {
      return response
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url))
    } else if (profile?.role === 'business_owner') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    } else {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // Prevent browser caching on dynamic pages
  const noCacheRoutes = ['/admin', '/dashboard', '/profile', '/mis-pedidos']
  const shouldNoCache = noCacheRoutes.some(route => path.startsWith(route))
  if (shouldNoCache) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
