'use client'
import { useEffect } from 'react'

// Keeps <html lang> in step with the page language after client-side
// navigation (the inline script in the root layout sets it before first paint).
export default function LangSync({ lang }) {
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])
  return null
}
