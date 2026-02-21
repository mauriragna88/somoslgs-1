import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUser } from '@/lib/supabase/server'
import { z } from 'zod'

const productSchema = z.object({
  business_id: z.string().uuid(),
  name: z.string().min(3).max(100),
  description: z.string().min(10),
  price: z.number().min(0),
  category: z.string().optional().nullable(), // Category is a string, not UUID
  stock: z.number().int().min(0).optional().nullable(),
  sku: z.string().max(50).optional().nullable(),
  images: z.array(z.string()).optional(),
  is_available: z.boolean().default(true),
  type: z.enum(['producto', 'servicio']).default('producto'),
})

export async function POST(request: Request) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()

    const validatedData = productSchema.parse(body)

    // Use service role to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Verify user owns this business
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, owner_id, subscription_tier')
      .eq('id', validatedData.business_id)
      .single()

    if (businessError || !business) {
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })
    }

    if (business.owner_id !== user.id) {
      return NextResponse.json({ error: 'No tienes permiso para agregar productos a este negocio' }, { status: 403 })
    }

    // Check if plan allows products
    const canManageProducts = ['ventas', 'delivery', 'premium'].includes(business.subscription_tier)
    if (!canManageProducts) {
      return NextResponse.json({
        error: 'Tu plan actual no incluye gestión de productos. Actualiza tu suscripción.'
      }, { status: 403 })
    }

    // Prepare product data - convert empty strings to null
    // Round price to 2 decimal places to avoid floating point issues
    const productData = {
      business_id: validatedData.business_id,
      name: validatedData.name,
      description: validatedData.description,
      price: Math.round(validatedData.price * 100) / 100,
      category: validatedData.category || null,
      stock: validatedData.stock || 0,
      sku: validatedData.sku || null,
      images: validatedData.images || [],
      is_available: validatedData.is_available,
      type: validatedData.type,
    }

    // Create product
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert(productData)
      .select()
      .single()

    if (productError) {
      console.error('Product creation error:', productError)
      return NextResponse.json({
        error: 'Error al crear el producto'
      }, { status: 500 })
    }

    return NextResponse.json({ success: true, product }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('business_id')

    if (!businessId) {
      return NextResponse.json({ error: 'business_id requerido' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Verify user owns this business
    const { data: business } = await supabase
      .from('businesses')
      .select('owner_id')
      .eq('id', businessId)
      .single()

    if (!business || business.owner_id !== user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Get products
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Error al obtener productos' }, { status: 500 })
    }

    return NextResponse.json({ products })
  } catch (error) {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
