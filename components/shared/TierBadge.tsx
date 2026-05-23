interface TierBadgeProps {
  tier: string
  className?: string
}

const TIER_CONFIG: Record<string, { label: string; bg: string; text: string; icon: string }> = {
  avanzado: {
    label: 'Verificado',
    bg: 'bg-gradient-to-r from-pueblo-barroco to-yellow-600/80',
    text: 'text-pueblo-noche',
    icon: 'check-badge',
  },
  pro: {
    label: 'PRO',
    bg: 'bg-pueblo-cantera',
    text: 'text-pueblo-crema',
    icon: 'star',
  },
  emprendedor: {
    label: '',
    bg: '',
    text: '',
    icon: '',
  },
  gratis: {
    label: '',
    bg: '',
    text: '',
    icon: '',
  },
}

export default function TierBadge({ tier, className = '' }: TierBadgeProps) {
  const config = TIER_CONFIG[tier]
  if (!config || !config.label) return null

  if (tier === 'avanzado') {
    return (
      <span className={`pueblo-wax-seal ${className}`}>
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        {config.label}
      </span>
    )
  }

  if (tier === 'pro') {
    return (
      <span className={`inline-flex items-center gap-1 ${config.bg} ${config.text} text-[10px] font-bold px-2.5 py-1 rounded-md shadow-sm tracking-wide uppercase ${className}`}>
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        {config.label}
      </span>
    )
  }

  return null
}