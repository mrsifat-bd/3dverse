'use client'
import { forwardRef } from 'react'
import NextLink from 'next/link'
import { useLang } from '@/i18n/client'
import { localizeHref } from '@/i18n/config'

// Drop-in replacement for next/link: internal paths automatically stay in the
// visitor's language (/shop -> /bn/shop on Bangla pages). Admin, API and
// external links are left untouched.
const LocalizedLink = forwardRef(function LocalizedLink({ href, ...props }, ref) {
  const lang = useLang()
  const target = typeof href === 'string' ? localizeHref(href, lang) : href
  return <NextLink ref={ref} href={target} {...props} />
})

export default LocalizedLink
