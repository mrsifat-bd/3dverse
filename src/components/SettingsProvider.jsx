'use client'
import { createContext, useContext } from 'react'
import { DEFAULT_SETTINGS } from '@/lib/settings'

const SettingsContext = createContext(DEFAULT_SETTINGS)

export function SettingsProvider({ settings, children }) {
  return (
    <SettingsContext.Provider value={settings || DEFAULT_SETTINGS}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  return useContext(SettingsContext)
}
