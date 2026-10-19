import './globals.css'
import { BUSINESS, SITE_URL } from '@/lib/config'
import { getSettings } from '@/lib/settings'
import { getPublicCategories, nonEmptyCategories } from '@/lib/categories'
import { SettingsProvider } from '@/components/SettingsProvider'
import { CartProvider } from '@/components/CartProvider'
import { AuthProvider } from '@/hooks/useAuth'
import { WishlistProvider } from '@/components/WishlistProvider'
import localFont from 'next/font/local'
import MotionProvider from '@/components/MotionProvider'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import DemoBanner from '@/components/DemoBanner'
import ScrollToTop from '@/components/ScrollToTop'
import WhatsAppButton from '@/components/WhatsAppButton'
import SubscribePopup from '@/components/SubscribePopup'
import PageViewTracker from '@/components/PageViewTracker'

// Self-hosted fonts (next/font/local, files in src/fonts): served from our own
// domain and preloaded — no render-blocking request to Google and no
// text jump when the web font arrives.
const inter = localFont({
  src: '../fonts/inter-latin-wght-normal.woff2',
  weight: '100 900',
  display: 'swap',
  variable: '--font-inter',
})
const comfortaa = localFont({
  src: '../fonts/comfortaa-latin-wght-normal.woff2',
  weight: '300 700',
  display: 'swap',
  variable: '--font-comfortaa',
})
// Bengali glyphs only (Latin text uses Inter). The browser downloads these
// files only when a page actually contains Bengali characters.
const hind = localFont({
  src: [
    { path: '../fonts/hind-siliguri-bengali-400-normal.woff2', weight: '400' },
    { path: '../fonts/hind-siliguri-bengali-500-normal.woff2', weight: '500' },
    { path: '../fonts/hind-siliguri-bengali-600-normal.woff2', weight: '600' },
  ],
  display: 'swap',
  preload: false,
  variable: '--font-hind',
  declarations: [{ prop: 'unicode-range', value: 'U+0951-0952, U+0964-0965, U+0980-09FE, U+1CD0, U+1CD2, U+1CD5-1CD6, U+1CD8, U+1CE1, U+1CEA, U+1CED, U+1CF2, U+1CF5-1CF7, U+200C-200D, U+20B9, U+25CC, U+A8F1' }],
})

export const metadata = {
  metadataBase: new URL(SITE_URL),
  // Pages set their own title; the template adds the brand once at the end,
  // e.g. "Human Heart Model 3D Printed | 3D Verse BD".
  title: {
    default: '3D Verse BD | 3D Printing in Bangladesh',
    template: '%s | 3D Verse BD',
  },
  description:
    '3D printed anatomical and bone models, Islamic décor, desk organisers and phone stands, made to order and delivered across Bangladesh. Order online: delivery charge via bKash, product price cash on delivery.',
  keywords: ['3D printing Bangladesh', 'custom 3D printing', 'anatomical models', 'bone models', 'medical models Bangladesh', 'Islamic decor', 'phone stand', 'pen holder', '3D Verse', '3DVerse', '৩ডি প্রিন্টিং'],
  openGraph: {
    title: '3D Verse BD | 3D Printing in Bangladesh',
    description: 'Made-to-order 3D printed products, delivered across Bangladesh. Order online: delivery charge via bKash, product price cash on delivery.',
    url: SITE_URL,
    siteName: '3D Verse BD',
    locale: 'en_US',
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: '3D Verse BD | 3D Printing in Bangladesh' },
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
  const [settings, categories] = await Promise.all([getSettings(), getPublicCategories()])
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${comfortaa.variable} ${hind.variable}`}>
      <head>
        {/* Product photos come from Supabase Storage: open that connection
            while the HTML is still parsing, so the first images (the LCP on
            shop/product pages) don't wait for DNS + TLS on slow networks. */}
        {process.env.NEXT_PUBLIC_SUPABASE_URL && <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} />}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var p=location.pathname;if(p==='/bn'||p.indexOf('/bn/')===0){document.documentElement.lang='bn'}}catch(e){}})();(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})()`,
          }}
        />
      </head>
      <body>
        <SettingsProvider settings={settings}>
          <AuthProvider>
          <WishlistProvider>
          <CartProvider>
            <MotionProvider>
              <div className="flex min-h-screen flex-col">
                <DemoBanner />
                <Navbar />
                <main className="flex-1">{children}</main>
                <Footer categories={nonEmptyCategories(categories)} />
              </div>
              <ScrollToTop />
              <WhatsAppButton />
              <SubscribePopup />
              <PageViewTracker />
            </MotionProvider>
          </CartProvider>
          </WishlistProvider>
          </AuthProvider>
        </SettingsProvider>
      </body>
    </html>
  )
}
