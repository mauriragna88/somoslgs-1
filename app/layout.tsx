import type { Metadata } from 'next'
import { Inter, Bricolage_Grotesque, DM_Sans, Instrument_Serif } from 'next/font/google'
import { Toaster } from 'sonner'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'
import PublicShell from '@/components/PublicShell'
import PWARegister from '@/components/PWARegister'

const inter = Inter({ subsets: ['latin'] })
const bricolageGrotesque = Bricolage_Grotesque({ subsets: ['latin'], display: 'swap', variable: '--font-display' })
const dmSans = DM_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-body' })
const instrumentSerif = Instrument_Serif({ subsets: ['latin'], display: 'swap', variable: '--font-serif', weight: '400' })

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
  openGraph: {
    type: 'website',
    locale: 'es_MX',
    siteName: 'SomosLagos',
    title: 'SomosLagos - Encuentra negocios en Lagos de Moreno',
    description: 'La plataforma digital de Lagos de Moreno. Descubre negocios locales, pide productos y conecta con tu comunidad.',
    url: 'https://www.somoslagos.com.mx',
    images: [
      {
        url: 'https://www.somoslagos.com.mx/tourism/panoramica-lagos.jpg',
        width: 1200,
        height: 630,
        alt: 'Lagos de Moreno, Pueblo Mágico de Jalisco',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SomosLagos - Encuentra negocios en Lagos de Moreno',
    description: 'La plataforma digital de Lagos de Moreno. Descubre negocios locales, pide productos y conecta con tu comunidad.',
    images: ['https://www.somoslagos.com.mx/tourism/panoramica-lagos.jpg'],
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SomosLagos',
  },
  other: {
    'theme-color': '#D96E33',
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'SomosLagos',
              url: 'https://www.somoslagos.com.mx',
              description: 'La plataforma digital de Lagos de Moreno',
              potentialAction: {
                '@type': 'SearchAction',
                target: {
                  '@type': 'EntryPoint',
                  urlTemplate: 'https://www.somoslagos.com.mx/buscar?q={search_term_string}',
                },
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
        {process.env.NEXT_PUBLIC_ADSENSE_ID && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_ID}`}
            crossOrigin="anonymous"
          />
        )}
      </head>
      <body className={`${bricolageGrotesque.variable} ${dmSans.variable} ${instrumentSerif.variable} ${inter.className}`}>
        <PublicShell>
          {children}
        </PublicShell>
        <Toaster richColors position="top-right" />
        <PWARegister />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
