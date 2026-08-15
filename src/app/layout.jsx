import './globals.css'
import { BUSINESS, SITE_URL } from '@/lib/config'
import { getSettings } from '@/lib/settings'
import { getPublicCategories } from '@/lib/categories'
import { SettingsProvider } from '@/components/SettingsProvider'
import { CartProvider } from '@/components/CartProvider'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import DemoBanner from '@/components/DemoBanner'
import ScrollToTop from '@/components/ScrollToTop'
import WhatsAppButton from '@/components/WhatsAppButton'
import SubscribePopup from '@/components/SubscribePopup'
import PageViewTracker from '@/components/PageViewTracker'

export const metadata = {
  metadataBase: new URL(SITE_URL),
  // Every browser tab shows exactly "3D Verse BD". The template has no %s, so
  // any page-specific title collapses to this same value site-wide.
  title: {
    default: '3D Verse BD',
    template: '3D Verse BD',
  },
  description:
    'Custom 3D printed anatomical models, keyrings, decor and gifts. Made to order in Sylhet, Bangladesh. Order easily on WhatsApp.',
  keywords: ['3D printing', 'Sylhet', 'anatomical models', 'custom keyrings', 'Bangladesh', '3D Verse', '3DVerse'],
  openGraph: {
    title: `${BUSINESS.name} — Custom 3D Printed Products`,
    description: 'Made-to-order 3D printed products. Order on WhatsApp.',
    url: SITE_URL,
    siteName: BUSINESS.name,
    locale: 'en_US',
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: BUSINESS.name },
  verification: { google: 'GfSE00tB2Iskt-kbkNlIhoYFzxEXvjq5TjQkreii--c' },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-32.png', type: 'image/png', sizes: '32x32' },
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icon-512.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [{ url: '/apple-icon.png', sizes: '180x180' }],
  },
}

export default async function RootLayout({ children }) {
  const settings = await getSettings()
  const categories = await getPublicCategories()
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})()`,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Comfortaa:wght@400;500;600;700&family=Hind+Siliguri:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <SettingsProvider settings={settings}>
          <CartProvider>
            <div className="flex min-h-screen flex-col">
              <DemoBanner />
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer categories={categories} />
            </div>
            <ScrollToTop />
            <WhatsAppButton />
            <SubscribePopup />
            <PageViewTracker />
          </CartProvider>
        </SettingsProvider>
      </body>
    </html>
  )
}
