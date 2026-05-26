'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { emailSchema } from '@/lib/security'
import { z } from 'zod'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      emailSchema.parse(email)

      const supabase = createClient()
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password/update`,
      })

      if (resetError) {
        throw new Error('Error al enviar el correo. Intenta de nuevo.')
      }

      setSent(true)
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message)
      } else {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      }
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--cream)' }}>
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl p-8 text-center" style={{ boxShadow: 'var(--shadow-card)' }}>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--ink)' }}>Correo enviado</h2>
            <p className="mb-6" style={{ color: 'var(--muted)' }}>
              Si existe una cuenta con <strong>{email}</strong>, recibirás un enlace para restablecer tu contraseña.
            </p>
            <Link
              href="/login"
              className="inline-block px-6 py-2.5 text-white font-semibold rounded-lg transition-colors"
              style={{ background: 'var(--coral)' }}
            >
              Volver al login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--cream)' }}>
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold" style={{ fontFamily: 'var(--display)', color: 'var(--ink)' }}>SomosLagos</h1>
          <p className="mt-2" style={{ color: 'var(--muted)' }}>Recupera tu contraseña</p>
        </div>

        <div className="bg-white rounded-2xl p-8" style={{ boxShadow: 'var(--shadow-card)' }}>
          <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
            Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2" style={{ color: 'var(--ink-soft)' }}>
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl focus:outline-none"
                style={{ border: '1px solid rgba(0,0,0,0.15)', color: 'var(--ink)' }}
                placeholder="tu@email.com"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'var(--coral)' }}
            >
              {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <Link href="/login" className="font-semibold" style={{ color: 'var(--coral)' }}>
              Volver al login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
