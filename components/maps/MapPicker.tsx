'use client'

import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix default marker icon issue in Leaflet + webpack/Next.js
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

// Lagos de Moreno default center
const LAGOS_CENTER: [number, number] = [21.3545, -102.3432]
const DEFAULT_ZOOM = 15

interface MapPickerProps {
  latitude?: number | null
  longitude?: number | null
  onChange: (lat: number, lng: number) => void
}

export default function MapPicker({ latitude, longitude, onChange }: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    latitude && longitude ? { lat: latitude, lng: longitude } : null
  )

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    const center: [number, number] = coords
      ? [coords.lat, coords.lng]
      : LAGOS_CENTER

    const map = L.map(mapRef.current).setView(center, DEFAULT_ZOOM)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)

    // Add existing marker if coordinates exist
    if (coords) {
      const marker = L.marker([coords.lat, coords.lng], { icon: DefaultIcon, draggable: true }).addTo(map)
      marker.on('dragend', () => {
        const pos = marker.getLatLng()
        setCoords({ lat: pos.lat, lng: pos.lng })
        onChange(pos.lat, pos.lng)
      })
      markerRef.current = marker
    }

    // Click to place/move marker
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng

      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng])
      } else {
        const marker = L.marker([lat, lng], { icon: DefaultIcon, draggable: true }).addTo(map)
        marker.on('dragend', () => {
          const pos = marker.getLatLng()
          setCoords({ lat: pos.lat, lng: pos.lng })
          onChange(pos.lat, pos.lng)
        })
        markerRef.current = marker
      }

      setCoords({ lat, lng })
      onChange(lat, lng)
    })

    mapInstanceRef.current = map

    return () => {
      map.remove()
      mapInstanceRef.current = null
      markerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div>
      <div
        ref={mapRef}
        className="w-full h-[300px] rounded-lg border border-gray-300 z-0"
      />
      <p className="text-xs text-gray-500 mt-1">
        {coords
          ? `Ubicación: ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`
          : 'Haz clic en el mapa para marcar la ubicación de tu negocio'}
      </p>
    </div>
  )
}
