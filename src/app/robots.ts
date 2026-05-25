import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/content'

const siteHost = new URL(siteUrl).host

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/_next/', '/api/payload/media/file/'],
      disallow: [
        '/admin/',
        '/api/',
        '/cgi-bin',
        '/bitrix/',
        '/local/',
        '/auth/',
        '/personal/',
        '/index.php',
        '/*index.php$',
        '*/search/',
        '*/feed',
        '*/rss',
        '*bitrix_*=',
        '*auth=',
        '*register=',
        '*forgot_password=',
        '*change_password=',
        '*login=',
        '*logout=',
        '*action=',
        '*print=',
        '*?edit=',
        '*?preview=',
        '*backurl=',
        '*back_url=',
        '*back_url_admin=',
        '*captcha',
        '*openstat='
      ]
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteHost
  }
}
