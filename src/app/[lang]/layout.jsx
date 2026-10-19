import { notFound } from 'next/navigation'
import ReactDOM from 'react-dom'
import { LOCALES, isLocale } from '@/i18n/config'
import LangSync from '@/components/LangSync'

// Every customer page exists twice: /shop (English, the original URL) and
// /bn/shop (Bangla). The middleware maps /shop to /en/shop internally, so the
// public English URLs never change. Both versions are built statically; any
// other first segment is rejected below. (No dynamicParams=false here: it would
// be inherited by product/category pages and 404 products added after a deploy.)
export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }))
}

export default function LangLayout({ children, params }) {
  if (!isLocale(params.lang)) notFound()
  // Bangla pages: start the Bangla font downloads with the HTML instead of
  // after the CSS, so headings don't paint late or jump when it arrives.
  if (params.lang === 'bn') {
    for (const w of ['400', '600']) {
      ReactDOM.preload(`/fonts/hind-siliguri-bengali-${w}.woff2`, { as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' })
    }
  }
  return (
    <>
      <LangSync lang={params.lang} />
      {children}
    </>
  )
}
