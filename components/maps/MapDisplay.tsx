'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'

const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

interface MapDisplayProps {
  latitude: number
  longitude: number
  businessName: string
  address?: string
}

export default function MapDisplay({ latitude, longitude, businessName, address }: MapDisplayProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    const map = L.map(mapRef.current, {
      scrollWheelZoom: false,
    }).setView([latitude, longitude], 16)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)

    const marker = L.marker([latitude, longitude], { icon: DefaultIcon }).addTo(map)

    const popupContent = address
      ? `<strong>${businessName}</strong><br/>${address}`
      : `<strong>${businessName}</strong>`
    marker.bindPopup(popupContent)

    mapInstanceRef.current = map

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [latitude, longitude, businessName, address])

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`

  return (
    <div>
      <div
        ref={mapRef}
        className="w-full h-[300px] rounded-xl border border-gray-200 z-0"
      />
      <a
        href={googleMapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium text-sm rounded-lg transition-colors"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
        Abrir en Google Maps
      </a>
    </div>
  )
}
