import type { CollectionConfig, GlobalConfig } from 'payload'

const seoFields = [
  { name: 'metaTitle', label: 'Title', type: 'text' },
  { name: 'metaDescription', label: 'Description', type: 'textarea' },
  { name: 'canonicalPath', label: 'Canonical path', type: 'text' },
  { name: 'indexable', label: 'Indexable', type: 'checkbox', defaultValue: true }
] satisfies CollectionConfig['fields']

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: { useAsTitle: 'email' },
  fields: [
    { name: 'name', type: 'text' },
    { name: 'role', type: 'select', defaultValue: 'editor', options: ['admin', 'editor'] }
  ]
}

export const Media: CollectionConfig = {
  slug: 'media',
  upload: true,
  fields: [{ name: 'alt', type: 'text', required: true }]
}

export const Directions: CollectionConfig = {
  slug: 'directions',
  admin: { useAsTitle: 'title' },
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
  admin: { useAsTitle: 'title' },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true },
    { name: 'legacyPath', type: 'text' },
    { name: 'description', type: 'textarea' },
    { name: 'direction', type: 'relationship', relationTo: 'directions' },
    { name: 'seo', type: 'group', fields: seoFields }
  ]
}

export const Products: CollectionConfig = {
  slug: 'products',
  admin: { useAsTitle: 'title' },
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
  admin: { useAsTitle: 'title' },
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
  admin: { useAsTitle: 'title' },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'kind', type: 'select', options: ['registration', 'certificate', 'instruction', 'catalog', 'other'] },
    { name: 'file', type: 'upload', relationTo: 'media' },
    { name: 'relatedProducts', type: 'relationship', relationTo: 'products', hasMany: true }
  ]
}

export const Articles: CollectionConfig = {
  slug: 'articles',
  admin: { useAsTitle: 'title' },
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
  admin: { useAsTitle: 'name' },
  fields: [
    { name: 'type', type: 'select', options: ['quote', 'availability', 'selection', 'documents', 'callback'] },
    { name: 'name', type: 'text', required: true },
    { name: 'phone', type: 'text', required: true },
    { name: 'email', type: 'email' },
    { name: 'message', type: 'textarea' },
    { name: 'pageUrl', type: 'text' },
    { name: 'productId', type: 'text' },
    { name: 'status', type: 'select', defaultValue: 'new', options: ['new', 'processing', 'done', 'spam'] }
  ]
}

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  fields: [
    { name: 'phone', type: 'text' },
    { name: 'email', type: 'email' },
    { name: 'address', type: 'text' },
    { name: 'telegram', type: 'text' },
    { name: 'mainCta', type: 'text' }
  ]
}
