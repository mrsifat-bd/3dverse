/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // CI runs `next lint` separately; skip during build for speed.
    ignoreDuringBuilds: true,
  },
  // Keep @react-pdf/renderer (and its native/wasm deps) out of the bundler so
  // the invoice PDF route works on the Vercel Node runtime.
  experimental: {
    serverComponentsExternalPackages: ['@react-pdf/renderer'],
  },
  images: {
    // Serve images directly from their source (Supabase Storage CDN / static
    // assets) instead of proxying through Vercel's Image Optimization. Product
    // images are user-uploaded and unbounded; routing them through Vercel's
    // optimizer hit its plan quota, which returns HTTP 402 for any image that
    // hasn't already been optimized+cached — so every NEWLY uploaded product
    // image showed as broken while older (cached) ones still worked. Supabase
    // Storage already fronts these with a CDN + our `cacheControl` headers, so
    // bypassing the optimizer makes every current and future image load
    // reliably without a quota wall. Layout/props are unaffected.
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
    // Allow lightweight vector (SVG) placeholders to render through next/image.
    dangerouslyAllowSVG: true,
    contentDispositionType: 'inline',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
    ]
  },
}

export default nextConfig
