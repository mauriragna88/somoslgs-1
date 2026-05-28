'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { createClient } from '@/lib/supabase/client'
import type { BlogPost } from '@/types/database.types'

const BLOG_CATEGORIES = [
  { value: 'guias-locales', label: 'Guias Locales' },
  { value: 'tips', label: 'Tips' },
  { value: 'noticias', label: 'Noticias' },
  { value: 'negocios-destacados', label: 'Negocios Destacados' },
  { value: 'general', label: 'General' },
]

interface BlogPostFormProps {
  post: BlogPost | null
  onSaved: (post: BlogPost) => void
  onCancel: () => void
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 220)
}

const TOOLBAR_ACTIONS = [
  { label: 'H2', prefix: '## ', suffix: '', title: 'Título de sección' },
  { label: 'H3', prefix: '### ', suffix: '', title: 'Subtítulo' },
  { label: 'B', prefix: '**', suffix: '**', title: 'Negrita', className: 'font-bold' },
  { label: 'I', prefix: '_', suffix: '_', title: 'Cursiva', className: 'italic' },
  { label: '🔗', prefix: '[texto](', suffix: 'https://)', title: 'Enlace' },
  { label: '• Lista', prefix: '\n- ', suffix: '', title: 'Lista con viñetas' },
  { label: '1. Lista', prefix: '\n1. ', suffix: '', title: 'Lista numerada' },
  { label: '❝', prefix: '\n> ', suffix: '', title: 'Cita' },
]

export default function BlogPostForm({ post, onSaved, onCancel }: BlogPostFormProps) {
  const [title, setTitle] = useState(post?.title || '')
  const [slug, setSlug] = useState(post?.slug || '')
  const [excerpt, setExcerpt] = useState(post?.excerpt || '')
  const [content, setContent] = useState(post?.content || '')
  const [featuredImageUrl, setFeaturedImageUrl] = useState(post?.featured_image_url || '')
  const [category, setCategory] = useState(post?.category || 'guias-locales')
  const [status, setStatus] = useState<'draft' | 'published'>(post?.status || 'draft')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const applyFormat = (prefix: string, suffix: string) => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = content.slice(start, end)
    const replacement = prefix + (selected || 'texto') + suffix
    const next = content.slice(0, start) + replacement + content.slice(end)
    setContent(next)
    setTimeout(() => {
      ta.focus()
      const cursor = start + prefix.length + (selected || 'texto').length
      ta.setSelectionRange(cursor, cursor)
    }, 0)
  }

  const handleTitleChange = (value: string) => {
    setTitle(value)
    if (!post) {
      setSlug(slugify(value))
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten imagenes')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no debe superar 5MB')
      return
    }

    setUploading(true)
    setPreviewUrl(URL.createObjectURL(file))

    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const fileName = `blog/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('business-images')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('business-images')
        .getPublicUrl(fileName)

      setFeaturedImageUrl(publicUrl)
      toast.success('Imagen subida')
    } catch (err: any) {
      toast.error('Error al subir imagen: ' + err.message)
      setPreviewUrl('')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !slug.trim() || !content.trim()) {
      toast.error('Titulo, slug y contenido son requeridos')
      return
    }

    setSaving(true)

    try {
      const url = post ? `/api/admin/blog/${post.id}` : '/api/admin/blog'
      const method = post ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          slug: slug.trim(),
          excerpt: excerpt.trim() || null,
          content: content.trim(),
          featured_image_url: featuredImageUrl || null,
          category,
          status,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al guardar')
      }

      const saved = await res.json()
      toast.success(post ? 'Post actualizado' : 'Post creado')
      onSaved(saved)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const displayImage = previewUrl || featuredImageUrl

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Titulo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Titulo *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          maxLength={200}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[rgba(255,107,53,0.2)] focus:border-[#FF6B35]"
          placeholder="Los 5 mejores tacos en Lagos de Moreno"
        />
        <p className="text-xs text-gray-400 mt-1">{title.length}/200</p>
      </div>

      {/* Slug */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Slug (URL) *</label>
        <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
          <span>/blog/</span>
          <span className="text-[#FF6B35]">{slug || '...'}</span>
        </div>
        <input
          type="text"
          value={slug}
          onChange={(e) => setSlug(slugify(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[rgba(255,107,53,0.2)] focus:border-[#FF6B35]"
        />
      </div>

      {/* Extracto */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Extracto</label>
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          maxLength={300}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[rgba(255,107,53,0.2)] focus:border-[#FF6B35] resize-none"
          placeholder="Resumen corto del articulo..."
        />
        <p className="text-xs text-gray-400 mt-1">{excerpt.length}/300</p>
      </div>

      {/* Imagen destacada */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Imagen destacada</label>
        {displayImage && (
          <div className="relative w-full h-40 rounded-lg overflow-hidden mb-2 bg-gray-100">
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <Image src={featuredImageUrl} alt="Imagen" fill sizes="600px" className="object-cover" />
            )}
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={handleUpload}
          disabled={uploading}
          className="text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-[rgba(255,107,53,0.1)] file:text-[#FF6B35] file:font-medium file:text-sm hover:file:bg-[rgba(255,107,53,0.2)]"
        />
        {uploading && <p className="text-xs text-[#FF6B35] mt-1">Subiendo imagen...</p>}
      </div>

      {/* Categoria */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[rgba(255,107,53,0.2)] focus:border-[#FF6B35]"
        >
          {BLOG_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Contenido */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-gray-700">Contenido (Markdown) *</label>
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="text-xs text-[#FF6B35] hover:text-[#E2541F] font-medium"
          >
            {showPreview ? 'Editar' : 'Vista previa'}
          </button>
        </div>

        {!showPreview && (
          <div className="flex flex-wrap gap-1 mb-1 p-1.5 border border-gray-200 rounded-t-lg bg-gray-50">
            {TOOLBAR_ACTIONS.map((action) => (
              <button
                key={action.label}
                type="button"
                title={action.title}
                onClick={() => applyFormat(action.prefix, action.suffix)}
                className={`px-2.5 py-1 text-xs border border-gray-200 rounded bg-white hover:bg-[rgba(255,107,53,0.06)] hover:border-[rgba(255,107,53,0.3)] text-gray-700 transition-colors ${action.className || ''}`}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}

        {showPreview ? (
          <div className="w-full min-h-[300px] px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 prose prose-sm max-w-none overflow-auto">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={14}
            className="w-full px-3 py-2 border border-gray-300 rounded-b-lg text-sm font-mono focus:ring-2 focus:ring-[rgba(255,107,53,0.2)] focus:border-[#FF6B35] resize-y"
            placeholder="Escribe tu articulo en Markdown..."
          />
        )}
      </div>

      {/* Status */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="status"
              value="draft"
              checked={status === 'draft'}
              onChange={() => setStatus('draft')}
              className="text-[#FF6B35] focus:ring-[#FF6B35]"
            />
            Borrador
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="status"
              value="published"
              checked={status === 'published'}
              onChange={() => setStatus('published')}
              className="text-[#FF6B35] focus:ring-[#FF6B35]"
            />
            Publicado
          </label>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving || uploading}
          className="flex-1 py-2.5 bg-[#FF6B35] hover:bg-[#E2541F] text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
        >
          {saving ? 'Guardando...' : post ? 'Actualizar' : 'Crear Post'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 text-sm"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}

