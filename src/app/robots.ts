import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/content'

const siteHost = new URL(siteUrl).host

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/', '/_next/']
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteHost
  }
}
