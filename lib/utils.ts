import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, '') // Trim - from end of text
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.slice(0, length) + '...'
}

/**
 * Calcula los días restantes hasta una fecha de expiración
 * @returns número de días (negativo si ya expiró), o null si no hay fecha
 */
export function getDaysRemaining(expiresAt: string | Date | null | undefined): number | null {
  if (!expiresAt) return null

  const now = new Date()
  const expDate = new Date(expiresAt)
  const diffTime = expDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays
}

/**
 * Formatea los días restantes para mostrar al usuario
 */
export function formatDaysRemaining(expiresAt: string | Date | null | undefined): {
  text: string
  color: string
  urgent: boolean
} {
  const days = getDaysRemaining(expiresAt)

  if (days === null) {
    return { text: 'Sin fecha', color: 'text-gray-500', urgent: false }
  }

  if (days < 0) {
    return { text: `Expiró hace ${Math.abs(days)} días`, color: 'text-red-600', urgent: true }
  }

  if (days === 0) {
    return { text: 'Expira hoy', color: 'text-red-600', urgent: true }
  }

  if (days === 1) {
    return { text: 'Expira mañana', color: 'text-orange-600', urgent: true }
  }

  if (days <= 7) {
    return { text: `${days} días restantes`, color: 'text-orange-600', urgent: true }
  }

  if (days <= 30) {
    return { text: `${days} días restantes`, color: 'text-yellow-600', urgent: false }
  }

  return { text: `${days} días restantes`, color: 'text-green-600', urgent: false }
}
