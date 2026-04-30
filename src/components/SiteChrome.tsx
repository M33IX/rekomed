import Link from 'next/link'
import { Mail, MapPin, Phone, Send } from 'lucide-react'
import { company, navigation } from '@/lib/content'
import { LeadForm } from '@/components/LeadForm'
import { MobileNav } from '@/components/MobileNav'

type SiteChromeProps = {
  children: React.ReactNode
}

export function SiteChrome({ children }: SiteChromeProps) {
  return (
    <>
      <header className="site-header">
        <div className="topbar">
          <span>
            <MapPin size={16} aria-hidden="true" />
            {company.address}
          </span>
          <a href={company.emailHref}>
            <Mail size={16} aria-hidden="true" />
            {company.email}
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
            <a className="phone-link" href={company.phoneHref}>
              <Phone size={17} aria-hidden="true" />
              {company.phone}
            </a>
            <Link className="outline-action" href="#lead">
              <Send size={17} aria-hidden="true" />
              КП
            </Link>
            <MobileNav />
          </div>
        </div>
      </header>
      <main>{children}</main>
      <section className="bottom-cta" id="lead">
        <div>
          <span className="section-kicker">Заявка менеджеру</span>
          <h2>Нужно КП, наличие или документы на изделие?</h2>
          <p>Отправьте запрос: мы уточним позицию, подберём аналог или подготовим документы для закупки.</p>
        </div>
        <LeadForm compact title="Быстрая заявка" />
      </section>
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
        </div>
        <div className="footer-contacts">
          <a href={company.phoneHref}>{company.phone}</a>
          <a href={company.emailHref}>{company.email}</a>
          <span>{company.hours}</span>
        </div>
      </footer>
    </>
  )
}
