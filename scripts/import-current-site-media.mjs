import { extname } from 'node:path'
import { readFile } from 'node:fs/promises'

const DEFAULT_API_URL = 'http://localhost:3000/api/payload'
const SOURCE = new URL('../src/data/current-site.generated.ts', import.meta.url)

const args = new Set(process.argv.slice(2))
const dryRun = args.has('--dry-run')
const strict = args.has('--strict')
const apiUrl = (process.env.PAYLOAD_API_URL || DEFAULT_API_URL).replace(/\/$/, '')
const email = process.env.PAYLOAD_IMPORT_EMAIL || process.env.PAYLOAD_EMAIL || 'test@test.test'
const password = process.env.PAYLOAD_IMPORT_PASSWORD || process.env.PAYLOAD_PASSWORD || '123'
const legacyMediaOrigin = (process.env.LEGACY_MEDIA_ORIGIN || '').replace(/\/$/, '')
const legacyMediaHostHeader = process.env.LEGACY_MEDIA_HOST_HEADER || ''

const normalizeText = (value) => String(value || '').replace(/\s+/g, ' ').trim()

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
      ...(options.json ? { 'content-type': 'application/json' } : {}),
      ...(options.token ? { Authorization: `JWT ${options.token}` } : {}),
      ...(options.headers || {})
    },
    body: options.json ? JSON.stringify(options.body) : options.body
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
    json: true,
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

const filenameFromUrl = (url) => {
  const parsed = new URL(url)
  const original = parsed.pathname.split('/').filter(Boolean).at(-1) || 'image'
  const ext = extname(original) || '.png'
  const stem = original.slice(0, original.length - ext.length)
  return `${stem}`.replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') + ext.toLowerCase()
}

const brandSlugFromPath = (path) => path.split('/').filter(Boolean).at(-1) || ''

const mediaUrl = (url) => {
  if (!legacyMediaOrigin) return url
  const parsed = new URL(url)
  const resolved = new URL(parsed.pathname, legacyMediaOrigin)
  resolved.search = parsed.search
  return resolved.toString()
}

const fetchImage = async (url) => {
  const response = await fetch(mediaUrl(url), {
    headers: {
      'user-agent': 'Mozilla/5.0 RekoMed media import',
      ...(legacyMediaHostHeader ? { host: legacyMediaHostHeader } : {})
    }
  })

  if (!response.ok) throw new Error(`Image request failed ${response.status}: ${url}`)
  const contentType = response.headers.get('content-type') || 'application/octet-stream'
  if (!contentType.startsWith('image/')) throw new Error(`Not an image (${contentType}): ${url}`)
  return { bytes: Buffer.from(await response.arrayBuffer()), contentType }
}

const uploadMedia = async ({ url, alt, token, cache, stats }) => {
  if (cache.has(url)) return cache.get(url)

  const existing = await findOne('media', 'filename', filenameFromUrl(url), token)
  if (existing) {
    cache.set(url, existing)
    stats.reused += 1
    return existing
  }

  if (dryRun) {
    const fake = { id: `dry-media-${stats.uploaded + 1}` }
    cache.set(url, fake)
    stats.uploaded += 1
    return fake
  }

  const { bytes, contentType } = await fetchImage(url)
  const form = new FormData()
  form.append('file', new File([bytes], filenameFromUrl(url), { type: contentType }))
  form.append('_payload', JSON.stringify({ alt }))

  const result = await requestJson('/media', {
    method: 'POST',
    token,
    body: form
  })

  const doc = result.doc || result
  cache.set(url, doc)
  stats.uploaded += 1
  return doc
}

const patchDoc = async (collection, id, body, token, stats) => {
  if (dryRun) {
    stats.patched += 1
    return
  }

  await requestJson(`/${collection}/${id}`, {
    method: 'PATCH',
    token,
    json: true,
    body
  })
  stats.patched += 1
}

const main = async () => {
  const pages = await parseGeneratedPages()
  const token = await login()
  const cache = new Map()
  const stats = { uploaded: 0, reused: 0, patched: 0, skipped: 0, missingDoc: 0, failed: 0 }
  const failures = []
  const targets = pages.filter((page) => ['product', 'brand'].includes(page.kind) && page.image)

  for (const page of targets) {
    try {
      const collection = page.kind === 'product' ? 'products' : 'brands'
      const lookupField = page.kind === 'product' ? 'legacyPath' : 'slug'
      const lookupValue = page.kind === 'product' ? page.path : page.id || brandSlugFromPath(page.path)
      const field = page.kind === 'product' ? 'image' : 'logo'
      const doc = await findOne(collection, lookupField, lookupValue, token)

      if (!doc) {
        stats.missingDoc += 1
        continue
      }

      if (doc[field]) {
        stats.skipped += 1
        continue
      }

      const media = await uploadMedia({
        url: page.image,
        alt: normalizeText(page.imageAlt || page.h1 || page.title),
        token,
        cache,
        stats
      })

      await patchDoc(collection, doc.id, { [field]: media.id }, token, stats)
    } catch (error) {
      stats.failed += 1
      failures.push({ path: page.path, image: page.image, reason: error.message })
    }
  }

  console.log(JSON.stringify({ apiUrl, dryRun, strict, targets: targets.length, stats, failures }, null, 2))

  if (strict && (stats.failed > 0 || stats.missingDoc > 0)) {
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
