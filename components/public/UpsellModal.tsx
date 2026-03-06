'use client'

import { useState, ReactNode } from 'react'
import Link from 'next/link'

interface UpsellModalProps {
  children: ReactNode
  businessName: string
}

export default function UpsellModal({ children, businessName }: UpsellModalProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleClick = () => {
    setIsOpen(true)
    // Track upsell click
    fetch('/api/analytics/upsell', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ business_name: businessName }),
    }).catch(() => {})
  }

  return (
    <>
      <button onClick={handleClick} className="contents">
        {children}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsOpen(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6 text-center">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-600"
              aria-label="Cerrar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-5xl mb-4">🚀</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Haz crecer tu negocio
            </h3>
            <p className="text-gray-600 mb-4">
              Con el Plan Emprendedor tu negocio se ve profesional: portada personalizada, redes sociales y mas fotos para atraer clientes.
            </p>
            <div className="bg-primary/5 rounded-xl p-4 mb-6">
              <p className="text-primary font-bold text-2xl">$2 <span className="text-sm font-normal text-gray-500">al dia</span></p>
              <p className="text-xs text-gray-400 mb-3">$60 MXN/mes — menos que un cafe diario</p>
              <ul className="text-sm text-gray-600 space-y-1 text-left">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Portada personalizada
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Redes sociales visibles
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Hasta 8 fotos en galeria
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Mejor posicion en busquedas
                </li>
              </ul>
            </div>
            <Link
              href="/registrar-negocio"
              className="block w-full px-6 py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition-colors"
            >
              Ver todos los planes
            </Link>
            <button
              onClick={() => setIsOpen(false)}
              className="mt-3 text-sm text-gray-500 hover:text-gray-700"
            >
              Ahora no
            </button>
          </div>
        </div>
      )}
    </>
  )
}
