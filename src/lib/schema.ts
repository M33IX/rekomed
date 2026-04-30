import { company, getCanonical, siteUrl } from '@/lib/content'
import type { CurrentSitePage } from '@/data/current-site.generated'

export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: company.name,
  legalName: company.legalName,
  url: siteUrl,
  email: company.email,
  telephone: company.phone,
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Воронеж',
    streetAddress: 'ул. Димитрова, д. 56а',
    addressCountry: 'RU'
  },
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'sales',
    telephone: company.phone,
    email: company.email,
    availableLanguage: 'ru'
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
