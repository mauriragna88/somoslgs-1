'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import type { BlogPost } from '@/types/database.types'
import BlogPostForm from './BlogPostForm'

const CATEGORY_LABELS: Record<string, string> = {
  'general': 'General',
  'guias-locales': 'Guias Locales',
  'tips': 'Tips',
  'noticias': 'Noticias',
  'negocios-destacados': 'Negocios Destacados',
}

interface BlogPostsTableProps {
  initialPosts: BlogPost[]
}

export default function BlogPostsTable({ initialPosts }: BlogPostsTableProps) {
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts)
  const [showForm, setShowForm] = useState(false)
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null)

  const handleToggleStatus = async (post: BlogPost) => {
    const newStatus = post.status === 'published' ? 'draft' : 'published'
    try {
      const res = await fetch(`/api/admin/blog/${post.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error('Error al actualizar')
      const updated = await res.json()
      setPosts(prev => prev.map(p => p.id === post.id ? updated : p))
      toast.success(newStatus === 'published' ? 'Post publicado' : 'Post despublicado')
    } catch {
      toast.error('Error al cambiar estado')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este post?')) return
    try {
      const res = await fetch(`/api/admin/blog/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error al eliminar')
      setPosts(prev => prev.filter(p => p.id !== id))
      toast.success('Post eliminado')
    } catch {
      toast.error('Error al eliminar post')
    }
  }

  const handleSaved = (saved: BlogPost) => {
    if (editingPost) {
      setPosts(prev => prev.map(p => p.id === saved.id ? saved : p))
    } else {
      setPosts(prev => [saved, ...prev])
    }
    setShowForm(false)
    setEditingPost(null)
  }

  const formatDate = (d: string | null) => {
    if (!d) return '-'
    return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-secondary">Blog</h1>
        <button
          onClick={() => { setEditingPost(null); setShowForm(true) }}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium text-sm"
        >
          + Nuevo Post
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-secondary">
                {editingPost ? 'Editar Post' : 'Nuevo Post'}
              </h2>
              <button
                onClick={() => { setShowForm(false); setEditingPost(null) }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <BlogPostForm
              post={editingPost}
              onSaved={handleSaved}
              onCancel={() => { setShowForm(false); setEditingPost(null) }}
            />
          </div>
        </div>
      )}

      {posts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <span className="text-5xl block mb-4">✍️</span>
          <p className="text-gray-500 mb-2">No hay posts creados</p>
          <p className="text-sm text-gray-400">Crea tu primer articulo para el blog</p>
        </div>
      ) : (
        <>
          {/* Mobile Cards */}
          <div className="lg:hidden space-y-4">
            {posts.map((post) => (
              <div key={post.id} className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="mb-3">
                  <h3 className="font-semibold text-secondary text-sm truncate">{post.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-400">
                      {CATEGORY_LABELS[post.category] || post.category}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      post.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {post.status === 'published' ? 'Publicado' : 'Borrador'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {post.status === 'published' ? formatDate(post.published_at) : formatDate(post.created_at)}
                    {' · '}{post.view_count} vistas
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleStatus(post)}
                    className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50"
                  >
                    {post.status === 'published' ? 'Despublicar' : 'Publicar'}
                  </button>
                  <button
                    onClick={() => { setEditingPost(post); setShowForm(true) }}
                    className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-primary"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-500"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden lg:block bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Titulo</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Categoria</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Vistas</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-sm text-secondary truncate max-w-[300px]">{post.title}</p>
                      {post.excerpt && (
                        <p className="text-xs text-gray-400 truncate max-w-[300px]">{post.excerpt}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {CATEGORY_LABELS[post.category] || post.category}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggleStatus(post)}
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          post.status === 'published'
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        }`}
                      >
                        {post.status === 'published' ? 'Publicado' : 'Borrador'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {post.status === 'published' ? formatDate(post.published_at) : formatDate(post.created_at)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600">
                      {post.view_count.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => { setEditingPost(post); setShowForm(true) }}
                          className="p-1.5 text-gray-400 hover:text-primary rounded-lg hover:bg-primary/5"
                          title="Editar"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50"
                          title="Eliminar"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
