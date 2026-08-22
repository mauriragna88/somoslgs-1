import { redirect } from 'next/navigation'

/* La sección de planes B2B ahora vive en /para-negocios.
   /planes redirige para no romper enlaces existentes. */
export default function PlanesRedirectPage() {
  redirect('/para-negocios')
}
