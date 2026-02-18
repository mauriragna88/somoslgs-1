'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface BankDataAlertProps {
  businessId: string
  hasBankData: boolean
}

export default function BankDataAlert({ businessId, hasBankData }: BankDataAlertProps) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [formData, setFormData] = useState({
    bank_name: '',
    bank_account_holder: '',
    bank_account_number: '',
    bank_clabe: '',
  })

  if (hasBankData) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.bank_clabe && formData.bank_clabe.length !== 18) {
      setMessage({ type: 'error', text: 'La CLABE debe tener 18 digitos' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch(`/api/businesses/${businessId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al guardar')
      }

      setMessage({ type: 'success', text: 'Datos bancarios guardados correctamente' })
      setShowForm(false)
      router.refresh()
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mb-6">
      {!showForm ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <h3 className="font-bold text-yellow-800">Configura tus datos bancarios</h3>
              <p className="text-sm text-yellow-700 mt-1">
                Para recibir pagos por transferencia de tus clientes, necesitas registrar tu cuenta bancaria.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-3 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Configurar Ahora
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Datos Bancarios para Recibir Pagos</h3>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              Cancelar
            </button>
          </div>

          {message && (
            <div className={`mb-4 p-3 rounded-lg ${
              message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Banco *
                </label>
                <input
                  type="text"
                  required
                  value={formData.bank_name}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  placeholder="Ej: BBVA, Santander, Banorte"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titular de la Cuenta *
                </label>
                <input
                  type="text"
                  required
                  value={formData.bank_account_holder}
                  onChange={(e) => setFormData({ ...formData, bank_account_holder: e.target.value })}
                  placeholder="Nombre como aparece en el banco"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Numero de Cuenta/Tarjeta
                </label>
                <input
                  type="text"
                  value={formData.bank_account_number}
                  onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })}
                  placeholder="Numero de cuenta o tarjeta"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CLABE Interbancaria *
                </label>
                <input
                  type="text"
                  required
                  value={formData.bank_clabe}
                  onChange={(e) => setFormData({ ...formData, bank_clabe: e.target.value.replace(/\D/g, '').slice(0, 18) })}
                  placeholder="18 digitos"
                  maxLength={18}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                />
                {formData.bank_clabe && formData.bank_clabe.length !== 18 && (
                  <p className="text-xs text-red-500 mt-1">
                    {formData.bank_clabe.length}/18 digitos
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Guardando...' : 'Guardar Datos Bancarios'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
