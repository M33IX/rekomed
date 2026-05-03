import type { Metadata, Viewport } from 'next'
import { SiteChrome } from '@/components/SiteChrome'
import { JsonLd } from '@/components/JsonLd'
import { JivoChatWidget } from '@/components/JivoChatWidget'
import { CookieConsentBanner } from '@/components/CookieConsentBanner'
import { company, siteUrl } from '@/lib/content'
import { organizationSchema, websiteSchema } from '@/lib/schema'
import { getSiteSettings } from '@/lib/site-settings'
import '../globals.css'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: 'RekoMed - медицинские изделия для клиник и закупщиков',
      template: '%s'
    },
    description: company.tagline,
    verification: {
      google: settings.googleSiteVerification || undefined,
      yandex: settings.yandexVerification || undefined
    },
    openGraph: {
      type: 'website',
      locale: 'ru_RU',
      siteName: 'RekoMed',
      title: 'RekoMed - медицинские изделия для клиник и закупщиков',
      description: company.tagline,
      url: siteUrl,
      images: ['/og-rekomed.svg']
    }
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f4f5f'
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const settings = await getSiteSettings()

  return (
    <html lang="ru">
      <body>
        <JsonLd data={[organizationSchema(settings), websiteSchema]} />
        <SiteChrome settings={settings}>{children}</SiteChrome>
        <CookieConsentBanner
          enabled={settings.cookieBannerEnabled}
          text={settings.cookieBannerText}
          policyPath={settings.cookiePolicyPath}
          yandexMetrikaId={settings.yandexMetrikaId}
        />
        <JivoChatWidget enabled={settings.jivoEnabled} widgetId={settings.jivoWidgetId} />
      </body>
    </html>
  )
}
