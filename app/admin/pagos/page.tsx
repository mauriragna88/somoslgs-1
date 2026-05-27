export const dynamic = 'force-dynamic'

import { createServiceClient } from '@/lib/supabase/server'
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
  const supabase = createServiceClient()

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

  // Revenue calculations
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const totalRevenue = approvedTransactions.reduce((sum, t) => sum + (t.amount || 0), 0)
  const monthRevenue = approvedTransactions
    .filter(t => new Date(t.created_at) >= firstDayOfMonth)
    .reduce((sum, t) => sum + (t.amount || 0), 0)
  const revenueByTier = approvedTransactions.reduce<Record<string, number>>((acc, t) => {
    const tier = t.subscription_tier || 'desconocido'
    acc[tier] = (acc[tier] || 0) + (t.amount || 0)
    return acc
  }, {})
  const tierLabels: Record<string, string> = { emprendedor: 'Emprendedor', pro: 'Pro', avanzado: 'Avanzado' }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold" style={{ fontFamily: 'var(--display)', color: 'var(--ink)' }}>Gestión de Pagos</h1>
        <p className="mt-1 text-sm sm:text-base" style={{ color: 'var(--muted)' }}>
          Revisa y aprueba los comprobantes de pago
        </p>
      </div>

      {/* Revenue Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="rounded-2xl p-4 sm:p-5" style={{ background: 'linear-gradient(135deg,var(--coral),#e85520)', boxShadow: '0 4px 14px rgba(255,107,53,0.3)' }}>
          <p className="text-xs font-medium text-white/80 mb-1">Ingresos totales</p>
          <p className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--display)' }}>${totalRevenue.toLocaleString('es-MX')}</p>
          <p className="text-xs text-white/70 mt-0.5">MXN acumulado</p>
        </div>
        <div className="rounded-2xl p-4 sm:p-5" style={{ background: 'linear-gradient(135deg,var(--gold),#d4a017)', boxShadow: '0 4px 14px rgba(245,185,66,0.3)' }}>
          <p className="text-xs font-medium text-white/80 mb-1">Este mes</p>
          <p className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--display)' }}>${monthRevenue.toLocaleString('es-MX')}</p>
          <p className="text-xs text-white/70 mt-0.5">{now.toLocaleString('es-MX', { month: 'long', year: 'numeric' })}</p>
        </div>
        {Object.entries(revenueByTier).slice(0, 2).map(([tier, amount]) => (
          <div key={tier} className="rounded-2xl p-4 sm:p-5 bg-white" style={{ boxShadow: 'var(--shadow-card)', border: '1px solid rgba(31,41,55,0.07)' }}>
            <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted)' }}>{tierLabels[tier] || tier}</p>
            <p className="text-2xl font-bold" style={{ fontFamily: 'var(--display)', color: 'var(--ink)' }}>${(amount as number).toLocaleString('es-MX')}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{approvedTransactions.filter(t => t.subscription_tier === tier).length} pagos</p>
          </div>
        ))}
      </div>

      {/* Status Stats */}
      <div className="grid grid-cols-3 gap-3 sm:gap-6 mb-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-yellow-700 font-medium">Pendientes</p>
              <p className="text-2xl sm:text-3xl font-bold text-yellow-900 mt-1">{pendingTransactions.length}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-200 rounded-full flex items-center justify-center">
              <span className="text-xl sm:text-2xl">⏳</span>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-xl p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-green-700 font-medium">Aprobados</p>
              <p className="text-2xl sm:text-3xl font-bold text-green-900 mt-1">{approvedTransactions.length}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-200 rounded-full flex items-center justify-center">
              <span className="text-xl sm:text-2xl">✓</span>
            </div>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-xl p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-red-700 font-medium">Rechazados</p>
              <p className="text-2xl sm:text-3xl font-bold text-red-900 mt-1">{rejectedTransactions.length}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-200 rounded-full flex items-center justify-center">
              <span className="text-xl sm:text-2xl">✗</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Payments */}
      {pendingTransactions.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'var(--display)', color: 'var(--ink)' }}>
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
          <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'var(--display)', color: 'var(--ink)' }}>
            Pagos Aprobados Recientemente
          </h2>
          {/* Mobile Cards */}
          <div className="lg:hidden space-y-3">
            {approvedTransactions.slice(0, 10).map((transaction) => (
              <div key={transaction.id} className="bg-white rounded-2xl p-4" style={{ boxShadow: 'var(--shadow-card)' }}>
                <div className="flex items-center justify-between mb-2">
                  {/* @ts-ignore */}
                  <p className="font-semibold" style={{ color: 'var(--ink)' }}>{transaction.businesses?.name}</p>
                  <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded capitalize">{transaction.subscription_tier}</span>
                </div>
                <div className="space-y-1 text-sm">
                  {/* @ts-ignore */}
                  <p style={{ color: 'var(--muted)' }}>{transaction.profiles?.full_name}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold" style={{ color: 'var(--ink)' }}>${transaction.amount.toLocaleString('es-MX')} MXN</span>
                    <span style={{ color: 'var(--muted)' }}>{new Date(transaction.created_at).toLocaleDateString('es-MX')}</span>
                  </div>
                  {transaction.proof_url && (
                    <a href={transaction.proof_url} target="_blank" rel="noopener noreferrer" className="text-sm" style={{ color: 'var(--coral)' }}>Ver comprobante</a>
                  )}
                </div>
              </div>
            ))}
          </div>
          {/* Desktop Table */}
          <div className="hidden lg:block bg-white rounded-2xl overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
            <table className="w-full">
              <thead style={{ background: 'var(--cream)' }}>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: 'var(--muted)' }}>Negocio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: 'var(--muted)' }}>Dueño</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: 'var(--muted)' }}>Plan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: 'var(--muted)' }}>Monto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: 'var(--muted)' }}>Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: 'var(--muted)' }}>Comprobante</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                {approvedTransactions.slice(0, 10).map((transaction) => (
                  <tr key={transaction.id}>
                    {/* @ts-ignore */}
                    <td className="px-6 py-4 whitespace-nowrap font-medium" style={{ color: 'var(--ink)' }}>{transaction.businesses?.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {/* @ts-ignore */}
                      <p className="text-sm" style={{ color: 'var(--ink)' }}>{transaction.profiles?.full_name}</p>
                      {/* @ts-ignore */}
                      <p className="text-xs" style={{ color: 'var(--muted)' }}>{transaction.profiles?.email}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded capitalize">{transaction.subscription_tier}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold" style={{ color: 'var(--ink)' }}>${transaction.amount.toLocaleString('es-MX')} MXN</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--muted)' }}>{new Date(transaction.created_at).toLocaleDateString('es-MX')}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {transaction.proof_url && (
                        <a href={transaction.proof_url} target="_blank" rel="noopener noreferrer" className="text-sm" style={{ color: 'var(--coral)' }}>Ver</a>
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
        <div className="bg-white rounded-2xl p-12 text-center" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--cream)' }}>
            <span className="text-4xl">📄</span>
          </div>
          <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--ink)' }}>
            No hay pagos registrados
          </h3>
          <p style={{ color: 'var(--muted)' }}>
            Los comprobantes de pago aparecerán aquí cuando los negocios los suban
          </p>
        </div>
      )}
    </div>
  )
}
