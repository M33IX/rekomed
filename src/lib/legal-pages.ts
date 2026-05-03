export type LegalPageKey = 'privacy' | 'consent' | 'terms' | 'legal' | 'license'

export type LegalPageDefinition = {
  key: LegalPageKey
  path: string
  aliases: string[]
  title: string
  description: string
  h1: string
  kicker: string
}

export const legalPages: LegalPageDefinition[] = [
  {
    key: 'privacy',
    path: '/privacy/',
    aliases: ['/privacy.html/'],
    title: 'Политика обработки персональных данных | RekoMed',
    description: 'Политика обработки персональных данных RekoMed: какие данные собираются через формы, cookie и заявки.',
    h1: 'Политика обработки персональных данных',
    kicker: 'Персональные данные'
  },
  {
    key: 'consent',
    path: '/consent/',
    aliases: ['/consent.html/'],
    title: 'Согласие на обработку персональных данных | RekoMed',
    description: 'Согласие на обработку персональных данных при отправке заявки на сайте RekoMed.',
    h1: 'Согласие на обработку персональных данных',
    kicker: 'Согласие'
  },
  {
    key: 'terms',
    path: '/terms/',
    aliases: ['/terms.html/'],
    title: 'Пользовательское соглашение | RekoMed',
    description: 'Правила использования сайта RekoMed, каталога медицинских изделий и формы обратной связи.',
    h1: 'Пользовательское соглашение',
    kicker: 'Правила сайта'
  },
  {
    key: 'legal',
    path: '/legal/',
    aliases: ['/legal.html/'],
    title: 'Юридическая информация | RekoMed',
    description: 'Юридические сведения, реквизиты и контакты компании RekoMed.',
    h1: 'Юридическая информация',
    kicker: 'Реквизиты'
  },
  {
    key: 'license',
    path: '/license/',
    aliases: ['/license.html/'],
    title: 'Лицензии и документы | RekoMed',
    description: 'Лицензии, документы и сведения о деятельности RekoMed.',
    h1: 'Лицензии и документы',
    kicker: 'Документы'
  }
]

export const legalPagePaths = legalPages.map((page) => page.path)

export const getLegalPageByPath = (path: string) =>
  legalPages.find((page) => page.path === path || page.aliases.includes(path)) || null
