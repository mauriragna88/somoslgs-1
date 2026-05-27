'use client'

import { usePathname } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import WhatsAppFloat from '@/components/WhatsAppFloat'

const INTERNAL_PREFIXES = ['/admin', '/dashboard']

export default function PublicShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isInternal = INTERNAL_PREFIXES.some(prefix => pathname.startsWith(prefix))

  if (isInternal) {
    return <>{children}</>
  }

  return (
    <>
      <Header />
      {children}
      <Footer />
      <WhatsAppFloat />
    </>
  )
}
