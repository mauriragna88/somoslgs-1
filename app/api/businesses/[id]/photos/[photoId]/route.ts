import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUser, isAdmin } from '@/lib/supabase/server'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  const { id, photoId } = await params
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()

    // Verify ownership
    const { data: business, error: fetchError } = await supabase
      .from('businesses')
      .select('owner_id')
      .eq('id', id)
      .single()

    if (fetchError || !business) {
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })
    }

    const userIsAdmin = await isAdmin()
    if (business.owner_id !== user.id && !userIsAdmin) {
      return NextResponse.json({ error: 'No tienes permiso' }, { status: 403 })
    }

    // Get the photo to find storage_path
    const { data: photo, error: photoError } = await supabase
      .from('business_photos')
      .select('storage_path')
      .eq('id', photoId)
      .eq('business_id', id)
      .single()

    if (photoError || !photo) {
      return NextResponse.json({ error: 'Foto no encontrada' }, { status: 404 })
    }

    // Delete from storage
    await supabase.storage
      .from('business-images')
      .remove([photo.storage_path])

    // Delete from database
    const { error: deleteError } = await supabase
      .from('business_photos')
      .delete()
      .eq('id', photoId)

    if (deleteError) {
      return NextResponse.json({ error: 'Error al eliminar la foto' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

