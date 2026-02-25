import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import CartProvider from '@/components/cart/CartProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'SomosLagos - Encuentra negocios en Lagos de Moreno',
    template: '%s | SomosLagos',
  },
  description: 'La plataforma digital de Lagos de Moreno. Descubre negocios locales, pide productos y conecta con tu comunidad.',
  keywords: ['Lagos de Moreno', 'negocios locales', 'directorio', 'restaurantes', 'tiendas', 'servicios', 'Jalisco', 'SomosLagos'],
  metadataBase: new URL('https://www.somoslagos.com.mx'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'es_MX',
    siteName: 'SomosLagos',
    title: 'SomosLagos - Encuentra negocios en Lagos de Moreno',
    description: 'La plataforma digital de Lagos de Moreno. Descubre negocios locales, pide productos y conecta con tu comunidad.',
    url: 'https://www.somoslagos.com.mx',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SomosLagos - Encuentra negocios en Lagos de Moreno',
    description: 'La plataforma digital de Lagos de Moreno. Descubre negocios locales, pide productos y conecta con tu comunidad.',
  },
  other: {
    'theme-color': '#0F766E',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        {process.env.NEXT_PUBLIC_ADSENSE_ID && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_ID}`}
            crossOrigin="anonymous"
          />
        )}
      </head>
      <body className={inter.className}>
        <CartProvider>
          <Header />
          {children}
          <Footer />
          <Toaster richColors position="top-right" />
        </CartProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
