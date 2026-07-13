import type { Metadata, Viewport } from 'next'
import { Cinzel, EB_Garamond } from 'next/font/google'
import { Providers } from './providers'
import { PWAInstaller } from './components/PWAInstaller'
import './globals.css'

const cinzel = Cinzel({ subsets: ['latin'], variable: '--font-cinzel', weight: ['400', '600', '700'] })
const garamond = EB_Garamond({ subsets: ['latin'], variable: '--font-garamond', style: ['normal', 'italic'] })

export const viewport: Viewport = {
  themeColor: '#C9A84C',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: 'Seminario Wycliffe de Teología — Veritas · Fides · Sapientia',
  description: 'Seminario Reformado de Teología en la tradición de Juan Wycliffe de Oxford. Bachillerato, maestrías y doctorados en teología, estudios bíblicos y ministerio pastoral.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Seminario Wycliffe',
  },
  icons: {
    apple: [
      { url: '/icons/icon-152.png', sizes: '152x152' },
      { url: '/icons/icon-192.png', sizes: '192x192' },
    ],
    icon: [
      { url: '/favicon.png', sizes: '32x32' },
      { url: '/icons/icon-192.png', sizes: '192x192' },
      { url: '/icons/icon-512.png', sizes: '512x512' },
    ],
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'msapplication-TileColor': '#021A38',
    'msapplication-TileImage': '/icons/icon-144.png',
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${cinzel.variable} ${garamond.variable}`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icons/icon-152.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192.png" />
        <meta name="theme-color" content="#C9A84C" />
      </head>
      <body className="bg-[#021A38] text-[#F5EDD8] font-garamond antialiased">
        <Providers>
          {children}
          <PWAInstaller />
        </Providers>
      </body>
    </html>
  )
}
