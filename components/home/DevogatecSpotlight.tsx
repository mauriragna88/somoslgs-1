import Link from 'next/link'

export default function DevogatecSpotlight() {
  return (
    <section className="sl-devogatec-v2" aria-labelledby="sl-devogatec-title">
      <div className="sl-devogatec-mark" aria-hidden="true">DEVOGATEC</div>
      <div>
        <p className="sl-eyebrow">Una forma de crecer</p>
        <h2 id="sl-devogatec-title">Tu negocio,<br /><em>con más alcance.</em></h2>
        <p className="sl-devogatec-copy">Herramientas y acompañamiento para que tu presencia digital trabaje a favor de tu negocio.</p>
        <Link href="/para-negocios" className="sl-devogatec-action">Conocer para negocios <span aria-hidden="true">→</span></Link>
      </div>
      <aside className="sl-devogatec-note"><span>Spotlight editorial</span><strong>Visibilidad que<br />se siente local.</strong><small>Espacio promocional identificado. No altera el orden del directorio.</small></aside>
    </section>
  )
}
