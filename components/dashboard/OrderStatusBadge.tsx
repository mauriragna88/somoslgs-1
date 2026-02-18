interface OrderStatusBadgeProps {
  status: string
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pendiente', color: 'text-yellow-800', bg: 'bg-yellow-100' },
  confirmed: { label: 'Confirmado', color: 'text-blue-800', bg: 'bg-blue-100' },
  preparing: { label: 'Preparando', color: 'text-purple-800', bg: 'bg-purple-100' },
  ready: { label: 'Listo', color: 'text-indigo-800', bg: 'bg-indigo-100' },
  delivering: { label: 'En Camino', color: 'text-orange-800', bg: 'bg-orange-100' },
  completed: { label: 'Completado', color: 'text-green-800', bg: 'bg-green-100' },
  cancelled: { label: 'Cancelado', color: 'text-red-800', bg: 'bg-red-100' },
}

export default function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const config = statusConfig[status] || { label: status, color: 'text-gray-800', bg: 'bg-gray-100' }

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.color} ${config.bg}`}>
      {config.label}
    </span>
  )
}
