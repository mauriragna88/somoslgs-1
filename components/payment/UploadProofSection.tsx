'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface UploadProofSectionProps {
  transaction: {
    id: string
    amount: number
    subscription_tier: string
    created_at: string
  }
  business: {
    id: string
    name: string
  }
  bankDetails: {
    name: string
    holder: string
    account: string
    clabe: string
  }
}

export default function UploadProofSection({ transaction, business, bankDetails }: UploadProofSectionProps) {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [proofPreview, setProofPreview] = useState('')
  const [notes, setNotes] = useState('')
  const [copied, setCopied] = useState('')

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopied(field)
    setTimeout(() => setCopied(''), 2000)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
    if (!validTypes.includes(file.type)) {
      setError('Solo se permiten archivos JPG, PNG o PDF')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('El archivo debe ser menor a 5MB')
      return
    }

    setProofFile(file)
    setError('')

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

      const { error: uploadError } = await supabase.storage
        .from('business-images')
        .upload(filePath, proofFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('business-images')
        .getPublicUrl(filePath)

      // Update transaction with proof
      const response = await fetch(`/api/payments/${transaction.id}/upload-proof`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proof_url: publicUrl,
          proof_notes: notes,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al subir el comprobante')
      }

      router.push('/dashboard/pago?success=true')
      router.refresh()
    } catch (err) {
      console.error('Error:', err)
      setError(err instanceof Error ? err.message : 'Error al subir el comprobante')
    } finally {
      setUploading(false)
    }
  }

  // Calculate hours remaining (48 hour window)
  const createdAt = new Date(transaction.created_at)
  const deadline = new Date(createdAt.getTime() + 48 * 60 * 60 * 1000)
  const hoursRemaining = Math.max(0, Math.floor((deadline.getTime() - Date.now()) / (1000 * 60 * 60)))

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6">
        <h2 className="text-2xl font-bold">Sube tu Comprobante de Pago</h2>
        <p className="text-white/90 mt-1">
          Completa tu registro subiendo el comprobante de transferencia
        </p>
      </div>

      <div className="p-6">
        {/* Time remaining alert */}
        <div className={`rounded-lg p-4 mb-6 ${hoursRemaining > 12 ? 'bg-blue-50 border border-blue-200' : 'bg-yellow-50 border border-yellow-200'}`}>
          <p className={`text-sm ${hoursRemaining > 12 ? 'text-blue-800' : 'text-yellow-800'}`}>
            <strong>Tiempo restante:</strong> {hoursRemaining > 0 ? `${hoursRemaining} horas` : 'Expirado'} para subir tu comprobante
          </p>
        </div>

        {/* Bank details reminder */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Datos para la transferencia:</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Banco:</span>
              <span className="font-medium">{bankDetails.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Beneficiario:</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">{bankDetails.holder}</span>
                <button
                  onClick={() => copyToClipboard(bankDetails.holder, 'holder')}
                  className="text-xs px-2 py-1 bg-white border rounded hover:bg-gray-50"
                >
                  {copied === 'holder' ? 'Copiado' : 'Copiar'}
                </button>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">CLABE:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-medium">{bankDetails.clabe}</span>
                <button
                  onClick={() => copyToClipboard(bankDetails.clabe, 'clabe')}
                  className="text-xs px-2 py-1 bg-white border rounded hover:bg-gray-50"
                >
                  {copied === 'clabe' ? 'Copiado' : 'Copiar'}
                </button>
              </div>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span className="text-gray-600">Monto:</span>
              <span className="font-bold text-lg" style={{ color: 'var(--coral)' }}>
                ${transaction.amount.toLocaleString('es-MX')} MXN
              </span>
            </div>
          </div>
        </div>

        {/* Upload form */}
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 mb-4">
            {proofPreview ? (
              <div className="space-y-4">
                <img
                  src={proofPreview}
                  alt="Comprobante"
                  className="max-w-full h-auto rounded-lg max-h-64 mx-auto"
                />
                <button
                  type="button"
                  onClick={() => {
                    setProofFile(null)
                    setProofPreview('')
                  }}
                  className="text-sm text-red-600 hover:text-red-700 block mx-auto"
                >
                  Eliminar y subir otro
                </button>
              </div>
            ) : proofFile ? (
              <div className="text-center space-y-2">
                <p className="text-lg">PDF: {proofFile.name}</p>
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
                  Haz click para subir tu comprobante
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

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas adicionales (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Ej: Transferencia realizada desde cuenta BBVA..."
              rows={3}
            />
          </div>

          <button
            type="submit"
            disabled={!proofFile || uploading}
            className="w-full text-white py-4 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed" style={{ background: 'var(--coral)' }}
          >
            {uploading ? 'Enviando...' : 'Enviar Comprobante'}
          </button>
        </form>
      </div>
    </div>
  )
}
