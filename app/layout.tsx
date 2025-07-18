import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'v0 App',
  description: 'Created with v0',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="google-site-verification" content="BhI47sT8D14KGEqKB-lA7IW-XTtiZzbQcFrSVc1ssZg" />
      </head>
      <body>{children}</body>
    </html>
  )
}
