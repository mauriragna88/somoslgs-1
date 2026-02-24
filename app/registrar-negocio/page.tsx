import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/supabase/server'
import Link from 'next/link'
import RegisterBusinessForm from '@/components/business/RegisterBusinessForm'

export const metadata: Metadata = {
  title: 'Registrar mi Negocio',
  description: 'Registra tu negocio GRATIS en SomosLagos y llega a miles de clientes en Lagos de Moreno, Jalisco.',
  openGraph: {
    title: 'Registrar mi Negocio | SomosLagos',
    description: 'Registra tu negocio en SomosLagos y llega a miles de clientes en Lagos de Moreno.',
    url: 'https://www.somoslagos.com.mx/registrar-negocio',
  },
}

export default async function RegistrarNegocioPage() {
  const user = await getUser()
  const supabase = await createClient()

  // Get categories for the form
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, icon')
    .is('parent_id', null)
    .order('display_order')

  // Check if user is admin
  let isAdmin = false
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single() as { data: { role: string } | null }
    isAdmin = profile?.role === 'admin'
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Registra tu Negocio en
            <span className="text-primary"> Lagos de Moreno</span>
          </h1>
          <p className="text-xl text-gray-600">
            Alcanza más clientes con tu presencia digital — <strong className="text-primary">es GRATIS</strong>
          </p>
        </div>

        {!user ? (
          /* Usuario NO está logueado */
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 md:p-12 text-center">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-5xl">🔐</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Primero necesitas una cuenta
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Para registrar tu negocio, primero debes crear tu cuenta de usuario.
              Es rápido, gratis y te tomará menos de 2 minutos.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/registro?ref=registrar-negocio"
                className="bg-primary hover:bg-primary-dark text-white px-8 py-4 rounded-lg font-bold text-lg transition-colors"
              >
                Crear mi Cuenta →
              </Link>
              <Link
                href="/login?ref=registrar-negocio"
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-8 py-4 rounded-lg font-bold text-lg transition-colors"
              >
                Ya tengo cuenta
              </Link>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-4">Después de crear tu cuenta podrás:</p>
              <div className="grid md:grid-cols-3 gap-4 text-left">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">✓</span>
                  <div>
                    <p className="font-semibold text-gray-900">Registrar tu negocio</p>
                    <p className="text-sm text-gray-600">Con toda tu información</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">✓</span>
                  <div>
                    <p className="font-semibold text-gray-900">Elegir tu plan</p>
                    <p className="text-sm text-gray-600">Plan Gratis disponible</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">✓</span>
                  <div>
                    <p className="font-semibold text-gray-900">Empezar a vender</p>
                    <p className="text-sm text-gray-600">Tu negocio visible 24/7</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Usuario está logueado y NO tiene negocio - Mostrar formulario */
          <RegisterBusinessForm categories={categories || []} isAdmin={isAdmin} />
        )}
      </div>
    </div>
  )
}
