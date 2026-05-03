import type { Access, CollectionConfig, GlobalConfig } from 'payload'

const getRole = (user: unknown) => (user as { role?: string } | null | undefined)?.role

const hasRole =
  (...roles: string[]): Access =>
  ({ req: { user } }) =>
    roles.includes(getRole(user) || '')

const isAuthenticated: Access = ({ req: { user } }) => Boolean(user)
const canManageContent = hasRole('owner', 'admin', 'editor')
const canManageSettings = hasRole('owner', 'admin')
const isOwner = hasRole('owner')

const allowFirstUserOrOwner: Access = async ({ req }) => {
  if (req.user) return getRole(req.user) === 'owner'

  try {
    const users = await req.payload.count({ collection: 'users' })
    return users.totalDocs === 0
  } catch (error) {
    const code = (error as { code?: string; cause?: { code?: string } }).code || (error as { cause?: { code?: string } }).cause?.code
    if (code === '42P01' || error instanceof Error && /relation .*users.* does not exist/i.test(error.message)) {
      return true
    }

    throw error
  }
}

const publicRead: Access = () => true

const seoFields = [
  { name: 'metaTitle', label: 'Title', type: 'text' },
  { name: 'metaDescription', label: 'Description', type: 'textarea' },
  { name: 'canonicalPath', label: 'Canonical path', type: 'text' },
  { name: 'indexable', label: 'Indexable', type: 'checkbox', defaultValue: true }
] satisfies CollectionConfig['fields']

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: { useAsTitle: 'email', group: 'System' },
  access: {
    create: allowFirstUserOrOwner,
    read: isAuthenticated,
    update: isOwner,
    delete: isOwner
  },
  fields: [
    { name: 'name', type: 'text' },
    { name: 'role', type: 'select', defaultValue: 'editor', options: ['owner', 'admin', 'editor'] }
  ]
}

export const Media: CollectionConfig = {
  slug: 'media',
  upload: {
    staticDir: 'media',
    adminThumbnail: 'thumbnail',
    imageSizes: [
      { name: 'thumbnail', width: 360, height: 260, position: 'centre' },
      { name: 'card', width: 720, height: 520, position: 'centre' }
    ],
    mimeTypes: ['image/*', 'application/pdf']
  },
  admin: { group: 'Content' },
  access: {
    read: publicRead,
    create: canManageContent,
    update: canManageContent,
    delete: canManageSettings
  },
  fields: [{ name: 'alt', type: 'text', required: true }]
}

export const Directions: CollectionConfig = {
  slug: 'directions',
  admin: { useAsTitle: 'title', group: 'Catalog', defaultColumns: ['title', 'slug', 'updatedAt'] },
  access: {
    read: publicRead,
    create: canManageContent,
    update: canManageContent,
    delete: canManageSettings
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true },
    { name: 'summary', type: 'textarea', required: true },
    { name: 'ctaType', type: 'select', options: ['quote', 'availability', 'selection', 'documents', 'callback'] },
    { name: 'seo', type: 'group', fields: seoFields }
  ]
}

export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: { useAsTitle: 'title', group: 'Catalog', defaultColumns: ['title', 'parent', 'sortOrder', 'legacyPath', 'updatedAt'] },
  access: {
    read: publicRead,
    create: canManageContent,
    update: canManageContent,
    delete: canManageSettings
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true },
    { name: 'legacyPath', type: 'text' },
    { name: 'description', type: 'textarea' },
    { name: 'parent', type: 'relationship', relationTo: 'categories' },
    { name: 'sortOrder', type: 'number', defaultValue: 1000 },
    { name: 'direction', type: 'relationship', relationTo: 'directions' },
    { name: 'seo', type: 'group', fields: seoFields }
  ]
}

export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'title',
    group: 'Catalog',
    defaultColumns: ['title', 'externalId', 'legacyPath', 'updatedAt'],
    listSearchableFields: ['title', 'externalId', 'legacyPath']
  },
  access: {
    read: publicRead,
    create: canManageContent,
    update: canManageContent,
    delete: canManageSettings
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true },
    { name: 'legacyPath', type: 'text', unique: true },
    { name: 'externalId', type: 'text' },
    { name: 'description', type: 'textarea' },
    { name: 'category', type: 'relationship', relationTo: 'categories' },
    { name: 'brand', type: 'relationship', relationTo: 'brands' },
    { name: 'image', type: 'upload', relationTo: 'media' },
    {
      name: 'attributes',
      type: 'array',
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'value', type: 'text', required: true }
      ]
    },
    { name: 'documents', type: 'relationship', relationTo: 'documents', hasMany: true },
    { name: 'seo', type: 'group', fields: seoFields }
  ]
}

export const Brands: CollectionConfig = {
  slug: 'brands',
  admin: { useAsTitle: 'title', group: 'Catalog', defaultColumns: ['title', 'slug', 'updatedAt'] },
  access: {
    read: publicRead,
    create: canManageContent,
    update: canManageContent,
    delete: canManageSettings
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true },
    { name: 'description', type: 'textarea' },
    { name: 'logo', type: 'upload', relationTo: 'media' },
    { name: 'seo', type: 'group', fields: seoFields }
  ]
}

export const Documents: CollectionConfig = {
  slug: 'documents',
  admin: { useAsTitle: 'title', group: 'Content', defaultColumns: ['title', 'kind', 'updatedAt'] },
  access: {
    read: publicRead,
    create: canManageContent,
    update: canManageContent,
    delete: canManageSettings
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'kind', type: 'select', options: ['registration', 'certificate', 'instruction', 'catalog', 'other'] },
    { name: 'file', type: 'upload', relationTo: 'media' },
    { name: 'relatedProducts', type: 'relationship', relationTo: 'products', hasMany: true }
  ]
}

export const Articles: CollectionConfig = {
  slug: 'articles',
  admin: { useAsTitle: 'title', group: 'Content', defaultColumns: ['title', 'publishedAt', 'updatedAt'] },
  access: {
    read: publicRead,
    create: canManageContent,
    update: canManageContent,
    delete: canManageSettings
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true },
    { name: 'excerpt', type: 'textarea' },
    { name: 'content', type: 'richText' },
    { name: 'publishedAt', type: 'date' },
    { name: 'seo', type: 'group', fields: seoFields }
  ]
}

export const Leads: CollectionConfig = {
  slug: 'leads',
  admin: {
    useAsTitle: 'name',
    group: 'Sales',
    defaultColumns: ['name', 'phone', 'productTitle', 'deliveryStatus', 'status', 'createdAt']
  },
  access: {
    read: isAuthenticated,
    create: canManageContent,
    update: canManageContent,
    delete: canManageSettings
  },
  fields: [
    { name: 'type', type: 'select', defaultValue: 'callback', options: ['callback'] },
    { name: 'name', type: 'text', required: true },
    { name: 'phone', type: 'text', required: true },
    { name: 'email', type: 'email' },
    { name: 'message', type: 'textarea' },
    { name: 'pageUrl', type: 'text' },
    { name: 'productId', type: 'text' },
    { name: 'productTitle', type: 'text' },
    { name: 'productSku', type: 'text' },
    { name: 'productPath', type: 'text' },
    { name: 'productCategory', type: 'text' },
    { name: 'utm', type: 'json' },
    { name: 'consent', label: 'Personal data consent accepted', type: 'checkbox', defaultValue: true },
    {
      name: 'deliveryStatus',
      type: 'select',
      defaultValue: 'pending',
      options: ['pending', 'sent', 'skipped', 'failed']
    },
    { name: 'vkMessageId', type: 'text' },
    { name: 'deliveryError', type: 'textarea' },
    { name: 'status', type: 'select', defaultValue: 'new', options: ['new', 'processing', 'done', 'spam'] }
  ]
}

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  admin: { group: 'Settings' },
  access: {
    read: publicRead,
    update: canManageSettings
  },
  fields: [
    { name: 'phone', type: 'text' },
    { name: 'email', type: 'email' },
    { name: 'address', type: 'text' },
    { name: 'telegram', type: 'text' },
    { name: 'mainCta', type: 'text' },
    { name: 'leadFormTitle', type: 'text', defaultValue: 'Связаться с RekoMed' },
    {
      name: 'leadFormText',
      type: 'textarea',
      defaultValue: 'Оставьте контакты, и менеджер свяжется с вами по заявке.'
    },
    { name: 'leadSuccessTitle', type: 'text', defaultValue: 'Заявка отправлена' },
    {
      name: 'leadSuccessText',
      type: 'textarea',
      defaultValue: 'Менеджер свяжется с вами и уточнит детали запроса.'
    },
    { name: 'jivoEnabled', type: 'checkbox', defaultValue: false },
    { name: 'jivoWidgetId', type: 'text' },
    { name: 'yandexMetrikaId', label: 'Yandex Metrika ID', type: 'text' },
    { name: 'yandexVerification', label: 'Yandex verification code', type: 'text' },
    { name: 'googleSiteVerification', label: 'Google site verification code', type: 'text' },
    { name: 'vkUrl', label: 'VK page URL', type: 'text' },
    { name: 'legalName', label: 'Legal name', type: 'text', defaultValue: 'ООО "Остеомед-В"' },
    { name: 'legalInn', label: 'INN', type: 'text' },
    { name: 'legalOgrn', label: 'OGRN', type: 'text' },
    { name: 'legalAddress', label: 'Legal address', type: 'text' },
    {
      name: 'privacyText',
      label: 'Privacy policy text',
      type: 'textarea',
      admin: {
        description: 'Полный текст страницы /privacy/. Если поле пустое, сайт покажет шаблонный текст.'
      }
    },
    {
      name: 'consentText',
      label: 'Personal data consent text',
      type: 'textarea',
      admin: {
        description: 'Полный текст страницы /consent/. Если поле пустое, сайт покажет шаблонный текст.'
      }
    },
    {
      name: 'termsText',
      label: 'Terms text',
      type: 'textarea',
      admin: {
        description: 'Полный текст страницы /terms/. Если поле пустое, сайт покажет шаблонный текст.'
      }
    },
    {
      name: 'legalText',
      label: 'Additional legal information text',
      type: 'textarea',
      admin: {
        description: 'Дополнительный текст страницы /legal/. Реквизиты ниже всё равно выводятся отдельным блоком.'
      }
    },
    { name: 'licenseText', label: 'License text', type: 'textarea' },
    { name: 'licenseFile', label: 'License file', type: 'upload', relationTo: 'media' },
    { name: 'cookieBannerEnabled', label: 'Cookie banner enabled', type: 'checkbox', defaultValue: true },
    {
      name: 'cookieBannerText',
      label: 'Cookie banner text',
      type: 'textarea',
      defaultValue:
        'Мы используем cookie для аналитики и улучшения работы сайта. Вы можете принять или отклонить использование cookie.'
    },
    { name: 'cookiePolicyPath', label: 'Cookie policy path', type: 'text', defaultValue: '/privacy/' },
    { name: 'medicalDisclaimerEnabled', label: 'Medical disclaimer enabled', type: 'checkbox', defaultValue: true },
    {
      name: 'medicalDisclaimerText',
      label: 'Medical disclaimer text',
      type: 'textarea',
      defaultValue: 'Имеются противопоказания. Необходима консультация специалиста.'
    },
    { name: 'vkLeadEnabled', type: 'checkbox', defaultValue: false, access: { read: ({ req }) => Boolean(req.user) } },
    { name: 'vkRecipientPeerId', type: 'text', access: { read: ({ req }) => Boolean(req.user) } },
    {
      name: 'vkLeadMessageTemplate',
      type: 'textarea',
      access: { read: ({ req }) => Boolean(req.user) },
      defaultValue:
        'Новая заявка RekoMed\nИмя: {{name}}\nТелефон: {{phone}}\nEmail: {{email}}\nТовар: {{product}}\nСтраница: {{page}}\nКомментарий: {{message}}'
    }
  ]
}
