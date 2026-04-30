import type { Metadata, Viewport } from 'next'
import { SiteChrome } from '@/components/SiteChrome'
import { JsonLd } from '@/components/JsonLd'
import { company, siteUrl } from '@/lib/content'
import { organizationSchema, websiteSchema } from '@/lib/schema'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'RekoMed - медицинские изделия для клиник и закупщиков',
    template: '%s'
  },
  description: company.tagline,
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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f4f5f'
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>
        <JsonLd data={[organizationSchema, websiteSchema]} />
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  )
}
