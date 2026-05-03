import type { Metadata, Viewport } from 'next'
import './globals.css'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#1B3A1D',
}

export const metadata: Metadata = {
  title: 'Naberly JA',
  description: 'Your Naberhood at your fingertips. Food, work, rides and urgent help — parish by parish across Jamaica.',
  applicationName: 'Naberly JA',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Naberly JA',
  },
  formatDetection: {
    telephone: false,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
