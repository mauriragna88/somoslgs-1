import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Iniciar Sesión',
  description: 'Inicia sesión en SomosLagos para gestionar tu negocio, hacer pedidos y más.',
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
