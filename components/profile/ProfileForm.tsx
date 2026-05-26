'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { passwordSchema } from '@/lib/security'
import { z } from 'zod'

interface ProfileFormProps {
  profile: {
    id: string
    full_name: string
    email: string
    phone: string | null
    role: string
    created_at: string
  }
  completa?: boolean
  nextUrl?: string
}

export default function ProfileForm({ profile, completa, nextUrl }: ProfileFormProps) {
  const router = useRouter()
  const [fullName, setFullName] = useState(profile.full_name)
  const [phone, setPhone] = useState(profile.phone || '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')

    try {
      if (fullName.trim().length < 2) {
        throw new Error('El nombre debe tener al menos 2 caracteres')
      }

      if (completa && !phone) {
        throw new Error('El telefono es necesario para recibir notificaciones por WhatsApp')
      }

      if (phone && !/^\d{10}$/.test(phone)) {
        throw new Error('El telefono debe tener 10 digitos')
      }

      const supabase = createClient()
      const { error: updateError } = await (supabase
        .from('profiles') as any)
        .update({
          full_name: fullName.trim(),
          phone: phone || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id)

      if (updateError) {
        throw new Error('Error al guardar los cambios')
      }

      // If completing profile after Google login, redirect to next page
      if (completa && phone) {
        setMessage('Perfil completado. Redirigiendo...')
        router.push(nextUrl || '/')
        router.refresh()
        return
      }

      setMessage('Perfil actualizado correctamente')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordSaving(true)
    setPasswordMessage('')
    setPasswordError('')

    try {
      if (!currentPassword) {
        throw new Error('Ingresa tu contrasena actual')
      }

      if (newPassword !== confirmPassword) {
        throw new Error('Las contrasenas no coinciden')
      }

      // Validate password strength
      passwordSchema.parse(newPassword)

      const supabase = createClient()

      // Verify current password first
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: currentPassword,
      })

      if (signInError) {
        throw new Error('Contrasena actual incorrecta')
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (updateError) {
        throw new Error(updateError.message)
      }

      setPasswordMessage('Contrasena actualizada correctamente')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      if (err instanceof z.ZodError) {
        setPasswordError(err.errors[0].message)
      } else {
        setPasswordError(err instanceof Error ? err.message : 'Error desconocido')
      }
    } finally {
      setPasswordSaving(false)
    }
  }

  const roleLabels: Record<string, string> = {
    admin: 'Administrador',
    business_owner: 'Dueno de negocio',
    customer: 'Cliente',
    delivery: 'Repartidor',
  }

  const memberSince = new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'long',
  }).format(new Date(profile.created_at))

  return (
    <div className="space-y-6">
      {/* Complete profile banner for Google OAuth users */}
      {completa && !profile.phone && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">📱</span>
            <div>
              <h3 className="font-bold text-amber-800 text-lg">Completa tu perfil</h3>
              <p className="text-amber-700 text-sm mt-1">
                Para recibir notificaciones y promociones por WhatsApp, agrega tu numero de telefono.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Profile Info Card */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--ink)' }}>Informacion personal</h2>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          {message && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              {message}
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre completo
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] transition-all"
              required
              disabled={saving}
            />
          </div>

          {/* Email (read-only) */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={profile.email}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              disabled
            />
            <p className="text-xs text-gray-400 mt-1">El email no se puede cambiar</p>
          </div>

          {/* Phone */}
          <div className={completa && !profile.phone ? 'bg-amber-50 border-2 border-amber-300 rounded-lg p-3 -mx-1' : ''}>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Telefono (10 digitos) {completa && !profile.phone && <span className="text-amber-600 font-semibold">*</span>}
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] transition-all"
              placeholder="4741234567"
              maxLength={10}
              disabled={saving}
              autoFocus={completa && !profile.phone}
            />
          </div>

          {/* Role + Member Since (read-only) */}
          <div className="flex items-center gap-4 pt-2">
            <span className="px-3 py-1 text-sm font-medium rounded-full" style={{ background: 'rgba(255,107,53,0.1)', color: 'var(--coral)' }}>
              {roleLabels[profile.role] || profile.role}
            </span>
            <span className="text-sm text-gray-500">
              Miembro desde {memberSince}
            </span>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-6 py-2.5 text-white font-semibold rounded-lg transition-colors disabled:opacity-50" style={{ background: 'var(--coral)' }}
          >
            {saving ? 'Guardando...' : completa && !profile.phone ? 'Guardar y continuar' : 'Guardar cambios'}
          </button>
        </form>
      </div>

      {/* Change Password Card */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--ink)' }}>Cambiar contrasena</h2>

        <form onSubmit={handleChangePassword} className="space-y-4">
          {passwordMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              {passwordMessage}
            </div>
          )}
          {passwordError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {passwordError}
            </div>
          )}

          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Contrasena actual
            </label>
            <input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] transition-all"
              placeholder="••••••••"
              required
              disabled={passwordSaving}
            />
          </div>

          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Nueva contrasena
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] transition-all"
              placeholder="••••••••"
              required
              disabled={passwordSaving}
            />
            <p className="text-xs text-gray-400 mt-1">
              Minimo 8 caracteres, mayusculas, minusculas, numeros y simbolos
            </p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar contrasena
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] transition-all"
              placeholder="••••••••"
              required
              disabled={passwordSaving}
            />
          </div>

          <button
            type="submit"
            disabled={passwordSaving}
            className="w-full sm:w-auto px-6 py-2.5 bg-[#1F2937] hover:bg-gray-800 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {passwordSaving ? 'Actualizando...' : 'Cambiar contrasena'}
          </button>
        </form>
      </div>
    </div>
  )
}
