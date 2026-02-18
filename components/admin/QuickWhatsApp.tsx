'use client'

import { useState } from 'react'

interface QuickWhatsAppProps {
  phone: string
  businessName: string
  ownerName?: string
  daysRemaining?: number | null
  onClose: () => void
}

const messageTemplates = [
  {
    id: 'reminder_7',
    label: '📅 Recordatorio 7 días',
    icon: '⏰',
    getMessage: (name: string, business: string, days: number | null) =>
      `¡Hola ${name}! 👋\n\nTe escribimos de SomosLagos para recordarte que tu suscripción de *${business}* vence en ${days || 7} días.\n\n¿Te gustaría renovar? Tenemos promociones especiales para ti. 🎉\n\n¿Cómo te podemos ayudar?`,
  },
  {
    id: 'reminder_3',
    label: '⚠️ Recordatorio 3 días',
    icon: '⚠️',
    getMessage: (name: string, business: string, days: number | null) =>
      `¡Hola ${name}! 👋\n\n⚠️ *IMPORTANTE:* Tu suscripción de *${business}* vence en solo ${days || 3} días.\n\nPara evitar que tu negocio desaparezca del directorio, te invitamos a renovar hoy.\n\n💳 ¿Te ayudo con el proceso de pago?`,
  },
  {
    id: 'expired',
    label: '❌ Suscripción vencida',
    icon: '❌',
    getMessage: (name: string, business: string) =>
      `¡Hola ${name}! 👋\n\nTu suscripción de *${business}* ha vencido y tu negocio ya no aparece en el directorio.\n\n🔄 ¡Pero no te preocupes! Podemos reactivarlo hoy mismo.\n\n¿Te gustaría renovar? Tenemos una promoción especial de reactivación. 🎁`,
  },
  {
    id: 'promo',
    label: '🎉 Promoción especial',
    icon: '🎉',
    getMessage: (name: string, business: string) =>
      `¡Hola ${name}! 👋\n\n🎉 *PROMOCIÓN ESPECIAL* 🎉\n\nPor ser cliente de SomosLagos, tenemos una oferta exclusiva para *${business}*:\n\n✅ 2 meses por el precio de 1\n✅ Upgrade de plan GRATIS\n\n¿Te interesa? Esta promoción es por tiempo limitado. ⏳`,
  },
  {
    id: 'upgrade',
    label: '⬆️ Oferta de upgrade',
    icon: '⬆️',
    getMessage: (name: string, business: string) =>
      `¡Hola ${name}! 👋\n\n¿Sabías que puedes hacer crecer *${business}* con nuestro plan superior?\n\n⬆️ Con el upgrade obtienes:\n• Más visibilidad\n• Catálogo de productos\n• Recibir pedidos online\n\n🎁 *Oferta especial:* Upgrade GRATIS por 15 días para que lo pruebes.\n\n¿Te interesa?`,
  },
  {
    id: 'welcome',
    label: '👋 Bienvenida',
    icon: '👋',
    getMessage: (name: string, business: string) =>
      `¡Hola ${name}! 👋\n\n¡Bienvenido a *SomosLagos*! 🎉\n\nTu negocio *${business}* ya está activo en nuestra plataforma.\n\n📱 Puedes ver tu perfil en: somoslagos.com.mx/negocios/${business.toLowerCase().replace(/\s+/g, '-')}\n\n¿Tienes alguna duda? Estamos para ayudarte. 😊`,
  },
  {
    id: 'payment_confirm',
    label: '✅ Confirmar pago',
    icon: '✅',
    getMessage: (name: string, business: string) =>
      `¡Hola ${name}! 👋\n\n✅ *Pago recibido*\n\nHemos recibido tu pago para *${business}*. Tu suscripción ha sido renovada exitosamente.\n\n📅 Nueva fecha de vencimiento: [FECHA]\n\n¡Gracias por confiar en SomosLagos! 🙏`,
  },
  {
    id: 'custom',
    label: '✏️ Mensaje personalizado',
    icon: '✏️',
    getMessage: (name: string, business: string) =>
      `¡Hola ${name}! 👋\n\nTe escribimos de SomosLagos respecto a *${business}*.\n\n[Tu mensaje aquí]`,
  },
]

export default function QuickWhatsApp({
  phone,
  businessName,
  ownerName = 'estimado cliente',
  daysRemaining,
  onClose,
}: QuickWhatsAppProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [customMessage, setCustomMessage] = useState('')
  const [editedMessage, setEditedMessage] = useState('')

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplate(templateId)
    const template = messageTemplates.find((t) => t.id === templateId)
    if (template) {
      const message = template.getMessage(ownerName || '', businessName, daysRemaining ?? null)
      setEditedMessage(message)
    }
  }

  const handleSend = () => {
    const message = encodeURIComponent(editedMessage || customMessage)
    const cleanPhone = phone.replace(/\D/g, '')
    const whatsappUrl = `https://wa.me/52${cleanPhone}?text=${message}`
    window.open(whatsappUrl, '_blank')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-green-500 text-white rounded-t-xl">
          <div>
            <h2 className="text-xl font-bold">💬 WhatsApp Rápido</h2>
            <p className="text-sm text-green-100">{businessName} • {phone}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-green-200 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Template Selection */}
        <div className="p-4 border-b border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-3">Selecciona una plantilla:</p>
          <div className="grid grid-cols-2 gap-2">
            {messageTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleSelectTemplate(template.id)}
                className={`p-2 text-left rounded-lg border text-sm transition-colors ${
                  selectedTemplate === template.id
                    ? 'border-green-500 bg-green-50 text-green-800'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="mr-1">{template.icon}</span>
                {template.label}
              </button>
            ))}
          </div>
        </div>

        {/* Message Preview/Edit */}
        <div className="p-4">
          <p className="text-sm font-medium text-gray-700 mb-2">
            {selectedTemplate ? 'Editar mensaje:' : 'O escribe tu mensaje:'}
          </p>
          <textarea
            value={selectedTemplate ? editedMessage : customMessage}
            onChange={(e) => {
              if (selectedTemplate) {
                setEditedMessage(e.target.value)
              } else {
                setCustomMessage(e.target.value)
              }
            }}
            rows={8}
            placeholder="Escribe tu mensaje aquí..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">
            Puedes editar el mensaje antes de enviarlo
          </p>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSend}
            disabled={!editedMessage && !customMessage}
            className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
          >
            📤 Enviar WhatsApp
          </button>
        </div>
      </div>
    </div>
  )
}
