'use client'

import { BUSINESS_HOURS_DAYS, normalizeBusinessHours } from '@/lib/constants'
import type { BusinessHours, BusinessHoursDay, DayHours } from '@/lib/constants'

interface BusinessHoursEditorProps {
  value: BusinessHours
  onChange: (hours: BusinessHours) => void
}

const DAYS: Array<{ key: BusinessHoursDay; label: string }> = [
  { key: 'monday', label: 'Lunes' },
  { key: 'tuesday', label: 'Martes' },
  { key: 'wednesday', label: 'Miercoles' },
  { key: 'thursday', label: 'Jueves' },
  { key: 'friday', label: 'Viernes' },
  { key: 'saturday', label: 'Sabado' },
  { key: 'sunday', label: 'Domingo' },
]

export default function BusinessHoursEditor({ value, onChange }: BusinessHoursEditorProps) {
  const normalizedValue = normalizeBusinessHours(value)

  const updateDay = (dayKey: BusinessHoursDay, updates: Partial<DayHours>) => {
    onChange({
      ...normalizedValue,
      [dayKey]: { ...normalizedValue[dayKey], ...updates },
    })
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Horarios de Atencion
      </label>
      <p className="text-sm text-gray-500">
        Configura cada dia por separado para que puedas marcar descansos entre semana y horarios distintos por jornada.
      </p>
      <div className="space-y-4 rounded-xl bg-gray-50 p-4">
        {DAYS.filter(({ key }) => BUSINESS_HOURS_DAYS.includes(key)).map(({ key, label }) => {
          const day = normalizedValue[key]
          return (
            <div key={key} className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <span className="w-36 flex-shrink-0 text-sm font-medium text-gray-700">
                {label}
              </span>

              <label className="flex flex-shrink-0 cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={day.closed}
                  onChange={(e) => updateDay(key, {
                    closed: e.target.checked,
                    ...(e.target.checked ? { open: null, close: null } : {}),
                  })}
                  className="h-4 w-4 rounded border-gray-300 text-red-500 focus:ring-red-500"
                />
                <span className="text-sm text-gray-600">Cerrado</span>
              </label>

              {!day.closed && (
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={day.open || '09:00'}
                    onChange={(e) => updateDay(key, { open: e.target.value })}
                    className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <span className="text-sm text-gray-400">a</span>
                  <input
                    type="time"
                    value={day.close || '18:00'}
                    onChange={(e) => updateDay(key, { close: e.target.value })}
                    className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
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
