'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { SiteEvent } from '@/types/database.types'

const PRESET_COLORS = [
  { value: '#FF6B35', label: 'Coral' },
  { value: '#F5B942', label: 'Dorado' },
  { value: '#D946EF', label: 'Magenta' },
  { value: '#22B8CF', label: 'Turquesa' },
  { value: '#C86B4A', label: 'Terracota' },
  { value: '#22C55E', label: 'Verde' },
  { value: '#A855F7', label: 'Morado' },
]

const TOURISM_IMAGES = [
  '/tourism/danza-matachines.jpg',
  '/tourism/dia-muertos.jpg',
  '/tourism/centro-historico.jpg',
  '/tourism/callelagos1.jpg',
  '/tourism/turismo-religioso.jpg',
  '/tourism/panoramica-lagos.jpg',
  '/tourism/parroquia-asuncion.jpg',
  '/tourism/teatro-rosas-moreno.jpg',
  '/tourism/calvario-panoramica.jpg',
  '/tourism/jardin-constituyentes.jpg',
  '/tourism/palacio-municipal.jpg',
  '/tourism/puente-panoramica.jpg',
]

interface EventFormProps {
  event: SiteEvent | null
  onSaved: (event: SiteEvent) => void
  onCancel: () => void
}

export default function EventForm({ event, onSaved, onCancel }: EventFormProps) {
  const isEditing = event !== null

  const [form, setForm] = useState({
    name: event?.name ?? '',
    month_code: event?.month_code ?? '',
    dates: event?.dates ?? '',
    description: event?.description ?? '',
    category: event?.category ?? '',
    category_color: event?.category_color ?? '#FF6B35',
    image_src: event?.image_src ?? TOURISM_IMAGES[0],
    image_alt: event?.image_alt ?? '',
    is_upcoming: event?.is_upcoming ?? false,
    col_span: event?.col_span ?? 'md:col-span-1',
    row_span: event?.row_span ?? 'md:row-span-1',
    display_order: event?.display_order ?? 0,
    is_active: event?.is_active ?? true,
  })

  const [customColor, setCustomColor] = useState('')
  const [saving, setSaving] = useState(false)

  const isPreset = PRESET_COLORS.some(c => c.value === form.category_color)

  const set = (key: string, value: string | boolean | number) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.category.trim() || !form.dates.trim()) {
      toast.error('Completa los campos requeridos: nombre, categoría y fechas')
      return
    }
    setSaving(true)
    const supabase = createClient()
    try {
      if (isEditing) {
        const { data, error } = await supabase
          .from('events')
          .update({ ...form, updated_at: new Date().toISOString() })
          .eq('id', event.id)
          .select()
          .single()
        if (error) throw error
        toast.success('Evento actualizado')
        onSaved(data as SiteEvent)
      } else {
        const { data, error } = await supabase
          .from('events')
          .insert(form)
          .select()
          .single()
        if (error) throw error
        toast.success('Evento creado')
        onSaved(data as SiteEvent)
      }
    } catch {
      toast.error('Error al guardar el evento')
    } finally {
      setSaving(false)
    }
  }

  const labelStyle = { color: '#FF6B35', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 6, display: 'block' }
  const inputStyle = { width: '100%', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: 14, color: '#1F2937', outline: 'none', background: 'white' }
  const focusRing = { '--focus-ring': '#FF6B35' } as React.CSSProperties

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Nombre del evento *</label>
          <input
            style={inputStyle}
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="Feria de Lagos"
            required
          />
        </div>

        <div>
          <label style={labelStyle}>Código de mes</label>
          <input
            style={inputStyle}
            value={form.month_code}
            onChange={e => set('month_code', e.target.value)}
            placeholder="AGO"
            maxLength={3}
          />
          <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>Ej: AGO, NOV, DIC, MAR, 365</p>
        </div>

        <div>
          <label style={labelStyle}>Fechas *</label>
          <input
            style={inputStyle}
            value={form.dates}
            onChange={e => set('dates', e.target.value)}
            placeholder="1 – 15 Agosto"
            required
          />
        </div>
      </div>

      <div>
        <label style={labelStyle}>Descripción</label>
        <textarea
          style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
          value={form.description}
          onChange={e => set('description', e.target.value)}
          placeholder="Descripción del evento..."
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <label style={labelStyle}>Categoría *</label>
          <input
            style={inputStyle}
            value={form.category}
            onChange={e => set('category', e.target.value)}
            placeholder="Tradición"
            required
          />
        </div>

        <div>
          <label style={labelStyle}>Color de categoría</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
            {PRESET_COLORS.map(c => (
              <button
                key={c.value}
                type="button"
                title={c.label}
                onClick={() => set('category_color', c.value)}
                style={{
                  width: 28, height: 28,
                  borderRadius: '50%',
                  background: c.value,
                  border: form.category_color === c.value ? '3px solid #1F2937' : '2px solid white',
                  boxShadow: form.category_color === c.value ? `0 0 0 2px ${c.value}` : 'none',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="color"
              value={form.category_color}
              onChange={e => set('category_color', e.target.value)}
              style={{ width: 36, height: 28, border: '1px solid #e5e7eb', borderRadius: 6, padding: 2, cursor: 'pointer' }}
            />
            <input
              style={{ ...inputStyle, flex: 1 }}
              value={customColor || form.category_color}
              onChange={e => {
                setCustomColor(e.target.value)
                if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                  set('category_color', e.target.value)
                }
              }}
              placeholder="#FF6B35"
              maxLength={7}
            />
          </div>
        </div>
      </div>

      <div>
        <label style={labelStyle}>Imagen</label>
        <select
          style={inputStyle}
          value={form.image_src}
          onChange={e => set('image_src', e.target.value)}
        >
          {TOURISM_IMAGES.map(img => (
            <option key={img} value={img}>{img.replace('/tourism/', '')}</option>
          ))}
        </select>
      </div>

      <div>
        <label style={labelStyle}>Texto alternativo de imagen</label>
        <input
          style={inputStyle}
          value={form.image_alt}
          onChange={e => set('image_alt', e.target.value)}
          placeholder="Descripción de la imagen para accesibilidad"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        <div>
          <label style={labelStyle}>Columnas</label>
          <select style={inputStyle} value={form.col_span} onChange={e => set('col_span', e.target.value)}>
            <option value="md:col-span-1">1 columna</option>
            <option value="md:col-span-2">2 columnas</option>
          </select>
        </div>

        <div>
          <label style={labelStyle}>Filas</label>
          <select style={inputStyle} value={form.row_span} onChange={e => set('row_span', e.target.value)}>
            <option value="md:row-span-1">1 fila</option>
            <option value="md:row-span-2">2 filas — más alto</option>
          </select>
        </div>

        <div>
          <label style={labelStyle}>Orden</label>
          <input
            type="number"
            style={inputStyle}
            value={form.display_order}
            onChange={e => set('display_order', parseInt(e.target.value) || 0)}
            min={0}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 24 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
          <div
            onClick={() => set('is_upcoming', !form.is_upcoming)}
            style={{
              width: 40, height: 22, borderRadius: 11,
              background: form.is_upcoming ? '#FF6B35' : '#d1d5db',
              position: 'relative', transition: 'background 0.2s', cursor: 'pointer',
            }}
          >
            <div style={{
              position: 'absolute', top: 3, left: form.is_upcoming ? 21 : 3,
              width: 16, height: 16, borderRadius: '50%', background: 'white',
              transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }} />
          </div>
          <span style={{ fontSize: 13, color: '#1F2937', fontWeight: 500 }}>Próximo evento</span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
          <div
            onClick={() => set('is_active', !form.is_active)}
            style={{
              width: 40, height: 22, borderRadius: 11,
              background: form.is_active ? '#FF6B35' : '#d1d5db',
              position: 'relative', transition: 'background 0.2s', cursor: 'pointer',
            }}
          >
            <div style={{
              position: 'absolute', top: 3, left: form.is_active ? 21 : 3,
              width: 16, height: 16, borderRadius: '50%', background: 'white',
              transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }} />
          </div>
          <span style={{ fontSize: 13, color: '#1F2937', fontWeight: 500 }}>Activo</span>
        </label>
      </div>

      <div style={{ display: 'flex', gap: 12, paddingTop: 8, borderTop: '1px solid #f3f4f6' }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            flex: 1, padding: '10px 0', borderRadius: 8,
            border: '1px solid #e5e7eb', background: 'white',
            color: '#6b7280', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          style={{
            flex: 2, padding: '10px 0', borderRadius: 8,
            background: saving ? '#fca48a' : '#FF6B35',
            color: 'white', fontSize: 14, fontWeight: 600,
            cursor: saving ? 'not-allowed' : 'pointer', border: 'none',
          }}
        >
          {saving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear evento'}
        </button>
      </div>
    </form>
  )
}
