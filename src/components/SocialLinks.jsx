import { BUSINESS } from '@/lib/config'
import { IconFacebook, IconInstagram, IconTiktok, IconYoutube, IconTelegram } from './icons'

const links = [
  { href: BUSINESS.social.facebook, label: 'Facebook', Icon: IconFacebook },
  { href: BUSINESS.social.instagram, label: 'Instagram', Icon: IconInstagram },
  { href: BUSINESS.social.tiktok, label: 'TikTok', Icon: IconTiktok },
  { href: BUSINESS.social.youtube, label: 'YouTube', Icon: IconYoutube },
  { href: BUSINESS.social.telegram, label: 'Telegram', Icon: IconTelegram },
]

export default function SocialLinks({ className = '', iconClass = 'h-5 w-5' }) {
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
