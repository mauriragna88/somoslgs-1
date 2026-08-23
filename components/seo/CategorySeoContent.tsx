import Link from 'next/link'

/* ═══════════════════════════════════════════════════════════
   CategorySeoContent — bloque de texto SEO local
   Genera contenido descriptivo rico en keywords + enlaces
   internos a colonias relevantes y otras categorías.
   Solo se renderiza en el servidor (HTML indexable).
   ═══════════════════════════════════════════════════════════ */

interface CategorySeoContentProps {
  categoryName: string
  categorySlug: string
  businessCount: number
  neighborhoods?: string[]
}

export default function CategorySeoContent({
  categoryName,
  categorySlug,
  businessCount,
  neighborhoods = [],
}: CategorySeoContentProps) {
  const nameLower = categoryName.toLowerCase()
  const countText = businessCount > 0 ? `${businessCount}` : 'muchos'

  return (
    <div
      className="mt-14 rounded-3xl p-8 md:p-10"
      style={{ background: 'var(--ivory)', border: '1px solid rgba(6,60,103,0.08)' }}
    >
      <h2
        className="text-2xl md:text-3xl font-black mb-4"
        style={{ fontFamily: 'var(--display)', color: 'var(--ink)' }}
      >
        {categoryName} en Lagos de Moreno, Jalisco
      </h2>
      <div className="space-y-4 text-sm md:text-[15px] leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
        <p>
          Lagos de Moreno, <strong className="font-semibold" style={{ color: 'var(--ink)' }}>Pueblo Mágico</strong> de
          Jalisco, es el hogar de {countText} negocios de <strong className="font-semibold" style={{ color: 'var(--ink)' }}>{nameLower}</strong> que
          forman parte del directorio SomosLagos. Ya sea que busques <strong>{nameLower}</strong> cerca de tu casa o en el
          centro histórico, aquí encuentras opciones con <strong>horarios actualizados</strong>, <strong>ubicación en el mapa</strong>,
          <strong> WhatsApp directo</strong> y <strong>opiniones reales</strong> de otros clientes del Pueblo Mágico.
        </p>
        <p>
          La oferta de {nameLower} en Lagos de Moreno es tan variada como su gente. Las familias altenas y los visitantes
          pueden disfrutar de opciones que combinan tradición y modernidad. En SomosLagos cada negocio de {nameLower} muestra
          su <strong>dirección exacta</strong>, <strong>teléfono</strong> y <strong>redes sociales</strong>, para que lo contactes
          en un solo clic sin intermediarios.
        </p>

        {neighborhoods.length > 0 && (
          <>
            <p>
              Las colonias con más negocios de {nameLower} son:{' '}
              {neighborhoods.slice(0, 6).map((n, i) => (
                <span key={n}>
                  <Link
                    href={`/negocios-en/${encodeURIComponent(n)}`}
                    className="font-semibold underline decoration-2 underline-offset-2 hover:opacity-70"
                    style={{ color: 'var(--coral)' }}
                  >
                    {n}
                  </Link>
                  {i < Math.min(neighborhoods.length, 6) - 1 ? ', ' : '.'}
                </span>
              ))}
            </p>
          </>
        )}

        <p>
          ¿Tienes un negocio de {nameLower} en Lagos de Moreno? Regístralo gratis en SomosLagos y aparece en las búsquedas
          locales de Google cuando alguien busque {nameLower} en el Pueblo Mágico. La plataforma es 100% gratuita para empezar
          y solo mejora la visibilidad de tu negocio alteño.
        </p>
      </div>
    </div>
  )
}
