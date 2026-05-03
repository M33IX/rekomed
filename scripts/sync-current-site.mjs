import { writeFile, mkdir } from 'node:fs/promises'
import { request } from 'node:https'

const SITE = 'https://reko-med.ru'
const OUT = new URL('../src/data/current-site.generated.ts', import.meta.url)
const CATALOG_SEED_PATHS = [
  '/catalog/',
  '/catalog/neyrokhirurgiya/',
  '/catalog/travmatologiya/',
  '/catalog/ortopediya/',
  '/catalog/khirurgiya/',
  '/catalog/oborudovanie/',
  '/catalog/otolaringologiya/',
  '/catalog/reabilitatsiya/',
  '/catalog/stomatologiya/'
]

const fetchText = (url, limit = 1_400_000) =>
  new Promise((resolve, reject) => {
    const req = request(
      url,
      {
        rejectUnauthorized: false,
        headers: {
          'user-agent': 'Mozilla/5.0 RekoMed rebuild content sync'
        }
      },
      (res) => {
        if (!res.statusCode || res.statusCode >= 400) {
          reject(new Error(`${url} returned ${res.statusCode}`))
          res.resume()
          return
        }

        let raw = ''
        res.setEncoding('utf8')
        res.on('data', (chunk) => {
          raw += chunk
          if (raw.length > limit) req.destroy(new Error(`Response too large: ${url}`))
        })
        res.on('end', () => resolve(raw))
      }
    )

    req.setTimeout(25_000, () => req.destroy(new Error(`Timeout: ${url}`)))
    req.on('error', reject)
    req.end()
  })

const stripTags = (value = '') =>
  value
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#43;/g, '+')
    .replace(/\s+/g, ' ')
    .trim()

const matchAll = (pattern, value) => [...value.matchAll(pattern)].map((match) => match[1])

const getMeta = (html, name) => {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(`<meta[^>]+(?:name|property)=["']${escaped}["'][^>]+content=["']([^"']*)["'][^>]*>`, 'i')
  const reverse = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:name|property)=["']${escaped}["'][^>]*>`, 'i')
  return stripTags(pattern.exec(html)?.[1] ?? reverse.exec(html)?.[1] ?? '')
}

const absolutize = (url) => {
  if (!url || url.startsWith('data:')) return ''
  return new URL(url, SITE).toString()
}

const isSameSite = (url) => {
  try {
    return new URL(url).origin === SITE
  } catch {
    return false
  }
}

const normalizeUrl = (url) => {
  const parsed = new URL(url, SITE)
  parsed.hash = ''
  parsed.search = ''
  return parsed.toString()
}

const getPath = (url) => new URL(url).pathname

const isCatalogCategoryPath = (path) => /^\/catalog\/[^/]+\/$/.test(path) || path === '/catalog/'
const isCatalogProductPath = (path) => /^\/catalog\/[^/]+\/\d+\/$/.test(path)

const isCatalogUtilityPath = (path) =>
  /\/filter\//.test(path) ||
  /\/compare\//.test(path) ||
  /\/personal\//.test(path) ||
  /\.(?:jpg|jpeg|png|gif|svg|webp|pdf|xml)$/i.test(path)

const extractCatalogLinks = (html) =>
  matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi, html)
    .map((href) => normalizeUrl(href))
    .filter(isSameSite)
    .filter((url) => {
      const path = getPath(url)
      return path.startsWith('/catalog/') && !isCatalogUtilityPath(path)
    })

const discoverCatalogUrls = async () => {
  const discovered = new Set()
  const queued = CATALOG_SEED_PATHS.map((path) => `${SITE}${path}`)
  const visited = new Set()

  while (queued.length > 0) {
    const url = queued.shift()
    if (!url || visited.has(url)) continue
    visited.add(url)

    let html = ''
    try {
      html = await fetchText(url)
    } catch (error) {
      console.warn(`\nSkipped catalog discovery ${url}: ${error.message}`)
      continue
    }

    discovered.add(url)

    for (const link of extractCatalogLinks(html)) {
      const path = getPath(link)

      if (isCatalogProductPath(path)) {
        discovered.add(link)
        continue
      }

      if (isCatalogCategoryPath(path)) {
        discovered.add(link)
        if (!visited.has(link) && !queued.includes(link)) queued.push(link)
      }
    }
  }

  return discovered
}

const selectImage = (html) => {
  const images = [...html.matchAll(/<img\b[^>]*>/gi)]
    .map(([tag]) => {
      const src =
        /data-original=["']([^"']+)["']/i.exec(tag)?.[1] ??
        /data-src=["']([^"']+)["']/i.exec(tag)?.[1] ??
        /src=["']([^"']+)["']/i.exec(tag)?.[1] ??
        ''
      const alt = /alt=["']([^"']*)["']/i.exec(tag)?.[1] ?? ''
      return { src: absolutize(src), alt: stripTags(alt) }
    })
    .filter((image) => {
      const haystack = `${image.src} ${image.alt}`
      return image.src.includes('/upload/') && !/logo|logotype|sprite|blank/i.test(haystack)
    })

  images.sort((a, b) => {
    const score = (image) => {
      let result = 0
      if (!image.src.includes('/resize_cache/')) result += 1000
      const size = /\/(\d+)_(\d+)(?:_\d+)?\//.exec(image.src)
      if (size) result += Number(size[1]) + Number(size[2])
      if (/\/iblock\//.test(image.src)) result += 100
      return result
    }

    return score(b) - score(a)
  })

  return images[0] ?? { src: '', alt: '' }
}

const parseAttributes = (text) => {
  const start = text.indexOf('Артикул:')
  const scoped =
    start >= 0
      ? text.slice(start, Math.max(text.indexOf('Нужна консультация?', start), start + 500))
      : text
  const result = {}
  const patterns = [
    ['Длина', /Длина\s*[-:]?\s*([^;,.]+(?:мм|см)?)/i],
    ['Диаметр', /Диаметр\s*[-:]?\s*([^;,.]+(?:мм|см)?)/i],
    ['Материал', /Материал(?!ы)\s*[-:]?\s*([^;.]+)/i],
    ['Толщина', /Толщина\s*[-:]?\s*([^;,.]+(?:мм|см)?)/i],
    ['Кол-во отв.', /Кол-во отв\.\s*[-:]?\s*([^;,.]+)/i]
  ]

  for (const [label, pattern] of patterns) {
    const match = pattern.exec(scoped)
    if (!match) continue
    result[label] = match[1].trim()
  }

  if (/Россия/i.test(scoped)) result['Страна производства'] = 'Россия, Венгрия, Индия'
  return result
}

const classify = (url) => {
  const path = new URL(url).pathname
  if (path === '/') return 'home'
  if (/^\/brands\//.test(path)) return 'brand'
  if (/^\/catalog\/[^/]+\/\d+\/$/.test(path)) return 'product'
  if (/^\/catalog\//.test(path)) return 'category'
  if (/^\/company\//.test(path)) return 'company'
  if (/^\/help\//.test(path)) return 'help'
  if (/^\/contacts\//.test(path)) return 'contacts'
  return 'page'
}

const parsePage = async (url) => {
  const html = await fetchText(url)
  const title = stripTags(/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? '')
  const h1 = stripTags(/<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(html)?.[1] ?? '')
  const text = stripTags(html)
  const image = selectImage(html)
  const path = new URL(url).pathname
  const section = path.split('/').filter(Boolean)[1] ?? ''
  const id = /^\/catalog\/[^/]+\/(\d+)\/$/.exec(path)?.[1] ?? ''

  return {
    url,
    path,
    kind: classify(url),
    title,
    h1: h1 || title,
    description: getMeta(html, 'description'),
    section,
    id,
    image: image.src,
    imageAlt: image.alt,
    attributes: parseAttributes(text)
  }
}

const run = async () => {
  const sitemapIndex = await fetchText(`${SITE}/sitemap.xml`, 250_000)
  const childSitemaps = matchAll(/<loc>(https:\/\/reko-med\.ru\/sitemap-iblock-[^<]+)<\/loc>/gi, sitemapIndex)
  const urls = new Set([`${SITE}/`])

  for (const sitemap of childSitemaps) {
    const xml = await fetchText(sitemap, 700_000)
    for (const loc of matchAll(/<loc>(https:\/\/reko-med\.ru\/[^<]+)<\/loc>/gi, xml)) {
      if (!loc.endsWith('.xml')) urls.add(loc)
    }
  }

  const discoveredCatalogUrls = await discoverCatalogUrls()
  for (const url of discoveredCatalogUrls) urls.add(url)
  console.log(`Discovered ${discoveredCatalogUrls.size} catalog URLs from public category pages`)

  const pages = []
  const skipped = []
  for (const url of urls) {
    try {
      pages.push(await parsePage(url))
      process.stdout.write('.')
    } catch (error) {
      skipped.push({ url, reason: error.message })
      console.warn(`\nSkipped ${url}: ${error.message}`)
    }
  }
  process.stdout.write('\n')

  const byKind = pages.reduce((acc, page) => {
    acc[page.kind] = (acc[page.kind] ?? 0) + 1
    return acc
  }, {})

  const source = `// Generated by scripts/sync-current-site.mjs. Do not edit manually.\n` +
    `export type CurrentSitePage = {\n` +
    `  url: string\n  path: string\n  kind: 'home' | 'brand' | 'product' | 'category' | 'company' | 'help' | 'contacts' | 'page'\n` +
    `  title: string\n  h1: string\n  description: string\n  section: string\n  id: string\n  image: string\n  imageAlt: string\n  attributes: Record<string, string>\n` +
    `}\n\n` +
    `export const currentSiteGeneratedAt = ${JSON.stringify(new Date().toISOString())}\n` +
    `export const currentSiteStats = ${JSON.stringify({ total: pages.length, byKind }, null, 2)} as const\n` +
    `export const skippedCurrentSiteUrls = ${JSON.stringify(skipped, null, 2)} as const\n` +
    `export const currentSitePages: CurrentSitePage[] = ${JSON.stringify(pages, null, 2)}\n`

  await mkdir(new URL('../src/data', import.meta.url), { recursive: true })
  await writeFile(OUT, source, 'utf8')
  console.log(`Generated ${pages.length} pages -> ${OUT.pathname}`)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
