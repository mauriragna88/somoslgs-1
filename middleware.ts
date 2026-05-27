import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const ALLOWED_ORIGINS = [
  'https://www.somoslagos.com.mx',
  'https://somoslagos.com.mx',
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.NEXT_PUBLIC_APP_URL,
].filter((origin): origin is string => Boolean(origin))

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false
  if (ALLOWED_ORIGINS.includes(origin)) return true

  try {
    const parsed = new URL(origin)
    const isLocalHttp = parsed.protocol === 'http:' && (
      parsed.hostname === 'localhost' ||
      parsed.hostname === '127.0.0.1'
    )

    return isLocalHttp
  } catch {
    return false
  }
}

// Lazy initialization: Supabase client is only created when needed (for authenticated routes).
// This avoids creating a client on every static/public request, reducing cold start overhead.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Helper to create Supabase client on demand with the correct cookie store for this request
const createSupabaseForRequest = (request: NextRequest, response: NextResponse) =>
  createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value)
          response.cookies.set(name, value, options)
        })
      },
    },
  })

export async function middleware(request: NextRequest) {
  // CORS + CSRF validation for API routes
  const origin = request.headers.get('origin')
  const path = request.nextUrl.pathname

  // Webhook paths that come from external servers (no origin header)
  const isWebhook = path.startsWith('/api/conekta/webhook') ||
    path.startsWith('/api/mercadopago/webhook') ||
    path.startsWith('/api/notifications/whatsapp')

  if (path.startsWith('/api/')) {
    // Reject oversized requests (10MB max, upload routes get 5MB limit in their own handlers)
    const contentLength = request.headers.get('content-length')
    if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Solicitud muy grande' }, { status: 413 })
    }

    if (!isWebhook) {
      // Block requests with unknown origin
      if (origin && !isAllowedOrigin(origin)) {
        return NextResponse.json({ error: 'No permitido' }, { status: 403 })
      }

      // CSRF: Mutation requests (POST/PUT/DELETE) MUST have a valid origin header
      const isMutation = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)
      if (isMutation && !origin) {
        // Allow if referer matches our domain (same-origin form submissions)
        const referer = request.headers.get('referer')
        const isValidReferer = referer && (
          ALLOWED_ORIGINS.some(o => referer.startsWith(o)) ||
          referer.startsWith('http://localhost:') ||
          referer.startsWith('http://127.0.0.1:')
        )
        if (!isValidReferer) {
          return NextResponse.json({ error: 'Solicitud no autorizada' }, { status: 403 })
        }
      }
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
  if (path.startsWith('/api/') && origin && isAllowedOrigin(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  }

  // Rutas protegidas que requieren autenticacion
  const protectedRoutes = ['/dashboard', '/admin', '/profile', '/mis-pedidos']
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route))

  // Rutas solo para admin
  const adminRoutes = ['/admin']
  const isAdminRoute = adminRoutes.some(route => path.startsWith(route))

  // Rutas solo para business owners
  const businessRoutes = ['/dashboard']
  const isBusinessRoute = businessRoutes.some(route => path.startsWith(route))

  // Determine if we need to authenticate (only for routes that use user info)
  const needsAuth = isProtectedRoute || isAdminRoute || isBusinessRoute || path === '/login' || path === '/registro'

  // Lazy: only create Supabase client and fetch user when actually needed
  let user: { id: string } | null = null
  if (needsAuth) {
    const supabase = createSupabaseForRequest(request, response)
    const { data: { user: authUser } } = await supabase.auth.getUser()
    user = authUser
  }

  // Si es ruta protegida y no hay usuario, redirigir a login
  if (isProtectedRoute && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Si es ruta de admin, verificar que sea admin
  if (isAdminRoute && user) {
    const supabase = createSupabaseForRequest(request, response)
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
    const supabase = createSupabaseForRequest(request, response)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'business_owner' && profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // Si esta en login/register y ya esta autenticado, redirigir segun role
  // EXCEPT if they have ref=registrar-negocio parameter
  if ((path === '/login' || path === '/registro') && user) {
    const ref = request.nextUrl.searchParams.get('ref')

    // If coming from registrar-negocio, allow them to continue
    if (ref === 'registrar-negocio') {
      return response
    }

    const supabase = createSupabaseForRequest(request, response)
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
    '/((?!_next/static|_next/image|favicon.ico|manifest\\.json|sw\\.js|icons/.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}