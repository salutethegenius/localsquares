/** @type {import('next').NextConfig} */
const nextConfig = {
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
}

module.exports = nextConfig

