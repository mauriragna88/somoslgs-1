'use client'

import Link from 'next/link'
import { useReducedMotion } from 'framer-motion'
import {
  UtensilsCrossed, Store, Wrench, User, Bike, Beef, Pizza, Salad,
  Coffee, Cake, ShoppingBag, Shirt, BookOpen, Clock, Briefcase, Sparkles,
  Pill, Flower2, GlassWater, Wine, Music, Plane, Hotel, House, Dumbbell,
  Baby, GraduationCap, Hammer, Scissors, Atom, Languages, Camera, Palette,
  Car, Truck, Gauge, Landmark, Trees, MapPin, Phone, Dog, Apple, Wifi,
} from 'lucide-react'
import { StaggerGroup, StaggerItem } from '@/components/animations/StaggerGroup'
import styles from './CategoryGrid.module.css'

/* Tipo unificado para iconos (Lucide o SVG manuales) */
type IconComponent = React.ComponentType<React.SVGProps<SVGSVGElement>>

/* ═══════════════════════════════════════════════════════════
   CategoryGrid v2 — "¿Qué buscas hoy?" moderno
   - Iconos Lucide únicos y coherentes por categoría
   - Cards glass con gradiente tintado por categoría
   - Micro-interacciones (tilt suave, glow, flecha)
   ═══════════════════════════════════════════════════════════ */

interface Category {
  id: string
  name: string
  icon: string
  slug: string
}

interface CategoryGridProps {
  categories: Category[]
}

/* Mapeo slug → icono específico */
function resolveIcon(slug: string): IconComponent {
  const s = slug.toLowerCase()
  const map: [string, IconComponent][] = [
    // Comida / bebida
    ['restaurante', UtensilsCrossed],
    ['hamburgues', Beef],
    ['taco', Salad],
    ['pizza', Pizza],
    ['comida-rapida', UtensilsCrossed],
    ['comida', UtensilsCrossed],
    ['comer', UtensilsCrossed],
    ['marisquer', FishIcon],
    ['pescad', FishIcon],
    ['helader', IceCreamIcon],
    ['postre', Cake],
    ['cafeter', Coffee],
    ['bar', GlassWater],
    ['cantina', GlassWater],
    ['cervecer', Wine],
    ['bebida', Wine],
    ['vino', Wine],
    ['botaner', Beef],
    ['antojit', Salad],
    ['cenadur', Beef],
    ['tortiller', Salad],
    ['panader', Cake],
    ['dulce', Cake],
    ['neveria', IceCreamIcon],
    ['taqueria', Salad],
    // Tiendas / compras
    ['tienda', Store],
    ['compr', ShoppingBag],
    ['ropa', Shirt],
    ['moda', Shirt],
    ['calzado', Shirt],
    ['zapat', Shirt],
    ['papeler', BookOpen],
    ['librer', BookOpen],
    ['juguet', Baby],
    ['regalo', Sparkles],
    ['flor', Flower2],
    ['merc', Store],
    ['abarrote', ShoppingBag],
    ['farmacia', Pill],
    ['botica', Pill],
    ['joyer', Sparkles],
    ['celular', Phone],
    ['electron', Phone],
    ['mueble', House],
    ['ferreter', Hammer],
    ['tlapaler', Hammer],
    ['mascota', Dog],
    ['veterin', Dog],
    // Servicios / profesionales
    ['servic', Wrench],
    ['profesion', Briefcase],
    ['contador', Briefcase],
    ['abogad', Briefcase],
    ['notaria', Briefcase],
    ['ingenier', Hammer],
    ['arquitect', House],
    ['salud', Pill],
    ['medic', Pill],
    ['dental', Pill],
    ['estetic', Flower2],
    ['belleza', Flower2],
    ['spa', Flower2],
    ['barber', Scissors],
    ['peluquer', Scissors],
    ['clinic', Pill],
    ['seguro', ShieldIcon],
    ['financi', Landmark],
    ['banco', Landmark],
    ['viaje', Plane],
    ['turistic', Plane],
    ['hospedaje', Hotel],
    ['hotel', Hotel],
    ['restaurante', UtensilsCrossed],
    ['automo', Car],
    ['mecanic', Car],
    ['lavado', Sparkles],
    ['moto', Bike],
    ['motomandado', Bike],
    ['entretenimiento', Music],
    ['centro', Music],
    ['noche', GlassWater],
    ['gym', Dumbbell],
    ['deporte', Dumbbell],
    ['escuela', GraduationCap],
    ['academia', GraduationCap],
    ['curso', GraduationCap],
    ['idioma', Languages],
    ['fotografia', Camera],
    ['artesania', Palette],
    ['arte', Palette],
    ['tech', Wifi],
    ['servicios', Wrench],
  ]
  for (const [key, icon] of map) {
    if (s.includes(key.toLowerCase())) return icon
  }
  return MapPin
}

/* Icono de pez para marisquerías */
function FishIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6.5 12c.94-3.46 4.94-6 8.5-6 3.56 0 6.06 2.54 7 6-.94 3.47-3.44 6-7 6-3.56 0-7.56-2.53-8.5-6Z" />
      <path d="M18 12v.5" />
      <path d="M16 17.93a9.77 9.77 0 0 1 0-11.86" />
      <path d="M13 10c.5.4 1 1 1 2" />
      <path d="M7 10v8" />
    </svg>
  )
}

/* Icono de helado (cono) para heladerías */
function IceCreamIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M17 8a5 5 0 0 0-10 0c0 1.5.6 2.6 1.3 3.4L7 17h10l-1.3-5.6c.7-.8 1.3-1.9 1.3-3.4Z" />
      <path d="M7 17l2 4" />
      <path d="M12 17v4" />
      <path d="M17 17l-2 4" />
    </svg>
  )
}

function ShieldIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

/* Gradiente tintado por categoría */
function catColor(slug: string): { bg: string; iconBg: string; text: string } {
  const s = slug.toLowerCase()
  const food = ['restaurante', 'comer', 'comida', 'taco', 'hamburgu', 'pizza', 'marisquer', 'helader', 'postre', 'panader', 'cenadur', 'taquer', 'antojit', 'botaner', 'tortiller', 'dulce', 'neveria', 'comida-rapida']
  const drink = ['bar', 'cantina', 'cervecer', 'bebida', 'vino', 'noche', 'centro']
  const shop = ['tienda', 'compr', 'ropa', 'moda', 'calzad', 'zapat', 'papel', 'librer', 'juguet', 'regalo', 'flor', 'merc', 'abarrote', 'joyer', 'celular', 'electron', 'mueble', 'ferreter', 'mascota', 'veterin']
  const health = ['salud', 'medic', 'dental', 'clinic', 'farmacia', 'botica', 'seguro']
  const beauty = ['estetic', 'belleza', 'spa', 'barber', 'peluquer', 'flor']
  const travel = ['viaje', 'turistic', 'hospedaje', 'hotel', 'hacienda']
  const fun = ['entretenimiento', 'centro', 'noche', 'gym', 'deporte', 'escuela', 'academia', 'curso', 'idioma', 'fotografia', 'artesania', 'arte', 'tech']

  if (food.some(k => s.includes(k))) return { bg: 'linear-gradient(135deg, #FFF4EC 0%, #FFF9F3 100%)', iconBg: 'linear-gradient(135deg, #FF6B35, #F5B942)', text: '#C2410C' }
  if (drink.some(k => s.includes(k))) return { bg: 'linear-gradient(135deg, #F0F4FF 0%, #F7F9FF 100%)', iconBg: 'linear-gradient(135deg, #6366F1, #8B5CF6)', text: '#4F46E5' }
  if (shop.some(k => s.includes(k))) return { bg: 'linear-gradient(135deg, #FFF7E6 0%, #FFFBF2 100%)', iconBg: 'linear-gradient(135deg, #F59E0B, #F97316)', text: '#C2410C' }
  if (health.some(k => s.includes(k))) return { bg: 'linear-gradient(135deg, #EFFDF5 0%, #F4FFF9 100%)', iconBg: 'linear-gradient(135deg, #10B981, #059669)', text: '#047857' }
  if (beauty.some(k => s.includes(k))) return { bg: 'linear-gradient(135deg, #FDF2F8 0%, #FFF7FB 100%)', iconBg: 'linear-gradient(135deg, #EC4899, #F472B6)', text: '#BE185D' }
  if (travel.some(k => s.includes(k))) return { bg: 'linear-gradient(135deg, #ECFEFF 0%, #F5FDFF 100%)', iconBg: 'linear-gradient(135deg, #06B6D4, #0891B2)', text: '#0E7490' }
  if (fun.some(k => s.includes(k))) return { bg: 'linear-gradient(135deg, #F5F3FF 0%, #FAF9FF 100%)', iconBg: 'linear-gradient(135deg, #8B5CF6, #EC4899)', text: '#7C3AED' }
  // default — servicios / otros azul tuquesa
  return { bg: 'linear-gradient(135deg, #EFF8F7 0%, #F5FBFA 100%)', iconBg: 'linear-gradient(135deg, #0D9488, #14B8A6)', text: '#0F766E' }
}

function tilt(e: React.PointerEvent<HTMLAnchorElement>) {
  const el = e.currentTarget
  const r = el.getBoundingClientRect()
  const x = (e.clientX - r.left) / r.width
  const y = (e.clientY - r.top) / r.height
  el.style.setProperty('--gx', `${x * 100}%`)
  el.style.setProperty('--gy', `${y * 100}%`)
  el.style.setProperty('--ry', `${(x * 2 - 1) * 6}deg`)
  el.style.setProperty('--rx', `${(y * 2 - 1) * -6}deg`)
}

function untilt(e: React.PointerEvent<HTMLAnchorElement>) {
  e.currentTarget.style.setProperty('--rx', '0deg')
  e.currentTarget.style.setProperty('--ry', '0deg')
}

export default function CategoryGrid({ categories }: CategoryGridProps) {
  const reduced = useReducedMotion()
  return (
    <StaggerGroup className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {categories.map((cat) => {
        const Icon = resolveIcon(cat.slug)
        const color = catColor(cat.slug)
        return (
          <StaggerItem key={cat.id} className="h-full">
            <Link
              href={`/categorias/${cat.slug}`}
              className={styles.tile}
              onPointerMove={reduced ? undefined : tilt}
              onPointerLeave={reduced ? undefined : untilt}
            >
              <span className={styles.glow} aria-hidden="true" />
              <span className={styles.icon} style={{ background: color.iconBg }}>
                <Icon width={26} height={26} strokeWidth={2} />
              </span>
              <span className={styles.name}>{cat.name}</span>
              <span className={styles.go}>
                Explorar <span aria-hidden="true">→</span>
              </span>
            </Link>
          </StaggerItem>
        )
      })}
    </StaggerGroup>
  )
}
