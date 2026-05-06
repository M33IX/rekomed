import { Socket } from 'node:net'
import config from '@payload-config'
import { getPayload } from 'payload'
import type { Brand, Category, Media, Product } from '../../payload-types'
import type { CurrentSitePage } from '@/data/current-site.generated'
import { getFallbackParentSection, getFallbackSortOrder } from '@/lib/catalog-hierarchy'
import { currentSiteGeneratedAt, currentSitePages, directions, siteUrl } from '@/lib/content'
import { getLegalPageByPath, type LegalPageDefinition } from '@/lib/legal-pages'

export type PublicCatalogPage = CurrentSitePage & {
  source?: 'cms' | 'generated'
  updatedAt?: string
  parentSection?: string | null
  sortOrder?: number | null
  categoryTitle?: string
  categoryPath?: string
  brandTitle?: string
  brandPath?: string
  documentsCount?: number
}

export type PublicContent = {
  pages: PublicCatalogPage[]
  productPages: PublicCatalogPage[]
  categoryPages: PublicCatalogPage[]
  brandPages: PublicCatalogPage[]
  pathToPage: Map<string, PublicCatalogPage>
  stats: {
    total: number
    byKind: Record<CurrentSitePage['kind'], number>
  }
  generatedAt: string
}

export type PublicRoute =
  | { type: 'direction'; path: string; direction: (typeof directions)[number] }
  | { type: 'documents'; path: string }
  | { type: 'legal'; path: string; legalPage: LegalPageDefinition }
  | { type: 'catalog'; path: string }
  | { type: 'company'; path: string; page: PublicCatalogPage }
  | { type: PublicCatalogPage['kind']; path: string; page: PublicCatalogPage }

const normalizeGeneratedText = (value: string) => value.toLowerCase().replaceAll('ё', 'е').trim()
const generatedBrandSourcePages = currentSitePages.filter((page) => page.kind === 'brand')
const generatedCategoryBySection = new Map(
  currentSitePages.filter((page) => page.kind === 'category').map((page) => [page.section, page])
)

const inferGeneratedBrand = (page: CurrentSitePage) => {
  if (page.kind !== 'product') return {}
  const haystack = normalizeGeneratedText(`${page.title} ${page.h1} ${page.imageAlt}`)
  const brand = generatedBrandSourcePages.find((item) => {
    const title = normalizeGeneratedText(item.h1 || item.title)
    return title && haystack.includes(title)
  })

  return brand ? { brandTitle: brand.h1, brandPath: brand.path } : {}
}

const generatedPages = currentSitePages.map((page) => {
  const category = page.kind === 'product' ? generatedCategoryBySection.get(page.section) : undefined

  return {
    ...page,
    parentSection: page.kind === 'category' ? getFallbackParentSection(page.section) : null,
    sortOrder: page.kind === 'category' ? getFallbackSortOrder(page.section) : null,
    categoryTitle: category?.h1 || '',
    categoryPath: category?.path || '',
    ...inferGeneratedBrand(page),
    source: 'generated' as const,
    updatedAt: currentSiteGeneratedAt
  }
})

const legacyPageByPath = new Map(currentSitePages.map((page) => [page.path, page]))

const normalizePathValue = (path: string) => {
  const trimmed = path.trim()
  if (!trimmed) return '/'
  const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`
}

export const normalizePath = (segments: string[] | undefined) => {
  if (!segments || segments.length === 0) return '/'
  return normalizePathValue(segments.filter(Boolean).join('/'))
}

const toString = (value: unknown, fallback = '') => (typeof value === 'string' && value.trim() ? value.trim() : fallback)

const getRelation = <T extends { id: number }>(value: number | T | null | undefined): T | undefined =>
  typeof value === 'object' && value !== null ? value : undefined

const mediaUrl = (media: number | Media | null | undefined) => {
  const item = getRelation<Media>(media)
  return item?.sizes?.card?.url || item?.url || ''
}

const mediaAlt = (media: number | Media | null | undefined, fallback: string, legacyAlt?: string) => {
  const item = getRelation<Media>(media)
  return item?.alt || legacyAlt || fallback
}

const categoryPath = (category: Category) => normalizePathValue(category.legacyPath || `/catalog/${category.slug}/`)

const productPath = (product: Product) => normalizePathValue(product.legacyPath || `/catalog/${product.slug}/`)

const brandPath = (brand: Brand) => normalizePathValue(`/brands/${brand.slug}/`)

const companyPage: PublicCatalogPage = {
  url: `${siteUrl}/company/`,
  path: '/company/',
  kind: 'company',
  title: 'О компании RekoMed',
  h1: 'О компании RekoMed',
  description:
    'RekoMed помогает клиникам, врачам и закупочным отделам подобрать медицинские изделия, документы и коммерческое предложение под задачу.',
  section: 'company',
  id: 'company',
  image: '',
  imageAlt: '',
  attributes: {},
  source: 'cms',
  updatedAt: currentSiteGeneratedAt
}

const contactsPage: PublicCatalogPage = {
  url: `${siteUrl}/contacts/`,
  path: '/contacts/',
  kind: 'contacts',
  title: 'Контакты RekoMed',
  h1: 'Контакты',
  description: 'Контакты RekoMed для заявок на КП, документы, цену, наличие и подбор медицинских изделий.',
  section: 'contacts',
  id: 'contacts',
  image: '',
  imageAlt: '',
  attributes: {},
  source: 'cms',
  updatedAt: currentSiteGeneratedAt
}

const mapCategory = (category: Category): PublicCatalogPage => {
  const path = categoryPath(category)
  const legacy = legacyPageByPath.get(path)
  const parent = getRelation<Category>(category.parent)

  return {
    url: `${siteUrl}${path}`,
    path,
    kind: 'category',
    title: category.seo?.metaTitle || category.title,
    h1: category.title,
    description: category.seo?.metaDescription || category.description || '',
    section: category.slug,
    id: String(category.id),
    image: legacy?.image || '',
    imageAlt: legacy?.imageAlt || '',
    attributes: {},
    parentSection: parent?.slug || getFallbackParentSection(category.slug),
    sortOrder: category.sortOrder ?? getFallbackSortOrder(category.slug),
    source: 'cms',
    updatedAt: category.updatedAt
  }
}

const mapProduct = (product: Product): PublicCatalogPage => {
  const path = productPath(product)
  const legacy = legacyPageByPath.get(path)
  const category = getRelation<Category>(product.category)
  const brand = getRelation<Brand>(product.brand)
  const image = mediaUrl(product.image) || legacy?.image || ''
  const attrs = Object.fromEntries((product.attributes || []).map((attr) => [attr.label, attr.value]))

  return {
    url: `${siteUrl}${path}`,
    path,
    kind: 'product',
    title: product.seo?.metaTitle || product.title,
    h1: product.title,
    description: product.seo?.metaDescription || product.description || '',
    section: category?.slug || 'cms',
    id: product.externalId || String(product.id),
    image,
    imageAlt: mediaAlt(product.image, product.title, legacy?.imageAlt),
    attributes: attrs,
    categoryTitle: category?.title || '',
    categoryPath: category ? categoryPath(category) : '',
    brandTitle: brand?.title || '',
    brandPath: brand ? brandPath(brand) : '',
    documentsCount: product.documents?.length || 0,
    source: 'cms',
    updatedAt: product.updatedAt
  }
}

const mapBrand = (brand: Brand): PublicCatalogPage => {
  const path = brandPath(brand)
  const legacy = legacyPageByPath.get(path)
  const image = mediaUrl(brand.logo) || legacy?.image || ''

  return {
    url: `${siteUrl}${path}`,
    path,
    kind: 'brand',
    title: brand.seo?.metaTitle || brand.title,
    h1: brand.title,
    description: brand.seo?.metaDescription || brand.description || '',
    section: brand.slug,
    id: String(brand.id),
    image,
    imageAlt: mediaAlt(brand.logo, brand.title, legacy?.imageAlt),
    attributes: {},
    source: 'cms',
    updatedAt: brand.updatedAt
  }
}

const buildContent = (cmsPages: PublicCatalogPage[] = []): PublicContent => {
  const withCompany = cmsPages.some((page) => page.path === companyPage.path) ? cmsPages : [companyPage, ...cmsPages]
  const basePages = withCompany.some((page) => page.path === contactsPage.path) ? withCompany : [contactsPage, ...withCompany]
  const cmsPaths = new Set(basePages.map((page) => page.path))
  const pages = [...basePages, ...generatedPages.filter((page) => !cmsPaths.has(page.path))]
  const productPages = pages.filter((page) => page.kind === 'product')
  const categoryPages = pages.filter((page) => page.kind === 'category')
  const brandPages = pages.filter((page) => page.kind === 'brand')

  if (productPages.some((page) => page.source === 'cms' && page.section === 'cms') && !categoryPages.some((page) => page.section === 'cms')) {
    const path = '/catalog/cms/'
    const category: PublicCatalogPage = {
      url: `${siteUrl}${path}`,
      path,
      kind: 'category',
      title: 'Дополнительные позиции',
      h1: 'Дополнительные позиции',
      description: 'Изделия и материалы, доступные для запроса у менеджера RekoMed.',
      section: 'cms',
      id: 'cms',
      image: '',
      imageAlt: '',
      attributes: {},
      parentSection: '',
      sortOrder: 1000,
      source: 'cms',
      updatedAt: new Date().toISOString()
    }

    pages.unshift(category)
    categoryPages.unshift(category)
  }

  const byKind = pages.reduce(
    (acc, page) => {
      acc[page.kind] = (acc[page.kind] || 0) + 1
      return acc
    },
    {
      home: 0,
      brand: 0,
      product: 0,
      category: 0,
      company: 0,
      help: 0,
      contacts: 0,
      page: 0
    } satisfies Record<CurrentSitePage['kind'], number>
  )

  return {
    pages,
    productPages,
    categoryPages,
    brandPages,
    pathToPage: new Map(pages.map((page) => [page.path, page])),
    stats: {
      total: pages.length,
      byKind
    },
    generatedAt: currentSiteGeneratedAt
  }
}

export const generatedPublicContent = buildContent()

const canReachDatabase = async () => {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) return true

  try {
    const url = new URL(connectionString)
    const host = url.hostname
    const port = Number(url.port || 5432)

    return await new Promise<boolean>((resolve) => {
      const socket = new Socket()
      const done = (available: boolean) => {
        socket.destroy()
        resolve(available)
      }

      socket.setTimeout(800)
      socket.once('connect', () => done(true))
      socket.once('error', () => done(false))
      socket.once('timeout', () => done(false))
      socket.connect(port, host)
    })
  } catch {
    return true
  }
}

let contentPromise: Promise<PublicContent> | undefined
let contentCache: { value: PublicContent; expiresAt: number } | undefined

const loadCmsContent = async () => {
  try {
    if (!(await canReachDatabase())) return generatedPublicContent

    const payload = await getPayload({ config })
    const [products, categories, brands] = await Promise.all([
      payload.find({ collection: 'products', depth: 1, limit: 500, overrideAccess: true }),
      payload.find({ collection: 'categories', depth: 1, limit: 500, overrideAccess: true }),
      payload.find({ collection: 'brands', depth: 1, limit: 500, overrideAccess: true })
    ])

    return buildContent([
      ...categories.docs.map(mapCategory),
      ...products.docs.map(mapProduct),
      ...brands.docs.map(mapBrand)
    ])
  } catch {
    return generatedPublicContent
  }
}

export const getPublicContent = async () => {
  const now = Date.now()
  if (contentCache && contentCache.expiresAt > now) return contentCache.value

  contentPromise ??= loadCmsContent().then((value) => {
    contentCache = { value, expiresAt: Date.now() + 5_000 }
    contentPromise = undefined
    return value
  })

  return contentPromise
}

const landingByPath = new Map(directions.map((direction) => [`/${direction.slug}/`, direction]))

export const getRoutePage = (segments: string[] | undefined, content: PublicContent): PublicRoute | null => {
  const path = normalizePath(segments)
  const landing = landingByPath.get(path)
  if (landing) return { type: 'direction', path, direction: landing }

  if (path === '/catalog/') {
    return { type: 'catalog', path }
  }

  if (path === '/documents/') {
    return { type: 'documents', path }
  }

  const legalPage = getLegalPageByPath(path)
  if (legalPage) {
    return { type: 'legal', path: legalPage.path, legalPage }
  }

  if (path === '/company/' || path === '/about/') {
    return { type: 'company', path, page: content.pathToPage.get(path) || companyPage }
  }

  if (path === '/contacts/') {
    return { type: 'contacts', path, page: content.pathToPage.get(path) || contactsPage }
  }

  const page = content.pathToPage.get(path)
  if (page) {
    return { type: page.kind, path, page }
  }

  return null
}

export const getCanonical = (path: string) => `${siteUrl}${path}`

export const getMetaForRoute = (route: PublicRoute) => {
  if (route.type === 'direction') {
    return {
      title: `${route.direction.title} | RekoMed`,
      description: route.direction.summary,
      path: route.path
    }
  }

  if (route.type === 'catalog') {
    return {
      title: 'Каталог медицинских изделий и расходных материалов | RekoMed',
      description:
        'Каталог RekoMed: изделия для травматологии, ортопедии, нейрохирургии, хирургии, ЛОР, стоматологии и реабилитации.',
      path: route.path
    }
  }

  if (route.type === 'documents') {
    return {
      title: 'Документы, сертификаты и регистрационные удостоверения | RekoMed',
      description: 'Запросите регистрационные удостоверения, сертификаты, инструкции и каталоги на медицинские изделия RekoMed.',
      path: route.path
    }
  }

  if (route.type === 'legal') {
    return {
      title: route.legalPage.title,
      description: route.legalPage.description,
      path: route.legalPage.path
    }
  }

  const page = route.page
  if (page.kind === 'home') {
    return {
      title: 'RekoMed - медицинские изделия для клиник и закупщиков',
      description:
        'Поставка медицинских изделий, расходных материалов и оборудования для клиник и закупочных отделов: подбор, документы и коммерческое предложение.',
      path: page.path
    }
  }

  return {
    title: `${page.title} | RekoMed`,
    description:
      page.description ||
      'Медицинские изделия, расходные материалы и оборудование для клиник, врачей, закупочных отделов и юридических лиц.',
    path: page.path
  }
}

export const getProductsForSections = (content: PublicContent, sections: string[], limit?: number) => {
  const products = content.productPages.filter((page) => sections.includes(page.section))
  return typeof limit === 'number' ? products.slice(0, limit) : products
}

export const getCategoryProducts = (content: PublicContent, section: string) =>
  content.productPages.filter((page) => page.section === section)

export const getCategoryBySection = (content: PublicContent, section: string) =>
  content.categoryPages.find((page) => page.section === section) ??
  ({
    path: `/catalog/${section}/`,
    h1: section,
    title: section,
    description: 'Категория медицинских изделий RekoMed.',
    kind: 'category',
    section,
    id: '',
    url: `${siteUrl}/catalog/${section}/`,
    image: '',
    imageAlt: '',
    attributes: {},
    parentSection: getFallbackParentSection(section),
    sortOrder: getFallbackSortOrder(section),
    source: 'generated'
  } satisfies PublicCatalogPage)

export const getProductById = async (id: string) => {
  const content = await getPublicContent()
  return content.productPages.find((product) => product.id === id)
}
