import { company, getCanonical, siteUrl } from '@/lib/content'
import type { CurrentSitePage } from '@/data/current-site.generated'
import type { PublicSiteSettings } from '@/lib/site-settings'

const getSameAs = (settings?: PublicSiteSettings) =>
  [settings?.vkUrl, settings?.telegram].filter((value): value is string => Boolean(value))

export const organizationSchema = (settings?: PublicSiteSettings) => {
  const legalName = settings?.legalName || company.legalName
  const address = settings?.legalAddress || settings?.address || company.address
  const sameAs = getSameAs(settings)

  return {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: company.name,
  legalName,
  url: siteUrl,
  email: settings?.email || company.email,
  telephone: settings?.phone || company.phone,
  ...(settings?.legalInn ? { taxID: settings.legalInn } : {}),
  ...(settings?.legalOgrn ? { identifier: settings.legalOgrn } : {}),
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Воронеж',
    streetAddress: address,
    addressCountry: 'RU'
  },
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'sales',
    telephone: settings?.phone || company.phone,
    email: settings?.email || company.email,
    availableLanguage: 'ru'
  },
  ...(sameAs.length ? { sameAs } : {})
  }
}

export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: company.name,
  url: siteUrl,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${siteUrl}/catalog/?q={search_term_string}`,
    'query-input': 'required name=search_term_string'
  }
}

export const breadcrumbSchema = (items: { name: string; path: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: getCanonical(item.path)
  }))
})

export const productSchema = (product: CurrentSitePage) => ({
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: product.h1,
  description: product.description,
  image: product.image || undefined,
  sku: product.id,
  brand: {
    '@type': 'Brand',
    name: 'RekoMed'
  },
  category: product.section,
  offers: {
    '@type': 'Offer',
    availability: 'https://schema.org/PreOrder',
    priceCurrency: 'RUB',
    url: getCanonical(product.path)
  }
})

export const aboutPageSchema = (settings?: PublicSiteSettings) => ({
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  name: 'О компании RekoMed',
  url: getCanonical('/company/'),
  mainEntity: organizationSchema(settings)
})
