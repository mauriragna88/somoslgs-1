import Link from 'next/link'

export default function ReviewsCTA() {
  return (
    <div className="relative overflow-hidden rounded-2xl border p-8 text-center" style={{ background: 'linear-gradient(135deg, rgba(255,107,53,0.05), #fffbeb, rgba(255,107,53,0.05))', borderColor: 'rgba(255,107,53,0.1)' }}>
      {/* Decorative stars */}
      <div className="absolute top-4 left-6 text-amber-200 text-2xl opacity-60">&#9733;</div>
      <div className="absolute top-8 right-10 text-amber-200 text-lg opacity-40">&#9733;</div>
      <div className="absolute bottom-6 left-16 text-3xl" style={{ color: 'rgba(255,107,53,0.1)' }}>&#9733;</div>
      <div className="absolute bottom-4 right-6 text-amber-200 text-xl opacity-50">&#9733;</div>

      <div className="relative">
        <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--ink)' }}>Comparte tu experiencia</h3>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          Tu opinion ayuda a otros a encontrar los mejores negocios en Lagos de Moreno
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/registro"
            className="inline-flex items-center justify-center px-6 py-3 text-white font-semibold rounded-xl hover:shadow-lg transition-all" style={{ background: 'linear-gradient(135deg, var(--coral), #E2541F)' }}
          >
            Crear cuenta gratis
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-6 py-3 border-2 font-semibold rounded-xl transition-all" style={{ borderColor: 'rgba(255,107,53,0.3)', color: 'var(--coral)' }}
          >
            Ya tengo cuenta
          </Link>
        </div>

        <p className="text-xs text-gray-400 mt-4">Registrarte es gratis y solo toma un minuto</p>
      </div>
    </div>
  )
}
