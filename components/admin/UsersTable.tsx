'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface UserProfile {
  id: string
  role: string
  full_name: string
  email: string
  phone: string | null
  avatar_url: string | null
  created_at: string
}

interface UsersTableProps {
  users: UserProfile[]
}

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  business_owner: 'Dueño de Negocio',
  customer: 'Cliente',
  delivery: 'Repartidor',
}

const roleColors: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-800',
  business_owner: 'bg-blue-100 text-blue-800',
  customer: 'bg-green-100 text-green-800',
  delivery: 'bg-yellow-100 text-yellow-800',
}

export default function UsersTable({ users }: UsersTableProps) {
  const router = useRouter()
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('')

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = !filterRole || user.role === filterRole
    return matchesSearch && matchesRole
  })

  const openDeleteModal = (user: UserProfile) => {
    setSelectedUser(user)
    setDeleteError('')
    setShowDeleteModal(true)
  }

  const handleDelete = async () => {
    if (!selectedUser) return
    setDeleting(true)
    setDeleteError('')
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok) {
        setDeleteError(data.error || 'Error al eliminar usuario')
        return
      }
      setShowDeleteModal(false)
      setSelectedUser(null)
      router.refresh()
    } catch {
      setDeleteError('Error de conexión')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-w-0 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B35] text-sm"
          />
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B35] text-sm"
          >
            <option value="">Todos los roles</option>
            <option value="admin">Administrador</option>
            <option value="business_owner">Dueño de Negocio</option>
            <option value="customer">Cliente</option>
            <option value="delivery">Repartidor</option>
          </select>
        </div>
      </div>

      {/* Mobile Cards View */}
      <div className="lg:hidden space-y-3">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <div key={user.id} className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  {user.avatar_url ? (
                    <Image
                      src={user.avatar_url}
                      alt={user.full_name}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-[#FF6B35] text-white rounded-full flex items-center justify-center font-semibold flex-shrink-0">
                      {user.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{user.full_name}</p>
                    <p className="text-sm text-gray-500 truncate">{user.email}</p>
                  </div>
                </div>
                {user.role !== 'admin' && (
                  <button
                    onClick={() => openDeleteModal(user)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg flex-shrink-0"
                  >
                    🗑️
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 mt-2 ml-[52px]">
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${roleColors[user.role] || 'bg-gray-100 text-gray-800'}`}>
                  {roleLabels[user.role] || user.role}
                </span>
                {user.phone && <span className="text-xs text-gray-500">{user.phone}</span>}
                <span className="text-xs text-gray-400">{new Date(user.created_at).toLocaleDateString('es-MX')}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500">
            {searchTerm || filterRole
              ? 'No se encontraron usuarios con los filtros aplicados'
              : 'No hay usuarios registrados'}
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registro</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {user.avatar_url ? (
                          <Image src={user.avatar_url} alt={user.full_name} width={40} height={40} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 bg-[#FF6B35] text-white rounded-full flex items-center justify-center font-semibold">
                            {user.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                          </div>
                        )}
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.phone || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${roleColors[user.role] || 'bg-gray-100 text-gray-800'}`}>
                        {roleLabels[user.role] || user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(user.created_at).toLocaleDateString('es-MX')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {user.role !== 'admin' ? (
                        <button onClick={() => openDeleteModal(user)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar usuario">🗑️</button>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    {searchTerm || filterRole ? 'No se encontraron usuarios con los filtros aplicados' : 'No hay usuarios registrados'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Results count */}
      <div className="mt-4 text-sm text-gray-500">
        Mostrando {filteredUsers.length} de {users.length} usuarios
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Eliminar usuario</h3>
            <p className="text-gray-600 mb-1">
              ¿Estás seguro de que deseas eliminar a <strong>{selectedUser.full_name}</strong>?
            </p>
            <p className="text-sm text-gray-500 mb-2">
              {selectedUser.email} - {roleLabels[selectedUser.role] || selectedUser.role}
            </p>
            <p className="text-sm text-red-600 mb-4">
              Esta acción no se puede deshacer.
            </p>
            {deleteError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-700">{deleteError}</p>
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setSelectedUser(null)
                  setDeleteError('')
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
