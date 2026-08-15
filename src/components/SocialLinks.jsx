'use client'
import { IconFacebook, IconInstagram, IconTiktok, IconYoutube, IconTelegram } from './icons'
import { useSettings } from './SettingsProvider'

export default function SocialLinks({ className = '', iconClass = 'h-5 w-5', variant = 'inline' }) {
  const s = useSettings()
  const links = [
    { href: s.social_facebook, label: 'Facebook', Icon: IconFacebook },
    { href: s.social_instagram, label: 'Instagram', Icon: IconInstagram },
    { href: s.social_tiktok, label: 'TikTok', Icon: IconTiktok },
    { href: s.social_youtube, label: 'YouTube', Icon: IconYoutube },
    { href: s.social_telegram, label: 'Telegram', Icon: IconTelegram },
  ].filter((l) => l.href)

  // Larger, tappable bordered tiles — used on the About page.
  if (variant === 'solid') {
    return (
      <div className={`flex flex-wrap items-center gap-3 ${className}`}>
        {links.map(({ href, label, Icon }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            title={label}
            className="grid h-12 w-12 place-items-center rounded-xl border border-line bg-paper text-ink transition-all duration-200 hover:-translate-y-0.5 hover:border-clay/40 hover:text-clay hover:shadow-md hover:shadow-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay/50"
          >
            <Icon className="h-5 w-5" />
          </a>
        ))}
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {links.map(({ href, label, Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          className="text-stone transition-colors hover:text-clay"
        >
          <Icon className={iconClass} />
        </a>
      ))}
    </div>
  )
}
