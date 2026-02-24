'use client'

import type { BusinessHours, DayHours } from '@/lib/constants'

interface BusinessHoursEditorProps {
  value: BusinessHours
  onChange: (hours: BusinessHours) => void
}

const DAYS: Array<{ key: keyof BusinessHours; label: string }> = [
  { key: 'weekdays', label: 'Lunes a Viernes' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' },
]

export default function BusinessHoursEditor({ value, onChange }: BusinessHoursEditorProps) {
  const updateDay = (dayKey: keyof BusinessHours, updates: Partial<DayHours>) => {
    onChange({
      ...value,
      [dayKey]: { ...value[dayKey], ...updates },
    })
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Horarios de Atención
      </label>
      <div className="bg-gray-50 rounded-xl p-4 space-y-4">
        {DAYS.map(({ key, label }) => {
          const day = value[key]
          return (
            <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-3">
              <span className="text-sm font-medium text-gray-700 w-36 flex-shrink-0">
                {label}
              </span>

              <label className="flex items-center gap-2 cursor-pointer flex-shrink-0">
                <input
                  type="checkbox"
                  checked={day.closed}
                  onChange={(e) => updateDay(key, { closed: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-red-500 focus:ring-red-500"
                />
                <span className="text-sm text-gray-600">Cerrado</span>
              </label>

              {!day.closed && (
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={day.open || '09:00'}
                    onChange={(e) => updateDay(key, { open: e.target.value })}
                    className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <span className="text-gray-400 text-sm">a</span>
                  <input
                    type="time"
                    value={day.close || '18:00'}
                    onChange={(e) => updateDay(key, { close: e.target.value })}
                    className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
