import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import { leadSchema, sendVkLead, storeLeadFallback, type StoredLead } from '@/lib/leads'
import { getSiteSettings } from '@/lib/site-settings'

export const runtime = 'nodejs'

const buckets = new Map<string, { count: number; resetAt: number }>()

const getIp = (request: NextRequest) =>
  request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
  request.headers.get('x-real-ip') ||
  '127.0.0.1'

const rateLimit = (ip: string) => {
  const max = Number(process.env.LEAD_RATE_LIMIT_PER_HOUR || 12)
  const now = Date.now()
  const current = buckets.get(ip)

  if (!current || current.resetAt <= now) {
    buckets.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 })
    return true
  }

  if (current.count >= max) return false
  current.count += 1
  return true
}

const getRawPayload = async (request: NextRequest) => {
  const contentType = request.headers.get('content-type') || ''
  if (contentType.includes('application/json')) return request.json()

  const form = await request.formData()
  return Object.fromEntries(form.entries())
}

export async function POST(request: NextRequest) {
  const ip = getIp(request)
  if (!rateLimit(ip)) {
    return NextResponse.json({ ok: false, error: 'Слишком много заявок. Попробуйте позже.' }, { status: 429 })
  }

  const parsed = leadSchema.safeParse(await getRawPayload(request))
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message || 'Проверьте поля формы' }, { status: 400 })
  }

  if (parsed.data.companyWebsite) {
    return NextResponse.json({ ok: true })
  }

  const lead: StoredLead = {
    ...parsed.data,
    id: crypto.randomUUID().slice(0, 8),
    createdAt: new Date().toISOString(),
    ip,
    userAgent: request.headers.get('user-agent') || ''
  }

  const payloadData = {
    type: 'callback' as const,
    name: lead.name,
    phone: lead.phone,
    email: lead.email || undefined,
    message: lead.message || undefined,
    pageUrl: lead.pageUrl || undefined,
    productId: lead.productId || undefined,
    productTitle: lead.productTitle || undefined,
    productSku: lead.productSku || undefined,
    productPath: lead.productPath || undefined,
    productCategory: lead.productCategory || undefined,
    utm: lead.utm || undefined,
    consent: lead.consent,
    deliveryStatus: 'pending',
    status: 'new'
  }

  try {
    const payload = await getPayload({ config })
    const savedLead = await payload.create({
      collection: 'leads',
      data: payloadData as never,
      overrideAccess: true
    })

    const settings = await getSiteSettings()
    const delivery = await sendVkLead(lead, settings)

    await payload.update({
      collection: 'leads',
      id: savedLead.id,
      data: {
        deliveryStatus: delivery.status,
        vkMessageId: delivery.messageId,
        deliveryError: delivery.error
      } as never,
      overrideAccess: true
    })

    return NextResponse.json({ ok: true, id: savedLead.id, deliveryStatus: delivery.status })
  } catch (error) {
    console.error('Lead save failed', error instanceof Error ? error.message : 'Unknown error')
    await storeLeadFallback({
      ...lead,
      deliveryStatus: 'failed',
      deliveryError: error instanceof Error ? error.message : 'Lead CMS save failed'
    })

    return NextResponse.json(
      { ok: false, error: 'Заявка сохранена не полностью. Свяжитесь с нами по телефону.' },
      { status: 500 }
    )
  }
}
