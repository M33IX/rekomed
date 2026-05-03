import { readFile } from 'node:fs/promises'

const DEFAULT_API_URL = 'http://localhost:3000/api/payload'
const SOURCE = new URL('../src/data/current-site.generated.ts', import.meta.url)
const HIERARCHY_SOURCE = new URL('../src/data/catalog-hierarchy.json', import.meta.url)

const args = new Set(process.argv.slice(2))
const prune = args.has('--prune')
const dryRun = args.has('--dry-run')
const apiUrl = (process.env.PAYLOAD_API_URL || DEFAULT_API_URL).replace(/\/$/, '')
const email = process.env.PAYLOAD_IMPORT_EMAIL || process.env.PAYLOAD_EMAIL || 'test@test.test'
const password = process.env.PAYLOAD_IMPORT_PASSWORD || process.env.PAYLOAD_PASSWORD || '123'

const hierarchy = JSON.parse(await readFile(HIERARCHY_SOURCE, 'utf8'))
const childrenByParent = hierarchy.children || {}
const parentBySection = Object.entries(childrenByParent).reduce((acc, [parent, children]) => {
  for (const child of children) acc.set(child, parent)
  return acc
}, new Map())
const orderBySection = new Map()
let sortOrder = 0

for (const section of hierarchy.topSections || []) {
  orderBySection.set(section, sortOrder++)
  for (const child of childrenByParent[section] || []) {
    orderBySection.set(child, sortOrder++)
    for (const nestedChild of childrenByParent[child] || []) {
      orderBySection.set(nestedChild, sortOrder++)
    }
  }
}

const getSortOrder = (section) => orderBySection.get(section) ?? 1000

const slugify = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/ё/g, 'e')
    .replace(/[^a-zа-я0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)

const pathSegment = (path, fallback) => path.split('/').filter(Boolean).at(-1) || fallback

const legacySlug = (page) => {
  if (page.kind === 'product') {
    const parts = page.path.split('/').filter(Boolean)
    return slugify(`${parts.at(-2) || page.section}-${page.id || parts.at(-1)}`)
  }

  return slugify(pathSegment(page.path, page.id || page.h1 || page.title))
}

const normalizeText = (value) => String(value || '').replace(/\s+/g, ' ').trim()

const cleanAttributeValue = (label, value) => {
  const text = normalizeText(value)
  if (!text) return ''
  if (text.length > 80) return ''
  if (/^,/.test(text)) return ''
  if (label === 'Материал' && /(использ|котор|соединени|поверхност|коррози)/i.test(text)) return ''
  return text
}

const cleanBrandTitle = (page) =>
  normalizeText(page.h1 || page.title)
    .replace(/:\s*каталог медицинских изделий$/i, '')
    .replace(/\s+каталог медицинских изделий$/i, '')

const parseGeneratedPages = async () => {
  const source = await readFile(SOURCE, 'utf8')
  const match = /export const currentSitePages: CurrentSitePage\[\] = ([\s\S]*)$/.exec(source)
  if (!match) throw new Error(`Could not parse currentSitePages from ${SOURCE.pathname}`)
  return JSON.parse(match[1])
}

const requestJson = async (path, options = {}) => {
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: {
      'content-type': 'application/json',
      ...(options.token ? { Authorization: `JWT ${options.token}` } : {}),
      ...(options.headers || {})
    },
    body: options.body && typeof options.body !== 'string' ? JSON.stringify(options.body) : options.body
  })

  if (!response.ok) {
    const details = await response.text()
    throw new Error(`${options.method || 'GET'} ${path} -> ${response.status}: ${details}`)
  }

  if (response.status === 204) return null
  return response.json()
}

const login = async () => {
  const result = await requestJson('/users/login', {
    method: 'POST',
    body: { email, password }
  })

  if (!result.token) throw new Error('Payload login did not return a token')
  return result.token
}

const whereEquals = (field, value, limit = 1) => {
  const params = new URLSearchParams()
  params.set(`where[${field}][equals]`, value)
  params.set('limit', String(limit))
  return params.toString()
}

const findOne = async (collection, field, value, token) => {
  const result = await requestJson(`/${collection}?${whereEquals(field, value)}`, { token })
  return result.docs?.[0] || null
}

const upsert = async (collection, lookupField, lookupValue, body, token, stats) => {
  const existing = await findOne(collection, lookupField, lookupValue, token)

  if (dryRun) {
    stats[existing ? 'updated' : 'created'] += 1
    return existing || { id: `dry-${collection}-${lookupValue}` }
  }

  if (existing) {
    stats.updated += 1
    const result = await requestJson(`/${collection}/${existing.id}`, { method: 'PATCH', token, body })
    return result.doc || result
  }

  stats.created += 1
  const result = await requestJson(`/${collection}`, { method: 'POST', token, body })
  return result.doc || result
}

const allDocs = async (collection, token) => {
  const result = await requestJson(`/${collection}?limit=1000`, { token })
  return result.docs || []
}

const deleteDoc = async (collection, id, token, stats) => {
  if (dryRun) {
    stats.deleted += 1
    return
  }

  await requestJson(`/${collection}/${id}`, { method: 'DELETE', token })
  stats.deleted += 1
}

const inferBrand = (page, brands) => {
  const title = normalizeText(page.title)
  return brands
    .filter((brand) => brand.title && title.toLowerCase().endsWith(brand.title.toLowerCase()))
    .sort((a, b) => b.title.length - a.title.length)[0]
}

const main = async () => {
  const pages = await parseGeneratedPages()
  const categoryPages = pages.filter((page) => page.kind === 'category' && page.path !== '/catalog/')
  const brandPages = pages.filter((page) => page.kind === 'brand' && page.path !== '/brands/')
  const productPages = pages.filter((page) => page.kind === 'product')

  const token = await login()
  const categoryStats = { created: 0, updated: 0, deleted: 0 }
  const brandStats = { created: 0, updated: 0, deleted: 0 }
  const productStats = { created: 0, updated: 0, deleted: 0 }

  const categoriesBySection = new Map()
  for (const page of categoryPages) {
    const slug = page.section || legacySlug(page)
    const body = {
      title: normalizeText(page.h1 || page.title),
      slug,
      legacyPath: page.path,
      description: normalizeText(page.description),
      parent: null,
      sortOrder: getSortOrder(slug),
      seo: {
        metaTitle: normalizeText(page.title),
        metaDescription: normalizeText(page.description),
        canonicalPath: page.path,
        indexable: true
      }
    }

    const category = await upsert('categories', 'legacyPath', page.path, body, token, categoryStats)
    categoriesBySection.set(slug, category)
  }

  for (const page of categoryPages) {
    const slug = page.section || legacySlug(page)
    const category = categoriesBySection.get(slug)
    const parent = categoriesBySection.get(parentBySection.get(slug))
    if (!category || !parent) continue

    await upsert(
      'categories',
      'legacyPath',
      page.path,
      { parent: parent.id, sortOrder: getSortOrder(slug) },
      token,
      categoryStats
    )
    categoriesBySection.set(slug, { ...category, parent: parent.id, sortOrder: getSortOrder(slug) })
  }

  const importedBrands = []
  for (const page of brandPages) {
    const slug = page.id || legacySlug(page)
    const title = cleanBrandTitle(page)
    const body = {
      title,
      slug,
      description: normalizeText(page.description),
      seo: {
        metaTitle: normalizeText(page.title),
        metaDescription: normalizeText(page.description),
        canonicalPath: page.path,
        indexable: true
      }
    }

    const brand = await upsert('brands', 'slug', slug, body, token, brandStats)
    importedBrands.push({ ...brand, title })
  }

  for (const page of productPages) {
    const attrs = Object.entries(page.attributes || {})
      .map(([label, value]) => ({ label, value: cleanAttributeValue(label, value) }))
      .filter((attr) => attr.value)
    const category = categoriesBySection.get(page.section)
    const brand = inferBrand(page, importedBrands)
    const body = {
      title: normalizeText(page.h1 || page.title),
      slug: legacySlug(page),
      legacyPath: page.path,
      externalId: page.id,
      description: normalizeText(page.description),
      category: category?.id,
      brand: brand?.id,
      attributes: attrs,
      seo: {
        metaTitle: normalizeText(page.title),
        metaDescription: normalizeText(page.description),
        canonicalPath: page.path,
        indexable: true
      }
    }

    await upsert('products', 'legacyPath', page.path, body, token, productStats)
  }

  if (prune) {
    const sourceCategoryPaths = new Set(categoryPages.map((page) => page.path))
    const sourceBrandSlugs = new Set(brandPages.map((page) => page.id || legacySlug(page)))
    const sourceProductPaths = new Set(productPages.map((page) => page.path))

    for (const doc of await allDocs('products', token)) {
      if (!doc.legacyPath || !sourceProductPaths.has(doc.legacyPath)) {
        await deleteDoc('products', doc.id, token, productStats)
      }
    }

    for (const doc of await allDocs('categories', token)) {
      if (!doc.legacyPath || !sourceCategoryPaths.has(doc.legacyPath)) {
        await deleteDoc('categories', doc.id, token, categoryStats)
      }
    }

    for (const doc of await allDocs('brands', token)) {
      if (!sourceBrandSlugs.has(doc.slug)) {
        await deleteDoc('brands', doc.id, token, brandStats)
      }
    }
  }

  console.log(
    JSON.stringify(
      {
        apiUrl,
        dryRun,
        prune,
        source: {
          categories: categoryPages.length,
          brands: brandPages.length,
          products: productPages.length
        },
        imported: {
          categories: categoryStats,
          brands: brandStats,
          products: productStats
        }
      },
      null,
      2
    )
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
