import type { Metadata } from 'next'
import { Inter_Tight } from 'next/font/google'
import { SpeedInsights } from '@vercel/speed-insights/next'
import '../styles/globals.css'
import { AuthProvider } from './providers'
import { APP_NAME, APP_TAGLINE } from '@/lib/brand'
import * as Sentry from '@sentry/nextjs'

export function generateMetadata(): Metadata {
  return {
    title: `${APP_NAME} - ${APP_TAGLINE}`,
    description: 'A visual neighborhood billboard platform for Freeport and Grand Bahama. Pin your business, get discovered by locals.',
    other: {
      ...Sentry.getTraceData(),
    },
  }
}

const interTight = Inter_Tight({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

// Note: Satoshi font should be loaded via Next.js font loader or CDN
// For now, using Inter Tight as primary, with Satoshi available via CSS variable

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={interTight.variable}>
      <head>
        {/* Preload Satoshi font - replace with actual font URL or use next/font when available */}
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-screen bg-white">
        <AuthProvider>
          {children}
        </AuthProvider>
        <SpeedInsights />
      </body>
    </html>
  )
}

