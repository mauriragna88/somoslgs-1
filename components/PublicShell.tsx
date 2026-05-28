'use client'

import { usePathname } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import WhatsAppFloat from '@/components/WhatsAppFloat'

const INTERNAL_PREFIXES = ['/admin', '/dashboard']

// Home page has a full-bleed hero — header intentionally overlaps it
const NO_HEADER_OFFSET = ['/']

export default function PublicShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isInternal = INTERNAL_PREFIXES.some(prefix => pathname.startsWith(prefix))

  if (isInternal) {
    return <>{children}</>
  }

  const needsOffset = !NO_HEADER_OFFSET.includes(pathname)

  return (
    <>
      <Header />
      <div className={needsOffset ? 'pt-24' : ''}>
        {children}
      </div>
      <Footer />
      <WhatsAppFloat />
    </>
  )
}
