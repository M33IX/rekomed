import { NextRequest, NextResponse } from 'next/server'
import { leadSchema, sendEmailLead, sendTelegramLead, storeLead, type StoredLead } from '@/lib/leads'

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

export async function POST(request: NextRequest) {
  const ip = getIp(request)
  if (!rateLimit(ip)) {
    return NextResponse.json({ ok: false, error: 'Слишком много заявок. Попробуйте позже.' }, { status: 429 })
  }

  let raw: unknown
  const contentType = request.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    raw = await request.json()
  } else {
    const form = await request.formData()
    raw = Object.fromEntries(form.entries())
  }

  const parsed = leadSchema.safeParse(raw)
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

  try {
    await storeLead(lead)
    await Promise.allSettled([sendTelegramLead(lead), sendEmailLead(lead)])
    return NextResponse.json({ ok: true, id: lead.id })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ ok: false, error: 'Заявка сохранена не полностью. Свяжитесь с нами по телефону.' }, { status: 500 })
  }
}
