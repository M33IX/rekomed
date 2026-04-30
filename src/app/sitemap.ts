import type { MetadataRoute } from 'next'
import { currentSiteGeneratedAt, currentSitePages, directions, siteUrl } from '@/lib/content'

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date(currentSiteGeneratedAt)
  const staticPaths = ['/catalog/', '/documents/', ...directions.map((direction) => `/${direction.slug}/`)]

  const legacyUrls = currentSitePages.map((page) => ({
    url: `${siteUrl}${page.path}`,
    lastModified,
    changeFrequency: page.kind === 'product' ? ('monthly' as const) : ('weekly' as const),
    priority: page.kind === 'home' ? 1 : page.kind === 'product' ? 0.7 : 0.8
  }))

  const staticUrls = staticPaths.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified,
    changeFrequency: 'weekly' as const,
    priority: 0.85
  }))

  return [...legacyUrls, ...staticUrls]
}
