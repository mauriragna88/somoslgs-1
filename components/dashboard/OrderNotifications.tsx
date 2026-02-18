'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Notification {
  id: string
  business_id: string
  order_id: string
  type: string
  message_preview: string
  is_read: boolean
  created_at: string
}

interface OrderNotificationsProps {
  businessId: string
  businessWhatsApp?: string
}

export default function OrderNotifications({ businessId, businessWhatsApp }: OrderNotificationsProps) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showPopup, setShowPopup] = useState(false)
  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null)
  // Play notification sound using Web Audio API (beep)
  const playSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = 880
      gain.gain.value = 0.3
      osc.start()
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)
      osc.stop(ctx.currentTime + 0.5)
      // Second beep
      const osc2 = ctx.createOscillator()
      const gain2 = ctx.createGain()
      osc2.connect(gain2)
      gain2.connect(ctx.destination)
      osc2.frequency.value = 1100
      gain2.gain.value = 0.3
      osc2.start(ctx.currentTime + 0.15)
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.65)
      osc2.stop(ctx.currentTime + 0.65)
    } catch {
      // Ignore audio errors (autoplay restrictions, etc.)
    }
  }, [])

  // Fetch unread notifications
  const fetchNotifications = useCallback(async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('business_id', businessId)
      .eq('is_read', false)
      .eq('type', 'new_order')
      .order('created_at', { ascending: false })
      .limit(10)

    if (data) {
      setNotifications(data)
    }
  }, [businessId, supabase])  // supabase is memoized, won't cause re-renders

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    await (supabase
      .from('notifications') as any)
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId)

    setNotifications(prev => prev.filter(n => n.id !== notificationId))
  }

  // Handle new notification
  const handleNewNotification = useCallback((payload: any) => {
    const newNotification = payload.new as Notification

    if (newNotification.business_id === businessId && newNotification.type === 'new_order') {
      setNotifications(prev => [newNotification, ...prev])
      setCurrentNotification(newNotification)
      setShowPopup(true)
      playSound()

      // Auto-hide popup after 30 seconds
      setTimeout(() => {
        setShowPopup(false)
      }, 30000)
    }
  }, [businessId, playSound])

  // Subscribe to realtime notifications
  useEffect(() => {
    fetchNotifications()

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `business_id=eq.${businessId}`,
        },
        handleNewNotification
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [businessId, fetchNotifications, handleNewNotification, supabase])

  // Go to order and mark as read
  const handleViewOrder = async (notification: Notification) => {
    await markAsRead(notification.id)
    setShowPopup(false)
    router.push(`/dashboard/pedidos/${notification.order_id}`)
  }

  // Generate WhatsApp link
  const getWhatsAppLink = (notification: Notification) => {
    if (!businessWhatsApp) return null
    const message = encodeURIComponent(
      `¡Gracias por tu pedido! Lo estamos preparando. Te avisamos cuando esté listo.`
    )
    return `https://wa.me/52${businessWhatsApp}?text=${message}`
  }

  return (
    <>
      {/* Notification Bell with Counter */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-40">
          <button
            onClick={() => setShowPopup(true)}
            className="relative bg-red-500 text-white p-3 rounded-full shadow-lg hover:bg-red-600 transition-all animate-bounce"
          >
            <span className="text-xl">🔔</span>
            <span className="absolute -top-1 -right-1 bg-yellow-400 text-red-800 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
              {notifications.length}
            </span>
          </button>
        </div>
      )}

      {/* Popup Notification */}
      {showPopup && currentNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in slide-in-from-top duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 text-white text-center">
              <div className="text-6xl mb-4 animate-bounce">🛒</div>
              <h2 className="text-2xl font-bold">¡Nuevo Pedido!</h2>
              <p className="text-white/90 mt-1">Tienes un pedido pendiente</p>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <p className="text-gray-800 font-medium text-center">
                  {currentNotification.message_preview}
                </p>
                <p className="text-gray-500 text-sm text-center mt-2">
                  {new Date(currentNotification.created_at).toLocaleString('es-MX')}
                </p>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={() => handleViewOrder(currentNotification)}
                  className="w-full py-4 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl transition-colors text-lg"
                >
                  ✅ Ver y Aceptar Pedido
                </button>

                {businessWhatsApp && (
                  <a
                    href={getWhatsAppLink(currentNotification) || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => markAsRead(currentNotification.id)}
                    className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    💬 Enviar WhatsApp al Cliente
                  </a>
                )}

                <button
                  onClick={() => setShowPopup(false)}
                  className="w-full py-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Ver después
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification List (Mini) */}
      {notifications.length > 1 && !showPopup && (
        <div className="fixed bottom-4 right-4 z-40 max-w-sm">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <p className="text-sm font-medium text-gray-700">
                🔔 {notifications.length} pedidos pendientes
              </p>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {notifications.slice(0, 3).map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleViewOrder(notification)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0"
                >
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {notification.message_preview}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(notification.created_at).toLocaleTimeString('es-MX')}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
