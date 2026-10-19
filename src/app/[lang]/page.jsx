import Link from '@/components/LocalizedLink'
import { ArrowRight, Flame, Bone, Cpu, Fish, PenTool, Lamp, Gift, Smartphone, Moon, Monitor, Sprout, Frame } from 'lucide-react'
import { SITE_URL } from '@/lib/config'
import { faqFor } from '@/lib/faq'
import { getServerT, getContent } from '@/i18n/server'
import { localizeHref } from '@/i18n/config'
import { seo } from '@/i18n/seo'
import { localized, formatNumber } from '@/lib/format'
import { getFeaturedProducts, toListProduct } from '@/lib/products'
import { getPublicCategories, nonEmptyCategories } from '@/lib/categories'
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
  'pen-holder': PenTool,
  'phone-stand': Smartphone,
  'islamic-items': Moon,
  'desktop-accessories': Monitor,
  'plant-pot': Sprout,
  'wall-decoration': Frame,
  'aquarium-accessories': Fish,
}


export const revalidate = 60

export async function generateMetadata(props) {
  const params = await props.params;
  const t = getServerT(params.lang)
  return seo('/', params.lang, t('meta.homeTitle'), t('meta.homeDescription'), { absoluteTitle: true })
}

export default async function Home(props) {
  const params = await props.params;
  const { lang } = params
  const t = getServerT(lang)
  const blurbs = getContent(lang, 'categoryBlurbs') || {}
  const faq = faqFor(lang)
  const [featured, s, cats] = await Promise.all([getFeaturedProducts(8), getSettings(), getPublicCategories()])
  const catNames = Object.fromEntries(cats.map((c) => [c.slug, localized(c, 'name', lang)]))
  const CATEGORY_CARDS = [
    { name: t('home.popularTitle'), blurb: t('home.popularBlurb'), href: '/shop?popular=1', Icon: Flame, featured: true },
    ...nonEmptyCategories(cats).map((c) => ({
      name: localized(c, 'name', lang),
      blurb: (lang === 'bn' && blurbs[c.slug]) || c.blurb,
      href: `/category/${c.slug}`,
      Icon: CATEGORY_ICONS[c.slug] || Flame,
    })),
  ]

  const businessLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': ['Organization', 'Store'],
        '@id': `${SITE_URL}/#business`,
        name: '3D Verse BD',
        alternateName: ['3D Verse', '3DVerse', 'থ্রিডি ভার্স'],
        url: SITE_URL,
        logo: `${SITE_URL}/logo.png`,
        image: `${SITE_URL}/opengraph-image.png`,
        description: lang === 'bn' ? t('home.brandText') : s.description,
        email: s.email,
        telephone: s.phone,
        address: { '@type': 'PostalAddress', addressLocality: 'Sylhet', addressRegion: 'Sylhet Division', addressCountry: 'BD' },
        areaServed: { '@type': 'Country', name: 'Bangladesh' },
        priceRange: '৳৳',
        currenciesAccepted: 'BDT',
        paymentAccepted: 'Cash on delivery, bKash',
        sameAs: [s.social_facebook, s.social_instagram, s.social_tiktok, s.social_youtube, s.social_telegram].filter(Boolean),
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: '3D Verse BD',
        inLanguage: ['en', 'bn'],
        publisher: { '@id': `${SITE_URL}/#business` },
        potentialAction: { '@type': 'SearchAction', target: `${SITE_URL}${localizeHref('/shop', lang)}?q={search_term_string}`, 'query-input': 'required name=search_term_string' },
      },
      {
        '@type': 'FAQPage',
        inLanguage: lang,
        mainEntity: faq.slice(0, 6).map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
      },
    ],
  }

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(businessLd).replace(/</g, '\\u003c') }} />
      {/* Hero */}
      <section className="border-b border-line">
        <div className="container grid items-center gap-10 py-16 md:grid-cols-2 md:py-24">
          <FadeIn onLoad>
            <h1 className="font-display text-4xl font-semibold leading-tight text-ink sm:text-5xl">
              {localized(s, 'hero_headline', lang)}
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-stone">
              {localized(s, 'hero_subtext', lang)}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/shop" className="btn-primary">{t('cart.browse')} <ArrowRight className="h-4 w-4" /></Link>
              <a href={`https://wa.me/${s.whatsapp_number}`} target="_blank" rel="noopener noreferrer" className="btn-ghost">
                <IconWhatsapp className="h-4 w-4" /> {t('home.chat')}
              </a>
            </div>
            <SocialLinks className="mt-8" />
          </FadeIn>

          <FadeIn onLoad delay={0.08} className="relative">
            <HeroPanel />
            <div className="absolute -bottom-5 -left-5 hidden rounded-2xl border border-line bg-cream px-5 py-4 shadow-lg shadow-black/5 sm:block">
              <p className="font-display text-2xl font-semibold text-ink">{formatNumber(100, lang)}%</p>
              <p className="text-xs text-stone">{t('product.madeToOrder')}</p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Categories */}
      <section className="container py-16">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold text-ink">{t('home.categoriesTitle')}</h2>
            <p className="mt-1 text-sm text-stone">{t('home.categoriesText')}</p>
          </div>
          <Link href="/shop" className="hidden text-sm font-medium text-clay hover:underline sm:block">{t('home.viewAll')} →</Link>
        </div>
        <Stagger className="mt-8 flex flex-wrap justify-center gap-4">
          {CATEGORY_CARDS.map((c, i) => (
            <StaggerItem key={c.href} index={i} className="w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.667rem)]">
              <Link
                href={c.href}
                className={`group block h-full rounded-2xl border bg-paper p-6 transition duration-300 hover:-translate-y-1.5 hover:border-clay/40 hover:shadow-xl hover:shadow-black/5 active:scale-[0.99] ${c.featured ? 'border-clay/40' : 'border-line'}`}
              >
                <span className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-clay/10 text-clay transition-transform duration-300 group-hover:scale-110">
                  <c.Icon className="h-5 w-5" />
                </span>
                <h3 className="font-display text-lg font-semibold text-ink transition-colors group-hover:text-clay">{c.name}</h3>
                <p className="mt-2 text-sm text-stone">{c.blurb}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-clay">{t('home.explore')} <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" /></span>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* Featured */}
      <section className="cv-auto container pb-16">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-2xl font-semibold text-ink">{t('home.featured')}</h2>
          <Link href="/shop" className="text-sm font-medium text-clay hover:underline">{t('home.viewAll')} →</Link>
        </div>
        <div className="mt-8">
          <ProductGrid products={featured.map((p) => toListProduct(p, catNames))} />
        </div>
      </section>

      {/* Who we are + common questions, in the page language */}
      <section className="cv-auto border-t border-line">
        <div className="container grid gap-10 py-16 md:grid-cols-[1fr_1.3fr]">
          <div>
            <h2 className="font-display text-2xl font-semibold text-ink">{t('home.aboutTitle')}</h2>
            <p className="mt-4 text-sm leading-relaxed text-stone">{t('home.aboutText')}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/shop" className="btn-primary">{t('home.allProducts')} <ArrowRight className="h-4 w-4" /></Link>
              <Link href="/faq" className="btn-ghost">{t('home.moreQuestions')}</Link>
            </div>
          </div>
          <div className="space-y-3">
            {faq.slice(0, 6).map((f) => (
              <details key={f.q} className="disclosure group rounded-xl border border-line bg-paper px-5 py-4">
                <summary className="cursor-pointer list-none text-sm font-medium text-ink marker:hidden">{f.q}</summary>
                <p className="mt-2 text-sm leading-relaxed text-stone">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Brand intro / CTA */}
      <section className="cv-auto border-t border-line bg-paper">
        <div className="container grid items-center gap-8 py-16 md:grid-cols-[1.2fr_1fr]">
          <FadeIn>
            <h2 className="font-display text-2xl font-semibold text-ink">{t('home.brandTitle')}</h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-stone">{lang === 'bn' ? t('home.brandText') : s.description}</p>
            <Link href="/about" className="btn-ghost mt-6">{t('home.ourStory')} <ArrowRight className="h-4 w-4" /></Link>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="rounded-2xl border border-line bg-cream p-8">
              <h3 className="font-display text-lg font-semibold text-ink">{t('home.stepsTitle')}</h3>
              <ol className="mt-4 space-y-3 text-sm text-stone">
                {[1, 2, 3].map((n) => (
                  <li key={n} className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-clay text-xs font-medium text-paper">{formatNumber(n, lang)}</span> {t(`home.step${n}`)}</li>
                ))}
              </ol>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
