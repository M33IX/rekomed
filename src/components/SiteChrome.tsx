import Link from 'next/link'
import { Clock, FileText, Mail, MapPin, Phone, Search, Send, Shapes } from 'lucide-react'
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
const desktopNavigation = navigation.filter((item) => item.href !== '/')
const headerNavigationOrder = ['Каталог', 'Направления', 'Документы', 'О компании', 'Контакты']
const headerNavigation = headerNavigationOrder
  .map((label) => desktopNavigation.find((item) => item.label === label))
  .filter((item): item is (typeof desktopNavigation)[number] => Boolean(item))
const footerCatalogLinks = desktopNavigation.filter((item) =>
  ['Направления', 'Каталог', 'Производители'].includes(item.label)
)
const footerCompanyLinks = desktopNavigation.filter((item) =>
  ['Документы', 'О компании', 'Контакты'].includes(item.label)
)
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
        <div className="nav-shell">
          <Link className="brand" href="/" aria-label="RekoMed — на главную">
            <span className="brand-mark">R</span>
            <strong>RekoMed</strong>
          </Link>
          <nav className="desktop-nav" aria-label="Основная навигация">
            {headerNavigation.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="header-actions">
            <a className="header-contact" href={phoneHref} aria-label="Позвонить в RekoMed">
              <Phone size={18} aria-hidden="true" />
              <span>{settings.phone}</span>
            </a>
            <Link className="primary-action header-cta" href={leadHref}>
              Запросить КП
              <Send size={16} aria-hidden="true" />
            </Link>
            <MobileNav
              phone={settings.phone}
              phoneHref={phoneHref}
              email={settings.email}
              emailHref={emailHref}
              leadHref={leadHref}
            />
          </div>
        </div>
      </header>
      <main>{children}</main>
      <footer className="site-footer">
        <div className="footer-main">
          <div className="footer-brand">
            <Link className="brand inverted" href="/">
              <span className="brand-mark">R</span>
              <span>
                <strong>RekoMed</strong>
                <small>медицинские изделия</small>
              </span>
            </Link>
            <p>{company.tagline}</p>
            <Link className="primary-action footer-cta" href={leadHref}>
              Запросить КП
              <Send size={16} aria-hidden="true" />
            </Link>
          </div>

          <nav className="footer-group" aria-label="Каталог">
            <span>Каталог</span>
            {footerCatalogLinks.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>

          <nav className="footer-group" aria-label="Компания">
            <span>Компания</span>
            {footerCompanyLinks.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="footer-group footer-contacts">
            <span>Контакты</span>
            <a href={phoneHref}>
              <Phone size={15} aria-hidden="true" />
              {settings.phone}
            </a>
            <a href={emailHref}>
              <Mail size={15} aria-hidden="true" />
              {settings.email}
            </a>
            <span className="footer-muted">
              <MapPin size={15} aria-hidden="true" />
              {settings.address}
            </span>
            <span className="footer-muted">
              <Clock size={15} aria-hidden="true" />
              {company.hours}
            </span>
            {settings.vkUrl && <a href={settings.vkUrl}>VK</a>}
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} RekoMed</span>
          <nav className="footer-legal" aria-label="Юридические ссылки">
            {legalLinks.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
      {settings.medicalDisclaimerEnabled && settings.medicalDisclaimerText && (
        <div className="medical-disclaimer">{settings.medicalDisclaimerText}</div>
      )}
      <nav className="mobile-bottom-nav" aria-label="Быстрые действия">
        <Link href="/catalog/">
          <Shapes size={19} aria-hidden="true" />
          Каталог
        </Link>
        <Link href="/catalog/#catalog-search">
          <Search size={19} aria-hidden="true" />
          Поиск
        </Link>
        <Link href={leadHref}>
          <FileText size={19} aria-hidden="true" />
          КП
        </Link>
      </nav>
    </>
  )
}
