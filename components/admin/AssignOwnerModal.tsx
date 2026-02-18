'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface AvailableUser {
  id: string
  full_name: string
  email: string
  phone: string | null
}

interface AssignOwnerModalProps {
  businessId: string
  businessName: string
  onClose: () => void
}

export default function AssignOwnerModal({ businessId, businessName, onClose }: AssignOwnerModalProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'link' | 'create'>('link')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Available users state
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [filterText, setFilterText] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  // Create new owner form
  const [newOwner, setNewOwner] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  })

  // Load available users on mount
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await fetch(`/api/admin/businesses/${businessId}/assign-owner`)
        if (res.ok) {
          const data = await res.json()
          setAvailableUsers(data.users || [])
          // If no available users, default to create tab
          if (!data.users || data.users.length === 0) {
            setActiveTab('create')
          }
        }
      } catch {
        // Ignore - will show empty list
      } finally {
        setLoadingUsers(false)
      }
    }
    loadUsers()
  }, [businessId])

  const filteredUsers = availableUsers.filter(u => {
    if (!filterText.trim()) return true
    const term = filterText.toLowerCase()
    return (
      u.full_name?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term) ||
      u.phone?.includes(term)
    )
  })

  const handleLinkExisting = async () => {
    if (!selectedUserId) {
      setMessage({ type: 'error', text: 'Selecciona un usuario' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch(`/api/admin/businesses/${businessId}/assign-owner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'link_existing',
          user_id: selectedUserId,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Error al vincular dueño')

      setMessage({ type: 'success', text: 'Dueño vinculado correctamente' })
      router.refresh()
      setTimeout(onClose, 1500)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAndLink = async () => {
    if (!newOwner.name || !newOwner.email || !newOwner.password) {
      setMessage({ type: 'error', text: 'Completa nombre, email y contraseña' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch(`/api/admin/businesses/${businessId}/assign-owner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_and_link',
          ...newOwner,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Error al asignar dueño')

      setMessage({ type: 'success', text: `Dueño ${data.owner.name} creado y asignado` })
      router.refresh()
      setTimeout(onClose, 1500)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Asignar Dueño</h2>
            <p className="text-sm text-gray-600">{businessName}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
            &times;
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className={`p-3 text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('link')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'link' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Usuarios Disponibles {!loadingUsers && `(${availableUsers.length})`}
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'create' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Crear Nuevo Dueño
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4">
          {activeTab === 'link' && (
            <div className="space-y-3">
              {loadingUsers ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                  Cargando usuarios...
                </div>
              ) : availableUsers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-3">No hay usuarios registrados sin negocio</p>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="text-primary hover:underline font-medium text-sm"
                  >
                    Crear un nuevo dueño
                  </button>
                </div>
              ) : (
                <>
                  {/* Filter input */}
                  <input
                    type="text"
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    placeholder="Filtrar por nombre, email o teléfono..."
                  />

                  {/* User list */}
                  <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-60 overflow-y-auto">
                    {filteredUsers.length === 0 ? (
                      <p className="p-3 text-sm text-gray-500 text-center">Sin resultados</p>
                    ) : (
                      filteredUsers.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => setSelectedUserId(user.id)}
                          className={`w-full p-3 text-left hover:bg-gray-50 transition-colors ${
                            selectedUserId === user.id ? 'bg-primary/10 border-l-4 border-primary' : ''
                          }`}
                        >
                          <p className="font-medium text-gray-900 text-sm">{user.full_name || 'Sin nombre'}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                          {user.phone && <p className="text-xs text-gray-400">{user.phone}</p>}
                        </button>
                      ))
                    )}
                  </div>

                  <button
                    onClick={handleLinkExisting}
                    disabled={loading || !selectedUserId}
                    className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Vinculando...' : 'Vincular Usuario Seleccionado'}
                  </button>
                </>
              )}
            </div>
          )}

          {activeTab === 'create' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  value={newOwner.name}
                  onChange={(e) => setNewOwner({ ...newOwner, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={newOwner.email}
                  onChange={(e) => setNewOwner({ ...newOwner, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input
                  type="tel"
                  value={newOwner.phone}
                  onChange={(e) => setNewOwner({ ...newOwner, phone: e.target.value })}
                  maxLength={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="4741234567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña Temporal *</label>
                <input
                  type="password"
                  value={newOwner.password}
                  onChange={(e) => setNewOwner({ ...newOwner, password: e.target.value })}
                  minLength={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-gray-500 mt-1">Mínimo 8 caracteres</p>
              </div>
              <button
                onClick={handleCreateAndLink}
                disabled={loading}
                className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Creando...' : 'Crear y Asignar Dueño'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
