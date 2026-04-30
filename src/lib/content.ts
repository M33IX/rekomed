import {
  currentSiteGeneratedAt,
  currentSitePages,
  currentSiteStats,
  type CurrentSitePage
} from '@/data/current-site.generated'

export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://reko-med.ru'

export const company = {
  name: 'RekoMed',
  legalName: 'ООО "Остеомед-В"',
  tagline: 'Медицинские изделия и расходные материалы для клиник и закупочных отделов',
  phone: '+7 (473) 233-86-82',
  phoneHref: 'tel:+74732338682',
  email: 'reko-med.ru@yandex.ru',
  emailHref: 'mailto:reko-med.ru@yandex.ru',
  address: 'г. Воронеж, ул. Димитрова, д. 56а',
  hours: 'Пн-Пт: 9:00-17:30',
  telegram: 'https://t.me/rekomed'
}

export const leadTypes = [
  { value: 'quote', label: 'Получить КП' },
  { value: 'availability', label: 'Запросить наличие и цену' },
  { value: 'selection', label: 'Подобрать изделие' },
  { value: 'documents', label: 'Запросить документы' },
  { value: 'callback', label: 'Связаться с менеджером' }
] as const

export type LeadType = (typeof leadTypes)[number]['value']

export type Direction = {
  slug: string
  title: string
  eyebrow: string
  summary: string
  oldSections: string[]
  highlights: string[]
  cta: LeadType
}

export const directions: Direction[] = [
  {
    slug: 'osteosintez',
    title: 'Изделия для остеосинтеза',
    eyebrow: 'Травматология',
    summary:
      'Пластины, винты, штифты и инструменты для хирургических задач клиник, травматологических отделений и закупочных служб.',
    oldSections: ['travmatologiya', 'plastiny', 'vinty', 'shtift'],
    highlights: ['металлоконструкции', 'типоразмеры', 'сертифицированные изделия', 'поставка под спецификацию'],
    cta: 'selection'
  },
  {
    slug: 'osteosintez/plastiny',
    title: 'Пластины для остеосинтеза',
    eyebrow: 'Категория',
    summary:
      'Реконструкционные, компрессионные и специализированные пластины с подбором по длине, толщине, количеству отверстий и материалу.',
    oldSections: ['plastiny'],
    highlights: ['таблица характеристик', 'подбор по размеру', 'запрос КП', 'документы на изделие'],
    cta: 'quote'
  },
  {
    slug: 'osteosintez/vinty-shurupy',
    title: 'Винты для травматологии и остеосинтеза',
    eyebrow: 'Категория',
    summary:
      'Кортикальные, спонгиозные и специализированные винты для фиксации, с быстрым запросом наличия и цены.',
    oldSections: ['vinty'],
    highlights: ['диаметр', 'длина', 'тип резьбы', 'заявка менеджеру'],
    cta: 'availability'
  },
  {
    slug: 'endoprotezirovanie',
    title: 'Эндопротезирование суставов',
    eyebrow: 'Ортопедия',
    summary:
      'Компоненты для тазобедренного и коленного суставов: ножки, головки, впадины, инсёрты и надколенники.',
    oldSections: [
      'endoprotezy_tazobedrennogo_sustava_',
      'endoprotezy_kolennyy_sustav',
      'endoprotezy',
      'nozhki_endoproteza',
      'golovki_endoproteza',
      'vpadiny_endoproteza',
      'implant_kolennogo_sustava',
      'bedrennyy_komponent_kolennogo_sustava',
      'insert_kolennogo_sustava',
      'nadkolennik'
    ],
    highlights: ['компоненты суставов', 'работа с юрлицами', 'документы', 'коммерческое предложение'],
    cta: 'quote'
  },
  {
    slug: 'nejrohirurgiya',
    title: 'Изделия для нейрохирургии',
    eyebrow: 'Нейрохирургия',
    summary:
      'Кейджи, пластины, инструменты и смежные изделия для профильных отделений с консультацией по подбору.',
    oldSections: ['neyrokhirurgiya', 'keydzhi', 'tpf', 'tverdaya_mozgovaya_obolochka'],
    highlights: ['кейджи', 'инструменты', 'подбор аналога', 'запрос документов'],
    cta: 'documents'
  },
  {
    slug: 'raskhodnye-materialy',
    title: 'Расходные материалы для медицинских организаций',
    eyebrow: 'Расходные материалы',
    summary:
      'Шовный материал и сопутствующие изделия для плановых закупок, заявок и регулярных поставок.',
    oldSections: ['shovnyy_material', 'shovnyy_material_stomatologiy'],
    highlights: ['шовный материал', 'регулярные поставки', 'закрывающие документы', 'условия для юрлиц'],
    cta: 'quote'
  },
  {
    slug: 'medicinskoe-oborudovanie',
    title: 'Медицинское оборудование',
    eyebrow: 'Оборудование',
    summary:
      'Оборудование и инструменты для профильных кабинетов и отделений: от запроса спецификации до поставки.',
    oldSections: ['oborudovanie', 'mikroskopy', 'kombayny', 'otolaringologiya'],
    highlights: ['оборудование', 'поставка под задачу', 'документы', 'подбор менеджером'],
    cta: 'selection'
  }
]

export const navigation = [
  { href: '/', label: 'Главная' },
  { href: '/osteosintez/', label: 'Направления' },
  { href: '/catalog/', label: 'Каталог' },
  { href: '/brands/226/', label: 'Производители' },
  { href: '/documents/', label: 'Документы' },
  { href: '/company/', label: 'О компании' },
  { href: '/contacts/stores/', label: 'Контакты' }
]

export const pathToCurrentPage = new Map(currentSitePages.map((page) => [page.path, page]))
export const productPages = currentSitePages.filter((page) => page.kind === 'product')
export const categoryPages = currentSitePages.filter((page) => page.kind === 'category')
export const brandPages = currentSitePages.filter((page) => page.kind === 'brand')

export const generatedStats = currentSiteStats
export { currentSiteGeneratedAt, currentSitePages }

export const normalizePath = (segments: string[] | undefined) => {
  if (!segments || segments.length === 0) return '/'
  const clean = segments.filter(Boolean).join('/')
  return `/${clean}${clean.endsWith('/') ? '' : '/'}`
}

export const landingByPath = new Map(directions.map((direction) => [`/${direction.slug}/`, direction]))

export const getProductsForSections = (sections: string[], limit?: number) => {
  const products = productPages.filter((page) => sections.includes(page.section))
  return typeof limit === 'number' ? products.slice(0, limit) : products
}

export const getCategoryProducts = (section: string) => productPages.filter((page) => page.section === section)

export const getCategoryBySection = (section: string) =>
  categoryPages.find((page) => page.section === section) ??
  ({
    path: `/catalog/${section}/`,
    h1: section,
    title: section,
    description: 'Категория медицинских изделий RekoMed.',
    kind: 'category',
    section,
    id: '',
    url: `${siteUrl}/catalog/${section}/`,
    image: '',
    imageAlt: '',
    attributes: {}
  } satisfies CurrentSitePage)

export const getRoutePage = (segments: string[] | undefined) => {
  const path = normalizePath(segments)
  const landing = landingByPath.get(path)
  if (landing) return { type: 'direction' as const, path, direction: landing }

  if (path === '/documents/') {
    return { type: 'documents' as const, path }
  }

  const current = pathToCurrentPage.get(path)
  if (current) {
    return { type: current.kind, path, page: current } as const
  }

  if (path === '/catalog/') {
    return { type: 'catalog' as const, path }
  }

  return null
}

export const getCanonical = (path: string) => `${siteUrl}${path}`

export const getMetaForRoute = (route: NonNullable<ReturnType<typeof getRoutePage>>) => {
  if (route.type === 'direction') {
    return {
      title: `${route.direction.title} | RekoMed`,
      description: route.direction.summary,
      path: route.path
    }
  }

  if (route.type === 'catalog') {
    return {
      title: 'Каталог медицинских изделий и расходных материалов | RekoMed',
      description:
        'Каталог RekoMed: изделия для травматологии, ортопедии, нейрохирургии, хирургии, ЛОР, стоматологии и реабилитации.',
      path: route.path
    }
  }

  if (route.type === 'documents') {
    return {
      title: 'Документы, сертификаты и регистрационные удостоверения | RekoMed',
      description: 'Запросите регистрационные удостоверения, сертификаты, инструкции и каталоги на медицинские изделия RekoMed.',
      path: route.path
    }
  }

  const page = route.page
  return {
    title: page.kind === 'home' ? 'RekoMed - поставка медицинских изделий для клиник и закупщиков' : `${page.title} | RekoMed`,
    description:
      page.description ||
      'Медицинские изделия, расходные материалы и оборудование для клиник, врачей, закупочных отделов и юридических лиц.',
    path: page.path
  }
}

export const getProductById = (id: string) => productPages.find((product) => product.id === id)
