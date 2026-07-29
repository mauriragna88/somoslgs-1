'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ClaimBusinessButtonProps {
  businessId: string
  businessName: string
  isClaimed: boolean
}

export default function ClaimBusinessButton({
  businessId,
  businessName,
  isClaimed,
}: ClaimBusinessButtonProps) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')

  // No mostrar si ya está reclamado
  if (isClaimed) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      // Crear solicitud de reclamación via API
      const res = await fetch(`/api/businesses/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          businessName,
          phone,
          email,
        }),
      })

      if (res.ok) {
        setSubmitted(true)
      } else {
        const data = await res.json().catch(() => ({}))
        alert(data.error || 'Error al enviar solicitud. Intenta de nuevo.')
      }
    } catch {
      alert('Error de conexión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Botón flotante — solo si no está reclamado */}
      <button
        onClick={() => setShowModal(true)}
        className="w-full mt-4 flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02]"
        style={{
          background: 'rgba(245, 185, 66, 0.12)',
          color: 'var(--gold)',
          border: '1px solid rgba(245, 185, 66, 0.3)',
        }}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        ¿Este negocio es tuyo? Reclamalo gratis
      </button>

      {/* Modal de reclamación */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {submitted ? (
              /* Estado: solicitud enviada */
              <div className="text-center py-8">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'rgba(34, 197, 94, 0.12)' }}
                >
                  <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--ink)' }}>
                  ¡Solicitud enviada!
                </h3>
                <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
                  Recibimos tu solicitud para reclamar <strong>{businessName}</strong>.
                  Te contactaremos pronto para verificar la propiedad.
                </p>
                <p className="text-sm mb-6 p-3 rounded-xl" style={{ background: 'rgba(245, 185, 66, 0.08)', color: 'var(--ink-soft)' }}>
                  Ya reclamaste tu negocio. Encontramos algunas oportunidades para
                  mejorar tu presencia digital. Solicita un diagnostico gratuito
                  con <strong>DEVOGATEC</strong>.
                </p>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 rounded-full font-semibold text-sm text-white"
                  style={{ background: 'var(--coral)' }}
                >
                  Entendido
                </button>
              </div>
            ) : (
              /* Estado: formulario */
              <>
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--ink)' }}>
                      Reclamar negocio
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>
                      Verifica que eres el dueño de <strong>{businessName}</strong>
                    </p>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ink)' }}>
                      Telefono
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="474 123 4567"
                      className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2"
                      style={{
                        borderColor: 'var(--hairline)',
                        color: 'var(--ink)',
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ink)' }}>
                      Correo (opcional)
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@correo.com"
                      className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2"
                      style={{
                        borderColor: 'var(--hairline)',
                        color: 'var(--ink)',
                      }}
                    />
                  </div>

                  <div className="p-3 rounded-xl text-xs" style={{ background: 'rgba(245, 185, 66, 0.06)', color: 'var(--ink-soft)' }}>
                    <strong>Proceso:</strong>
                    <ol className="mt-1 space-y-0.5 list-decimal list-inside">
                      <li>Proporcionas telefono o correo</li>
                      <li>SomosLagos solicita comprobacion sencilla</li>
                      <li>Admin aprueba la propiedad</li>
                      <li>Creas tu contrasena y administras tu negocio</li>
                    </ol>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-all hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: 'var(--coral)' }}
                  >
                    {loading ? 'Enviando...' : 'Enviar solicitud'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
