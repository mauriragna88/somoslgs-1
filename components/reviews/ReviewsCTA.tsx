import Link from 'next/link'

export default function ReviewsCTA() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-amber-50 to-primary/5 border border-primary/10 p-8 text-center">
      {/* Decorative stars */}
      <div className="absolute top-4 left-6 text-amber-200 text-2xl opacity-60">&#9733;</div>
      <div className="absolute top-8 right-10 text-amber-200 text-lg opacity-40">&#9733;</div>
      <div className="absolute bottom-6 left-16 text-primary/10 text-3xl">&#9733;</div>
      <div className="absolute bottom-4 right-6 text-amber-200 text-xl opacity-50">&#9733;</div>

      <div className="relative">
        <h3 className="text-xl font-bold text-secondary mb-2">Comparte tu experiencia</h3>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          Tu opinion ayuda a otros a encontrar los mejores negocios en Lagos de Moreno
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/registro"
            className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-primary to-primary-dark text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary/20 transition-all"
          >
            Crear cuenta gratis
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-6 py-3 border-2 border-primary/30 text-primary font-semibold rounded-xl hover:bg-primary/5 transition-all"
          >
            Ya tengo cuenta
          </Link>
        </div>

        <p className="text-xs text-gray-400 mt-4">Registrarte es gratis y solo toma un minuto</p>
      </div>
    </div>
  )
}
