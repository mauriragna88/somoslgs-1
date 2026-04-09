import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import { Toaster } from 'sonner'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import CartButton from '@/components/cart/CartButton'
import CartDrawer from '@/components/cart/CartDrawer'
import PWARegister from '@/components/PWARegister'
import WhatsAppFloat from '@/components/WhatsAppFloat'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'SomosLagos - Encuentra negocios en Lagos de Moreno',
    template: '%s | SomosLagos',
  },
  description: 'La plataforma digital de Lagos de Moreno. Descubre negocios locales, pide productos y conecta con tu comunidad.',
  keywords: ['Lagos de Moreno', 'negocios locales', 'directorio', 'restaurantes', 'tiendas', 'servicios', 'Jalisco', 'SomosLagos'],
  metadataBase: new URL('https://www.somoslagos.com.mx'),
  verification: {
    google: '7oumsaVSEVPXWZ28wu1vd8Dgvr1H5aQ10aRl30KEp-Q',
  },
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
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SomosLagos',
  },
  other: {
    'theme-color': '#0F766E',
    'mobile-web-app-capable': 'yes',
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
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        {process.env.NEXT_PUBLIC_ADSENSE_ID && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_ID}`}
            crossOrigin="anonymous"
          />
        )}
      </head>
      <body className={inter.className}>
        <Header />
        {children}
        <Footer />
        <CartButton />
        <CartDrawer />
        <Toaster richColors position="top-right" />
        <WhatsAppFloat />
        <PWARegister />
        <Analytics />
        <SpeedInsights />
        {process.env.NEXT_PUBLIC_GA4_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA4_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA4_ID}');
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  )
}
