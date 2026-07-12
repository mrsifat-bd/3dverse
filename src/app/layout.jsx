import './globals.css'
import { BUSINESS, SITE_URL } from '@/lib/config'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import DemoBanner from '@/components/DemoBanner'

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${BUSINESS.name} — Custom 3D Printed Products`,
    template: `%s · ${BUSINESS.name}`,
  },
  description:
    'Custom 3D printed anatomical models, keyrings, decor and gifts. Made to order in Sylhet, Bangladesh. Order easily on WhatsApp.',
  keywords: ['3D printing', 'Sylhet', 'anatomical models', 'custom keyrings', 'Bangladesh', '3DVerse'],
  openGraph: {
    title: `${BUSINESS.name} — Custom 3D Printed Products`,
    description: 'Made-to-order 3D printed products. Order on WhatsApp.',
    url: SITE_URL,
    siteName: BUSINESS.name,
    locale: 'en_US',
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: BUSINESS.name },
  icons: { icon: '/favicon.svg' },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@500;600;700&family=Hind+Siliguri:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="flex min-h-screen flex-col">
          <DemoBanner />
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  )
}
