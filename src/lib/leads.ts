import { appendFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { z } from 'zod'
import { siteUrl } from '@/lib/content'
import type { PublicSiteSettings } from '@/lib/site-settings'

export const leadSchema = z.object({
  type: z.literal('callback').default('callback'),
  name: z.string().min(2, 'Укажите имя').max(120),
  phone: z.string().min(7, 'Укажите телефон').max(40),
  email: z.string().email('Укажите корректную почту').optional().or(z.literal('')),
  message: z.string().max(4000).optional().or(z.literal('')),
  pageUrl: z.string().max(500).optional().or(z.literal('')),
  productId: z.string().max(80).optional().or(z.literal('')),
  productTitle: z.string().max(240).optional().or(z.literal('')),
  productSku: z.string().max(80).optional().or(z.literal('')),
  productPath: z.string().max(500).optional().or(z.literal('')),
  productCategory: z.string().max(240).optional().or(z.literal('')),
  consent: z.literal(true, {
    errorMap: () => ({ message: 'Нужно согласие на обработку персональных данных' })
  }),
  utm: z.record(z.string()).optional(),
  companyWebsite: z.string().optional().or(z.literal(''))
})

export type LeadPayload = z.infer<typeof leadSchema>

export type StoredLead = LeadPayload & {
  id: string
  createdAt: string
  ip: string
  userAgent: string
}

export type VkDeliveryResult =
  | { status: 'skipped'; messageId?: never; error?: never }
  | { status: 'sent'; messageId: string; error?: never }
  | { status: 'failed'; messageId?: never; error: string }

const getProductUrl = (lead: StoredLead) => {
  if (!lead.productPath) return ''
  if (/^https?:\/\//i.test(lead.productPath)) return lead.productPath
  return `${siteUrl}${lead.productPath.startsWith('/') ? lead.productPath : `/${lead.productPath}`}`
}

const getProductLine = (lead: StoredLead) => {
  if (!lead.productTitle && !lead.productSku) return ''
  const sku = lead.productSku || lead.productId
  return [lead.productTitle, sku ? `арт. ${sku}` : ''].filter(Boolean).join(', ')
}

const stringifyUtm = (utm: StoredLead['utm']) => {
  if (!utm || Object.keys(utm).length === 0) return ''
  return Object.entries(utm)
    .map(([key, value]) => `${key}=${value}`)
    .join('&')
}

const replaceTemplateTokens = (template: string, lead: StoredLead) => {
  const product = getProductLine(lead)
  const productUrl = getProductUrl(lead)
  const tokens: Record<string, string> = {
    id: lead.id,
    name: lead.name,
    phone: lead.phone,
    email: lead.email || '-',
    message: lead.message || '-',
    product: product || '-',
    productTitle: lead.productTitle || '-',
    productSku: lead.productSku || lead.productId || '-',
    productCategory: lead.productCategory || '-',
    productUrl: productUrl || '-',
    page: lead.pageUrl || '-',
    date: lead.createdAt,
    utm: stringifyUtm(lead.utm) || '-'
  }

  return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => tokens[key] ?? '')
}

export const formatLead = (lead: StoredLead, template?: string) => {
  if (template?.trim()) return replaceTemplateTokens(template, lead)

  const product = getProductLine(lead)
  const productUrl = getProductUrl(lead)
  const utm = stringifyUtm(lead.utm)

  return [
    `Новая заявка RekoMed #${lead.id}`,
    `Имя: ${lead.name}`,
    `Телефон: ${lead.phone}`,
    lead.email ? `Email: ${lead.email}` : '',
    product ? `Товар: ${product}` : '',
    lead.productCategory ? `Категория: ${lead.productCategory}` : '',
    productUrl ? `Ссылка на товар: ${productUrl}` : '',
    lead.pageUrl ? `Страница заявки: ${lead.pageUrl}` : '',
    lead.message ? `Комментарий: ${lead.message}` : '',
    utm ? `UTM: ${utm}` : '',
    `Дата: ${lead.createdAt}`
  ]
    .filter(Boolean)
    .join('\n')
}

export const storeLeadFallback = async (lead: StoredLead & { deliveryStatus?: string; deliveryError?: string }) => {
  const storageFile = process.env.LEADS_STORAGE_FILENAME || 'leads.jsonl'
  const storagePath = join(process.cwd(), 'var', storageFile)
  await mkdir(join(process.cwd(), 'var'), { recursive: true })
  await appendFile(storagePath, `${JSON.stringify(lead)}\n`, 'utf8')
}

export const sendVkLead = async (lead: StoredLead, settings: PublicSiteSettings): Promise<VkDeliveryResult> => {
  const token = process.env.VK_GROUP_TOKEN
  const peerId = settings.vkRecipientPeerId

  if (!settings.vkLeadEnabled || !token || !peerId) return { status: 'skipped' }

  const randomId = Math.floor(Math.random() * 2_000_000_000)
  const body = new URLSearchParams({
    access_token: token,
    v: process.env.VK_API_VERSION || '5.199',
    peer_id: peerId,
    random_id: String(randomId),
    message: formatLead(lead, settings.vkLeadMessageTemplate)
  })

  try {
    const response = await fetch('https://api.vk.com/method/messages.send', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body
    })

    const data = (await response.json()) as {
      response?: number
      error?: { error_code?: number; error_msg?: string }
    }

    if (!response.ok || data.error) {
      const message = data.error?.error_msg || `VK delivery failed: ${response.status}`
      return { status: 'failed', error: message }
    }

    return { status: 'sent', messageId: String(data.response || '') }
  } catch (cause) {
    return { status: 'failed', error: cause instanceof Error ? cause.message : 'VK delivery failed' }
  }
}
