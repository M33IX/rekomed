import { mkdir, appendFile } from 'node:fs/promises'
import { join } from 'node:path'
import nodemailer from 'nodemailer'
import { z } from 'zod'
import { leadTypes } from '@/lib/content'

const leadTypeValues = leadTypes.map((type) => type.value) as [string, ...string[]]

export const leadSchema = z.object({
  type: z.enum(leadTypeValues).default('quote'),
  name: z.string().min(2, 'Укажите имя').max(120),
  phone: z.string().min(7, 'Укажите телефон').max(40),
  email: z.string().email('Укажите корректную почту').optional().or(z.literal('')),
  message: z.string().max(4000).optional().or(z.literal('')),
  pageUrl: z.string().max(500).optional().or(z.literal('')),
  productId: z.string().max(80).optional().or(z.literal('')),
  consent: z.literal(true, {
    errorMap: () => ({ message: 'Нужно согласие на обработку персональных данных' })
  }),
  utm: z.record(z.string()).optional(),
  fileName: z.string().max(240).optional().or(z.literal('')),
  companyWebsite: z.string().optional().or(z.literal(''))
})

export type LeadPayload = z.infer<typeof leadSchema>

export type StoredLead = LeadPayload & {
  id: string
  createdAt: string
  ip: string
  userAgent: string
}

const formatLead = (lead: StoredLead) => [
  `Новая заявка RekoMed #${lead.id}`,
  `Тип: ${lead.type}`,
  `Имя: ${lead.name}`,
  `Телефон: ${lead.phone}`,
  lead.email ? `Email: ${lead.email}` : '',
  lead.productId ? `Товар: ${lead.productId}` : '',
  lead.pageUrl ? `Страница: ${lead.pageUrl}` : '',
  lead.fileName ? `Файл: ${lead.fileName}` : '',
  lead.message ? `Комментарий: ${lead.message}` : '',
  `Дата: ${lead.createdAt}`
]
  .filter(Boolean)
  .join('\n')

export const storeLead = async (lead: StoredLead) => {
  const storageFile = process.env.LEADS_STORAGE_FILENAME || 'leads.jsonl'
  const storagePath = join(process.cwd(), 'var', storageFile)
  await mkdir(join(process.cwd(), 'var'), { recursive: true })
  await appendFile(storagePath, `${JSON.stringify(lead)}\n`, 'utf8')
}

export const sendTelegramLead = async (lead: StoredLead) => {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) return { skipped: true }

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: formatLead(lead),
      disable_web_page_preview: true
    })
  })

  if (!response.ok) {
    throw new Error(`Telegram delivery failed: ${response.status}`)
  }

  return { skipped: false }
}

export const sendEmailLead = async (lead: StoredLead) => {
  const host = process.env.SMTP_HOST
  const to = process.env.LEADS_EMAIL_TO
  if (!host || !to) return { skipped: true }

  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 465),
    secure: process.env.SMTP_SECURE !== 'false',
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        : undefined
  })

  await transporter.sendMail({
    from: process.env.LEADS_EMAIL_FROM || 'site@reko-med.ru',
    to,
    subject: `Заявка RekoMed: ${lead.name}`,
    text: formatLead(lead),
    replyTo: lead.email || undefined
  })

  return { skipped: false }
}
