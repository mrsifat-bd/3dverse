'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'

const WORDS = ['Dream', 'Design', 'Deliver']

export default function HeroPanel() {
  const [i, setI] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % WORDS.length), 1900)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-paper to-cream">
      {/* Soft glowing orbs */}
      <motion.div
        aria-hidden
        className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-clay/15 blur-3xl"
        animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0.85, 0.5] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="absolute -bottom-14 -left-10 h-52 w-52 rounded-full bg-clay/10 blur-3xl"
        animate={{ scale: [1.15, 1, 1.15], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 7.5, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative flex h-full flex-col items-center justify-center gap-6 p-8">
        {/* Floating, gently tilting logo */}
        <motion.div
          animate={{ y: [0, -12, 0], rotate: [-2, 2, -2] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          className="drop-shadow-xl"
        >
          <Image src="/logo.png" alt="3D Verse" width={170} height={188} priority className="h-28 w-auto dark:invert sm:h-32" />
        </motion.div>

        {/* Rotating word */}
        <div className="flex h-14 items-center overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.p
              key={WORDS[i]}
              initial={{ y: 26, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -26, opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="font-display text-4xl font-bold tracking-tight text-clay sm:text-5xl"
            >
              {WORDS[i]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Progress dots */}
        <div className="flex items-center gap-2">
          {WORDS.map((w, idx) => (
            <span
              key={w}
              className={`h-1.5 rounded-full transition-all duration-300 ${idx === i ? 'w-7 bg-clay' : 'w-1.5 bg-line'}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
