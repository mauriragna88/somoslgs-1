'use client'

import type { BusinessHours } from '@/lib/constants'

interface BusinessHoursDisplayProps {
  hours: BusinessHours | null | undefined
}

const ROWS: Array<{ key: keyof BusinessHours; label: string; days: number[] }> = [
  { key: 'weekdays', label: 'Lunes a Viernes', days: [1, 2, 3, 4, 5] },
  { key: 'saturday', label: 'Sábado', days: [6] },
  { key: 'sunday', label: 'Domingo', days: [0] },
]

function formatTime(time: string | null): string {
  if (!time) return ''
  const [h, m] = time.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${hour12}:${m.toString().padStart(2, '0')} ${ampm}`
}

export default function BusinessHoursDisplay({ hours }: BusinessHoursDisplayProps) {
  if (!hours) {
    return null
  }

  // Obtener dia actual en Mexico City
  const now = new Date()
  const mexicoTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Mexico_City' }))
  const currentDay = mexicoTime.getDay()

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--coral)' }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Horarios
      </h3>
      <div className="space-y-2">
        {ROWS.map(({ key, label, days }) => {
          const day = hours[key]
          const isToday = days.includes(currentDay)

          return (
            <div
              key={key}
              className={`flex items-center justify-between py-2 px-3 rounded-lg text-sm ${
                isToday ? 'font-semibold' : ''
              }`}
              style={isToday ? { background: 'rgba(255,107,53,0.05)' } : undefined}
            >
              <span style={isToday ? { color: 'var(--coral)' } : { color: '#374151' }}>
                {label}
                {isToday && <span className="ml-2 text-xs" style={{ color: 'rgba(255,107,53,0.7)' }}>(Hoy)</span>}
              </span>
              <span className={day.closed ? 'text-red-500' : ''} style={!day.closed && isToday ? { color: 'var(--coral)' } : !day.closed ? { color: '#4B5563' } : undefined}>
                {day.closed
                  ? 'Cerrado'
                  : `${formatTime(day.open)} - ${formatTime(day.close)}`}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
