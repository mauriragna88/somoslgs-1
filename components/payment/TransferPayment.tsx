'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface TransferPaymentProps {
  business: {
    id: string
    name: string
    subscription_tier: string
  }
  amount: number
  bankDetails: {
    name: string
    holder: string
    account: string
    clabe: string
  }
  onBack: () => void
  // Optional: existing transaction awaiting proof
  pendingTransaction?: {
    id: string
    created_at: string
  } | null
}

export default function TransferPayment({ business, amount, bankDetails, onBack, pendingTransaction }: TransferPaymentProps) {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [proofPreview, setProofPreview] = useState('')
  const [notes, setNotes] = useState('')
  const [copied, setCopied] = useState('')
  const [showUploadForm, setShowUploadForm] = useState(!!pendingTransaction)

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopied(field)
    setTimeout(() => setCopied(''), 2000)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
    if (!validTypes.includes(file.type)) {
      setError('Solo se permiten archivos JPG, PNG o PDF')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('El archivo debe ser menor a 5MB')
      return
    }

    setProofFile(file)
    setError('')

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setProofPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setProofPreview('')
    }
  }

  // Save intent to pay (without proof yet)
  const handleSaveIntent = async () => {
    setSaving(true)
    setError('')

    try {
      const response = await fetch('/api/payments/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: business.id,
          amount,
          subscription_tier: business.subscription_tier,
          status: 'awaiting_proof', // Special status for pre-registration
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al registrar')
      }

      // Redirect to dashboard
      router.push('/dashboard/pago?intent=saved')
      router.refresh()
    } catch (err) {
      console.error('Error:', err)
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!proofFile) {
      setError('Debes subir el comprobante de pago')
      return
    }

    setUploading(true)
    setError('')

    try {
      const supabase = createClient()

      // Upload proof to Supabase Storage
      const fileExt = proofFile.name.split('.').pop()
      const fileName = `${business.id}-${Date.now()}.${fileExt}`
      const filePath = `payment-proofs/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('business-images')
        .upload(filePath, proofFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('business-images')
        .getPublicUrl(filePath)

      // Create or update transaction record
      const endpoint = pendingTransaction
        ? `/api/payments/${pendingTransaction.id}/upload-proof`
        : '/api/payments/transfer'

      const response = await fetch(endpoint, {
        method: pendingTransaction ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: business.id,
          amount,
          subscription_tier: business.subscription_tier,
          proof_url: publicUrl,
          proof_notes: notes,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al registrar el pago')
      }

      // Redirect to dashboard with success message
      router.push('/dashboard/pago?success=true')
      router.refresh()
    } catch (err) {
      console.error('Error:', err)
      setError(err instanceof Error ? err.message : 'Error al subir el comprobante')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-dark text-white p-6">
        <button
          onClick={onBack}
          className="text-white hover:text-gray-200 mb-4 flex items-center gap-2 text-sm"
        >
          ← Volver a métodos de pago
        </button>
        <h2 className="text-2xl font-bold">Transferencia Bancaria</h2>
        <p className="text-white/90 mt-1">Realiza la transferencia y sube tu comprobante</p>
      </div>

      <div className="p-6">
        {/* Paso 1: Datos bancarios */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">
              1
            </div>
            <h3 className="text-lg font-bold text-gray-900">Realiza la transferencia</h3>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Banco:</p>
                <p className="font-semibold text-gray-900">{bankDetails.name}</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600">Beneficiario:</p>
                <p className="font-semibold text-gray-900">{bankDetails.holder}</p>
              </div>
              <button
                onClick={() => copyToClipboard(bankDetails.holder, 'holder')}
                className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
              >
                {copied === 'holder' ? '✓ Copiado' : 'Copiar'}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600">CLABE:</p>
                <p className="font-mono font-semibold text-gray-900">{bankDetails.clabe}</p>
              </div>
              <button
                onClick={() => copyToClipboard(bankDetails.clabe, 'clabe')}
                className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
              >
                {copied === 'clabe' ? '✓ Copiado' : 'Copiar'}
              </button>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <p className="text-gray-600">Monto a transferir:</p>
                <p className="text-3xl font-bold text-primary">
                  ${amount.toLocaleString('es-MX')} <span className="text-lg">MXN</span>
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              💡 <strong>Importante:</strong> Realiza la transferencia por exactamente <strong>${amount.toLocaleString('es-MX')} MXN</strong> para facilitar la verificación.
            </p>
          </div>
        </div>

        {/* Paso 2: Opciones */}
        {!showUploadForm ? (
          /* Mostrar opciones: subir ahora o después */
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <h3 className="text-lg font-bold text-gray-900">¿Ya hiciste la transferencia?</h3>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              {/* Opción: Ya hice la transferencia */}
              <button
                type="button"
                onClick={() => setShowUploadForm(true)}
                className="p-6 border-2 border-green-200 bg-green-50 rounded-xl hover:border-green-400 transition-colors text-left"
              >
                <div className="text-4xl mb-3">✅</div>
                <h4 className="font-bold text-gray-900 mb-2">Ya hice la transferencia</h4>
                <p className="text-sm text-gray-600">
                  Tengo mi comprobante listo para subirlo ahora
                </p>
              </button>

              {/* Opción: Haré la transferencia después */}
              <button
                type="button"
                onClick={handleSaveIntent}
                disabled={saving}
                className="p-6 border-2 border-blue-200 bg-blue-50 rounded-xl hover:border-blue-400 transition-colors text-left disabled:opacity-50"
              >
                <div className="text-4xl mb-3">⏰</div>
                <h4 className="font-bold text-gray-900 mb-2">
                  {saving ? 'Guardando...' : 'Haré la transferencia después'}
                </h4>
                <p className="text-sm text-gray-600">
                  Guardar los datos y subir el comprobante en las próximas 24-48 horas
                </p>
              </button>
            </div>

            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Nota:</strong> Tu negocio se activará una vez que verifiquemos tu comprobante de pago.
              </p>
            </div>
          </div>
        ) : (
          /* Formulario para subir comprobante */
          <form onSubmit={handleSubmit}>
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <h3 className="text-lg font-bold text-gray-900">Sube tu comprobante</h3>
              </div>

              {pendingTransaction && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-900">
                    <strong>Pago pre-registrado:</strong> Sube tu comprobante para completar el proceso.
                  </p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
              )}

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                {proofPreview ? (
                  <div className="space-y-4">
                    <img
                      src={proofPreview}
                      alt="Comprobante"
                      className="max-w-full h-auto rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setProofFile(null)
                        setProofPreview('')
                      }}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Eliminar y subir otro
                    </button>
                  </div>
                ) : proofFile ? (
                  <div className="text-center space-y-2">
                    <p className="text-lg">📄 {proofFile.name}</p>
                    <p className="text-sm text-gray-600">
                      {(proofFile.size / 1024).toFixed(1)} KB
                    </p>
                    <button
                      type="button"
                      onClick={() => setProofFile(null)}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Eliminar
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer block text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl">📤</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900 mb-2">
                      Haz click para subir
                    </p>
                    <p className="text-sm text-gray-600 mb-4">
                      o arrastra y suelta tu archivo aquí
                    </p>
                    <p className="text-xs text-gray-500">
                      JPG, PNG o PDF (máx. 5MB)
                    </p>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/jpg,application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas adicionales (opcional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Ej: Transferencia realizada desde cuenta bancomer..."
                  rows={3}
                />
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => pendingTransaction ? onBack() : setShowUploadForm(false)}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                {pendingTransaction ? 'Cancelar' : 'Volver'}
              </button>
              <button
                type="submit"
                disabled={!proofFile || uploading}
                className="flex-1 bg-primary hover:bg-primary-dark text-white py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Enviando...' : 'Enviar Comprobante'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
