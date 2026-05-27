'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'

interface BusinessPin {
  id: string
  name: string
  slug: string
  address: string | null
  latitude: number | null
  longitude: number | null
  is_featured: boolean
  subscription_tier: string
  category: { name: string; icon: string } | null
}

interface SearchResultsMapProps {
  businesses: BusinessPin[]
}

const LAGOS_CENTER: [number, number] = [21.358, -102.345]

const coralPinHtml = `
  <div style="
    width:32px;height:32px;
    background:linear-gradient(135deg,#FF6B35,#e85520);
    border:3px solid #fff;
    border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);
    box-shadow:0 3px 10px rgba(255,107,53,0.45);
  "></div>`

const darkPinHtml = `
  <div style="
    width:26px;height:26px;
    background:#1F2937;
    border:2.5px solid #fff;
    border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);
    box-shadow:0 2px 7px rgba(0,0,0,0.28);
  "></div>`

export default function SearchResultsMap({ businesses }: SearchResultsMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)

  const withCoords = businesses.filter(
    (b): b is BusinessPin & { latitude: number; longitude: number } =>
      b.latitude != null && b.longitude != null,
  )

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    const map = L.map(mapRef.current).setView(LAGOS_CENTER, 13)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)

    const coralIcon = L.divIcon({ className: '', html: coralPinHtml, iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -34] })
    const darkIcon = L.divIcon({ className: '', html: darkPinHtml, iconSize: [26, 26], iconAnchor: [13, 26], popupAnchor: [0, -28] })

    const bounds: L.LatLngTuple[] = []

    withCoords.forEach((b) => {
      const isPremium = b.is_featured || ['avanzado', 'pro'].includes(b.subscription_tier)
      const marker = L.marker([b.latitude, b.longitude], { icon: isPremium ? coralIcon : darkIcon }).addTo(map)

      marker.bindPopup(`
        <div style="min-width:190px;font-family:system-ui,sans-serif;padding:2px 0">
          <div style="font-weight:700;font-size:14px;color:#1F2937;margin-bottom:3px">${b.name}</div>
          ${b.category ? `<div style="font-size:12px;color:#6B7280;margin-bottom:3px">${b.category.icon} ${b.category.name}</div>` : ''}
          ${b.address ? `<div style="font-size:11px;color:#9CA3AF;margin-bottom:9px">${b.address}</div>` : ''}
          <a href="/negocios/${b.slug}" style="
            display:inline-block;padding:5px 14px;
            background:#FF6B35;color:#fff;
            border-radius:20px;font-size:12px;font-weight:600;
            text-decoration:none;
          ">Ver perfil →</a>
        </div>
      `)

      bounds.push([b.latitude, b.longitude])
    })

    if (bounds.length > 1) {
      map.fitBounds(bounds as L.LatLngBoundsLiteral, { padding: [50, 50], maxZoom: 15 })
    } else if (bounds.length === 1) {
      map.setView(bounds[0], 15)
    }

    mapInstanceRef.current = map

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (withCoords.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center h-64 rounded-2xl gap-3"
        style={{
          background: 'linear-gradient(135deg,rgba(255,107,53,0.04),rgba(245,185,66,0.04))',
          border: '1px dashed rgba(255,107,53,0.2)',
        }}
      >
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="1.5">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
        </svg>
        <p style={{ color: 'var(--muted)', fontFamily: 'var(--body)', fontSize: 14 }}>
          Ningún negocio tiene ubicación registrada aún
        </p>
      </div>
    )
  }

  return (
    <div>
      <div
        ref={mapRef}
        className="w-full rounded-2xl overflow-hidden"
        style={{ height: 500 }}
      />
      <p className="text-xs mt-2" style={{ color: 'var(--muted)', fontFamily: 'var(--body)' }}>
        {withCoords.length} de {businesses.length} negocios con ubicación registrada
        {businesses.length > withCoords.length && (
          <span> — los demás no aparecen en el mapa</span>
        )}
      </p>
    </div>
  )
}
