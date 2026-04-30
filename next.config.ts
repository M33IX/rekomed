import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  output: 'standalone',
  serverExternalPackages: ['payload', '@payloadcms/db-postgres', '@payloadcms/drizzle', 'drizzle-kit', 'esbuild'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'reko-med.ru'
      }
    ],
    formats: ['image/avif', 'image/webp']
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)'
          }
        ]
      }
    ]
  }
}

export default nextConfig
