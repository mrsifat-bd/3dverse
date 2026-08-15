import Link from 'next/link'
import Image from 'next/image'
import { formatPrice, firstImage, hasDiscount, effectivePrice } from '@/lib/format'
import { categoryName } from '@/lib/config'
import { Badge } from './ui/badge'
import WishlistButton from './WishlistButton'

export default function ProductCard({ product }) {
  const image = firstImage(product)
  return (
    <Link
      href={`/product/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-paper transition-all duration-300 hover:-translate-y-1.5 hover:border-clay/40 hover:shadow-xl hover:shadow-black/5 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay/50 focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
    >
      <div className="relative aspect-square overflow-hidden bg-line/40">
        {image ? (
          <Image
            src={image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-stone">No image</div>
        )}
        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {product.is_popular && (
            <span className="rounded-full bg-clay px-2.5 py-0.5 text-xs font-medium text-paper">★ Popular</span>
          )}
          {hasDiscount(product) && (
            <span className="rounded-full bg-clay px-2.5 py-0.5 text-xs font-medium text-paper">-{product.discount_percent}%</span>
          )}
          {!product.in_stock && (
            <Badge variant="solid">Made to order</Badge>
          )}
        </div>
        <div className="absolute right-3 top-3">
          <WishlistButton productId={product.id} />
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-[11px] uppercase tracking-wide text-stone">{categoryName(product.category)}</p>
        <h3 className="mt-1 line-clamp-2 text-sm font-medium text-ink">{product.name}</h3>
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="flex items-baseline gap-1.5">
            <span className="text-base font-semibold text-ink">{formatPrice(effectivePrice(product))}</span>
            {hasDiscount(product) && (
              <span className="text-xs text-stone line-through">{formatPrice(product.price)}</span>
            )}
          </span>
          <span className="text-xs font-medium text-clay opacity-0 transition-opacity group-hover:opacity-100">View →</span>
        </div>
      </div>
    </Link>
  )
}
