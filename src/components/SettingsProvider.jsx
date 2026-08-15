'use client'
import { createContext, useContext } from 'react'
import { MotionConfig } from 'framer-motion'
import { DEFAULT_SETTINGS } from '@/lib/settings'

const SettingsContext = createContext(DEFAULT_SETTINGS)

export function SettingsProvider({ settings, children }) {
  return (
    <SettingsContext.Provider value={settings || DEFAULT_SETTINGS}>
      {/* Honour the OS "reduce motion" setting across all Framer animations. */}
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  return useContext(SettingsContext)
}
