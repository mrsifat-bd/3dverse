'use client'
import { motion } from 'framer-motion'
import ProductCard from './ProductCard'
import { Skeleton } from './ui/skeleton'

export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-line bg-paper">
          <Skeleton className="aspect-square rounded-none" />
          <div className="space-y-2 p-4">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  )
}

const gridVariants = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } }
const itemVariants = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }

// `animateKey` re-triggers the entrance when it changes (e.g. shop filter/sort),
// so filtered results fade in smoothly instead of snapping.
export default function ProductGrid({ products, animateKey }) {
  if (!products.length) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-paper py-16 text-center">
        <p className="text-sm text-stone">No products found. Try a different search or category.</p>
      </div>
    )
  }
  return (
    <motion.div
      key={animateKey}
      className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
      variants={gridVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-40px' }}
    >
      {products.map((p) => (
        <motion.div key={p.id} variants={itemVariants} transition={{ duration: 0.4, ease: 'easeOut' }}>
          <ProductCard product={p} />
        </motion.div>
      ))}
    </motion.div>
  )
}
