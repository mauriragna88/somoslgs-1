export const dynamic = 'force-dynamic'

import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { getUser, isAdmin } from '@/lib/supabase/server'
import PaymentApprovalCard from '@/components/admin/PaymentApprovalCard'

interface Transaction {
  id: string
  status: string
  amount: number
  subscription_tier: string
  proof_url: string | null
  created_at: string
  businesses?: { id: string; name: string; slug: string; subscription_tier: string }
  profiles?: { full_name: string; email: string; phone: string }
}

export default async function AdminPagosPage() {
  const user = await getUser()
  if (!user) {
    redirect('/login')
  }

  const admin = await isAdmin()
  if (!admin) {
    redirect('/')
  }

  // Use service role client to bypass RLS and get ALL transactions
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Get all transactions with business and user info
  const { data: transactions } = await supabase
    .from('transactions')
    .select(`
      *,
      businesses:business_id (id, name, slug, subscription_tier),
      profiles:user_id (full_name, email, phone)
    `)
    .order('created_at', { ascending: false }) as { data: Transaction[] | null }

  // Separate by status
  const pendingTransactions = transactions?.filter(t => t.status === 'pending') || []
  const approvedTransactions = transactions?.filter(t => t.status === 'approved') || []
  const rejectedTransactions = transactions?.filter(t => t.status === 'rejected') || []

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Pagos</h1>
        <p className="text-gray-600 mt-2">
          Revisa y aprueba los comprobantes de pago de suscripciones
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-700 font-medium">Pagos Pendientes</p>
              <p className="text-3xl font-bold text-yellow-900 mt-1">{pendingTransactions.length}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-200 rounded-full flex items-center justify-center">
              <span className="text-2xl">⏳</span>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 font-medium">Pagos Aprobados</p>
              <p className="text-3xl font-bold text-green-900 mt-1">{approvedTransactions.length}</p>
            </div>
            <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
              <span className="text-2xl">✓</span>
            </div>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-700 font-medium">Pagos Rechazados</p>
              <p className="text-3xl font-bold text-red-900 mt-1">{rejectedTransactions.length}</p>
            </div>
            <div className="w-12 h-12 bg-red-200 rounded-full flex items-center justify-center">
              <span className="text-2xl">✗</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Payments */}
      {pendingTransactions.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Pagos Pendientes de Aprobación
          </h2>
          <div className="grid gap-6">
            {pendingTransactions.map((transaction) => (
              <PaymentApprovalCard
                key={transaction.id}
                transaction={transaction}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recent Approved */}
      {approvedTransactions.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Pagos Aprobados Recientemente
          </h2>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Negocio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dueño</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Comprobante</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {approvedTransactions.slice(0, 10).map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {/* @ts-ignore */}
                      <p className="font-medium text-gray-900">{transaction.businesses?.name}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {/* @ts-ignore */}
                      <p className="text-sm text-gray-900">{transaction.profiles?.full_name}</p>
                      {/* @ts-ignore */}
                      <p className="text-xs text-gray-500">{transaction.profiles?.email}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded capitalize">
                        {transaction.subscription_tier}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">
                      ${transaction.amount.toLocaleString('es-MX')} MXN
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(transaction.created_at).toLocaleDateString('es-MX')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {transaction.proof_url && (
                        <a
                          href={transaction.proof_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary-dark text-sm"
                        >
                          Ver
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {pendingTransactions.length === 0 && approvedTransactions.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">📄</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            No hay pagos registrados
          </h3>
          <p className="text-gray-600">
            Los comprobantes de pago aparecerán aquí cuando los negocios los suban
          </p>
        </div>
      )}
    </div>
  )
}
