import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { notFound, redirect } from 'next/navigation'
import { getCanonical, getMetaForRoute, getPublicContent, getRoutePage } from '@/lib/cms-content'
import { JsonLd } from '@/components/JsonLd'
import { aboutPageSchema, breadcrumbSchema, productSchema } from '@/lib/schema'
import { getSiteSettings } from '@/lib/site-settings'
import { getDirectionCatalogHref, getDirectionLandingCatalogHref, isCatalogDirectionSection } from '@/lib/catalog-links'
import {
  BrandPage,
  CatalogPage,
  CategoryPage,
  CompanyPage,
  DocumentsPage,
  HomePage,
  InfoPage,
  LegalPage,
  ProductPage
} from '@/components/templates'

type PageProps = {
  params: Promise<{ slug?: string[] }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const content = await getPublicContent()
  const route = getRoutePage(slug, content)
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
      type: 'website',
      title: meta.title,
      description: meta.description,
      url: canonical,
      siteName: 'RekoMed',
      locale: 'ru_RU',
      images: ['/og-rekomed.svg']
    }
  }
}

const getFirstSearchParam = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value

export default async function Page({ params, searchParams }: PageProps) {
  const { slug } = await params
  const resolvedSearchParams = searchParams ? await searchParams : {}
  if (slug?.[0] === 'directions') {
    redirect(slug[1] ? getDirectionCatalogHref(slug[1]) : '/catalog/')
  }

  const publicContent = await getPublicContent()
  const siteSettings = await getSiteSettings()
  const route = getRoutePage(slug, publicContent)
  if (!route) notFound()

  if (route.type === 'direction') {
    redirect(getDirectionLandingCatalogHref(route.direction.oldSections))
  }

  if (route.type === 'category' && isCatalogDirectionSection(route.page.section)) {
    redirect(getDirectionCatalogHref(route.page.section))
  }

  const crumbs = [
    { name: 'Главная', path: '/' },
    route.path === '/' ? null : { name: getMetaForRoute(route).title.replace(' | RekoMed', ''), path: route.path }
  ].filter(Boolean) as { name: string; path: string }[]

  let content: ReactNode
  if (route.type === 'home') content = <HomePage content={publicContent} settings={siteSettings} />
  else if (route.type === 'catalog') content = <CatalogPage content={publicContent} initialDirection={getFirstSearchParam(resolvedSearchParams.direction)} />
  else if (route.type === 'category') content = <CategoryPage page={route.page} content={publicContent} settings={siteSettings} />
  else if (route.type === 'product') content = <ProductPage product={route.page} content={publicContent} />
  else if (route.type === 'brand') content = <BrandPage page={route.page} content={publicContent} settings={siteSettings} />
  else if (route.type === 'company' && route.path === '/company/') content = <CompanyPage settings={siteSettings} />
  else if (route.type === 'documents') content = <DocumentsPage />
  else if (route.type === 'legal') content = <LegalPage page={route.legalPage} settings={siteSettings} />
  else content = <InfoPage page={route.page} settings={siteSettings} />

  return (
    <>
      <JsonLd data={breadcrumbSchema(crumbs)} />
      {route.type === 'product' && <JsonLd data={productSchema(route.page)} />}
      {route.type === 'company' && route.path === '/company/' && <JsonLd data={aboutPageSchema(siteSettings)} />}
      {content}
    </>
  )
}
