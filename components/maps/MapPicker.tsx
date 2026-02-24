'use client'

import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'

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

// Lagos de Moreno - vista de la ciudad completa
const LAGOS_CENTER: [number, number] = [21.3580, -102.3450]
const DEFAULT_ZOOM = 13

interface MapPickerProps {
  latitude?: number | null
  longitude?: number | null
  onChange: (lat: number | null, lng: number | null) => void
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

    // Always center on Lagos de Moreno city view
    const map = L.map(mapRef.current).setView(LAGOS_CENTER, DEFAULT_ZOOM)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)

    // Add existing marker if coordinates exist (but don't change the map center)
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
      <div className="relative">
        <div
          ref={mapRef}
          className="w-full h-64 sm:h-80 md:h-[300px] rounded-lg border border-gray-300 z-0"
        />
        {/* Overlay hint when no pin placed */}
        {!coords && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[400]">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg px-5 py-4 text-center max-w-[280px] animate-pulse">
              <div className="text-3xl mb-2">📍</div>
              <p className="text-sm font-semibold text-gray-800">
                Toca el mapa para colocar tu pin
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Puedes moverlo arrastrándolo después
              </p>
            </div>
          </div>
        )}
      </div>
      {coords && (
        <div className="flex items-center gap-2 mt-2">
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Pin colocado
          </span>
          <span className="text-xs text-gray-400">
            {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
          </span>
          <button
            type="button"
            onClick={() => {
              if (markerRef.current && mapInstanceRef.current) {
                mapInstanceRef.current.removeLayer(markerRef.current)
                markerRef.current = null
              }
              setCoords(null)
              onChange(null, null)
            }}
            className="text-xs text-red-500 hover:text-red-700 font-medium ml-auto"
          >
            Quitar pin
          </button>
        </div>
      )}
      {!coords && (
        <p className="text-xs text-gray-500 mt-1">
          Toca o haz clic en el mapa para marcar la ubicación de tu negocio
        </p>
      )}
    </div>
  )
}
