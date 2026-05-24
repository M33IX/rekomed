import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  trailingSlash: true,
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
  },
  async redirects() {
    return [
      { source: '/directions', destination: '/catalog/', permanent: true },
      { source: '/directions/neyrohirurgiya', destination: '/catalog/?direction=neyrokhirurgiya', permanent: true },
      { source: '/directions/nejrohirurgiya', destination: '/catalog/?direction=neyrokhirurgiya', permanent: true },
      { source: '/directions/hirurgiya', destination: '/catalog/?direction=khirurgiya', permanent: true },
      { source: '/directions/reabilitaciya', destination: '/catalog/?direction=reabilitatsiya', permanent: true },
      { source: '/directions/:slug', destination: '/catalog/?direction=:slug', permanent: true },
      { source: '/osteosintez', destination: '/catalog/?direction=travmatologiya', permanent: true },
      { source: '/osteosintez/plastiny', destination: '/catalog/?direction=travmatologiya&category=plastiny', permanent: true },
      { source: '/osteosintez/vinty-shurupy', destination: '/catalog/?direction=travmatologiya&category=vinty', permanent: true },
      { source: '/endoprotezirovanie', destination: '/catalog/?direction=ortopediya', permanent: true },
      { source: '/nejrohirurgiya', destination: '/catalog/?direction=neyrokhirurgiya', permanent: true },
      { source: '/raskhodnye-materialy', destination: '/catalog/?direction=khirurgiya&category=shovnyy_material', permanent: true },
      { source: '/medicinskoe-oborudovanie', destination: '/catalog/?direction=oborudovanie', permanent: true },
      { source: '/catalog/neyrokhirurgiya', destination: '/catalog/?direction=neyrokhirurgiya', permanent: true },
      { source: '/catalog/travmatologiya', destination: '/catalog/?direction=travmatologiya', permanent: true },
      { source: '/catalog/ortopediya', destination: '/catalog/?direction=ortopediya', permanent: true },
      { source: '/catalog/khirurgiya', destination: '/catalog/?direction=khirurgiya', permanent: true },
      { source: '/catalog/oborudovanie', destination: '/catalog/?direction=oborudovanie', permanent: true },
      { source: '/catalog/otolaringologiya', destination: '/catalog/?direction=otolaringologiya', permanent: true },
      { source: '/catalog/reabilitatsiya', destination: '/catalog/?direction=reabilitatsiya', permanent: true },
      { source: '/catalog/stomatologiya', destination: '/catalog/?direction=stomatologiya', permanent: true }
    ]
  }
}

export default nextConfig
