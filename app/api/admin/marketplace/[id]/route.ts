import { NextResponse } from 'next/server'
import { isAdmin, getUser, createServiceClient } from '@/lib/supabase/server'

// PUT: Admin update listing/report status
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const user = await getUser()
  const body = await request.json()
  const { action, report_id } = body

  const supabase = createServiceClient()

  if (action === 'dismiss' && report_id) {
    // Dismiss report
    const { error } = await supabase
      .from('reports')
      .update({
        status: 'dismissed',
        reviewed_by: user!.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', report_id)

    if (error) {
      return NextResponse.json({ error: 'Error al descartar reporte' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  }

  if (action === 'remove') {
    // Remove listing + resolve all related reports
    const { error: listingError } = await supabase
      .from('marketplace_listings')
      .update({ status: 'removed', updated_at: new Date().toISOString() })
      .eq('id', params.id)

    if (listingError) {
      return NextResponse.json({ error: 'Error al eliminar artículo' }, { status: 500 })
    }

    // Resolve all pending reports for this listing
    await supabase
      .from('reports')
      .update({
        status: 'resolved',
        reviewed_by: user!.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('item_type', 'marketplace_listing')
      .eq('item_id', params.id)
      .eq('status', 'pending')

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
}

// DELETE: Admin force remove listing
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const supabase = createServiceClient()

  const { error } = await supabase
    .from('marketplace_listings')
    .update({ status: 'removed', updated_at: new Date().toISOString() })
    .eq('id', params.id)

  if (error) {
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
