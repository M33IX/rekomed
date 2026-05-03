import Link from 'next/link'
import { Mail, MapPin, Phone, Send } from 'lucide-react'
import { company, navigation } from '@/lib/content'
import { MobileNav } from '@/components/MobileNav'
import type { PublicSiteSettings } from '@/lib/site-settings'

type SiteChromeProps = {
  children: React.ReactNode
  settings: PublicSiteSettings
}

const getPhoneHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`
const getEmailHref = (email: string) => `mailto:${email}`
const leadHref = '/contacts/stores/#lead'
const legalLinks = [
  { href: '/privacy/', label: 'Политика обработки ПД' },
  { href: '/consent/', label: 'Согласие на обработку ПД' },
  { href: '/terms/', label: 'Пользовательское соглашение' },
  { href: '/legal/', label: 'Юридическая информация' },
  { href: '/license/', label: 'Лицензии и документы' }
]

export function SiteChrome({ children, settings }: SiteChromeProps) {
  const phoneHref = getPhoneHref(settings.phone)
  const emailHref = getEmailHref(settings.email)

  return (
    <>
      <header className="site-header">
        <div className="topbar">
          <span>
            <MapPin size={16} aria-hidden="true" />
            {settings.address}
          </span>
          <a href={emailHref}>
            <Mail size={16} aria-hidden="true" />
            {settings.email}
          </a>
        </div>
        <div className="nav-shell">
          <Link className="brand" href="/" aria-label="RekoMed">
            <span className="brand-mark">R</span>
            <span>
              <strong>RekoMed</strong>
              <small>медицинские изделия</small>
            </span>
          </Link>
          <nav className="desktop-nav" aria-label="Основная навигация">
            {navigation.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="header-actions">
            <a className="phone-link" href={phoneHref}>
              <Phone size={17} aria-hidden="true" />
              {settings.phone}
            </a>
            <Link className="outline-action" href={leadHref}>
              <Send size={17} aria-hidden="true" />
              КП
            </Link>
            <MobileNav phone={settings.phone} phoneHref={phoneHref} leadHref={leadHref} />
          </div>
        </div>
      </header>
      <main>{children}</main>
      <footer className="site-footer">
        <div>
          <Link className="brand inverted" href="/">
            <span className="brand-mark">R</span>
            <span>
              <strong>RekoMed</strong>
              <small>медицинские изделия</small>
            </span>
          </Link>
          <p>{company.tagline}</p>
        </div>
        <div className="footer-links">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
          {legalLinks.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </div>
        <div className="footer-contacts">
          <a href={phoneHref}>{settings.phone}</a>
          <a href={emailHref}>{settings.email}</a>
          {settings.vkUrl && <a href={settings.vkUrl}>VK</a>}
          <span>{company.hours}</span>
        </div>
      </footer>
      {settings.medicalDisclaimerEnabled && settings.medicalDisclaimerText && (
        <div className="medical-disclaimer">{settings.medicalDisclaimerText}</div>
      )}
    </>
  )
}
