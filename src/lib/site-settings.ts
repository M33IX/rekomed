import { Socket } from 'node:net'
import config from '@payload-config'
import { getPayload } from 'payload'
import { company } from '@/lib/content'
import type { Media } from '../../payload-types'

export type PublicSiteSettings = {
  phone: string
  email: string
  address: string
  telegram: string
  mainCta: string
  leadFormTitle: string
  leadFormText: string
  leadSuccessTitle: string
  leadSuccessText: string
  jivoEnabled: boolean
  jivoWidgetId: string
  vkLeadEnabled: boolean
  vkRecipientPeerId: string
  vkLeadMessageTemplate: string
  yandexMetrikaId: string
  yandexVerification: string
  googleSiteVerification: string
  vkUrl: string
  legalInn: string
  legalOgrn: string
  legalAddress: string
  legalName: string
  privacyText: string
  consentText: string
  termsText: string
  legalText: string
  licenseText: string
  licenseFileUrl: string
  cookieBannerEnabled: boolean
  cookieBannerText: string
  cookiePolicyPath: string
  medicalDisclaimerEnabled: boolean
  medicalDisclaimerText: string
}

export const defaultSiteSettings: PublicSiteSettings = {
  phone: company.phone,
  email: company.email,
  address: company.address,
  telegram: company.telegram,
  mainCta: 'Получить консультацию',
  leadFormTitle: 'Связаться с RekoMed',
  leadFormText: 'Оставьте контакты, и менеджер свяжется с вами по заявке.',
  leadSuccessTitle: 'Заявка отправлена',
  leadSuccessText: 'Менеджер свяжется с вами и уточнит детали запроса.',
  jivoEnabled: false,
  jivoWidgetId: '',
  vkLeadEnabled: false,
  vkRecipientPeerId: '',
  vkLeadMessageTemplate:
    'Новая заявка RekoMed\nИмя: {{name}}\nТелефон: {{phone}}\nEmail: {{email}}\nТовар: {{product}}\nСтраница: {{page}}\nКомментарий: {{message}}',
  yandexMetrikaId: '',
  yandexVerification: '',
  googleSiteVerification: '',
  vkUrl: '',
  legalInn: '',
  legalOgrn: '',
  legalAddress: company.address,
  legalName: company.legalName,
  privacyText: '',
  consentText: '',
  termsText: '',
  legalText: '',
  licenseText: '',
  licenseFileUrl: '',
  cookieBannerEnabled: true,
  cookieBannerText:
    'Мы используем cookie для аналитики и улучшения работы сайта. Вы можете принять или отклонить использование cookie.',
  cookiePolicyPath: '/privacy/',
  medicalDisclaimerEnabled: true,
  medicalDisclaimerText: 'Имеются противопоказания. Необходима консультация специалиста.'
}

const toString = (value: unknown, fallback = '') => (typeof value === 'string' && value.trim() ? value : fallback)
const getMediaUrl = (value: unknown) =>
  typeof value === 'object' && value !== null && 'url' in value ? toString((value as Media).url) : ''

let settingsPromise: Promise<PublicSiteSettings> | undefined
let settingsCache: { value: PublicSiteSettings; expiresAt: number } | undefined

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

export const normalizeSiteSettings = (raw: unknown): PublicSiteSettings => {
  const settings = raw as
    | (Partial<Record<keyof PublicSiteSettings, unknown>> & { licenseFile?: unknown })
    | null
    | undefined

  return {
    phone: toString(settings?.phone, defaultSiteSettings.phone),
    email: toString(settings?.email, defaultSiteSettings.email),
    address: toString(settings?.address, defaultSiteSettings.address),
    telegram: toString(settings?.telegram, defaultSiteSettings.telegram),
    mainCta: toString(settings?.mainCta, defaultSiteSettings.mainCta),
    leadFormTitle: toString(settings?.leadFormTitle, defaultSiteSettings.leadFormTitle),
    leadFormText: toString(settings?.leadFormText, defaultSiteSettings.leadFormText),
    leadSuccessTitle: toString(settings?.leadSuccessTitle, defaultSiteSettings.leadSuccessTitle),
    leadSuccessText: toString(settings?.leadSuccessText, defaultSiteSettings.leadSuccessText),
    jivoEnabled: settings?.jivoEnabled === true,
    jivoWidgetId: toString(settings?.jivoWidgetId),
    vkLeadEnabled: settings?.vkLeadEnabled === true,
    vkRecipientPeerId: toString(settings?.vkRecipientPeerId),
    vkLeadMessageTemplate: toString(settings?.vkLeadMessageTemplate, defaultSiteSettings.vkLeadMessageTemplate),
    yandexMetrikaId: toString(settings?.yandexMetrikaId),
    yandexVerification: toString(settings?.yandexVerification),
    googleSiteVerification: toString(settings?.googleSiteVerification),
    vkUrl: toString(settings?.vkUrl),
    legalInn: toString(settings?.legalInn),
    legalOgrn: toString(settings?.legalOgrn),
    legalAddress: toString(settings?.legalAddress, defaultSiteSettings.legalAddress),
    legalName: toString(settings?.legalName, defaultSiteSettings.legalName),
    privacyText: toString(settings?.privacyText),
    consentText: toString(settings?.consentText),
    termsText: toString(settings?.termsText),
    legalText: toString(settings?.legalText),
    licenseText: toString(settings?.licenseText),
    licenseFileUrl: getMediaUrl(settings?.licenseFile),
    cookieBannerEnabled: settings?.cookieBannerEnabled !== false,
    cookieBannerText: toString(settings?.cookieBannerText, defaultSiteSettings.cookieBannerText),
    cookiePolicyPath: toString(settings?.cookiePolicyPath, defaultSiteSettings.cookiePolicyPath),
    medicalDisclaimerEnabled: settings?.medicalDisclaimerEnabled !== false,
    medicalDisclaimerText: toString(settings?.medicalDisclaimerText, defaultSiteSettings.medicalDisclaimerText)
  }
}

const loadSiteSettings = async () => {
  try {
    if (!(await canReachDatabase())) return defaultSiteSettings

    const payload = await getPayload({ config })
    const settings = await payload.findGlobal({
      slug: 'site-settings',
      depth: 1,
      overrideAccess: true
    })

    return normalizeSiteSettings(settings)
  } catch {
    return defaultSiteSettings
  }
}

export const getSiteSettings = async () => {
  const now = Date.now()
  if (settingsCache && settingsCache.expiresAt > now) return settingsCache.value

  settingsPromise ??= loadSiteSettings().then((value) => {
    settingsCache = { value, expiresAt: Date.now() + 60_000 }
    settingsPromise = undefined
    return value
  })

  return settingsPromise
}
