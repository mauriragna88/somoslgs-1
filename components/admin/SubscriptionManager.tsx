'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Business {
  id: string
  name: string
  subscription_tier: string
  subscription_status: string
  subscription_expires_at: string | null
  whatsapp?: string
  phone?: string
  owner?: {
    full_name: string
    email: string
    phone: string | null
  } | null
}

interface SubscriptionManagerProps {
  business: Business
  onClose: () => void
}

interface HistoryEntry {
  id: string
  action: string
  previous_tier: string | null
  new_tier: string | null
  previous_status: string | null
  new_status: string | null
  days_added: number | null
  notes: string | null
  created_at: string
  admin?: { full_name: string } | { full_name: string }[] | null
}

const tierOptions = [
  { value: 'gratis', label: 'Gratis', price: '$0', features: ['Listado en directorio', 'Perfil básico', 'WhatsApp de contacto', 'Hasta 5 fotos'] },
  { value: 'pro', label: 'Pro', price: '$100/mes', features: ['Todo de Gratis', 'Catálogo de productos', 'Pedidos online', 'Pagos transferencia y tarjeta'] },
  { value: 'avanzado', label: 'Avanzado', price: '$180/mes', features: ['Todo de Pro', 'Destacado en búsquedas', 'Estadísticas avanzadas', 'Badge verificado'] },
]

const daysOptions = [
  { value: 7, label: '7 días' },
  { value: 15, label: '15 días' },
  { value: 30, label: '30 días' },
  { value: 60, label: '60 días' },
  { value: 90, label: '90 días' },
  { value: 180, label: '180 días' },
  { value: 365, label: '1 año' },
]

const actionLabels: Record<string, string> = {
  add_days: 'Días agregados',
  change_tier: 'Cambio de plan',
  suspend: 'Suspensión',
  activate: 'Activación',
  pause: 'Pausa',
  resume: 'Reanudación',
  set_expiration: 'Fecha modificada',
}

export default function SubscriptionManager({ business, onClose }: SubscriptionManagerProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'days' | 'tier' | 'status' | 'history'>('days')
  const [selectedDays, setSelectedDays] = useState(30)
  const [selectedTier, setSelectedTier] = useState(business.subscription_tier)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [notes, setNotes] = useState('')
  const [customExpiration, setCustomExpiration] = useState('')
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory()
    }
  }, [activeTab])

  const loadHistory = async () => {
    setLoadingHistory(true)
    try {
      const response = await fetch(`/api/admin/businesses/${business.id}/subscription-history`)
      if (response.ok) {
        const data = await response.json()
        setHistory(data.history || [])
      }
    } catch {
      // Ignore
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleAction = async (action: string, data?: Record<string, any>) => {
    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: business.id,
          action,
          notes: notes || undefined,
          ...data,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al actualizar')
      }

      setMessage({ type: 'success', text: result.message })
      setNotes('')
      router.refresh()

      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  const getDaysRemaining = () => {
    if (!business.subscription_expires_at) return null
    const now = new Date()
    const expires = new Date(business.subscription_expires_at)
    const diff = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  const daysRemaining = getDaysRemaining()

  const statusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Activo'
      case 'suspended': return 'Suspendido'
      case 'paused': return 'Pausado'
      default: return status
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Gestionar Suscripción</h2>
            <p className="text-sm text-gray-600">{business.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Current Status */}
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-gray-500 uppercase">Plan Actual</p>
              <p className="font-bold text-primary capitalize">{business.subscription_tier}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Estado</p>
              <p className={`font-bold ${business.subscription_status === 'active' ? 'text-green-600' : business.subscription_status === 'paused' ? 'text-yellow-600' : 'text-red-600'}`}>
                {statusLabel(business.subscription_status)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Días Restantes</p>
              <p className={`font-bold ${daysRemaining && daysRemaining <= 7 ? 'text-red-600' : 'text-gray-900'}`}>
                {daysRemaining !== null ? (daysRemaining < 0 ? `Expiró hace ${Math.abs(daysRemaining)}d` : `${daysRemaining}d`) : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`p-3 ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('days')}
            className={`flex-1 py-3 text-sm font-medium ${activeTab === 'days' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
          >
            Días
          </button>
          <button
            onClick={() => setActiveTab('tier')}
            className={`flex-1 py-3 text-sm font-medium ${activeTab === 'tier' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
          >
            Plan
          </button>
          <button
            onClick={() => setActiveTab('status')}
            className={`flex-1 py-3 text-sm font-medium ${activeTab === 'status' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
          >
            Estado
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3 text-sm font-medium ${activeTab === 'history' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
          >
            Historial
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4">
          {activeTab === 'days' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Selecciona la cantidad de días a agregar a la suscripción:
              </p>
              <div className="grid grid-cols-3 gap-2">
                {daysOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedDays(option.value)}
                    className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                      selectedDays === option.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  placeholder="Motivo del cambio..."
                />
              </div>
              <button
                onClick={() => handleAction('add_days', { days: selectedDays })}
                disabled={loading}
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Procesando...' : `Regalar ${selectedDays} días`}
              </button>
            </div>
          )}

          {activeTab === 'tier' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Selecciona el nuevo plan para este negocio:
              </p>
              <div className="space-y-2">
                {tierOptions.map((tier) => (
                  <button
                    key={tier.value}
                    onClick={() => setSelectedTier(tier.value)}
                    className={`w-full p-3 rounded-lg border text-left transition-colors ${
                      selectedTier === tier.value
                        ? 'border-primary bg-primary/10'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold">{tier.label}</span>
                      <span className="text-sm text-gray-500">{tier.price}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {tier.features.join(' • ')}
                    </p>
                  </button>
                ))}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  placeholder="Motivo del cambio..."
                />
              </div>
              <button
                onClick={() => handleAction('change_tier', { tier: selectedTier })}
                disabled={loading || selectedTier === business.subscription_tier}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Procesando...' : `Cambiar a ${selectedTier}`}
              </button>
            </div>
          )}

          {activeTab === 'status' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Gestiona el estado de la suscripción:
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleAction('activate')}
                  disabled={loading || business.subscription_status === 'active'}
                  className="py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
                >
                  Activar
                </button>
                <button
                  onClick={() => handleAction('suspend')}
                  disabled={loading || business.subscription_status === 'suspended'}
                  className="py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
                >
                  Suspender
                </button>
                <button
                  onClick={() => handleAction('pause')}
                  disabled={loading || business.subscription_status === 'paused'}
                  className="py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
                >
                  Pausar
                </button>
                <button
                  onClick={() => handleAction('resume')}
                  disabled={loading || business.subscription_status === 'active'}
                  className="py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
                >
                  Reanudar
                </button>
              </div>

              {/* Custom expiration date */}
              <div className="border-t border-gray-200 pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de expiración personalizada
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={customExpiration}
                    onChange={(e) => setCustomExpiration(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  />
                  <button
                    onClick={() => handleAction('set_expiration', { expiration_date: customExpiration })}
                    disabled={loading || !customExpiration}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 text-sm"
                  >
                    Aplicar
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  placeholder="Motivo del cambio..."
                />
              </div>

              <div className="p-3 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Nota:</strong> Suspender o pausar ocultará el negocio del directorio público.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-3">
              {loadingHistory ? (
                <div className="text-center py-8 text-gray-500">Cargando historial...</div>
              ) : history.length > 0 ? (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {history.map((entry) => {
                    const adminName = Array.isArray(entry.admin)
                      ? entry.admin[0]?.full_name
                      : entry.admin?.full_name
                    return (
                      <div key={entry.id} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold text-gray-900">
                            {actionLabels[entry.action] || entry.action}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(entry.created_at).toLocaleDateString('es-MX', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 space-y-0.5">
                          {entry.previous_tier !== entry.new_tier && entry.new_tier && (
                            <p>Plan: {entry.previous_tier} → <strong>{entry.new_tier}</strong></p>
                          )}
                          {entry.previous_status !== entry.new_status && entry.new_status && (
                            <p>Estado: {entry.previous_status} → <strong>{entry.new_status}</strong></p>
                          )}
                          {entry.days_added && (
                            <p>+{entry.days_added} días</p>
                          )}
                          {entry.notes && (
                            <p className="italic text-gray-500">&ldquo;{entry.notes}&rdquo;</p>
                          )}
                          {adminName && (
                            <p className="text-gray-400">Por: {adminName}</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-lg mb-1">Sin historial</p>
                  <p className="text-sm">Los cambios futuros aparecerán aquí</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick WhatsApp */}
        {(business.whatsapp || business.owner?.phone) && (
          <div className="p-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 uppercase mb-2">Contacto Rápido</p>
            <a
              href={`https://wa.me/52${business.whatsapp || business.owner?.phone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              WhatsApp
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
