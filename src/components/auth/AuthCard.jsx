'use client'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { useSettings } from '@/components/SettingsProvider'

// Centered auth card matching the 3D Verse dark premium theme.
export default function AuthCard({ title, subtitle, children, footer }) {
  const s = useSettings()
  return (
    <div className="container flex min-h-[75vh] items-center justify-center py-14">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-md rounded-3xl border border-line bg-paper p-8"
      >
        <Link href="/" className="mb-6 flex items-center justify-center gap-2.5">
          <Image src="/logo.png" alt={`${s.business_name} logo`} width={40} height={44} className="h-9 w-auto dark:invert" />
          <span className="font-display text-xl font-semibold tracking-tight text-ink">{s.business_name}</span>
        </Link>
        <h1 className="text-center font-display text-2xl font-semibold text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-center text-sm text-stone">{subtitle}</p>}
        <div className="mt-6">{children}</div>
        {footer && <div className="mt-6 text-center text-sm text-stone">{footer}</div>}
      </motion.div>
    </div>
  )
}
