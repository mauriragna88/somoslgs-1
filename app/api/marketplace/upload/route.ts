import { NextResponse } from 'next/server'
import { getUser, createServiceClient } from '@/lib/supabase/server'
import { MARKETPLACE_PHOTO_LIMIT } from '@/lib/constants'
import { checkUploadRateLimit, getClientIP } from '@/lib/security'

// POST: Upload marketplace image
export async function POST(request: Request) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // Rate limiting
  const ip = getClientIP(request)
  const rateLimit = checkUploadRateLimit(`upload:${ip}`)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Demasiadas subidas. Intenta más tarde.' },
      { status: 429 }
    )
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const listingId = formData.get('listing_id') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 })
    }

    // Validate file type by MIME and extension
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    const allowedExts = ['jpg', 'jpeg', 'png', 'webp', 'gif']
    const fileExt = (file.name.split('.').pop() || '').toLowerCase()

    if (!allowedMimes.includes(file.type) || !allowedExts.includes(fileExt)) {
      return NextResponse.json({ error: 'Solo se permiten imágenes (JPG, PNG, WEBP, GIF)' }, { status: 400 })
    }

    // Prevent path traversal in filename
    if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
      return NextResponse.json({ error: 'Nombre de archivo inválido' }, { status: 400 })
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
    // Use MIME-derived extension, not user-provided filename extension
    const mimeToExt: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' }
    const safeExt = mimeToExt[file.type] || 'jpg'
    const path = `marketplace/${user.id}/${timestamp}.${safeExt}`

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
