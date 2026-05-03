import type { MetadataRoute } from 'next'
import { directions, siteUrl } from '@/lib/content'
import { getPublicContent } from '@/lib/cms-content'
import { legalPagePaths } from '@/lib/legal-pages'

export const revalidate = 30

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const content = await getPublicContent()
  const lastModified = new Date(content.generatedAt)
  const staticPaths = ['/catalog/', '/documents/', ...legalPagePaths, ...directions.map((direction) => `/${direction.slug}/`)]

  const pageUrls = content.pages.map((page) => ({
    url: `${siteUrl}${page.path}`,
    lastModified: page.updatedAt ? new Date(page.updatedAt) : lastModified,
    changeFrequency: page.kind === 'product' ? ('monthly' as const) : ('weekly' as const),
    priority: page.kind === 'home' ? 1 : page.kind === 'product' ? 0.7 : 0.8
  }))

  const staticUrls = staticPaths.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified,
    changeFrequency: 'weekly' as const,
    priority: 0.85
  }))

  return [...staticUrls, ...pageUrls].filter(
    (item, index, items) => items.findIndex((candidate) => candidate.url === item.url) === index
  )
}
