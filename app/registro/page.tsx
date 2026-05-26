'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { registerSchema } from '@/lib/security'
import { z } from 'zod'

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const ref = searchParams.get('ref')

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
  })
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleGoogleRegister = async () => {
    setError('')
    setGoogleLoading(true)

    try {
      const supabase = createClient()
      const redirectTo = `${window.location.origin}/auth/callback${ref ? `?next=/${ref === 'registrar-negocio' ? 'registrar-negocio' : ''}` : ''}`

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (oauthError) {
        throw new Error('Error al conectar con Google')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrarse con Google')
      setGoogleLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validar datos con Zod (incluye validación de password fuerte)
      const validatedData = registerSchema.parse(formData)

      // Llamar a la API para crear el usuario
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: validatedData.email,
          password: validatedData.password,
          fullName: validatedData.fullName,
          phone: validatedData.phone || '',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear usuario')
      }

      // Ahora hacer login automático
      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: validatedData.email,
        password: validatedData.password,
      })

      if (signInError) {
        // Usuario creado pero no pudo hacer login - redirigir a login
        router.push('/login?registered=true')
        return
      }

      // Redirigir según de dónde vino
      if (ref === 'registrar-negocio') {
        router.push('/registrar-negocio')
      } else {
        router.push('/?registered=true')
      }
      router.refresh()
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Error al registrarse')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const inputStyle = {
    borderColor: 'var(--hairline)',
  }

  const inputFocusHandlers = {
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => {
      e.target.style.borderColor = 'var(--coral)'
      e.target.style.boxShadow = '0 0 0 1px var(--coral)'
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
      e.target.style.borderColor = 'var(--hairline)'
      e.target.style.boxShadow = 'none'
    },
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: 'var(--ivory)' }}>
      <div className="max-w-md w-full">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold" style={{ color: 'var(--ink)' }}>
            Somos<span style={{ color: 'var(--coral)' }}>Lagos</span>
          </h1>
          <p className="mt-2" style={{ color: 'var(--muted)' }}>
            {ref === 'registrar-negocio'
              ? 'Crea tu cuenta para registrar tu negocio'
              : 'Crea tu cuenta gratis'}
          </p>
          {ref === 'registrar-negocio' && (
            <div
              className="mt-4 rounded-[var(--r-md)] p-3"
              style={{ backgroundColor: 'color-mix(in srgb, var(--coral) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--coral) 20%, transparent)' }}
            >
              <p className="text-sm font-semibold" style={{ color: 'var(--coral-deep)' }}>
                Después de crear tu cuenta, continuarás con el registro de tu negocio
              </p>
            </div>
          )}
        </div>

        {/* Card de Registro */}
        <div
          className="bg-white rounded-[var(--r-xl)] p-8"
          style={{ boxShadow: 'var(--shadow-card)' }}
        >
          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-5">
              {error}
            </div>
          )}

          {/* Google Register - opcion rapida */}
          <button
            type="button"
            onClick={handleGoogleRegister}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border rounded-[var(--r-md)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ borderColor: 'var(--hairline)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--hairline-soft)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent' }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span className="font-medium" style={{ color: 'var(--ink)' }}>
              {googleLoading ? 'Conectando...' : 'Registrarse con Google'}
            </span>
          </button>

          {/* Divider */}
          <div className="my-5 flex items-center gap-4">
            <div className="flex-1 h-px" style={{ backgroundColor: 'var(--hairline)' }}></div>
            <span className="text-sm" style={{ color: 'var(--muted)' }}>o con email</span>
            <div className="flex-1 h-px" style={{ backgroundColor: 'var(--hairline)' }}></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nombre completo */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium mb-2" style={{ color: 'var(--ink)' }}>
                Nombre completo *
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border rounded-[var(--r-md)] focus:outline-none transition-colors"
                style={inputStyle}
                {...inputFocusHandlers}
                placeholder="Juan Pérez"
                required
                disabled={loading}
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2" style={{ color: 'var(--ink)' }}>
                Email *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border rounded-[var(--r-md)] focus:outline-none transition-colors"
                style={inputStyle}
                {...inputFocusHandlers}
                placeholder="tu@email.com"
                required
                disabled={loading}
              />
            </div>

            {/* Teléfono */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium mb-2" style={{ color: 'var(--ink)' }}>
                Teléfono (10 dígitos)
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border rounded-[var(--r-md)] focus:outline-none transition-colors"
                style={inputStyle}
                {...inputFocusHandlers}
                placeholder="4741234567"
                maxLength={10}
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2" style={{ color: 'var(--ink)' }}>
                Contraseña *
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border rounded-[var(--r-md)] focus:outline-none transition-colors"
                style={inputStyle}
                {...inputFocusHandlers}
                placeholder="••••••••"
                required
                disabled={loading}
              />
              <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
                Mínimo 12 caracteres, debe incluir mayúsculas, minúsculas, números y símbolos
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2" style={{ color: 'var(--ink)' }}>
                Confirmar contraseña *
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border rounded-[var(--r-md)] focus:outline-none transition-colors"
                style={inputStyle}
                {...inputFocusHandlers}
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>

            {/* Legal checkbox */}
            <div className="flex items-start gap-3">
              <input
                id="acceptTerms"
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 focus:ring-1"
                style={{ accentColor: 'var(--coral)' }}
                disabled={loading}
              />
              <label htmlFor="acceptTerms" className="text-sm" style={{ color: 'var(--muted)' }}>
                He leido y acepto el{' '}
                <Link href="/aviso-de-privacidad" target="_blank" className="font-medium underline hover:opacity-80" style={{ color: 'var(--coral)' }}>
                  Aviso de Privacidad
                </Link>{' '}
                y los{' '}
                <Link href="/terminos" target="_blank" className="font-medium underline hover:opacity-80" style={{ color: 'var(--coral)' }}>
                  Terminos y Condiciones
                </Link>
              </label>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading || !acceptedTerms}
              className="w-full rounded-full text-white font-semibold py-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: 'var(--coral)' }}
              onMouseEnter={(e) => { if (!loading && acceptedTerms) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--coral-deep)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--coral)' }}
            >
              {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6 text-center text-sm" style={{ color: 'var(--muted)' }}>
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="font-semibold hover:underline" style={{ color: 'var(--coral)' }}>
              Inicia sesión
            </Link>
          </div>
        </div>

        {/* Back to home */}
        <div className="text-center mt-6">
          <Link href="/" className="text-sm hover:underline" style={{ color: 'var(--muted)' }}>
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--ivory)' }}>
        <div className="animate-pulse" style={{ color: 'var(--muted)' }}>Cargando...</div>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  )
}
