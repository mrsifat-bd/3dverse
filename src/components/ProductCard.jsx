'use client'
import Link from './LocalizedLink'
import { formatPrice, firstImage, hasDiscount, effectivePrice, localized } from '@/lib/format'
import { useLang, useT } from '@/i18n/client'
import { categoryName } from '@/lib/config'
import { Badge } from './ui/badge'
import WishlistButton from './WishlistButton'
import ProductImage from './ProductImage'

// `priority`: first cards of a grid (above the fold) load eagerly at high
// priority — they are usually the page's LCP image on phones.
export default function ProductCard({ product, priority = false }) {
  const image = firstImage(product)
  const lang = useLang()
  const t = useT()
  const name = localized(product, 'name', lang)
  return (
    <Link
      href={`/product/${product.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-paper transition-[transform,border-color,box-shadow] duration-300 ease-out hover:-translate-y-1.5 hover:border-clay/40 hover:shadow-xl hover:shadow-black/5 active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay/50 focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
    >
      <div className="relative aspect-square overflow-hidden bg-line/40">
        <ProductImage
          src={image}
          variant="card"
          priority={priority}
          alt={name}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
        />
        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {product.is_popular && (
            <span className="rounded-full bg-clay px-2.5 py-0.5 text-xs font-medium text-paper">★ {t('product.popular')}</span>
          )}
          {hasDiscount(product) && (
            <span className="rounded-full bg-clay px-2.5 py-0.5 text-xs font-medium text-paper">-{product.discount_percent}%</span>
          )}
          {!product.in_stock && (
            <Badge variant="solid">{t('product.madeToOrder')}</Badge>
          )}
        </div>
        <div className="absolute right-3 top-3">
          <WishlistButton productId={product.id} />
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-[11px] uppercase tracking-wide text-stone">{product.category_name || categoryName(product.category)}</p>
        <h3 className="mt-1 line-clamp-2 text-sm font-medium text-ink">{name}</h3>
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="flex items-baseline gap-1.5">
            <span className="text-base font-semibold text-ink">{formatPrice(effectivePrice(product), lang)}</span>
            {hasDiscount(product) && (
              <span className="text-xs text-stone line-through">{formatPrice(product.price, lang)}</span>
            )}
          </span>
          <span className="text-xs font-medium text-clay opacity-0 transition-opacity group-hover:opacity-100">{t('product.view')} →</span>
        </div>
      </div>
    </Link>
  )
}
