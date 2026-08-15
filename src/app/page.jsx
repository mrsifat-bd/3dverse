import Link from 'next/link'
import { ArrowRight, Flame, Bone, Cpu, Fish, PenTool, Lamp, Gift } from 'lucide-react'
import { getFeaturedProducts } from '@/lib/products'
import { getPublicCategories } from '@/lib/categories'
import { getSettings } from '@/lib/settings'
import ProductGrid from '@/components/ProductGrid'
import SocialLinks from '@/components/SocialLinks'
import HeroPanel from '@/components/HeroPanel'
import { IconWhatsapp } from '@/components/icons'
import { FadeIn, Stagger, StaggerItem } from '@/components/Motion'

const CATEGORY_ICONS = {
  'medical-bone-models': Bone,
  gadgets: Cpu,
  aquarium: Fish,
  'desk-accessories': PenTool,
  'home-decor': Lamp,
  gifts: Gift,
}

export const revalidate = 60

export const metadata = {
  alternates: { canonical: '/' },
}

export default async function Home() {
  const featured = await getFeaturedProducts(8)
  const s = await getSettings()
  const cats = await getPublicCategories()
  const CATEGORY_CARDS = [
    { name: 'Popular', blurb: 'Our most-loved, best-selling prints — start here.', href: '/shop?popular=1', Icon: Flame, featured: true },
    ...cats.map((c) => ({ name: c.name, blurb: c.blurb, href: `/category/${c.slug}`, Icon: CATEGORY_ICONS[c.slug] || Flame })),
  ]

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-line">
        <div className="container grid items-center gap-10 py-16 md:grid-cols-2 md:py-24">
          <FadeIn>
            <h1 className="font-display text-4xl font-semibold leading-tight text-ink sm:text-5xl">
              {s.hero_headline}
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-stone">
              {s.hero_subtext}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/shop" className="btn-primary">Browse products <ArrowRight className="h-4 w-4" /></Link>
              <a href={`https://wa.me/${s.whatsapp_number}`} target="_blank" rel="noopener noreferrer" className="btn-ghost">
                <IconWhatsapp className="h-4 w-4" /> Chat with us
              </a>
            </div>
            <SocialLinks className="mt-8" />
          </FadeIn>

          <FadeIn delay={0.1} className="relative">
            <HeroPanel />
            <div className="absolute -bottom-5 -left-5 hidden rounded-2xl border border-line bg-cream px-5 py-4 shadow-lg shadow-black/5 sm:block">
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
        <Stagger className="mt-8 flex flex-wrap justify-center gap-4">
          {CATEGORY_CARDS.map((c) => (
            <StaggerItem key={c.href} className="w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.667rem)]">
              <Link
                href={c.href}
                className={`group block h-full rounded-2xl border bg-paper p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-clay/40 hover:shadow-xl hover:shadow-black/5 active:scale-[0.99] ${c.featured ? 'border-clay/40' : 'border-line'}`}
              >
                <span className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-clay/10 text-clay transition-transform duration-300 group-hover:scale-110">
                  <c.Icon className="h-5 w-5" />
                </span>
                <h3 className="font-display text-lg font-semibold text-ink transition-colors group-hover:text-clay">{c.name}</h3>
                <p className="mt-2 text-sm text-stone">{c.blurb}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-clay">Explore <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" /></span>
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
            <h2 className="font-display text-2xl font-semibold text-ink">Designed and printed in {s.location}</h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-stone">{s.description}</p>
            <Link href="/about" className="btn-ghost mt-6">Our story <ArrowRight className="h-4 w-4" /></Link>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="rounded-2xl border border-line bg-cream p-8">
              <h3 className="font-display text-lg font-semibold text-ink">Ordering is simple</h3>
              <ol className="mt-4 space-y-3 text-sm text-stone">
                <li className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-clay text-xs font-medium text-paper">1</span> Browse and add products to your cart.</li>
                <li className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-clay text-xs font-medium text-paper">2</span> Check out &mdash; prepay only the delivery charge via bKash.</li>
                <li className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-clay text-xs font-medium text-paper">3</span> We confirm your order and deliver &mdash; pay for the product on delivery.</li>
              </ol>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  )
}
