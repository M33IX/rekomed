import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import {
  currentSitePages,
  directions,
  getCanonical,
  getMetaForRoute,
  getRoutePage,
} from '@/lib/content'
import { JsonLd } from '@/components/JsonLd'
import { breadcrumbSchema, productSchema } from '@/lib/schema'
import {
  BrandPage,
  CatalogPage,
  CategoryPage,
  DirectionPage,
  DocumentsPage,
  HomePage,
  InfoPage,
  ProductPage
} from '@/components/templates'

type PageProps = {
  params: Promise<{ slug?: string[] }>
}

export const revalidate = 3600

export function generateStaticParams() {
  const legacy = currentSitePages.map((page) => ({
    slug: page.path === '/' ? [] : page.path.split('/').filter(Boolean)
  }))
  const landing = directions.map((direction) => ({ slug: direction.slug.split('/') }))

  return [...legacy, ...landing, { slug: ['catalog'] }, { slug: ['documents'] }]
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const route = getRoutePage(slug)
  if (!route) return {}

  const meta = getMetaForRoute(route)
  const canonical = getCanonical(meta.path)

  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical
    },
    openGraph: {
      type: route.type === 'product' ? 'website' : 'website',
      title: meta.title,
      description: meta.description,
      url: canonical,
      siteName: 'RekoMed',
      locale: 'ru_RU'
    }
  }
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params
  const route = getRoutePage(slug)
  if (!route) notFound()

  const crumbs = [
    { name: 'Главная', path: '/' },
    route.path === '/' ? null : { name: getMetaForRoute(route).title.replace(' | RekoMed', ''), path: route.path }
  ].filter(Boolean) as { name: string; path: string }[]

  let content: ReactNode
  if (route.type === 'home') content = <HomePage />
  else if (route.type === 'direction') content = <DirectionPage direction={route.direction} />
  else if (route.type === 'catalog') content = <CatalogPage />
  else if (route.type === 'category') content = <CategoryPage page={route.page} />
  else if (route.type === 'product') content = <ProductPage product={route.page} />
  else if (route.type === 'brand') content = <BrandPage page={route.page} />
  else if (route.type === 'documents') content = <DocumentsPage />
  else content = <InfoPage page={route.page} />

  return (
    <>
      <JsonLd data={breadcrumbSchema(crumbs)} />
      {route.type === 'product' && <JsonLd data={productSchema(route.page)} />}
      {content}
    </>
  )
}
