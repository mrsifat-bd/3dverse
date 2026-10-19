'use client'
import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'
import { useT } from '@/i18n/client'

export default function ThemeToggle() {
  const t = useT()
  const [dark, setDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setDark(document.documentElement.classList.contains('dark'))
  }, [])

  function toggle() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light')
    } catch (e) {}
  }

  return (
    <button
      onClick={toggle}
      aria-label={dark ? t('common.lightMode') : t('common.darkMode')}
      className="grid h-10 w-10 place-items-center rounded-full border border-line text-ink transition hover:-translate-y-0.5 hover:border-clay/40 hover:text-clay active:scale-90"
    >
      {mounted && dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  )
}
