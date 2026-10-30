import { HOME_FAQ } from '@/lib/home/faq'

/* Preguntas frecuentes visibles. Usa <details> nativo: funciona sin JavaScript,
   con teclado y lectores de pantalla, y el contenido queda en el HTML para Google. */
export default function HomeFaq() {
  return (
    <section
      aria-labelledby="home-faq-title"
      className="py-20 md:py-24"
      style={{ background: 'linear-gradient(180deg,#f8e4d3,#fffaf4)' }}
    >
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <span
              className="inline-block px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest mb-4"
              style={{
                background: 'rgba(217,110,51,0.12)',
                color: 'var(--logo-terracotta)',
                border: '1px solid rgba(217,110,51,0.28)',
              }}
            >
              Preguntas frecuentes
            </span>
            <h2
              id="home-faq-title"
              className="text-3xl md:text-4xl font-black"
              style={{ fontFamily: 'var(--display)', color: 'var(--logo-navy-deep)' }}
            >
              Lo que más nos preguntan sobre{' '}
              <em
                style={{
                  color: 'var(--logo-terracotta)',
                  fontFamily: 'var(--font-serif), Georgia, serif',
                  fontWeight: 400,
                }}
              >
                SomosLagos
              </em>
            </h2>
          </div>

          <div className="space-y-3">
            {HOME_FAQ.map(item => (
              <details
                key={item.question}
                className="group rounded-2xl overflow-hidden"
                style={{
                  background: 'rgba(255,255,255,0.9)',
                  border: '1px solid rgba(10,65,114,0.12)',
                  boxShadow: '0 1px 6px rgba(10,65,114,0.06)',
                }}
              >
                <summary
                  className="flex items-center justify-between gap-4 cursor-pointer list-none px-5 min-h-14 py-3 font-semibold text-base [&::-webkit-details-marker]:hidden focus-visible:outline-2 focus-visible:outline-offset-2"
                  style={{ color: 'var(--logo-navy-deep)', outlineColor: 'var(--logo-terracotta)' }}
                >
                  {item.question}
                  <span
                    aria-hidden="true"
                    className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-lg leading-none transition-transform duration-200 group-open:rotate-45"
                    style={{ background: 'rgba(217,110,51,0.14)', color: 'var(--logo-terracotta)' }}
                  >
                    +
                  </span>
                </summary>
                <p className="px-5 pb-5 text-base leading-relaxed" style={{ color: '#3d4f63' }}>
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
