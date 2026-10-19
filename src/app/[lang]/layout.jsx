import { notFound } from 'next/navigation'
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
  return (
    <>
      <LangSync lang={params.lang} />
      {children}
    </>
  )
}
