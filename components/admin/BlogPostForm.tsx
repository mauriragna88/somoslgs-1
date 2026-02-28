'use client'

import { useState } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
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
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
          placeholder="Los 5 mejores tacos en Lagos de Moreno"
        />
        <p className="text-xs text-gray-400 mt-1">{title.length}/200</p>
      </div>

      {/* Slug */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Slug (URL) *</label>
        <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
          <span>/blog/</span>
          <span className="text-primary">{slug || '...'}</span>
        </div>
        <input
          type="text"
          value={slug}
          onChange={(e) => setSlug(slugify(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
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
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
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
          className="text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-primary/10 file:text-primary file:font-medium file:text-sm hover:file:bg-primary/20"
        />
        {uploading && <p className="text-xs text-primary mt-1">Subiendo imagen...</p>}
      </div>

      {/* Categoria */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
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
            className="text-xs text-primary hover:text-primary-dark font-medium"
          >
            {showPreview ? 'Editar' : 'Vista previa'}
          </button>
        </div>
        {showPreview ? (
          <div className="w-full min-h-[200px] px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 prose prose-sm max-w-none">
            <div dangerouslySetInnerHTML={{ __html: simpleMarkdown(content) }} />
          </div>
        ) : (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={12}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y"
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
              className="text-primary focus:ring-primary"
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
              className="text-primary focus:ring-primary"
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
          className="flex-1 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
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

// Simple markdown to HTML for preview (basic)
function simpleMarkdown(md: string): string {
  return md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br />')
}
