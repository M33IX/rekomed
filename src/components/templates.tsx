import Link from 'next/link'
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Filter,
  Handshake,
  PackageCheck,
  Search,
  ShieldCheck,
  Truck
} from 'lucide-react'
import {
  brandPages,
  categoryPages,
  company,
  directions,
  generatedStats,
  getCategoryBySection,
  getCategoryProducts,
  getProductsForSections,
  productPages,
  type Direction
} from '@/lib/content'
import type { CurrentSitePage } from '@/data/current-site.generated'
import { LeadForm } from '@/components/LeadForm'

const fallbackImage =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420"><rect width="640" height="420" fill="%23eef6f4"/><path d="M96 316h448M126 106h388M126 158h298M126 210h352" stroke="%231a6a7a" stroke-width="18" stroke-linecap="round"/><rect x="96" y="72" width="448" height="276" rx="16" fill="none" stroke="%230f4f5f" stroke-width="12"/></svg>'

function ProductVisual({ product, className = '' }: { product: CurrentSitePage; className?: string }) {
  return (
    <div className={`product-visual ${className}`}>
      <img src={product.image || fallbackImage} alt={product.imageAlt || product.h1} loading="lazy" />
    </div>
  )
}

export function ProductCard({ product }: { product: CurrentSitePage }) {
  const attrs = Object.entries(product.attributes).slice(0, 3)

  return (
    <article className="product-card">
      <ProductVisual product={product} />
      <div>
        <span className="muted-label">Артикул {product.id || 'по запросу'}</span>
        <h3>
          <Link href={product.path}>{product.h1}</Link>
        </h3>
        <p>{product.description || 'Медицинское изделие RekoMed. Уточните наличие, документы и цену у менеджера.'}</p>
      </div>
      {attrs.length > 0 && (
        <dl className="mini-specs">
          {attrs.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      )}
      <Link className="text-action" href={`${product.path}#lead`}>
        Запросить цену
        <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </article>
  )
}

function CategoryTile({ category }: { category: CurrentSitePage }) {
  const count = getCategoryProducts(category.section).length

  return (
    <Link className="category-tile" href={category.path}>
      <span>{category.h1}</span>
      <small>{count ? `${count} позиций` : 'подбор по запросу'}</small>
      <ArrowRight size={18} aria-hidden="true" />
    </Link>
  )
}

export function HomePage() {
  const featuredProducts = productPages.slice(0, 6)
  const primaryCategories = categoryPages
    .filter((category) => ['travmatologiya', 'plastiny', 'vinty', 'shtift', 'ortopediya', 'khirurgiya'].includes(category.section))
    .slice(0, 8)

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="section-kicker">B2B-поставка медицинских изделий</span>
          <h1>RekoMed помогает клиникам и закупщикам быстро получить изделия, документы и коммерческое предложение</h1>
          <p>
            Остеосинтез, эндопротезирование, нейрохирургия, хирургия, оборудование и расходные материалы с подбором под
            спецификацию.
          </p>
          <div className="hero-actions">
            <Link className="primary-action" href="#lead">
              Получить КП
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link className="outline-action dark" href="/catalog/">
              Смотреть каталог
            </Link>
          </div>
          <div className="trust-strip" aria-label="Ключевые показатели">
            <span>{generatedStats.total} живых страниц перенесено</span>
            <span>{productPages.length} карточки товаров</span>
            <span>{categoryPages.length} категории</span>
          </div>
        </div>
        <div className="hero-panel" aria-label="Основные сценарии">
          <div className="panel-row">
            <ClipboardCheck aria-hidden="true" />
            <span>КП под спецификацию</span>
          </div>
          <div className="panel-row">
            <FileText aria-hidden="true" />
            <span>РУ, сертификаты и инструкции</span>
          </div>
          <div className="panel-row">
            <Truck aria-hidden="true" />
            <span>Поставка для юрлиц и клиник</span>
          </div>
          <ProductVisual product={featuredProducts[0]} className="hero-product" />
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <span className="section-kicker">Направления</span>
          <h2>Маршруты выбора вместо бесконечной витрины</h2>
          <p>Страницы направлений объясняют ассортимент, условия поставки и сразу ведут к заявке.</p>
        </div>
        <div className="direction-grid">
          {directions.slice(0, 6).map((direction) => (
            <Link className="direction-card" href={`/${direction.slug}/`} key={direction.slug}>
              <span>{direction.eyebrow}</span>
              <h3>{direction.title}</h3>
              <p>{direction.summary}</p>
              <strong>
                Перейти
                <ArrowRight size={16} aria-hidden="true" />
              </strong>
            </Link>
          ))}
        </div>
      </section>

      <section className="section band">
        <div className="section-head">
          <span className="section-kicker">Каталог</span>
          <h2>Ключевые категории</h2>
          <p>Сохранены старые каталожные URL, чтобы не ломать индекс и переходы из поиска.</p>
        </div>
        <div className="category-grid">
          {primaryCategories.map((category) => (
            <CategoryTile key={category.path} category={category} />
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head split">
          <div>
            <span className="section-kicker">Популярные позиции</span>
            <h2>Товары с характеристиками и быстрым запросом</h2>
          </div>
          <Link className="outline-action" href="/catalog/">
            Весь каталог
          </Link>
        </div>
        <div className="product-grid">
          {featuredProducts.map((product) => (
            <ProductCard key={product.path} product={product} />
          ))}
        </div>
      </section>

      <TrustSection />
      <ProcessSection />
    </>
  )
}

export function DirectionPage({ direction }: { direction: Direction }) {
  const categories = direction.oldSections.map(getCategoryBySection)
  const products = getProductsForSections(direction.oldSections, 9)

  return (
    <>
      <section className="page-hero compact-hero">
        <span className="section-kicker">{direction.eyebrow}</span>
        <h1>{direction.title}</h1>
        <p>{direction.summary}</p>
        <div className="tag-row">
          {direction.highlights.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
        <Link className="primary-action" href="#lead">
          Оставить заявку
          <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </section>

      <section className="section">
        <div className="section-head">
          <span className="section-kicker">Подкатегории</span>
          <h2>Быстрый переход к нужному типу изделий</h2>
        </div>
        <div className="category-grid">
          {categories.map((category) => (
            <CategoryTile key={category.path} category={category} />
          ))}
        </div>
      </section>

      <section className="section band">
        <div className="section-head split">
          <div>
            <span className="section-kicker">Позиции</span>
            <h2>Примеры товаров по направлению</h2>
          </div>
          <Link className="outline-action" href="/catalog/">
            Открыть каталог
          </Link>
        </div>
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard key={product.path} product={product} />
          ))}
        </div>
      </section>

      <DocumentsBand />
    </>
  )
}

export function CatalogPage() {
  return (
    <>
      <section className="page-hero compact-hero">
        <span className="section-kicker">Каталог</span>
        <h1>Каталог медицинских изделий и расходных материалов</h1>
        <p>
          Структура каталога сохранена для старых URL и усилена B2B-сценариями: подбор, КП, документы и наличие.
        </p>
      </section>
      <section className="section">
        <div className="catalog-toolbar">
          <div>
            <Search size={18} aria-hidden="true" />
            <span>Поиск по названию, категории или артикулу</span>
          </div>
          <div>
            <Filter size={18} aria-hidden="true" />
            <span>Фильтры реализуются через CMS-поля характеристик</span>
          </div>
        </div>
        <div className="category-grid">
          {categoryPages.map((category) => (
            <CategoryTile key={category.path} category={category} />
          ))}
        </div>
      </section>
    </>
  )
}

export function CategoryPage({ page }: { page: CurrentSitePage }) {
  const products = getCategoryProducts(page.section)

  return (
    <>
      <section className="page-hero compact-hero">
        <span className="section-kicker">Категория</span>
        <h1>{page.h1}</h1>
        <p>{page.description || 'Подбор медицинских изделий по характеристикам, документам и условиям поставки.'}</p>
        <Link className="primary-action" href="#lead">
          Запросить подбор
          <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </section>
      <section className="section">
        <div className="section-head split">
          <div>
            <span className="section-kicker">Товары</span>
            <h2>{products.length ? `${products.length} позиций в категории` : 'Позиции уточняются у менеджера'}</h2>
          </div>
          <Link className="outline-action" href="#lead">
            Получить КП
          </Link>
        </div>
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard key={product.path} product={product} />
          ))}
        </div>
      </section>
    </>
  )
}

export function ProductPage({ product }: { product: CurrentSitePage }) {
  const related = getCategoryProducts(product.section).filter((item) => item.path !== product.path).slice(0, 3)
  const attrs = Object.entries(product.attributes)

  return (
    <>
      <section className="product-layout">
        <ProductVisual product={product} className="large-product" />
        <div className="product-copy">
          <span className="section-kicker">Карточка изделия</span>
          <h1>{product.h1}</h1>
          <p>{product.description || 'Уточните характеристики, документы и актуальные условия поставки у менеджера RekoMed.'}</p>
          <div className="product-actions">
            <Link className="primary-action" href="#lead">
              Запросить цену
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link className="outline-action" href="/documents/">
              Документы
            </Link>
          </div>
        </div>
      </section>
      <section className="section two-column">
        <div>
          <div className="section-head">
            <span className="section-kicker">Характеристики</span>
            <h2>Данные для первичного подбора</h2>
          </div>
          <dl className="spec-table">
            <div>
              <dt>Артикул</dt>
              <dd>{product.id || 'уточнить'}</dd>
            </div>
            <div>
              <dt>Категория</dt>
              <dd>{getCategoryBySection(product.section).h1}</dd>
            </div>
            {attrs.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <LeadForm type="availability" productId={product.id} title="Запросить наличие и цену" />
      </section>
      {related.length > 0 && (
        <section className="section band">
          <div className="section-head">
            <span className="section-kicker">Связанные позиции</span>
            <h2>Другие изделия в категории</h2>
          </div>
          <div className="product-grid three">
            {related.map((item) => (
              <ProductCard key={item.path} product={item} />
            ))}
          </div>
        </section>
      )}
    </>
  )
}

export function BrandPage({ page }: { page: CurrentSitePage }) {
  return (
    <>
      <section className="page-hero compact-hero">
        <span className="section-kicker">Производитель</span>
        <h1>{page.h1}</h1>
        <p>{page.description || 'Информация о производителе и связанных медицинских изделиях.'}</p>
        <Link className="primary-action" href="#lead">
          Запросить позиции бренда
          <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </section>
      <section className="section">
        <div className="brand-list">
          {brandPages.map((brand) => (
            <Link key={brand.path} href={brand.path}>
              {brand.h1}
            </Link>
          ))}
        </div>
      </section>
    </>
  )
}

export function DocumentsPage() {
  return (
    <>
      <section className="page-hero compact-hero">
        <span className="section-kicker">Документы</span>
        <h1>Сертификаты, РУ, инструкции и каталоги</h1>
        <p>
          В первой версии документы запрашиваются через форму. В CMS предусмотрена отдельная коллекция для файлов и
          привязки к товарам.
        </p>
      </section>
      <DocumentsBand />
    </>
  )
}

export function InfoPage({ page }: { page: CurrentSitePage }) {
  const isContact = page.kind === 'contacts'

  return (
    <>
      <section className="page-hero compact-hero">
        <span className="section-kicker">{isContact ? 'Контакты' : 'Информация'}</span>
        <h1>{page.h1}</h1>
        <p>{page.description || 'Информация RekoMed для клиентов, партнёров и закупочных отделов.'}</p>
      </section>
      <section className="section two-column">
        <div className="info-block">
          <h2>{isContact ? 'Связаться с менеджером' : 'Как работаем'}</h2>
          <p>
            {isContact
              ? `${company.address}. ${company.hours}. Телефон и почта доступны для заявок на КП, документы и подбор.`
              : 'Получаем заявку или спецификацию, уточняем задачу, подбираем позиции и передаём коммерческое предложение.'}
          </p>
          <div className="contact-lines">
            <a href={company.phoneHref}>{company.phone}</a>
            <a href={company.emailHref}>{company.email}</a>
            <span>{company.address}</span>
          </div>
        </div>
        <LeadForm type="callback" title="Связаться с RekoMed" />
      </section>
    </>
  )
}

export function TrustSection() {
  const items = [
    { icon: ShieldCheck, title: 'Документы на изделия', text: 'Регистрационные удостоверения, сертификаты и инструкции привязываются к товарам в CMS.' },
    { icon: Building2, title: 'Работа с юрлицами', text: 'КП, счета, закрывающие документы и поставка под закупочную спецификацию.' },
    { icon: PackageCheck, title: 'Подбор ассортимента', text: 'Менеджер помогает уточнить позицию, аналог, размер и условия наличия.' },
    { icon: Handshake, title: 'Партнёрская логика', text: 'Сайт говорит с клиниками и закупщиками языком задач, документов и сроков.' }
  ]

  return (
    <section className="section">
      <div className="section-head">
        <span className="section-kicker">Доверие</span>
        <h2>На сайте должны быть не обещания, а проверяемые основания для заявки</h2>
      </div>
      <div className="trust-grid">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <div className="trust-card" key={item.title}>
              <Icon aria-hidden="true" />
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export function ProcessSection() {
  const steps = ['Заявка или спецификация', 'Подбор и проверка документов', 'Коммерческое предложение', 'Поставка и закрывающие документы']

  return (
    <section className="section band">
      <div className="section-head">
        <span className="section-kicker">Процесс</span>
        <h2>Понятный сценарий для закупщика</h2>
      </div>
      <div className="process-grid">
        {steps.map((step, index) => (
          <div key={step} className="process-step">
            <span>{index + 1}</span>
            <p>{step}</p>
            <CheckCircle2 aria-hidden="true" />
          </div>
        ))}
      </div>
    </section>
  )
}

export function DocumentsBand() {
  return (
    <section className="section document-band">
      <div>
        <span className="section-kicker">Документы</span>
        <h2>Запросите РУ, сертификаты, инструкции или PDF-каталог</h2>
        <p>В CMS документы хранятся отдельно и привязываются к товарам, брендам или направлениям.</p>
      </div>
      <Link className="primary-action" href="#lead">
        Запросить документы
        <ArrowRight size={18} aria-hidden="true" />
      </Link>
    </section>
  )
}
