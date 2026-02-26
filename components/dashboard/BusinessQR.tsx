'use client'

import { useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'

interface BusinessQRProps {
  businessName: string
  businessSlug: string
}

export default function BusinessQR({ businessName, businessSlug }: BusinessQRProps) {
  const qrRef = useRef<HTMLDivElement>(null)
  const url = `https://www.somoslagos.com.mx/negocios/${businessSlug}`

  const handleDownload = () => {
    if (!qrRef.current) return
    const svg = qrRef.current.querySelector('svg')
    if (!svg) return

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const size = 400
    const padding = 40
    const total = size + padding * 2
    canvas.width = total
    canvas.height = total + 60

    // White background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw QR
    const svgData = new XMLSerializer().serializeToString(svg)
    const img = new window.Image()
    img.onload = () => {
      ctx.drawImage(img, padding, padding, size, size)

      // Business name below QR
      ctx.fillStyle = '#0F766E'
      ctx.font = 'bold 20px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(businessName, total / 2, size + padding + 35)

      // SomosLagos text
      ctx.fillStyle = '#94a3b8'
      ctx.font = '14px Arial'
      ctx.fillText('somoslagos.com.mx', total / 2, size + padding + 55)

      // Download
      const link = document.createElement('a')
      link.download = `QR-${businessSlug}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-1">Codigo QR</h3>
      <p className="text-sm text-gray-500 mb-4">Imprimelo y ponlo en tu local para que tus clientes te encuentren</p>

      <div className="flex flex-col items-center">
        <div ref={qrRef} className="bg-white p-4 rounded-xl border border-gray-100">
          <QRCodeSVG
            value={url}
            size={180}
            level="M"
            fgColor="#0F766E"
            includeMargin={false}
          />
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center break-all">{url}</p>
        <button
          onClick={handleDownload}
          className="mt-4 px-6 py-2.5 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl transition-colors text-sm"
        >
          Descargar QR
        </button>
      </div>
    </div>
  )
}
