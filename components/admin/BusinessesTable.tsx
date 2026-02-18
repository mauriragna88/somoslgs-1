'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { formatDaysRemaining } from '@/lib/utils'
import SubscriptionManager from './SubscriptionManager'
import QuickWhatsApp from './QuickWhatsApp'
import AssignOwnerModal from './AssignOwnerModal'

interface CategoryData {
  name: string
}

interface OwnerData {
  id: string
  full_name: string
  email: string
  phone: string | null
}

interface Business {
  id: string
  owner_id: string | null
  name: string
  phone: string
  whatsapp?: string
  logo_url: string | null
  subscription_tier: string
  subscription_status?: string
  subscription_expires_at: string | null
  is_courtesy?: boolean
  is_active: boolean
  created_at: string
  category: CategoryData | null
  owner: OwnerData | null
}

interface BusinessesTableProps {
  businesses: Business[]
}

export default function BusinessesTable({ businesses }: BusinessesTableProps) {
  const router = useRouter()
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null)
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false)
  const [showAssignOwnerModal, setShowAssignOwnerModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [filterPlan, setFilterPlan] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPayment, setFilterPayment] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  // Filter businesses
  const filteredBusinesses = businesses.filter((business) => {
    const matchesSearch = business.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      business.owner?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      business.owner?.email?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesPlan = !filterPlan || business.subscription_tier === filterPlan

    const matchesStatus = !filterStatus ||
      (filterStatus === 'active' && business.is_active) ||
      (filterStatus === 'inactive' && !business.is_active) ||
      (filterStatus === 'no_owner' && !business.owner_id)

    const matchesPayment = !filterPayment ||
      (filterPayment === 'courtesy' && business.is_courtesy) ||
      (filterPayment === 'paying' && !business.is_courtesy)

    return matchesSearch && matchesPlan && matchesStatus && matchesPayment
  })

  const getDaysRemaining = (expiresAt: string | null) => {
    if (!expiresAt) return null
    const now = new Date()
    const expires = new Date(expiresAt)
    return Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  }

  const openSubscriptionModal = (business: Business) => {
    setSelectedBusiness(business)
    setShowSubscriptionModal(true)
  }

  const openWhatsAppModal = (business: Business) => {
    setSelectedBusiness(business)
    setShowWhatsAppModal(true)
  }

  const openDeleteModal = (business: Business) => {
    setSelectedBusiness(business)
    setShowDeleteModal(true)
  }

  const handleDelete = async () => {
    if (!selectedBusiness) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/businesses/${selectedBusiness.id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || 'Error al eliminar negocio')
        return
      }
      setShowDeleteModal(false)
      setSelectedBusiness(null)
      router.refresh()
    } catch {
      alert('Error de conexión')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="Buscar por nombre, dueño o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <select
            value={filterPlan}
            onChange={(e) => setFilterPlan(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Todos los planes</option>
            <option value="basico">Básico</option>
            <option value="ventas">Ventas</option>
            <option value="delivery">Delivery</option>
            <option value="premium">Premium</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Todos los estados</option>
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
            <option value="no_owner">Sin dueño</option>
          </select>
          <select
            value={filterPayment}
            onChange={(e) => setFilterPayment(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Todos (pago/cortesia)</option>
            <option value="paying">De pago</option>
            <option value="courtesy">Cortesia</option>
          </select>
        </div>
      </div>

      {/* Businesses Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Negocio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dueño
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Suscripción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBusinesses.length > 0 ? (
                filteredBusinesses.map((business) => {
                  const daysInfo = formatDaysRemaining(business.subscription_expires_at)
                  const daysRemaining = getDaysRemaining(business.subscription_expires_at)

                  return (
                    <tr key={business.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {business.logo_url ? (
                            <Image
                              src={business.logo_url}
                              alt={business.name}
                              width={40}
                              height={40}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                              <span className="text-gray-500 font-semibold">
                                {business.name[0].toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{business.name}</div>
                            <div className="text-sm text-gray-500">{business.category?.name || 'Sin categoría'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {business.owner ? (
                          <>
                            <div className="text-sm font-medium text-gray-900">
                              {business.owner.full_name}
                            </div>
                            <div className="text-sm text-gray-500">{business.owner.email}</div>
                            {business.owner.phone && (
                              <div className="text-xs text-blue-600">{business.owner.phone}</div>
                            )}
                          </>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">
                              Sin dueño
                            </span>
                            <button
                              onClick={() => {
                                setSelectedBusiness(business)
                                setShowAssignOwnerModal(true)
                              }}
                              className="text-xs text-primary hover:underline font-medium"
                            >
                              Asignar
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${
                              business.subscription_tier === 'premium'
                                ? 'bg-purple-100 text-purple-800'
                                : business.subscription_tier === 'delivery'
                                ? 'bg-blue-100 text-blue-800'
                                : business.subscription_tier === 'ventas'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {business.subscription_tier}
                          </span>
                          {business.is_courtesy && (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-teal-100 text-teal-800">
                              Cortesia
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <span className={`text-sm font-medium ${daysInfo.color}`}>
                            {daysInfo.text}
                          </span>
                          {business.subscription_expires_at && (
                            <p className="text-xs text-gray-400">
                              {new Date(business.subscription_expires_at).toLocaleDateString('es-MX')}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            business.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {business.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Quick Actions */}
                          <button
                            onClick={() => openSubscriptionModal(business)}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Gestionar suscripción"
                          >
                            🎁
                          </button>
                          {(business.phone || business.owner?.phone) && (
                            <button
                              onClick={() => openWhatsAppModal(business)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Enviar WhatsApp"
                            >
                              💬
                            </button>
                          )}
                          <Link
                            href={`/admin/negocios/${business.id}`}
                            className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            title="Ver detalles"
                          >
                            👁️
                          </Link>
                          <Link
                            href={`/admin/negocios/${business.id}/editar`}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            ✏️
                          </Link>
                          <button
                            onClick={() => openDeleteModal(business)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <p className="text-lg font-medium mb-2">No hay negocios</p>
                      <p className="text-sm">
                        {searchTerm || filterPlan || filterStatus || filterPayment
                          ? 'No se encontraron negocios con los filtros aplicados'
                          : 'Comienza agregando tu primer negocio'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Results count */}
      <div className="mt-4 text-sm text-gray-500">
        Mostrando {filteredBusinesses.length} de {businesses.length} negocios
      </div>

      {/* Subscription Modal */}
      {showSubscriptionModal && selectedBusiness && (
        <SubscriptionManager
          business={{
            ...selectedBusiness,
            subscription_status: selectedBusiness.subscription_status || (selectedBusiness.is_active ? 'active' : 'inactive'),
          }}
          onClose={() => {
            setShowSubscriptionModal(false)
            setSelectedBusiness(null)
          }}
        />
      )}

      {/* WhatsApp Modal */}
      {showWhatsAppModal && selectedBusiness && (
        <QuickWhatsApp
          phone={selectedBusiness.phone || selectedBusiness.owner?.phone || ''}
          businessName={selectedBusiness.name}
          ownerName={selectedBusiness.owner?.full_name}
          daysRemaining={getDaysRemaining(selectedBusiness.subscription_expires_at)}
          onClose={() => {
            setShowWhatsAppModal(false)
            setSelectedBusiness(null)
          }}
        />
      )}

      {/* Assign Owner Modal */}
      {showAssignOwnerModal && selectedBusiness && (
        <AssignOwnerModal
          businessId={selectedBusiness.id}
          businessName={selectedBusiness.name}
          onClose={() => {
            setShowAssignOwnerModal(false)
            setSelectedBusiness(null)
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedBusiness && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Eliminar negocio</h3>
            <p className="text-gray-600 mb-1">
              ¿Estás seguro de que deseas eliminar <strong>{selectedBusiness.name}</strong>?
            </p>
            <p className="text-sm text-red-600 mb-6">
              Se eliminarán también todos sus productos, pedidos y datos relacionados. Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setSelectedBusiness(null)
                }}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
