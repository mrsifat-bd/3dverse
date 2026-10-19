import Image from 'next/image'

// Slowly rotating 3DVerse logo box — used for loading states.
// `label` is passed in already translated by the caller.
export default function Loader({ label = '', className = '' }) {
  return (
    <div className={`flex min-h-[45vh] flex-col items-center justify-center gap-5 ${className}`}>
      <div style={{ perspective: '600px' }}>
        <div className="logo-spin">
          <Image src="/logo-md.webp" alt="3D Verse" width={80} height={88} priority className="h-16 w-auto dark:invert" />
        </div>
      </div>
      {label && <p className="text-sm text-stone">{label}</p>}
    </div>
  )
}
