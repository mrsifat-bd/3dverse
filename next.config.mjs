/** @type {import('next').NextConfig} */
const nextConfig = {
  env: { NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '' },
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
  // Old URLs that changed (kept forever so links and Google results still work).
  async redirects() {
    const legacy = [
      ['/category/i', '/category/islamic-items'],
      ['/product/porsche-911-gt3-rs-wall-art', '/product/gt-sports-car-wall-art'],
      ['/privacy', '/privacy-policy'],
      ['/refund', '/refund-policy'],
      ['/return-policy', '/refund-policy'],
      ['/shipping', '/shipping-policy'],
      ['/terms-and-conditions', '/terms'],
    ]
    // Same legacy paths under /bn go to the Bangla page (one hop, no chain).
    return legacy.flatMap(([from, to]) => [
      { source: from, destination: to, permanent: true },
      { source: `/bn${from}`, destination: `/bn${to}`, permanent: true },
    ])
  },
  async headers() {
    // Content-Security-Policy, built from the hosts the site actually uses:
    //   Supabase (API, realtime websocket, storage images), ipwho.is (lead
    //   country lookup), the OpenStreetMap embed on the contact page.
    // 'unsafe-inline' for scripts is required by statically rendered Next.js
    // pages (no per-request nonce). Shipped as REPORT-ONLY first: browsers
    // report violations to /api/csp-report without blocking anything. Switch
    // the header name to Content-Security-Policy once reports are clean.
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.supabase.co",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://ipwho.is",
      "frame-src 'self' https://www.openstreetmap.org",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      'report-uri /api/csp-report',
    ].join('; ')
    return [
      {
        // Stable font file names: rename the file if it ever changes.
        source: '/fonts/:file*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Content-Security-Policy-Report-Only', value: csp },
        ],
      },
    ]
  },
}

export default nextConfig
