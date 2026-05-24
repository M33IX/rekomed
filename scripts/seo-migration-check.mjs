import { readFile } from 'node:fs/promises'

const SOURCE = new URL('../src/data/current-site.generated.ts', import.meta.url)
const HIERARCHY_SOURCE = new URL('../src/data/catalog-hierarchy.json', import.meta.url)
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://reko-med.ru').replace(/\/$/, '')
const baseUrl = (process.env.SEO_CHECK_BASE_URL || siteUrl).replace(/\/$/, '')
const limit = Number(process.env.SEO_CHECK_LIMIT || 20)
const requireImportedMedia = process.env.SEO_CHECK_REQUIRE_IMPORTED_MEDIA !== '0'
const userAgent = 'Mozilla/5.0 RekoMed SEO migration check'
const permanentRedirects = new Set([301, 308])
const failures = []
const warnings = []
let topDirectionSections = new Set()

const parseGeneratedPages = async () => {
  const source = await readFile(SOURCE, 'utf8')
  const match = /export const currentSitePages: CurrentSitePage\[\] = ([\s\S]*)$/.exec(source)
  if (!match) throw new Error(`Could not parse currentSitePages from ${SOURCE.pathname}`)
  return JSON.parse(match[1])
}

const parseCatalogHierarchy = async () => {
  const source = await readFile(HIERARCHY_SOURCE, 'utf8')
  return JSON.parse(source)
}

const uniqueByPath = (pages) => {
  const seen = new Set()
  return pages.filter((page) => {
    if (seen.has(page.path)) return false
    seen.add(page.path)
    return true
  })
}

const samplePages = (pages) => {
  const byPath = new Map(pages.map((page) => [page.path, page]))
  const fixed = ['/', '/catalog/', '/company/', '/contacts/stores/', '/brands/226/']
    .map((path) => byPath.get(path))
    .filter(Boolean)

  return uniqueByPath([
    ...fixed,
    ...pages.filter((page) => page.kind === 'category').slice(0, 5),
    ...pages.filter((page) => page.kind === 'product').slice(0, 12),
    ...pages.filter((page) => page.kind === 'brand').slice(0, 3)
  ]).slice(0, limit)
}

const requestWithRedirects = async (path) => {
  let url = new URL(path, `${baseUrl}/`).toString()
  const redirects = []

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(url, {
      redirect: 'manual',
      headers: { 'user-agent': userAgent }
    })

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location')
      redirects.push({ status: response.status, from: url, to: location })

      if (!permanentRedirects.has(response.status)) {
        failures.push(`${path}: redirect ${response.status} is not permanent`)
      }

      if (!location) {
        failures.push(`${path}: redirect has no Location header`)
        return { response, finalUrl: url, redirects, text: '' }
      }

      url = new URL(location, url).toString()
      continue
    }

    const text = await response.text()
    return { response, finalUrl: url, redirects, text }
  }

  failures.push(`${path}: too many redirects`)
  return { response: null, finalUrl: url, redirects, text: '' }
}

const canonicalFromHtml = (html) => {
  const match = /<link\b(?=[^>]*\brel=["']canonical["'])(?=[^>]*\bhref=["']([^"']+)["'])[^>]*>/i.exec(html)
  return match?.[1] || ''
}

const expectedCanonical = (page) => {
  if (page.path === '/') return [`${siteUrl}/`, siteUrl]
  if (page.kind === 'category' && topDirectionSections.has(page.section)) return [`${siteUrl}/catalog/`]
  return [`${siteUrl}${page.path}`]
}

const checkRobots = async () => {
  const response = await fetch(new URL('/robots.txt', `${baseUrl}/`), { headers: { 'user-agent': userAgent } })
  const text = await response.text()

  if (response.status !== 200) failures.push(`robots.txt: expected 200, got ${response.status}`)
  if (!text.includes('Allow: /')) failures.push('robots.txt: missing Allow: /')
  if (!text.includes('Disallow: /admin/')) failures.push('robots.txt: missing /admin/ disallow')
  if (!text.includes(`Sitemap: ${siteUrl}/sitemap.xml`)) failures.push('robots.txt: sitemap does not point to canonical domain')
}

const checkSitemap = async () => {
  const response = await fetch(new URL('/sitemap.xml', `${baseUrl}/`), { headers: { 'user-agent': userAgent } })
  const text = await response.text()

  if (response.status !== 200) failures.push(`sitemap.xml: expected 200, got ${response.status}`)
  const locs = [...text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1])

  if (locs.length === 0) failures.push('sitemap.xml: no <loc> URLs found')
  for (const loc of locs) {
    if (!loc.startsWith(`${siteUrl}/`)) failures.push(`sitemap.xml: non-canonical URL ${loc}`)
    if (/194\.67\.121\.63/.test(loc)) failures.push(`sitemap.xml: IP URL leaked ${loc}`)
  }
}

const checkPage = async (page) => {
  const result = await requestWithRedirects(page.path)
  const { response, redirects, text } = result

  if (!response) return
  if (response.status !== 200) failures.push(`${page.path}: expected 200, got ${response.status}`)
  if (redirects.length > 1) failures.push(`${page.path}: expected at most one redirect, got ${redirects.length}`)

  const canonical = canonicalFromHtml(text)
  const expected = expectedCanonical(page)
  if (!expected.includes(canonical)) {
    failures.push(`${page.path}: canonical "${canonical || 'missing'}" does not match ${expected.join(' or ')}`)
  }

  if (requireImportedMedia && page.kind === 'product' && (text.includes(`${siteUrl}/upload/`) || text.includes('"/upload/'))) {
    failures.push(`${page.path}: legacy /upload media is still referenced`)
  }

  return {
    path: page.path,
    status: response.status,
    redirects: redirects.length,
    canonical
  }
}

const main = async () => {
  const pages = await parseGeneratedPages()
  const hierarchy = await parseCatalogHierarchy()
  topDirectionSections = new Set(hierarchy.topSections || [])
  const sample = samplePages(pages)

  await checkRobots()
  await checkSitemap()
  const checkedPages = []

  for (const page of sample) {
    const checked = await checkPage(page)
    if (checked) checkedPages.push(checked)
  }

  if (requireImportedMedia && checkedPages.every((page) => !page.path.startsWith('/catalog/'))) {
    warnings.push('No product pages were checked for imported media')
  }

  console.log(
    JSON.stringify(
      {
        baseUrl,
        siteUrl,
        limit,
        requireImportedMedia,
        checkedPages,
        warnings,
        failures
      },
      null,
      2
    )
  )

  if (failures.length > 0) process.exitCode = 1
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
