import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Chez OSI | Les saveurs qui font revenir',
  description: 'Découvrez nos spécialités : chawarmas et dèguè au couscous. Commandez sur place, en drive ou en livraison à Godomey, Bénin.',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className="scroll-smooth">
      <body className={`${inter.className} bg-charcoal-900 text-charcoal-50 antialiased selection:bg-orange-500/30 selection:text-orange-50`}>
        {children}
      </body>
    </html>
  )
}
