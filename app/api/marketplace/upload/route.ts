import { NextResponse } from 'next/server'
import { getUser, createServiceClient } from '@/lib/supabase/server'
import { MARKETPLACE_PHOTO_LIMIT } from '@/lib/constants'

// POST: Upload marketplace image
export async function POST(request: Request) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const listingId = formData.get('listing_id') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Solo se permiten imágenes' }, { status: 400 })
    }

    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'La imagen no puede pesar más de 5MB' }, { status: 400 })
    }

    // If listing_id provided, check photo limit
    if (listingId) {
      const supabase = createServiceClient()
      const { data: listing } = await supabase
        .from('marketplace_listings')
        .select('images, seller_id')
        .eq('id', listingId)
        .single()

      if (listing && listing.seller_id !== user.id) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }

      if (listing && (listing.images || []).length >= MARKETPLACE_PHOTO_LIMIT) {
        return NextResponse.json(
          { error: `Máximo ${MARKETPLACE_PHOTO_LIMIT} fotos por artículo` },
          { status: 400 }
        )
      }
    }

    const supabase = createServiceClient()
    const timestamp = Date.now()
    const ext = file.name.split('.').pop() || 'jpg'
    const path = `marketplace/${user.id}/${timestamp}.${ext}`

    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await supabase.storage
      .from('business-images')
      .upload(path, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      return NextResponse.json({ error: 'Error al subir imagen' }, { status: 500 })
    }

    const { data: urlData } = supabase.storage
      .from('business-images')
      .getPublicUrl(path)

    return NextResponse.json({
      url: urlData.publicUrl,
      path,
    })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
