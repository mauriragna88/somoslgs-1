import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getUser } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { moderateText } from '@/lib/moderation'
import { MARKETPLACE_LISTING_DAYS } from '@/lib/constants'
import { checkMarketplaceRateLimit, getClientIP, sanitizeSearchQuery } from '@/lib/security'

const listingSchema = z.object({
  title: z.string().min(5, 'El título debe tener al menos 5 caracteres').max(100),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres').max(1000),
  price: z.number().min(0, 'El precio no puede ser negativo'),
  price_type: z.enum(['fijo', 'negociable', 'gratis', 'intercambio']),
  condition: z.enum(['nuevo', 'seminuevo', 'usado']),
  category_id: z.string().uuid().nullable().optional(),
  images: z.array(z.string()).max(8, 'Máximo 8 fotos').default([]),
  location: z.string().max(200).optional().nullable(),
  whatsapp: z.string().min(10, 'WhatsApp debe tener al menos 10 dígitos').max(20),
})

// GET: List active listings with filters
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category') || ''
  const condition = searchParams.get('condition') || ''
  const priceMin = searchParams.get('price_min') || ''
  const priceMax = searchParams.get('price_max') || ''
  const search = searchParams.get('q') || ''
  const order = searchParams.get('order') || ''
  const offset = parseInt(searchParams.get('offset') || '0')
  const limit = parseInt(searchParams.get('limit') || '20')

  const own = searchParams.get('own') === '1'

  // If requesting own listings, require auth
  if (own) {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const supabase = createServiceClient()
    const { data } = await supabase
      .from('marketplace_listings')
      .select('*, category:marketplace_categories(*), marketplace_leads(count)')
      .eq('seller_id', user.id)
      .neq('status', 'removed')
      .order('created_at', { ascending: false })
      .limit(100)

    // Flatten lead count into each listing
    const withLeadCount = (data || []).map((item: any) => ({
      ...item,
      lead_count: item.marketplace_leads?.[0]?.count || 0,
      marketplace_leads: undefined,
    }))

    return NextResponse.json({ data: withLeadCount })
  }

  const supabase = createServiceClient()

  let query = supabase
    .from('marketplace_listings')
    .select('*, category:marketplace_categories(*), seller:profiles!marketplace_listings_seller_id_fkey(full_name, created_at)', { count: 'exact' })
    .eq('status', 'active')
    .gte('expires_at', new Date().toISOString())

  if (category) {
    query = query.eq('category_id', category)
  }

  if (condition) {
    query = query.eq('condition', condition)
  }

  if (priceMin) {
    query = query.gte('price', parseFloat(priceMin))
  }

  if (priceMax) {
    query = query.lte('price', parseFloat(priceMax))
  }

  if (search) {
    const sanitized = sanitizeSearchQuery(search)
    const words = sanitized.toLowerCase().split(/\s+/).filter((w: string) => w.length >= 2)
    if (words.length > 0) {
      const orConditions = words.map((word: string) =>
        `title.ilike.%${word}%,description.ilike.%${word}%`
      ).join(',')
      query = query.or(orConditions)
    }
  }

  // Ordering
  if (order === 'price_asc') {
    query = query.order('price', { ascending: true })
  } else if (order === 'price_desc') {
    query = query.order('price', { ascending: false })
  } else {
    // Default: featured first, then newest
    query = query
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
  }

  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ error: 'Error al obtener artículos' }, { status: 500 })
  }

  return NextResponse.json({ data, count })
}

// POST: Create a new listing
export async function POST(request: Request) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // Rate limiting
  const ip = getClientIP(request)
  const rateLimit = checkMarketplaceRateLimit(`marketplace:${ip}`)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Demasiados artículos publicados. Intenta más tarde.' },
      { status: 429 }
    )
  }

  try {
    const body = await request.json()
    const validated = listingSchema.parse(body)

    // Moderate content
    const moderation = moderateText(validated.title, validated.description)
    if (!moderation.ok) {
      return NextResponse.json({ error: moderation.reason }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Calculate expiration
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + MARKETPLACE_LISTING_DAYS)

    const price = validated.price_type === 'gratis' ? 0 : Math.round(validated.price * 100) / 100

    const { data, error } = await supabase
      .from('marketplace_listings')
      .insert({
        seller_id: user.id,
        title: validated.title.trim(),
        description: validated.description.trim(),
        price,
        price_type: validated.price_type,
        condition: validated.condition,
        category_id: validated.category_id || null,
        images: validated.images,
        location: validated.location?.trim() || null,
        whatsapp: validated.whatsapp.trim(),
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Error al crear artículo' }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
