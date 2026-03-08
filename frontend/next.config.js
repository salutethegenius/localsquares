/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: [
      'cloudflare-images.com',
      // Supabase storage domain will be added here
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.cloudflareimages.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          // CSP: restrict script/connect sources; tune if auth or Stripe break
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
              "connect-src 'self' https://*.supabase.co https://*.supabase.in https://api.stripe.com",
              "img-src 'self' data: https: blob:",
              "style-src 'self' 'unsafe-inline'",
              "frame-src https://js.stripe.com https://hooks.stripe.com",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig

