import Link from 'next/link'
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  Bone,
  Building2,
  CheckCircle2,
  CircleHelp,
  ClipboardCheck,
  Clock,
  FileCheck2,
  FileText,
  Handshake,
  HeartPulse,
  Layers3,
  Mail,
  MapPin,
  Microscope,
  PackageCheck,
  Phone,
  Search,
  ShieldCheck,
  Stethoscope,
  Truck,
  type LucideIcon
} from 'lucide-react'
import { CommandSearch } from '@/components/home/CommandSearch'
import { FeaturedManufacturerSection } from '@/components/home/FeaturedManufacturerSection'
import { CatalogExplorer } from '@/components/CatalogExplorer'
import { LeadForm } from '@/components/LeadForm'
import { RevealSection } from '@/components/Motion'
import { ProductCard, fallbackProductImage } from '@/components/catalog/ProductCard'
import { ManufacturerListing } from '@/components/catalog/ManufacturerListing'
import { MobileProductCTA } from '@/components/product/MobileProductCTA'
import { company } from '@/lib/content'
import {
  generatedPublicContent,
  getCategoryBySection,
  getCategoryProducts,
  type PublicCatalogPage,
  type PublicContent
} from '@/lib/cms-content'
import {
  formatCatalogCount,
  getCategoryAncestors,
  getCategoryNode,
  getTopCatalogNodes
} from '@/lib/catalog-hierarchy'
import { getCategoryCatalogHref, getDirectionCatalogHref, isCatalogDirectionSection, normalizeDirectionSlug } from '@/lib/catalog-links'
import type { LegalPageDefinition } from '@/lib/legal-pages'
import type { PublicSiteSettings } from '@/lib/site-settings'

type BreadcrumbItem = {
  href: string
  label: string
}

type DirectionCard = {
  section: string
  href: string
  title: string
  text: string
  icon: LucideIcon
}

const directionCards: DirectionCard[] = [
  { section: 'neyrokhirurgiya', href: getDirectionCatalogHref('neyrokhirurgiya'), title: 'Нейрохирургия', text: 'Кейджи, фиксация, пластины', icon: Activity },
  { section: 'travmatologiya', href: getDirectionCatalogHref('travmatologiya'), title: 'Травматология', text: 'Пластины, винты, штифты', icon: Bone },
  { section: 'ortopediya', href: getDirectionCatalogHref('ortopediya'), title: 'Ортопедия', text: 'Компоненты суставов', icon: HeartPulse },
  { section: 'khirurgiya', href: getDirectionCatalogHref('khirurgiya'), title: 'Хирургия', text: 'Материалы и инструменты', icon: Stethoscope },
  { section: 'oborudovanie', href: getDirectionCatalogHref('oborudovanie'), title: 'Оборудование', text: 'Подбор под кабинет', icon: Microscope },
  { section: 'otolaringologiya', href: getDirectionCatalogHref('otolaringologiya'), title: 'Оториноларингология', text: 'ЛОР-оборудование', icon: Layers3 },
  { section: 'stomatologiya', href: getDirectionCatalogHref('stomatologiya'), title: 'Стоматология', text: 'Шовный материал', icon: FileCheck2 },
  { section: 'reabilitatsiya', href: getDirectionCatalogHref('reabilitatsiya'), title: 'Реабилитация', text: 'Позиции по запросу', icon: PackageCheck }
]

const documentItems = [
  'Регистрационные удостоверения',
  'Сертификаты соответствия',
  'Декларации',
  'Инструкции',
  'Паспорта изделий',
  'Политики и согласия'
]

const processItems = [
  {
    title: 'Уточняем задачу',
    text: 'Вы указываете изделие, артикул или область применения.'
  },
  {
    title: 'Подбираем решение',
    text: 'Проверяем позицию, параметры, аналоги и наличие.'
  },
  {
    title: 'Готовим документы',
    text: 'Формируем КП, спецификации и доступный комплект документов.'
  },
  {
    title: 'Сопровождаем поставку',
    text: 'Согласуем условия, сроки и закрывающие документы.'
  }
]

const cleanText = (value: string | undefined, fallback: string) => {
  const text = (value || '')
    .replaceAll('&quot;', '"')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (!text || text === 'Интернет-магазин') return fallback
  return text.length > 190 ? `${text.slice(0, 187)}...` : text
}

const formatCategoryCount = (count: number) => {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return `${count} категория`
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return `${count} категории`
  return `${count} категорий`
}

const productSummary = (product: PublicCatalogPage) => {
  const attrs = Object.entries(product.attributes || {}).slice(0, 2)
  if (attrs.length) {
    return `Цена, наличие и документы уточняются по заявке. Ключевые параметры: ${attrs
      .map(([label, value]) => `${label.toLowerCase()} - ${value}`)
      .join(', ')}.`
  }
  return 'Цена, наличие и документы уточняются по заявке. Менеджер поможет проверить параметры и подготовить КП.'
}

const descriptionParagraphs = (value: string | undefined) =>
  (value || '')
    .replaceAll('&quot;', '"')
    .replace(/<[^>]*>/g, '')
    .split(/\n+/)
    .map((item) => item.replace(/\s+/g, ' ').trim())
    .filter((item) => item && item !== 'Интернет-магазин')

const getDirectionCount = (content: PublicContent, section: string) => {
  const category = content.categoryPages.find((item) => item.section === section)
  if (!category) return content.productPages.filter((item) => item.section === section).length
  return getCategoryNode(category, content.categoryPages, content.productPages).descendantProductCount
}

const uniqueProducts = (products: PublicCatalogPage[]) => {
  const seen = new Set<string>()
  return products.filter((product) => {
    if (seen.has(product.path)) return false
    seen.add(product.path)
    return true
  })
}

const directionCatalogHeadings: Record<string, string> = {
  neyrokhirurgiya: 'Изделия для нейрохирургии',
  travmatologiya: 'Изделия для травматологии',
  ortopediya: 'Изделия для ортопедии',
  khirurgiya: 'Изделия для хирургии',
  oborudovanie: 'Медицинское оборудование',
  otolaringologiya: 'Изделия для оториноларингологии',
  reabilitatsiya: 'Изделия для реабилитации',
  stomatologiya: 'Изделия для стоматологии'
}

const getCatalogDirection = (content: PublicContent, section?: string) => {
  if (!section || section === 'all') return undefined
  const normalizedSection = normalizeDirectionSlug(section)
  return getTopCatalogNodes(content.categoryPages, content.productPages).find((node) => node.category.section === normalizedSection)?.category
}

const getProductDirectionCategory = (content: PublicContent, product: PublicCatalogPage) => {
  const category = getCategoryBySection(content, product.section)
  const productSections = [
    category.section,
    ...getCategoryAncestors(category, content.categoryPages).map((item) => item.section)
  ]

  return getTopCatalogNodes(content.categoryPages, content.productPages).find((node) =>
    productSections.includes(node.category.section)
  )?.category
}

function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="breadcrumbs" aria-label="Хлебные крошки">
      {items.map((item, index) => (
        <span key={`${item.href}-${item.label}`}>
          {index > 0 && <span aria-hidden="true">/</span>}
          <Link href={item.href}>{item.label}</Link>
        </span>
      ))}
    </nav>
  )
}

function SectionHead({
  kicker,
  title,
  text,
  action
}: {
  kicker: string
  title: string
  text?: string
  action?: React.ReactNode
}) {
  return (
    <div className={action ? 'section-head split' : 'section-head'}>
      <div>
        <span className="section-kicker">{kicker}</span>
        <h2>{title}</h2>
        {text && <p>{text}</p>}
      </div>
      {action}
    </div>
  )
}

function DirectionTile({ item, count }: { item: DirectionCard; count: number }) {
  const Icon = item.icon

  return (
    <Link className="direction-tile" href={item.href}>
      <span className="icon-pill">
        <Icon size={22} aria-hidden="true" />
      </span>
      <span className="tile-content">
        <strong>{item.title}</strong>
        <small>{count ? formatCatalogCount(count).replace('категорий', 'позиций').replace('категория', 'позиция').replace('категории', 'позиции') : item.text}</small>
      </span>
      <ArrowRight size={18} aria-hidden="true" />
    </Link>
  )
}

function CategoryTile({ category, content }: { category: PublicCatalogPage; content: PublicContent }) {
  const count = getCategoryNode(category, content.categoryPages, content.productPages).descendantProductCount
  const href = isCatalogDirectionSection(category.section) ? getDirectionCatalogHref(category.section) : category.path

  return (
    <Link className="category-tile" href={href}>
      <span>{category.h1}</span>
      <small>{formatCatalogCount(count)}</small>
      <ArrowRight size={18} aria-hidden="true" />
    </Link>
  )
}

function ProductVisual({ product, className = '' }: { product: PublicCatalogPage; className?: string }) {
  return (
    <div className={`product-visual ${className}`}>
      <img src={product.image || fallbackProductImage} alt={product.imageAlt || product.h1} loading="lazy" />
    </div>
  )
}

function LeadSection({
  title = 'Свяжитесь с нами',
  text = 'Готовы помочь с подбором изделий и подготовкой КП под вашу задачу.',
  kicker = 'Заявка менеджеру',
  type = 'quote',
  source = 'contacts',
  settings
}: {
  title?: string
  text?: string
  kicker?: string
  type?: Parameters<typeof LeadForm>[0]['type']
  source?: Parameters<typeof LeadForm>[0]['source']
  settings?: PublicSiteSettings
}) {
  const phone = settings?.phone || company.phone
  const email = settings?.email || company.email

  return (
    <RevealSection className="section lead-section" id="lead">
      <div>
        <span className="section-kicker">{kicker}</span>
        <h2>{title}</h2>
        <p>{text}</p>
        <div className="contact-lines">
          <a href={`tel:${phone.replace(/[^\d+]/g, '')}`}>
            <Phone size={16} aria-hidden="true" />
            {phone}
          </a>
          <a href={`mailto:${email}`}>
            <Mail size={16} aria-hidden="true" />
            {email}
          </a>
          <span>
            <Clock size={16} aria-hidden="true" />
            {company.hours}
          </span>
        </div>
      </div>
      <LeadForm
        title="Запросить подбор и КП"
        text="Опишите изделие, артикул, количество или задачу. Менеджер уточнит детали."
        type={type}
        source={source}
        submitLabel={type === 'documents' ? 'Запросить документы' : 'Отправить заявку'}
      />
    </RevealSection>
  )
}

export function HomePage({ content = generatedPublicContent, settings }: { content?: PublicContent; settings?: PublicSiteSettings }) {
  const preferredArticles = ['1026', '1027', '1028', '1058']
  const preferred = preferredArticles
    .map((article) => content.productPages.find((product) => product.id === article))
    .filter((product): product is PublicCatalogPage => Boolean(product))
  const featuredProducts = uniqueProducts([
    ...preferred,
    ...content.productPages.filter((product) => product.source === 'cms'),
    ...content.productPages
  ]).slice(0, 6)
  const hasManufacturerProducts =
    content.brandPages.filter((brand) => content.productPages.some((product) => product.brandTitle === brand.h1)).length > 1

  return (
    <>
      <RevealSection className="hero-dashboard" variant="fadeIn">
        <div className="hero-grid">
          <div className="hero-copy">
            <span className="section-kicker">Поставка медицинских изделий для клиник</span>
            <h1>Медицинские изделия, документы и КП для клиник</h1>
            <p>
              Помогаем подобрать позицию, уточнить наличие и подготовить документы для закупки.
            </p>
            <div className="hero-actions">
              <Link className="primary-action" href="#lead">
                Запросить КП
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link className="outline-action" href="/catalog/">
                Смотреть каталог
              </Link>
            </div>
            <CommandSearch categories={content.categoryPages} products={content.productPages} />
            <div className="trust-strip" aria-label="Ключевые показатели">
              <span>{content.productPages.length}+ товаров</span>
              <span>{formatCategoryCount(content.categoryPages.length)}</span>
              <span>Документы по запросу</span>
              <span>Работаем с юрлицами</span>
            </div>
          </div>
          <div className="dashboard-request-card">
            <LeadForm
              title="Запросить подбор и КП"
              text="Оставьте заявку - менеджер уточнит задачу, подберет позиции и подготовит КП."
              type="quote"
              source="home"
              submitLabel="Отправить заявку"
            />
          </div>
        </div>
      </RevealSection>

      <RevealSection className="section" id="directions">
        <SectionHead
          kicker="Направления"
          title="Быстрый переход по направлениям"
          text="Выберите медицинское направление - откроем каталог с подходящими позициями."
        />
        <div className="direction-grid">
          {directionCards.map((item) => (
            <DirectionTile key={item.section} item={item} count={getDirectionCount(content, item.section)} />
          ))}
        </div>
      </RevealSection>

      <ProcessSection />

      {featuredProducts.length > 0 && (
        <RevealSection className="section">
          <SectionHead
            kicker="Каталог"
            title="Популярные изделия"
            text="Карточки показывают только главное: артикул, категорию, 1-2 параметра и заявку на цену."
            action={
              <Link className="outline-action" href="/catalog/">
                Все товары
              </Link>
            }
          />
          <div className="product-grid">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.path}
                product={product}
                categoryTitle={getCategoryBySection(content, product.section).h1}
              />
            ))}
          </div>
        </RevealSection>
      )}

      <TrustSection />
      {hasManufacturerProducts && (
        <RevealSection className="section" id="manufacturers">
          <FeaturedManufacturerSection brands={content.brandPages} products={content.productPages} />
        </RevealSection>
      )}
      <DocumentsBand />
      <LeadSection source="home" settings={settings} />
    </>
  )
}

export function CatalogPage({
  content = generatedPublicContent,
  initialDirection
}: {
  content?: PublicContent
  initialDirection?: string
}) {
  const activeDirection = getCatalogDirection(content, initialDirection)
  const catalogTitle = activeDirection
    ? directionCatalogHeadings[activeDirection.section] || `Изделия направления «${activeDirection.h1}»`
    : 'Каталог медицинских изделий'
  const catalogDescription = activeDirection
    ? `Позиции направления «${activeDirection.h1}»: уточняйте наличие, цену и документы по заявке.`
    : 'Найдите изделие по названию, артикулу, направлению или производителю. Если нужной позиции нет в каталоге, отправьте запрос менеджеру.'

  return (
    <>
      <RevealSection className="catalog-page-head">
        <div>
          <Breadcrumbs items={[{ href: '/', label: 'Главная' }, { href: '/catalog/', label: 'Каталог' }]} />
          <span className="section-kicker">Каталог</span>
          <h1>{catalogTitle}</h1>
          <p>{catalogDescription}</p>
        </div>
        <div className="catalog-top-help">
          <CircleHelp size={24} aria-hidden="true" />
          <h2>Не нашли изделие?</h2>
          <p>Подберем аналог, уточним наличие и документы по запросу.</p>
          <Link className="primary-action" href="/contacts/stores/#lead">
            Отправить запрос
          </Link>
        </div>
      </RevealSection>
      <RevealSection className="section catalog-section">
        <CatalogExplorer categories={content.categoryPages} products={content.productPages} initialDirection={activeDirection?.section} />
      </RevealSection>
    </>
  )
}

export function CategoryPage({
  page,
  content = generatedPublicContent,
  settings
}: {
  page: PublicCatalogPage
  content?: PublicContent
  settings?: PublicSiteSettings
}) {
  const products = getCategoryProducts(content, page.section)
  const node = getCategoryNode(page, content.categoryPages, content.productPages)
  const ancestors = getCategoryAncestors(page, content.categoryPages)
  const description = cleanText(
    page.description,
    'Выберите подкатегорию или отправьте запрос менеджеру для подбора изделия, документов и условий поставки.'
  )
  const suggestions = getTopCatalogNodes(content.categoryPages, content.productPages)
    .filter((item) => item.category.path !== page.path)
    .slice(0, 4)

  return (
    <>
      <RevealSection className="catalog-page-head">
        <div>
          <Breadcrumbs
            items={[
              { href: '/', label: 'Главная' },
              { href: '/catalog/', label: 'Каталог' },
              ...ancestors.map((category) => ({
                href: isCatalogDirectionSection(category.section) ? getDirectionCatalogHref(category.section) : category.path,
                label: category.h1
              })),
              { href: page.path, label: page.h1 }
            ]}
          />
          <span className="section-kicker">Категория</span>
          <h1>{page.h1}</h1>
          <p>{description}</p>
        </div>
        <div className="catalog-top-help">
          <BadgeCheck size={24} aria-hidden="true" />
          <h2>Цена и наличие</h2>
          <p>Отправьте заявку по категории, если нужна спецификация или подбор аналога.</p>
          <Link className="primary-action" href="#lead">
            Запросить КП
          </Link>
        </div>
      </RevealSection>

      {node.children.length > 0 && (
        <RevealSection className="section catalog-section">
          <SectionHead kicker="Подкатегории" title="Выберите нужный тип изделий" />
          <div className="category-grid compact">
            {node.children.map((category) => (
              <CategoryTile key={category.path} category={category} content={content} />
            ))}
          </div>
        </RevealSection>
      )}

      {products.length > 0 && (
        <RevealSection className="section catalog-section">
          <SectionHead
            kicker="Товары"
            title={`${formatCatalogCount(products.length)} в категории`}
            action={<Link className="outline-action" href="#lead">Получить КП</Link>}
          />
          <div className="product-grid">
            {products.map((product) => (
              <ProductCard key={product.path} product={product} categoryTitle={page.h1} />
            ))}
          </div>
        </RevealSection>
      )}

      {!node.children.length && !products.length && (
        <RevealSection className="section catalog-section">
          <div className="empty-category-panel">
            <div>
              <span className="section-kicker">Запрос по разделу</span>
              <h2>Подберем позицию по вашей спецификации</h2>
              <p>В этом разделе нет опубликованных карточек товаров. Оставьте запрос, и менеджер уточнит наличие, аналоги и документы.</p>
            </div>
            <Link className="primary-action" href="#lead">
              Оставить запрос
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
          {suggestions.length > 0 && (
            <div className="category-grid compact">
              {suggestions.map((item) => (
                <CategoryTile key={item.category.path} category={item.category} content={content} />
              ))}
            </div>
          )}
        </RevealSection>
      )}

      <LeadSection
        title="Запросить подбор по категории"
        text="Укажите нужный тип изделия, количество или характеристики. Мы уточним наличие, документы и цену."
        source="catalog"
        settings={settings}
      />
    </>
  )
}

export function ProductPage({ product, content = generatedPublicContent }: { product: PublicCatalogPage; content?: PublicContent }) {
  const related = product.section === 'cms' ? [] : getCategoryProducts(content, product.section).filter((item) => item.path !== product.path).slice(0, 3)
  const sameManufacturer = product.brandTitle
    ? content.productPages
        .filter((item) => item.path !== product.path && item.brandTitle === product.brandTitle)
        .slice(0, 3)
    : []
  const attrs = Object.entries(product.attributes || {}).filter(([, value]) => Boolean(value))
  const category = getCategoryBySection(content, product.section)
  const direction = getProductDirectionCategory(content, product)
  const directionHref = direction ? getDirectionCatalogHref(direction.section) : ''
  const categoryHref = getCategoryCatalogHref(category.section, direction?.section)
  const productDescription = descriptionParagraphs(product.contentDescription)
  const productBreadcrumbs = [
    { href: '/', label: 'Главная' },
    { href: '/catalog/', label: 'Каталог' },
    ...(direction ? [{ href: directionHref, label: direction.h1 }] : []),
    ...(direction?.section === category.section ? [] : [{ href: categoryHref, label: category.h1 }]),
    { href: product.path, label: product.h1 }
  ]
  const leadProduct = {
    id: product.id,
    sku: product.id,
    title: product.h1,
    path: product.path,
    category: category.h1
  }

  return (
    <>
      <RevealSection className="product-page">
        <Breadcrumbs items={productBreadcrumbs} />
        <div className="product-hero-grid">
          <div className="product-gallery">
            <ProductVisual product={product} className="large-product" />
            <div className="thumb-row" aria-label="Изображения товара">
              <button type="button" aria-label="Основное изображение">
                <img src={product.image || fallbackProductImage} alt="" loading="lazy" />
              </button>
            </div>
          </div>
          <div className="product-info">
            <span className="section-kicker">{category.h1}</span>
            <h1>{product.h1}</h1>
            <p className="product-meta-line">
              {product.id ? `Артикул: ${product.id}` : 'Артикул по запросу'}
              {direction ? ` · Направление: ${direction.h1}` : ''} · Категория: {category.h1}
              {product.brandTitle ? ` · Производитель: ${product.brandTitle}` : ''}
            </p>
            <p>{productSummary(product)}</p>
            <div className="product-badges">
              <span>Цена по запросу</span>
              <span>Документы по запросу</span>
              <span>Для юрлиц</span>
            </div>
            <div className="product-actions">
              <Link className="primary-action" href="#product-lead">
                Запросить цену и наличие
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link className="outline-action" href="/documents/">
                Документы
              </Link>
            </div>
            <div className="support-chips">
              <span>Подбор для клиник и отделений</span>
              <span>Быстрая обработка запроса</span>
              <span>Официальные документы по запросу</span>
              {direction && <Link href={directionHref}>Все товары направления</Link>}
            </div>
          </div>
        </div>
      </RevealSection>

      <RevealSection className="section product-detail-layout" id="product-lead">
        <div className="product-main-panels">
          {productDescription.length > 0 && (
            <section className="info-panel">
              <SectionHead kicker="Описание" title="Описание товара" />
              <div className="content-description">
                {productDescription.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          )}

          <section className="info-panel">
            <SectionHead kicker="Характеристики" title="Данные для первичного подбора" />
            <dl className="spec-table">
              <div>
                <dt>Артикул</dt>
                <dd>{product.id || 'уточнить'}</dd>
              </div>
              <div>
                <dt>Направление</dt>
                <dd>{direction ? <Link href={directionHref}>{direction.h1}</Link> : 'уточнить'}</dd>
              </div>
              <div>
                <dt>Категория</dt>
                <dd>
                  <Link href={categoryHref}>{category.h1}</Link>
                </dd>
              </div>
              {product.brandTitle && (
                <div>
                  <dt>Производитель</dt>
                  <dd>
                    {product.brandPath ? <Link href={product.brandPath}>{product.brandTitle}</Link> : product.brandTitle}
                  </dd>
                </div>
              )}
              {attrs.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="info-panel">
            <SectionHead kicker="Документы" title="Доступный комплект по запросу" text="Укажите изделие или артикул, и менеджер уточнит доступные документы." />
            <div className="document-list">
              {['Регистрационное удостоверение', 'Сертификат соответствия', 'Инструкция по применению', 'Паспорт изделия', 'Декларация о соответствии'].map((item) => (
                <div className="document-row" key={item}>
                  <FileText size={18} aria-hidden="true" />
                  <span>{item}</span>
                  <small>По запросу</small>
                </div>
              ))}
            </div>
            <div className="doc-callout">
              <strong>Не нашли нужный документ?</strong>
              <p>Оставьте запрос - мы предоставим доступный комплект по изделию.</p>
              <Link className="outline-action" href="#product-lead">
                Запросить документ
              </Link>
            </div>
          </section>

          {related.length > 0 && (
            <section className="info-panel">
              <SectionHead kicker="Связанные позиции" title="Другие изделия в категории" />
              <div className="product-grid three">
                {related.map((item) => (
                  <ProductCard key={item.path} product={item} categoryTitle={category.h1} />
                ))}
              </div>
            </section>
          )}

          {sameManufacturer.length > 0 && (
            <section className="info-panel">
              <SectionHead kicker="Производитель" title={`Другие изделия ${product.brandTitle}`} />
              <div className="product-grid three">
                {sameManufacturer.map((item) => (
                  <ProductCard
                    key={item.path}
                    product={item}
                    categoryTitle={getCategoryBySection(content, item.section).h1}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
        <aside className="product-request-card">
          <LeadForm
            product={leadProduct}
            type="availability"
            title="Запросить цену и наличие"
            text="Менеджер свяжется с вами в ближайшее время."
            submitLabel="Отправить запрос"
          />
        </aside>
      </RevealSection>
      <MobileProductCTA product={leadProduct} />
    </>
  )
}

export function BrandPage({
  page,
  content = generatedPublicContent,
  settings
}: {
  page: PublicCatalogPage
  content?: PublicContent
  settings?: PublicSiteSettings
}) {
  const brandDescription = descriptionParagraphs(page.contentDescription)

  return (
    <>
      <RevealSection className="page-hero compact-hero">
        <Breadcrumbs items={[{ href: '/', label: 'Главная' }, { href: page.path, label: page.h1 }]} />
        <span className="section-kicker">Производитель</span>
        <h1>{page.h1}</h1>
        <p>{cleanText(page.contentDescription || page.description, 'Изделия производителя в каталоге RekoMed для подбора по заявке.')}</p>
        <Link className="primary-action" href="/catalog/">
          Перейти в каталог
          <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </RevealSection>
      {brandDescription.length > 0 && (
        <RevealSection className="section">
          <div className="info-panel">
            <SectionHead kicker="О бренде" title={page.h1} />
            <div className="content-description">
              {brandDescription.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>
        </RevealSection>
      )}
      <RevealSection className="section">
        <SectionHead
          kicker="Изделия по производителям"
          title="Быстрый переход к бренду"
          text="Список показывает производителей, которые есть в каталоге. Количество позиций считается по опубликованным товарам."
        />
        <ManufacturerListing brands={content.brandPages} products={content.productPages} activeBrandPath={page.path} />
      </RevealSection>
      <LeadSection
        title="Запросить позиции производителя"
        text="Напишите, какие изделия или документы по бренду нужны. Менеджер уточнит доступные позиции и условия поставки."
        source="catalog"
        settings={settings}
      />
    </>
  )
}

export function DocumentsPage() {
  return (
    <>
      <RevealSection className="page-hero compact-hero documents-hero">
        <Breadcrumbs items={[{ href: '/', label: 'Главная' }, { href: '/documents/', label: 'Документы' }]} />
        <span className="section-kicker">Документы</span>
        <h1>Документы для медицинских изделий</h1>
        <p>Предоставляем доступные регистрационные удостоверения, сертификаты, инструкции и сопроводительные документы по запросу.</p>
      </RevealSection>

      <RevealSection className="section">
        <SectionHead kicker="Категории" title="Какие документы можно запросить" />
        <div className="document-card-grid">
          {documentItems.map((item) => (
            <div className="document-card" key={item}>
              <FileCheck2 aria-hidden="true" />
              <h3>{item}</h3>
              <p>Статус и доступность уточняются по конкретному изделию.</p>
            </div>
          ))}
        </div>
      </RevealSection>

      <RevealSection className="section band">
        <SectionHead kicker="Процесс" title="Как запросить документы" />
        <div className="process-grid three">
          {['Укажите изделие или артикул', 'Оставьте контакты', 'Получите доступный комплект документов'].map((step, index) => (
            <div className="process-step" key={step}>
              <span>{index + 1}</span>
              <p>{step}</p>
              <CheckCircle2 aria-hidden="true" />
            </div>
          ))}
        </div>
      </RevealSection>

      <RevealSection className="section two-column">
        <div className="info-panel">
          <SectionHead kicker="FAQ" title="Частые вопросы" />
          <div className="faq-list">
            {[
              ['Можно ли получить документы до КП?', 'Да, если документ доступен по конкретному изделию. Укажите артикул или название.'],
              ['Какие документы доступны?', 'Регистрационные удостоверения, сертификаты, декларации, инструкции и паспорта изделий - при наличии.'],
              ['Что делать, если товара нет в каталоге?', 'Оставьте запрос. Менеджер проверит позицию вручную и предложит следующий шаг.'],
              ['Как быстро отвечает менеджер?', 'Заявка попадает менеджеру после отправки формы. Срок ответа зависит от сложности запроса.']
            ].map(([question, answer]) => (
              <details key={question}>
                <summary>{question}</summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </div>
        <LeadForm
          title="Запросить документы"
          text="Укажите артикул или название изделия в комментарии."
          type="documents"
          source="documents"
          submitLabel="Запросить документы"
        />
      </RevealSection>
    </>
  )
}

const missingValue = 'Заполняется владельцем сайта в админке'

const legalRows = (settings: PublicSiteSettings) => [
  ['Наименование', settings.legalName || missingValue],
  ['ИНН', settings.legalInn || missingValue],
  ['ОГРН', settings.legalOgrn || missingValue],
  ['Юридический адрес', settings.legalAddress || settings.address || missingValue],
  ['Телефон', settings.phone],
  ['Email', settings.email]
]

const legalTextByPage = (settings: PublicSiteSettings, key: LegalPageDefinition['key']) => {
  if (key === 'privacy') return settings.privacyText
  if (key === 'consent') return settings.consentText
  if (key === 'terms') return settings.termsText
  if (key === 'legal') return settings.legalText
  if (key === 'license') return settings.licenseText
  return ''
}

function EditableLegalText({ text }: { text: string }) {
  return (
    <div className="legal-card">
      <div className="legal-copy">{text}</div>
    </div>
  )
}

export function LegalPage({ page, settings }: { page: LegalPageDefinition; settings: PublicSiteSettings }) {
  const operatorName = settings.legalName || company.legalName
  const contactEmail = settings.email || company.email
  const customText = legalTextByPage(settings, page.key)

  return (
    <>
      <RevealSection className="catalog-page-head legal-page-head">
        <div>
          <Breadcrumbs items={[{ href: '/', label: 'Главная' }, { href: page.path, label: page.h1 }]} />
          <span className="section-kicker">{page.kicker}</span>
          <h1>{page.h1}</h1>
          <p>{page.description}</p>
        </div>
      </RevealSection>

      <RevealSection className="section legal-page">
        {customText && page.key !== 'legal' && page.key !== 'license' && <EditableLegalText text={customText} />}

        {page.key === 'privacy' && !customText && (
          <div className="legal-card">
            <h2>Какие данные обрабатываются</h2>
            <p>RekoMed обрабатывает данные, которые пользователь передает через формы сайта: имя, телефон, email, комментарий, выбранный товар, страницу заявки и UTM-метки.</p>
            <h2>Цели обработки</h2>
            <p>Данные используются для ответа на заявку, подготовки коммерческого предложения, уточнения наличия, документов и условий поставки.</p>
            <h2>Оператор данных</h2>
            <p>Оператор: {operatorName}. Для вопросов по персональным данным можно написать на <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.</p>
          </div>
        )}

        {page.key === 'consent' && !customText && (
          <div className="legal-card">
            <h2>Текст согласия</h2>
            <p>Отправляя форму на сайте RekoMed, пользователь дает согласие {operatorName} на обработку персональных данных, указанных в форме.</p>
            <p>Согласие действует до достижения целей обработки или до его отзыва. Отозвать согласие можно по адресу <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.</p>
          </div>
        )}

        {page.key === 'terms' && !customText && (
          <div className="legal-card">
            <h2>Правила использования сайта</h2>
            <p>Сайт RekoMed содержит справочную информацию о медицинских изделиях, расходных материалах, документах и условиях обращения к менеджеру. Информация на сайте не является публичной офертой.</p>
            <p>Цена, наличие, сроки поставки, применимость изделия и комплект документов уточняются менеджером после получения заявки.</p>
          </div>
        )}

        {page.key === 'legal' && (
          <div className="legal-card">
            {customText && <div className="legal-copy legal-copy-with-gap">{customText}</div>}
            <h2>Реквизиты</h2>
            <dl className="legal-list">
              {legalRows(settings).map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {page.key === 'license' && (
          <div className="legal-card">
            <h2>Лицензии и документы</h2>
            {customText ? (
              <div className="legal-copy">{customText}</div>
            ) : (
              <p>Сведения о лицензиях и дополнительных документах будут размещены после подтверждения владельцем сайта. Для запроса документов по изделиям обратитесь к менеджеру RekoMed.</p>
            )}
            {settings.licenseFileUrl && (
              <a className="outline-action legal-doc-link" href={settings.licenseFileUrl}>
                Открыть файл
              </a>
            )}
          </div>
        )}
      </RevealSection>
    </>
  )
}

export function CompanyPage({ settings }: { settings?: PublicSiteSettings }) {
  return (
    <>
      <RevealSection className="page-hero company-hero">
        <Breadcrumbs items={[{ href: '/', label: 'Главная' }, { href: '/company/', label: 'О компании' }]} />
        <span className="section-kicker">О компании</span>
        <h1>О RekoMed</h1>
        <p>Мы помогаем медицинским организациям подбирать изделия, уточнять наличие и получать документы для закупки.</p>
        <div className="hero-actions">
          <Link className="primary-action" href="#lead">
            Запросить КП
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
          <Link className="outline-action" href="/catalog/">
            Перейти в каталог
          </Link>
        </div>
      </RevealSection>

      <RevealSection className="section">
        <SectionHead kicker="Для кого" title="Работаем с медицинскими организациями и специалистами" />
        <div className="trust-grid">
          {[
            ['Клиники и отделения', 'Подбор изделий под профильную задачу.'],
            ['Закупочные отделы', 'КП, документы и спецификации для согласования.'],
            ['Врачи и специалисты', 'Уточнение параметров и доступных аналогов.'],
            ['Юридические лица', 'Счета, договоры и закрывающие документы.']
          ].map(([title, text]) => (
            <div className="trust-card" key={title}>
              <Building2 aria-hidden="true" />
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </RevealSection>

      <ProcessSection />
      <TrustSection />
      <LeadSection
        title="Нужна помощь с подбором?"
        text="Оставьте заявку - подготовим КП и уточним документы."
        source="contacts"
        settings={settings}
      />
    </>
  )
}

export function InfoPage({ page, settings }: { page: PublicCatalogPage; settings?: PublicSiteSettings }) {
  const isContact = page.kind === 'contacts' || page.path.includes('/contacts')
  const phone = settings?.phone || company.phone
  const email = settings?.email || company.email
  const address = settings?.address || company.address
  const legalName = settings?.legalName || company.legalName
  const legalInn = settings?.legalInn || ''
  const legalOgrn = settings?.legalOgrn || ''
  const yandexMapUrl = 'https://yandex.ru/map-widget/v1/?ll=39.251192%2C51.672452&mode=search&oid=227723470864&ol=biz&z=14'

  if (isContact) {
    return (
      <>
        <RevealSection className="page-hero compact-hero contacts-hero">
          <Breadcrumbs items={[{ href: '/', label: 'Главная' }, { href: page.path, label: 'Контакты' }]} />
          <span className="section-kicker">Контакты</span>
          <h1>Контакты</h1>
          <p>Свяжитесь с нами, если нужно КП, цена, наличие, документы или подбор изделия.</p>
        </RevealSection>
        <RevealSection className="section contact-layout" id="lead">
          <div className="contact-panels">
            <div className="info-panel contact-card">
              <Phone aria-hidden="true" />
              <h2>Телефон</h2>
              <a href={`tel:${phone.replace(/[^\d+]/g, '')}`}>{phone}</a>
            </div>
            <div className="info-panel contact-card">
              <Mail aria-hidden="true" />
              <h2>Email</h2>
              <a href={`mailto:${email}`}>{email}</a>
            </div>
            <div className="info-panel contact-card">
              <MapPin aria-hidden="true" />
              <h2>Адрес</h2>
              <p>{address}</p>
            </div>
            <div className="info-panel contact-card">
              <Clock aria-hidden="true" />
              <h2>Время работы</h2>
              <p>Пн-Пт: 9:00-17:30</p>
            </div>
            <div className="map-card">
              <iframe
                src={yandexMapUrl}
                title={`Карта проезда: ${address}`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
            <div className="info-panel requisites-card">
              <h2>Реквизиты</h2>
              <dl className="legal-list">
                <div>
                  <dt>Наименование</dt>
                  <dd>{legalName}</dd>
                </div>
                {legalInn && (
                  <div>
                    <dt>ИНН</dt>
                    <dd>{legalInn}</dd>
                  </div>
                )}
                {legalOgrn && (
                  <div>
                    <dt>ОГРН</dt>
                    <dd>{legalOgrn}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
          <LeadForm title="Связаться с RekoMed" text="Опишите задачу, изделие или документы, которые нужны." source="contacts" />
        </RevealSection>
      </>
    )
  }

  return (
    <>
      <RevealSection className="page-hero compact-hero">
        <Breadcrumbs items={[{ href: '/', label: 'Главная' }, { href: page.path, label: page.h1 }]} />
        <span className="section-kicker">Информация</span>
        <h1>{page.h1}</h1>
        <p>{cleanText(page.description, 'Информация RekoMed для клиентов, партнеров и закупочных отделов.')}</p>
      </RevealSection>
      <LeadSection settings={settings} />
    </>
  )
}

export function TrustSection() {
  const items = [
    { icon: ShieldCheck, title: 'Документы на изделия', text: 'Помогаем запросить регистрационные удостоверения, сертификаты, инструкции и каталоги.' },
    { icon: Building2, title: 'Работа с юрлицами', text: 'КП, счета, закрывающие документы и поставка под закупочную спецификацию.' },
    { icon: PackageCheck, title: 'Подбор ассортимента', text: 'Менеджер помогает уточнить позицию, аналог, размер и условия наличия.' },
    { icon: Handshake, title: 'Понятная коммуникация', text: 'Обсуждаем задачу на языке сроков, документов, спецификаций и условий поставки.' }
  ]

  return (
    <RevealSection className="section">
      <SectionHead kicker="Документы и доверие" title="Надежность подтверждается документами и понятными условиями" />
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
    </RevealSection>
  )
}

export function ProcessSection() {
  return (
    <RevealSection className="section band">
      <SectionHead kicker="Процесс" title="Как мы работаем" />
      <div className="process-grid">
        {processItems.map((step, index) => (
          <div key={step.title} className="process-step">
            <span>{index + 1}</span>
            <h3>{step.title}</h3>
            <p>{step.text}</p>
            <CheckCircle2 aria-hidden="true" />
          </div>
        ))}
      </div>
    </RevealSection>
  )
}

export function DocumentsBand() {
  return (
    <RevealSection className="section document-band">
      <div>
        <span className="section-kicker">Документы</span>
        <h2>Нужен документ по конкретному изделию?</h2>
        <p>Запросите - отправим доступный комплект в одном письме.</p>
      </div>
      <Link className="primary-action" href="/documents/">
        Запросить документы
        <ArrowRight size={18} aria-hidden="true" />
      </Link>
    </RevealSection>
  )
}
