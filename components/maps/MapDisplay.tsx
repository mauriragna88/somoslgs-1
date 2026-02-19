'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

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

  return (
    <div
      ref={mapRef}
      className="w-full h-[300px] rounded-lg border border-gray-200 z-0"
    />
  )
}
