'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface InterestButtonProps {
  listingId: string
  isLoggedIn: boolean
  alreadyInterested: boolean
  interestCount: number
}

export default function InterestButton({
  listingId,
  isLoggedIn,
  alreadyInterested,
  interestCount,
}: InterestButtonProps) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(alreadyInterested)
  const [count, setCount] = useState(interestCount)
  const [sending, setSending] = useState(false)

  const handleClick = () => {
    if (!isLoggedIn) {
      router.push(`/login?redirect=/marketplace/${listingId}`)
      return
    }
    if (submitted) return
    setShowModal(true)
  }

  const handleSubmit = async () => {
    setSending(true)
    try {
      const res = await fetch(`/api/marketplace/${listingId}/interest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.trim() || null }),
      })

      if (res.ok) {
        setSubmitted(true)
        setCount((c) => c + 1)
        setShowModal(false)
      }
    } catch {
      // ignore
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={submitted}
        className={`flex items-center justify-center gap-3 w-full py-4 font-bold rounded-xl transition-colors text-lg ${
          submitted
            ? 'bg-gray-100 text-gray-500 cursor-default'
            : 'bg-green-500 hover:bg-green-600 text-white'
        }`}
      >
        {submitted ? (
          <>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Ya enviaste tu interes
          </>
        ) : (
          <>
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            Me interesa
          </>
        )}
      </button>

      {count > 0 && (
        <p className="text-center text-sm text-gray-500 mt-2">
          {count} persona{count !== 1 ? 's' : ''} interesada{count !== 1 ? 's' : ''}
        </p>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-secondary mb-2">Mostrar interes</h3>
            <p className="text-sm text-gray-600 mb-4">
              El vendedor vera que estas interesado. Puedes agregar un mensaje opcional.
            </p>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ej: Hola, me interesa tu articulo. Esta disponible?"
              maxLength={500}
              rows={3}
              className="w-full px-4 py-3 bg-surface border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none text-sm mb-4"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={sending}
                className="flex-1 py-3 text-sm font-bold text-white bg-green-500 rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                {sending ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
