import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = {
  params: Promise<{ path?: string[] }>
}

const legacyMediaOrigin = () => (process.env.LEGACY_MEDIA_ORIGIN || '').replace(/\/$/, '')

const isSafePath = (segments: string[]) =>
  segments.length > 0 &&
  segments.every((segment) => segment && segment !== '.' && segment !== '..' && !segment.includes('/') && !segment.includes('\\'))

const getLegacyUrl = (segments: string[], request: NextRequest) => {
  const origin = legacyMediaOrigin()
  if (!origin) return null

  const url = new URL(`/upload/${segments.map(encodeURIComponent).join('/')}`, origin)
  url.search = request.nextUrl.search
  return url
}

const responseHeaders = (upstream: Response) => {
  const headers = new Headers()
  const contentType = upstream.headers.get('content-type') || 'application/octet-stream'
  const contentLength = upstream.headers.get('content-length')
  const lastModified = upstream.headers.get('last-modified')
  const etag = upstream.headers.get('etag')

  headers.set('content-type', contentType)
  headers.set('cache-control', 'public, max-age=604800, stale-while-revalidate=86400')
  headers.set('x-rekomed-legacy-media', 'proxied')
  if (contentLength) headers.set('content-length', contentLength)
  if (lastModified) headers.set('last-modified', lastModified)
  if (etag) headers.set('etag', etag)

  return headers
}

const proxyLegacyMedia = async (request: NextRequest, context: RouteContext, method: 'GET' | 'HEAD') => {
  const { path = [] } = await context.params
  if (!isSafePath(path)) {
    return NextResponse.json({ ok: false, error: 'Invalid legacy media path' }, { status: 400 })
  }

  const url = getLegacyUrl(path, request)
  if (!url) {
    return NextResponse.json({ ok: false, error: 'LEGACY_MEDIA_ORIGIN is not configured' }, { status: 404 })
  }

  const hostHeader = process.env.LEGACY_MEDIA_HOST_HEADER || ''
  const upstream = await fetch(url, {
    method,
    headers: {
      'user-agent': 'Mozilla/5.0 RekoMed legacy media fallback',
      ...(hostHeader ? { host: hostHeader } : {})
    },
    redirect: 'follow'
  })

  if (!upstream.ok || (method === 'GET' && !upstream.body)) {
    return new NextResponse(null, {
      status: upstream.status,
      headers: {
        'cache-control': 'public, max-age=300',
        'x-rekomed-legacy-media': 'miss'
      }
    })
  }

  const contentType = upstream.headers.get('content-type') || ''
  if (!contentType.startsWith('image/') && contentType !== 'application/pdf') {
    return NextResponse.json({ ok: false, error: 'Unsupported legacy media type' }, { status: 502 })
  }

  return new NextResponse(method === 'HEAD' ? null : upstream.body, {
    status: upstream.status,
    headers: responseHeaders(upstream)
  })
}

export async function GET(request: NextRequest, context: RouteContext) {
  return proxyLegacyMedia(request, context, 'GET')
}

export async function HEAD(request: NextRequest, context: RouteContext) {
  return proxyLegacyMedia(request, context, 'HEAD')
}
