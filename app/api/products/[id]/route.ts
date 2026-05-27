import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUser } from '@/lib/supabase/server'
import { z } from 'zod'

const productUpdateSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().min(10).optional(),
  price: z.number().min(0).optional(),
  category: z.string().optional().nullable(),
  stock: z.number().int().min(0).optional().nullable(),
  sku: z.string().max(50).optional().nullable(),
  images: z.array(z.string()).optional(),
  is_available: z.boolean().optional(),
  type: z.enum(['producto', 'servicio']).optional(),
})

// Helper to create supabase client with service role
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = productUpdateSchema.parse(body)

    const supabase = getSupabaseAdmin()

    // Get product and verify ownership
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*, businesses!inner(owner_id)')
      .eq('id', id)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    }

    // @ts-ignore - businesses is an array due to join
    if (product.businesses.owner_id !== user.id) {
      return NextResponse.json({ error: 'No tienes permiso para modificar este producto' }, { status: 403 })
    }

    // Prepare update data - convert empty strings to null
    // Round price to 2 decimal places to avoid floating point issues
    const updateData = {
      ...validatedData,
      price: validatedData.price !== undefined ? Math.round(validatedData.price * 100) / 100 : undefined,
      category: validatedData.category || null,
      sku: validatedData.sku || null,
    }

    // Update product
    const { data: updatedProduct, error: updateError } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: 'Error al actualizar el producto' }, { status: 500 })
    }

    return NextResponse.json({ success: true, product: updatedProduct })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()

    // Get product and verify ownership
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*, businesses!inner(owner_id)')
      .eq('id', id)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    }

    // @ts-ignore - businesses is an array due to join
    if (product.businesses.owner_id !== user.id) {
      return NextResponse.json({ error: 'No tienes permiso para eliminar este producto' }, { status: 403 })
    }

    // Delete product
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    if (deleteError) {
      return NextResponse.json({ error: 'Error al eliminar el producto' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Producto eliminado' })
  } catch (error) {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

