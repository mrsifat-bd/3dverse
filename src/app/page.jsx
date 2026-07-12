import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { BUSINESS, CATEGORIES } from '@/lib/config'
import { getFeaturedProducts } from '@/lib/products'
import ProductGrid from '@/components/ProductGrid'
import SocialLinks from '@/components/SocialLinks'
import BuyButton from '@/components/BuyButton'
import { IconWhatsapp } from '@/components/icons'
import { FadeIn, Stagger, StaggerItem } from '@/components/Motion'

export const revalidate = 60

export default async function Home() {
  const featured = await getFeaturedProducts(8)

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-line">
        <div className="container grid items-center gap-10 py-16 md:grid-cols-2 md:py-24">
          <FadeIn>
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-3 py-1 text-xs text-stone">
              <span className="h-1.5 w-1.5 rounded-full bg-clay" /> Made to order in {BUSINESS.location}
            </span>
            <h1 className="mt-5 font-display text-4xl font-semibold leading-tight text-ink sm:text-5xl">
              Custom 3D printed products, <span className="text-clay">made for you</span>.
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-stone">
              Anatomical models, personalised keyrings, home decor and gifts — designed and printed on
              demand. Browse the catalog and order in seconds over WhatsApp.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/shop" className="btn-primary">Browse products <ArrowRight className="h-4 w-4" /></Link>
              <a href={`https://wa.me/${BUSINESS.whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="btn-ghost">
                <IconWhatsapp className="h-4 w-4" /> Chat with us
              </a>
            </div>
            <SocialLinks className="mt-8" />
          </FadeIn>

          <FadeIn delay={0.1} className="relative">
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-line bg-paper">
              <Image src="https://placehold.co/900x680/E7E2D6/8A8577?text=3DVerse" alt="3D printed products by 3DVerse" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" priority />
            </div>
            <div className="absolute -bottom-5 -left-5 hidden rounded-2xl border border-line bg-cream px-5 py-4 sm:block">
              <p className="font-display text-2xl font-semibold text-ink">100%</p>
              <p className="text-xs text-stone">Made to order</p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Categories */}
      <section className="container py-16">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold text-ink">Shop by category</h2>
            <p className="mt-1 text-sm text-stone">Find exactly what you&apos;re looking for.</p>
          </div>
          <Link href="/shop" className="hidden text-sm font-medium text-clay hover:underline sm:block">View all →</Link>
        </div>
        <Stagger className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((c) => (
            <StaggerItem key={c.slug}>
              <Link href={`/category/${c.slug}`} className="group block h-full rounded-2xl border border-line bg-paper p-6 transition-all hover:-translate-y-0.5 hover:border-clay/40">
                <h3 className="font-display text-lg font-semibold text-ink group-hover:text-clay">{c.name}</h3>
                <p className="mt-2 text-sm text-stone">{c.blurb}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-clay">Explore <ArrowRight className="h-4 w-4" /></span>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* Featured */}
      <section className="container pb-16">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-2xl font-semibold text-ink">Featured products</h2>
          <Link href="/shop" className="text-sm font-medium text-clay hover:underline">View all →</Link>
        </div>
        <div className="mt-8">
          <ProductGrid products={featured} />
        </div>
      </section>

      {/* Brand intro / CTA */}
      <section className="border-t border-line bg-paper">
        <div className="container grid items-center gap-8 py-16 md:grid-cols-[1.2fr_1fr]">
          <FadeIn>
            <h2 className="font-display text-2xl font-semibold text-ink">Designed and printed in Sylhet</h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-stone">{BUSINESS.description}</p>
            <Link href="/about" className="btn-ghost mt-6">Our story <ArrowRight className="h-4 w-4" /></Link>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="rounded-2xl border border-line bg-cream p-8">
              <h3 className="font-display text-lg font-semibold text-ink">Ordering is simple</h3>
              <ol className="mt-4 space-y-3 text-sm text-stone">
                <li className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-clay text-xs font-medium text-paper">1</span> Browse and pick a product.</li>
                <li className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-clay text-xs font-medium text-paper">2</span> Tap &ldquo;Buy Now on WhatsApp&rdquo;.</li>
                <li className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-clay text-xs font-medium text-paper">3</span> We confirm your order and deliver.</li>
              </ol>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  )
}
