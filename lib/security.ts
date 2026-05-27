import { z } from 'zod'

/**
 * UTILIDADES DE SEGURIDAD - SomosLagos
 *
 * Este archivo contiene funciones para proteger la aplicación:
 * - Validación de datos
 * - Sanitización de inputs
 * - Rate limiting
 * - Prevención de XSS, SQL Injection, etc.
 */

// ============================================
// VALIDACIÓN DE DATOS CON ZOD
// ============================================

// Schema para Email
export const emailSchema = z
  .string()
  .min(1, 'El email es requerido')
  .email('Email inválido')
  .max(255, 'Email muy largo')

// Schema para Password
export const passwordSchema = z
  .string()
  .min(12, 'La contraseña debe tener al menos 12 caracteres')
  .max(100, 'Contraseña muy larga')
  .regex(/[a-z]/, 'Debe contener al menos una letra minúscula')
  .regex(/[A-Z]/, 'Debe contener al menos una letra mayúscula')
  .regex(/[0-9]/, 'Debe contener al menos un número')
  .regex(/[^a-zA-Z0-9]/, 'Debe contener al menos un caracter especial')

// Schema para Teléfono (México)
export const phoneSchema = z
  .string()
  .regex(/^[0-9]{10}$/, 'El teléfono debe tener 10 dígitos')

// Schema para Login
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'La contraseña es requerida'),
})

// Schema para Registro
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  fullName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  phone: phoneSchema.optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

// Schema para Negocio
export const businessSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  categoryId: z.string().uuid('Categoría inválida'),
  description: z.string().max(500, 'Descripción muy larga').optional(),
  address: z.string().min(5, 'Dirección muy corta').max(200),
  phone: phoneSchema,
  whatsapp: phoneSchema,
  email: emailSchema.optional(),
})

// Schema para Producto
export const productSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  description: z.string().max(500).optional(),
  price: z.number().min(0, 'El precio no puede ser negativo').max(999999),
  stock: z.number().int().min(0).optional(),
  isAvailable: z.boolean().default(true),
})

// ============================================
// SANITIZACIÓN DE INPUTS
// ============================================

/**
 * Sanitiza texto para prevenir XSS
 * Remueve tags HTML y caracteres peligrosos
 */
export function sanitizeText(text: string): string {
  return text
    .replace(/[<>]/g, '') // Remueve < y >
    .replace(/javascript:/gi, '') // Remueve javascript:
    .replace(/on\w+=/gi, '') // Remueve eventos onclick=, onload=, etc
    .trim()
}

/**
 * Sanitiza texto para uso en filtros PostgREST (.or(), .ilike())
 * Escapa caracteres que pueden romper la sintaxis de filtros
 */
export function sanitizeSearchQuery(text: string): string {
  return text
    .replace(/[\\%_().,'"]/g, '') // Remueve chars especiales de PostgREST/SQL LIKE
    .replace(/\s+/g, ' ')         // Normaliza espacios
    .trim()
    .slice(0, 100)                // Limita largo
}

/**
 * Sanitiza HTML (para descripciones que permiten formato básico)
 * Solo permite tags seguros
 */
export function sanitizeHTML(html: string): string {
  // Lista blanca de tags permitidos
  const allowedTags = ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li']

  // Por ahora, simplemente removemos todos los tags
  // En producción, usar una librería como DOMPurify
  return html.replace(/<[^>]*>/g, '')
}

/**
 * Sanitiza slug para URLs
 */
export function sanitizeSlug(slug: string): string {
  return slug
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remueve acentos
    .replace(/[^a-z0-9-]/g, '-') // Solo letras, números y guiones
    .replace(/-+/g, '-') // Múltiples guiones a uno solo
    .replace(/^-|-$/g, '') // Remueve guiones al inicio/final
}

// ============================================
// RATE LIMITING (Upstash Redis)
// ============================================
/**
 * Production rate limiter using Upstash Redis.
 * Environment variables required:
 *   UPSTASH_REDIS_URL  - Your Upstash Redis REST URL
 *   UPSTASH_REDIS_TOKEN - Your Upstash Redis REST token
 * Add these in Vercel project settings or .env.local
 */

import { Redis } from '@upstash/redis'

// Create Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL || '',
  token: process.env.UPSTASH_REDIS_TOKEN || '',
})

export async function checkRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowSeconds: number = 60
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const key = `rate_limit:${identifier}`

  try {
    const multi = redis.multi()
    multi.incr(key)
    multi.expire(key, windowSeconds)
    const results = await multi.exec()

    const count = results[0] as number
    const ttl = await redis.ttl(key)

    return {
      allowed: count <= maxRequests,
      remaining: Math.max(0, maxRequests - count),
      resetTime: Date.now() + (ttl > 0 ? ttl * 1000 : windowSeconds * 1000),
    }
  } catch (error) {
    // If Redis fails, allow the request (fail open) but log it
    console.error('Rate limit Redis error:', error)
    return {
      allowed: true,
      remaining: maxRequests,
      resetTime: Date.now() + windowSeconds * 1000,
    }
  }
}

/**
 * Obtiene la IP real del request (Vercel/Cloudflare compatible)
 * Prioriza headers confiables sobre x-forwarded-for (spoofable)
 */
export function getClientIP(request: Request): string {
  // x-real-ip es seteado por Vercel/nginx y es más confiable
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp.trim()

  // Fallback a x-forwarded-for (primer IP es la del cliente)
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown'

  return 'unknown'
}

/**
 * Rate limit específico para login (más restrictivo)
 */
export async function checkLoginRateLimit(identifier: string) {
  return checkRateLimit(identifier, 5, 300) // 5 intentos cada 5 minutos
}

/**
 * Rate limit para registro
 */
export async function checkRegisterRateLimit(identifier: string) {
  return checkRateLimit(identifier, 3, 3600) // 3 registros por hora
}

/**
 * Rate limit para crear artículos en marketplace
 */
export async function checkMarketplaceRateLimit(identifier: string) {
  return checkRateLimit(identifier, 10, 3600) // 10 artículos por hora
}

/**
 * Rate limit para uploads
 */
export async function checkUploadRateLimit(identifier: string) {
  return checkRateLimit(identifier, 30, 3600) // 30 uploads por hora
}

/**
 * Rate limit para reportes
 */
export async function checkReportRateLimit(identifier: string) {
  return checkRateLimit(identifier, 10, 3600) // 10 reportes por hora
}


// ============================================
// VALIDACIÓN DE ARCHIVOS (IMÁGENES)
// ============================================

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Verificar tamaño
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'El archivo es muy grande (máx 5MB)' }
  }

  // Verificar tipo
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { valid: false, error: 'Tipo de archivo no permitido (solo JPG, PNG, WEBP)' }
  }

  // Verificar nombre (prevenir directory traversal)
  if (file.name.includes('..') || file.name.includes('/')) {
    return { valid: false, error: 'Nombre de archivo inválido' }
  }

  return { valid: true }
}

// ============================================
// VALIDACIÓN DE PERMISOS
// ============================================

export type UserRole = 'admin' | 'business_owner' | 'customer' | 'delivery'

export function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    admin: 4,
    business_owner: 3,
    delivery: 2,
    customer: 1,
  }

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

// ============================================
// GENERACIÓN DE TOKENS SEGUROS
// ============================================

/**
 * Genera un token aleatorio seguro
 */
export function generateSecureToken(length: number = 32): string {
  if (typeof window !== 'undefined') {
    // En browser
    const array = new Uint8Array(length)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  } else {
    // En Node.js
    const crypto = require('crypto')
    return crypto.randomBytes(length).toString('hex')
  }
}

// ============================================
// LOGGING DE AUDITORÍA
// ============================================

export interface AuditLog {
  userId?: string
  action: string
  resource: string
  resourceId?: string
  details?: Record<string, unknown>
  ip?: string
  userAgent?: string
}

/**
 * Registra una accion en el log de auditoria (Supabase)
 * Fire-and-forget: no bloquea el request si falla
 */
export async function logAudit(log: AuditLog) {
  try {
    // Dynamic import to avoid circular dependencies
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    await supabase.from('audit_logs').insert({
      user_id: log.userId || null,
      action: log.action,
      resource_type: log.resource,
      resource_id: log.resourceId || null,
      details: log.details || {},
      ip_address: log.ip || null,
      user_agent: log.userAgent || null,
    })
  } catch {
    // Silent fail - audit logging should never break the app
    if (process.env.NODE_ENV === 'development') {
      console.error('[AUDIT] Failed to log:', log.action)
    }
  }
}

// ============================================
// PREVENCIÓN DE CSRF (para forms)
// ============================================

/**
 * Genera un token CSRF
 */
export function generateCSRFToken(): string {
  return generateSecureToken(32)
}

/**
 * Verifica un token CSRF
 */
export function verifyCSRFToken(token: string, expectedToken: string): boolean {
  if (!token || !expectedToken) return false
  return token === expectedToken
}

// ============================================
// HELPERS DE ENCRIPTACIÓN
// ============================================

/**
 * Hash de texto (para passwords adicionales, tokens, etc)
 * Nota: Supabase ya hace hash de passwords automáticamente
 */
export async function hashText(text: string): Promise<string> {
  if (typeof window !== 'undefined') {
    // En browser usando Web Crypto API
    const encoder = new TextEncoder()
    const data = encoder.encode(text)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  } else {
    // En Node.js
    const crypto = require('crypto')
    return crypto.createHash('sha256').update(text).digest('hex')
  }
}

/**
 * Compara un texto con su hash
 */
export async function verifyHash(text: string, hash: string): Promise<boolean> {
  const textHash = await hashText(text)
  return textHash === hash
}
