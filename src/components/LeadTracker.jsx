'use client'
import { useEffect } from 'react'
import { recordLead } from '@/lib/leads'

// Records a 'view' lead once per product per browser session.
export default function LeadTracker({ product }) {
  useEffect(() => {
    if (!product?.slug) return
    let skip = false
    try {
      const key = 'lead_view_' + product.slug
      if (sessionStorage.getItem(key)) skip = true
      else sessionStorage.setItem(key, '1')
    } catch {}
    if (!skip) recordLead({ action: 'view', product })
  }, [product?.slug])
  return null
}
