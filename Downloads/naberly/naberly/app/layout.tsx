// app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Naberly JA — Your Naberhood at your fingertips',
  description: 'Connecting Jamaican neighbors with food, work, and help — free to post, always.',
  manifest: '/manifest.json',
  themeColor: '#1B3A1D',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'Naberly JA',
    description: 'No one in your Naberhood should go hungry.',
    url: 'https://naberlyja.com',
    siteName: 'Naberly JA',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
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
