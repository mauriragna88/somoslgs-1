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

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const { id } = await params
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const adminCheck = await isAdmin()
    if (!adminCheck) {
      return NextResponse.json({ error: 'Solo administradores' }, { status: 403 })
    }

    const supabase = getSupabaseAdmin()

    // Get the target user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('id', id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Don't allow deleting admins
    if (profile.role === 'admin') {
      return NextResponse.json({ error: 'No se puede eliminar un administrador' }, { status: 403 })
    }

    // Don't allow deleting yourself
    if (id === user.id) {
      return NextResponse.json({ error: 'No puedes eliminarte a ti mismo' }, { status: 400 })
    }

    // Check if user has linked businesses
    const { data: businesses, error: bizError } = await supabase
      .from('businesses')
      .select('id, name')
      .eq('owner_id', id)

    if (bizError) {
      return NextResponse.json({ error: 'Error al verificar negocios' }, { status: 500 })
    }

    if (businesses && businesses.length > 0) {
      const names = businesses.map(b => b.name).join(', ')
      return NextResponse.json({
        error: `El usuario tiene ${businesses.length} negocio(s) ligado(s): ${names}. Elimina los negocios primero.`,
      }, { status: 409 })
    }

    // Delete profile first (will cascade or be handled by DB)
    const { error: deleteProfileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id)

    if (deleteProfileError) {
      return NextResponse.json({ error: 'Error al eliminar perfil' }, { status: 500 })
    }

    // Delete from Supabase Auth
    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(id)

    if (deleteAuthError) {
      return NextResponse.json({ error: 'Error al eliminar usuario' }, { status: 500 })
    }

    // Log the action
    try {
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'delete_user',
        resource_type: 'user',
        resource_id: id,
        details: { user_name: profile.full_name, user_role: profile.role },
      })
    } catch {
      // Ignore logging errors
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

