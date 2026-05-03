import Link from 'next/link'
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Handshake,
  PackageCheck,
  Search,
  ShieldCheck,
  Truck
} from 'lucide-react'
import {
  company,
  directions,
  type Direction
} from '@/lib/content'
import {
  generatedPublicContent,
  getCategoryBySection,
  getCategoryProducts,
  getProductsForSections,
  type PublicCatalogPage,
  type PublicContent
} from '@/lib/cms-content'
import {
  formatCatalogCount,
  getCategoryAncestors,
  getCategoryNode,
  getTopCatalogNodes,
  isWorkingCategory
} from '@/lib/catalog-hierarchy'
import { CatalogExplorer } from '@/components/CatalogExplorer'
import { LeadForm } from '@/components/LeadForm'
import type { LegalPageDefinition } from '@/lib/legal-pages'
import type { PublicSiteSettings } from '@/lib/site-settings'

const fallbackImage =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420"><rect width="640" height="420" fill="%23eef6f4"/><path d="M96 316h448M126 106h388M126 158h298M126 210h352" stroke="%231a6a7a" stroke-width="18" stroke-linecap="round"/><rect x="96" y="72" width="448" height="276" rx="16" fill="none" stroke="%230f4f5f" stroke-width="12"/></svg>'

function ProductVisual({ product, className = '' }: { product: PublicCatalogPage; className?: string }) {
  return (
    <div className={`product-visual ${className}`}>
      <img src={product.image || fallbackImage} alt={product.imageAlt || product.h1} loading="lazy" />
    </div>
  )
}

export function ProductCard({ product }: { product: PublicCatalogPage }) {
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
      <Link className="text-action" href={`${product.path}#product-lead`}>
        Запросить цену
        <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </article>
  )
}

function CategoryTile({ category, content }: { category: PublicCatalogPage; content: PublicContent }) {
  const count = getCategoryNode(category, content.categoryPages, content.productPages).descendantProductCount

  return (
    <Link className="category-tile" href={category.path}>
      <span>{category.h1}</span>
      <small>{formatCatalogCount(count)}</small>
      <ArrowRight size={18} aria-hidden="true" />
    </Link>
  )
}

function Breadcrumbs({ items }: { items: { href: string; label: string }[] }) {
  return (
    <nav className="breadcrumbs" aria-label="Хлебные крошки">
      {items.map((item, index) => (
        <span key={item.href}>
          {index > 0 && <span aria-hidden="true">/</span>}
          <Link href={item.href}>{item.label}</Link>
        </span>
      ))}
    </nav>
  )
}

function LeadSection({
  title = 'Получить консультацию или КП',
  text = 'Оставьте контакты: менеджер уточнит задачу, подберет позицию, проверит документы и подготовит коммерческое предложение.',
  kicker = 'Заявка менеджеру'
}: {
  title?: string
  text?: string
  kicker?: string
}) {
  return (
    <section className="section lead-section" id="lead">
      <div>
        <span className="section-kicker">{kicker}</span>
        <h2>{title}</h2>
        <p>{text}</p>
        <div className="contact-lines">
          <a href={company.phoneHref}>{company.phone}</a>
          <a href={company.emailHref}>{company.email}</a>
          <span>{company.hours}</span>
        </div>
      </div>
      <LeadForm title="Связаться с RekoMed" text="Опишите задачу или укажите изделие, которое нужно подобрать." />
    </section>
  )
}

export function HomePage({ content = generatedPublicContent }: { content?: PublicContent }) {
  const cmsProducts = content.productPages.filter((product) => product.source === 'cms')
  const featuredProducts = [...cmsProducts, ...content.productPages.filter((product) => product.source !== 'cms')].slice(0, 6)
  const primaryCategories = content.categoryPages
    .filter((category) => ['travmatologiya', 'plastiny', 'vinty', 'shtift', 'ortopediya', 'khirurgiya'].includes(category.section))
    .slice(0, 8)

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="section-kicker">Поставка медицинских изделий</span>
          <h1>Медицинские изделия, документы и КП для клиник без лишних согласований</h1>
          <p>
            Помогаем врачам, клиникам и закупочным отделам быстро уточнить наличие, подобрать изделие под спецификацию
            и получить комплект документов для закупки.
          </p>
          <div className="hero-actions">
            <Link className="primary-action" href="#lead">
              Получить КП
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link className="outline-action" href="/catalog/">
              Смотреть каталог
            </Link>
          </div>
          <div className="trust-strip" aria-label="Ключевые показатели">
            <span>{content.productPages.length} товаров в каталоге</span>
            <span>{content.categoryPages.length} категорий</span>
            <span>КП и документы под запрос</span>
          </div>
        </div>
        <div className="hero-panel" aria-label="Чем помогает RekoMed">
          <div className="panel-row">
            <ClipboardCheck aria-hidden="true" />
            <span>Проверяем позицию, артикул и наличие</span>
          </div>
          <div className="panel-row">
            <FileText aria-hidden="true" />
            <span>Готовим РУ, сертификаты и инструкции</span>
          </div>
          <div className="panel-row">
            <Truck aria-hidden="true" />
            <span>Работаем с юрлицами и закупочными отделами</span>
          </div>
          <div className="hero-note">
            <strong>Запрос по конкретному изделию</strong>
            <p>Откройте карточку товара и оставьте контакты. Менеджер увидит выбранную позицию и быстрее уточнит цену, наличие и документы.</p>
          </div>
        </div>
      </section>

      <section className="section audience-section">
        <div className="section-head">
          <span className="section-kicker">Кому подходит</span>
          <h2>Для тех, кому важно быстро закрыть заявку на поставку</h2>
          <p>Помогаем уточнить позицию, собрать документы и получить понятные условия для закупки.</p>
        </div>
        <div className="trust-grid">
          <div className="trust-card">
            <Building2 aria-hidden="true" />
            <h3>Клиникам и отделениям</h3>
            <p>Подбор изделий, расходных материалов и оборудования под конкретную медицинскую задачу.</p>
          </div>
          <div className="trust-card">
            <ClipboardCheck aria-hidden="true" />
            <h3>Закупочным отделам</h3>
            <p>КП, спецификации, документы и понятная коммуникация по срокам поставки.</p>
          </div>
          <div className="trust-card">
            <FileText aria-hidden="true" />
            <h3>Врачам и специалистам</h3>
            <p>Уточнение характеристик, типоразмеров, аналогов и регистрационных документов.</p>
          </div>
          <div className="trust-card">
            <Truck aria-hidden="true" />
            <h3>Юридическим лицам</h3>
            <p>Работа по счетам, закрывающим документам и поставкам под заявку организации.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <span className="section-kicker">Направления</span>
          <h2>Направления, с которых удобно начать подбор</h2>
          <p>Выберите профильный раздел, если уже знаете задачу, область применения или тип изделия.</p>
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
          <p>Основные группы изделий собраны по направлениям, чтобы быстрее перейти к нужной позиции.</p>
        </div>
        <div className="category-grid">
          {primaryCategories.map((category) => (
            <CategoryTile key={category.path} category={category} content={content} />
          ))}
        </div>
      </section>

      {featuredProducts.length > 0 && (
      <section className="section">
        <div className="section-head split">
          <div>
            <span className="section-kicker">Каталог</span>
            <h2>Позиции, по которым можно сразу отправить заявку</h2>
            <p>Откройте карточку изделия или отправьте запрос менеджеру, если нужна цена, наличие или документы.</p>
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
      )}

      <TrustSection />
      <ProcessSection />
      <LeadSection />
    </>
  )
}

export function DirectionPage({ direction, content = generatedPublicContent }: { direction: Direction; content?: PublicContent }) {
  const categories = direction.oldSections
    .map((section) => content.categoryPages.find((category) => category.section === section))
    .filter((category): category is PublicCatalogPage => Boolean(category))
    .filter((category) => isWorkingCategory(category, content.categoryPages, content.productPages))
  const products = getProductsForSections(content, direction.oldSections, 9)

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

      {categories.length > 0 && (
        <section className="section">
          <div className="section-head">
            <span className="section-kicker">Подкатегории</span>
            <h2>Быстрый переход к нужному типу изделий</h2>
          </div>
          <div className="category-grid">
            {categories.map((category) => (
              <CategoryTile key={category.path} category={category} content={content} />
            ))}
          </div>
        </section>
      )}

      {products.length > 0 && (
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
      )}

      {!categories.length && !products.length && (
        <section className="section">
          <div className="empty-category-panel">
            <div>
              <span className="section-kicker">Запрос по направлению</span>
              <h2>Подберём изделия под вашу задачу</h2>
              <p>В этом направлении сейчас нет опубликованных категорий с товарами. Оставьте запрос, и менеджер уточнит подходящие позиции, аналоги и документы.</p>
            </div>
            <Link className="primary-action" href="#lead">
              Оставить запрос
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </section>
      )}

      <DocumentsBand />
      <LeadSection title="Подобрать изделия по направлению" text="Опишите задачу или приложите спецификацию: менеджер поможет уточнить позиции, документы и условия поставки." />
    </>
  )
}

export function CatalogPage({ content = generatedPublicContent }: { content?: PublicContent }) {
  return (
    <>
      <section className="catalog-page-head">
        <Breadcrumbs items={[{ href: '/', label: 'Главная' }, { href: '/catalog/', label: 'Каталог' }]} />
        <h1>Каталог медицинских изделий и расходных материалов</h1>
        <p>
          В каталоге собраны изделия, расходные материалы и оборудование для клиник, специалистов и закупочных отделов.
        </p>
      </section>
      <section className="section">
        <CatalogExplorer categories={content.categoryPages} products={content.productPages} />
      </section>
      <LeadSection title="Не нашли нужную позицию в каталоге?" text="Оставьте запрос: менеджер проверит наличие, подберет аналог или подготовит документы по нужному изделию." />
    </>
  )
}

export function CategoryPage({ page, content = generatedPublicContent }: { page: PublicCatalogPage; content?: PublicContent }) {
  const products = getCategoryProducts(content, page.section)
  const node = getCategoryNode(page, content.categoryPages, content.productPages)
  const ancestors = getCategoryAncestors(page, content.categoryPages)
  const description =
    page.description && page.description !== 'Интернет-магазин'
      ? page.description
      : 'Выберите подкатегорию или отправьте запрос менеджеру для подбора изделия, документов и условий поставки.'
  const suggestions = getTopCatalogNodes(content.categoryPages, content.productPages)
    .filter((item) => item.category.path !== page.path)
    .slice(0, 4)

  return (
    <>
      <section className="catalog-page-head">
        <Breadcrumbs
          items={[
            { href: '/', label: 'Главная' },
            { href: '/catalog/', label: 'Каталог' },
            ...ancestors.map((category) => ({ href: category.path, label: category.h1 })),
            { href: page.path, label: page.h1 }
          ]}
        />
        <h1>{page.h1}</h1>
        <p>{description}</p>
      </section>

      {node.children.length > 0 && (
        <section className="section catalog-section">
          <div className="section-head">
            <span className="section-kicker">Подкатегории</span>
            <h2>Выберите нужный тип изделий</h2>
          </div>
          <div className="category-grid compact">
            {node.children.map((category) => (
              <CategoryTile key={category.path} category={category} content={content} />
            ))}
          </div>
        </section>
      )}

      {products.length > 0 && (
        <section className="section catalog-section">
          <div className="section-head split">
            <div>
              <span className="section-kicker">Товары</span>
              <h2>{formatCatalogCount(products.length)} в категории</h2>
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
      )}

      {!node.children.length && !products.length && (
        <section className="section catalog-section">
          <div className="empty-category-panel">
            <div>
              <span className="section-kicker">Запрос по разделу</span>
              <h2>Подберём позицию по вашей спецификации</h2>
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
        </section>
      )}

      <LeadSection title="Запросить подбор по категории" text="Укажите нужный тип изделия, количество или характеристики. Мы уточним наличие, документы и цену." />
    </>
  )
}

export function ProductPage({ product, content = generatedPublicContent }: { product: PublicCatalogPage; content?: PublicContent }) {
  const related = product.section === 'cms' ? [] : getCategoryProducts(content, product.section).filter((item) => item.path !== product.path).slice(0, 3)
  const attrs = Object.entries(product.attributes)
  const category = getCategoryBySection(content, product.section)

  return (
    <>
      <section className="product-layout">
        <ProductVisual product={product} className="large-product" />
        <div className="product-copy">
          <span className="section-kicker">Карточка изделия</span>
          <h1>{product.h1}</h1>
          <p>{product.description || 'Уточните характеристики, документы и актуальные условия поставки у менеджера RekoMed.'}</p>
          <div className="product-actions">
            <Link className="primary-action" href="#product-lead">
              Запросить цену
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link className="outline-action" href="/documents/">
              Документы
            </Link>
          </div>
        </div>
      </section>
      <section className="section two-column" id="product-lead">
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
              <dd>{category.h1}</dd>
            </div>
            {attrs.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <LeadForm
          product={{
            id: product.id,
            sku: product.id,
            title: product.h1,
            path: product.path,
            category: category.h1
          }}
          title="Запросить наличие и цену"
          text="Товар уже выбран. Оставьте контакты, и менеджер уточнит наличие, цену и документы."
        />
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

export function BrandPage({ page, content = generatedPublicContent }: { page: PublicCatalogPage; content?: PublicContent }) {
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
          {content.brandPages.map((brand) => (
            <Link key={brand.path} href={brand.path}>
              {brand.h1}
            </Link>
          ))}
        </div>
      </section>
      <LeadSection title="Запросить позиции производителя" text="Напишите, какие изделия или документы по бренду нужны. Менеджер уточнит доступные позиции и условия поставки." />
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
          Запросите документы по конкретному изделию, категории или производителю. Менеджер уточнит, какие материалы
          нужны для вашей закупки.
        </p>
      </section>
      <DocumentsBand />
      <LeadSection title="Запросить документы на изделие" text="Укажите товар, артикул или категорию: менеджер подберет регистрационные удостоверения, сертификаты или инструкции." />
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
      <section className="catalog-page-head legal-page-head">
        <Breadcrumbs items={[{ href: '/', label: 'Главная' }, { href: page.path, label: page.h1 }]} />
        <span className="section-kicker">{page.kicker}</span>
        <h1>{page.h1}</h1>
        <p>{page.description}</p>
      </section>

      <section className="section legal-page">
        {customText && page.key !== 'legal' && page.key !== 'license' && <EditableLegalText text={customText} />}

        {page.key === 'privacy' && !customText && (
          <div className="legal-card">
            <h2>Какие данные обрабатываются</h2>
            <p>
              RekoMed обрабатывает данные, которые пользователь передает через формы сайта: имя, телефон, email,
              комментарий, выбранный товар, страницу заявки и UTM-метки.
            </p>
            <h2>Правовые основания</h2>
            <p>
              Обработка выполняется на основании согласия пользователя, требований Федерального закона от 27.07.2006
              N 152-ФЗ "О персональных данных", а также законных интересов оператора при обработке обращений.
            </p>
            <h2>Цели обработки</h2>
            <p>
              Данные используются для ответа на заявку, подготовки коммерческого предложения, уточнения наличия,
              документов и условий поставки. Cookie и аналитика применяются только после согласия пользователя.
            </p>
            <h2>Срок хранения и отзыв согласия</h2>
            <p>
              Данные обрабатываются до достижения целей обработки или до отзыва согласия, если иной срок не требуется
              по закону. Отозвать согласие можно, направив обращение на{' '}
              <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
            </p>
            <h2>Оператор данных</h2>
            <p>
              Оператор: {operatorName}. Для вопросов по персональным данным можно написать на{' '}
              <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
            </p>
          </div>
        )}

        {page.key === 'consent' && !customText && (
          <div className="legal-card">
            <h2>Текст согласия</h2>
            <p>
              Отправляя форму на сайте RekoMed, пользователь дает согласие {operatorName} на обработку персональных
              данных, указанных в форме, включая имя, телефон, email, комментарий, сведения о выбранном товаре и страницу
              отправки заявки.
            </p>
            <p>
              Согласие распространяется на сбор, запись, систематизацию, накопление, хранение, уточнение, использование,
              передачу в случаях, необходимых для обработки заявки и работы сайта, обезличивание, блокирование,
              удаление и уничтожение персональных данных.
            </p>
            <p>
              Согласие действует до достижения целей обработки или до его отзыва. Отозвать согласие можно, направив
              обращение на <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
            </p>
          </div>
        )}

        {page.key === 'terms' && !customText && (
          <div className="legal-card">
            <h2>Правила использования сайта</h2>
            <p>
              Сайт RekoMed содержит справочную информацию о медицинских изделиях, расходных материалах, документах и
              условиях обращения к менеджеру. Информация на сайте не является публичной офертой.
            </p>
            <p>
              Цена, наличие, сроки поставки, применимость изделия и комплект документов уточняются менеджером после
              получения заявки.
            </p>
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
              <p>
                Сведения о лицензиях и дополнительных документах будут размещены после подтверждения владельцем сайта.
                Для запроса документов по изделиям обратитесь к менеджеру RekoMed.
              </p>
            )}
            {settings.licenseFileUrl && (
              <a className="outline-action legal-doc-link" href={settings.licenseFileUrl}>
                Открыть файл
              </a>
            )}
          </div>
        )}
      </section>
    </>
  )
}

export function CompanyPage() {
  return (
    <>
      <section className="page-hero company-hero">
        <span className="section-kicker">О компании</span>
        <h1>RekoMed помогает медицинским организациям получать изделия, документы и КП под закупочную задачу</h1>
        <p>
          Мы работаем с клиниками, врачами, закупочными отделами и юридическими лицами: уточняем позицию,
          проверяем характеристики, готовим документы и помогаем пройти путь от запроса до поставки.
        </p>
        <div className="hero-actions">
          <Link className="primary-action" href="#lead">
            Связаться с менеджером
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
          <Link className="outline-action" href="/documents/">
            Запросить документы
          </Link>
        </div>
      </section>
      <section className="section">
        <div className="section-head">
          <span className="section-kicker">Как помогаем</span>
          <h2>Помогаем пройти путь от запроса до поставки</h2>
        </div>
        <div className="trust-grid">
          <div className="trust-card">
            <Search aria-hidden="true" />
            <h3>Подбор позиции</h3>
            <p>Уточняем категорию, артикул, типоразмер, характеристики и возможные аналоги.</p>
          </div>
          <div className="trust-card">
            <FileText aria-hidden="true" />
            <h3>Документы</h3>
            <p>Помогаем запросить регистрационные удостоверения, сертификаты, инструкции и каталоги.</p>
          </div>
          <div className="trust-card">
            <ClipboardCheck aria-hidden="true" />
            <h3>Коммерческое предложение</h3>
            <p>Готовим КП под спецификацию, заявку или регулярную потребность организации.</p>
          </div>
          <div className="trust-card">
            <Handshake aria-hidden="true" />
            <h3>Работа с юрлицами</h3>
            <p>Сопровождаем поставку, счета и закрывающие документы для медицинских организаций.</p>
          </div>
        </div>
      </section>
      <ProcessSection />
      <LeadSection title="Обсудить задачу с RekoMed" text="Оставьте контакты и кратко опишите, какие изделия, документы или КП нужны вашей организации." />
    </>
  )
}

export function InfoPage({ page }: { page: PublicCatalogPage }) {
  const isContact = page.kind === 'contacts'

  return (
    <>
      <section className="page-hero compact-hero">
        <span className="section-kicker">{isContact ? 'Контакты' : 'Информация'}</span>
        <h1>{page.h1}</h1>
        <p>{page.description || 'Информация RekoMed для клиентов, партнёров и закупочных отделов.'}</p>
      </section>
      <section className="section two-column" id="lead">
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
        <LeadForm title="Связаться с RekoMed" />
      </section>
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
    <section className="section">
      <div className="section-head">
        <span className="section-kicker">Доверие</span>
        <h2>Надёжность подтверждается документами и понятными условиями</h2>
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
        <h2>Как проходит работа по заявке</h2>
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
        <p>Укажите изделие, артикул или направление. Мы подскажем, какие документы можно подготовить под запрос.</p>
      </div>
      <Link className="primary-action" href="#lead">
        Запросить документы
        <ArrowRight size={18} aria-hidden="true" />
      </Link>
    </section>
  )
}
