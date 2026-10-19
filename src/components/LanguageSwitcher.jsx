'use client'
import { usePathname, useRouter } from 'next/navigation'
import { Languages } from 'lucide-react'
import { useLang, rememberLang } from '@/i18n/client'
import { localizeHref } from '@/i18n/config'
import { cn } from '@/lib/utils'

// Switches between English and Bangla on the SAME page (query string kept),
// and remembers the choice for future visits.
export default function LanguageSwitcher({ variant = 'pill', className = '', onSwitched }) {
  const lang = useLang()
  const pathname = usePathname() || '/'
  const router = useRouter()
  const next = lang === 'bn' ? 'en' : 'bn'

  function switchTo(target) {
    if (target === lang) return
    rememberLang(target)
    const search = typeof window !== 'undefined' ? window.location.search + window.location.hash : ''
    router.push(localizeHref(pathname + search, target), { scroll: false })
    onSwitched?.()
  }

  if (variant === 'menu') {
    return (
      <div className={cn('flex items-center gap-2 rounded-lg px-3 py-2', className)} role="group" aria-label="Language / ভাষা">
        <Languages className="h-4 w-4 text-stone" aria-hidden="true" />
        {['en', 'bn'].map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => switchTo(l)}
            aria-pressed={lang === l}
            lang={l}
            className={cn(
              'rounded-full px-3 py-1.5 text-sm transition-colors',
              lang === l ? 'bg-clay text-paper' : 'text-ink/80 hover:bg-line/60'
            )}
          >
            {l === 'en' ? 'English' : 'বাংলা'}
          </button>
        ))}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => switchTo(next)}
      lang={next}
      aria-label={next === 'bn' ? 'বাংলায় দেখুন (Switch to Bangla)' : 'View in English (ইংরেজিতে দেখুন)'}
      className={cn(
        'grid h-10 min-w-10 place-items-center rounded-full border border-line px-3 text-sm font-medium text-ink transition-[transform,border-color,color] duration-200 hover:-translate-y-0.5 hover:border-clay/40 hover:text-clay active:scale-90',
        className
      )}
    >
      {next === 'bn' ? 'বাংলা' : 'EN'}
    </button>
  )
}
