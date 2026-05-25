import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { payloadEmailAdapter } from '@/lib/payload-email'
import {
  Articles,
  Brands,
  Categories,
  Directions,
  Documents,
  Leads,
  Media,
  Products,
  SiteSettings,
  Users
} from '@/lib/payload-collections'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET || 'local-dev-secret-change-before-production',
  sharp,
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: '- RekoMed CMS'
    },
    importMap: {
      baseDir: path.resolve(dirname)
    }
  },
  routes: {
    admin: '/admin',
    api: '/api/payload'
  },
  email: payloadEmailAdapter,
  editor: lexicalEditor(),
  collections: [Users, Media, Directions, Categories, Products, Brands, Documents, Articles, Leads],
  globals: [SiteSettings],
  typescript: {
    outputFile: path.resolve(dirname, '../payload-types.ts')
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || 'postgres://rekomed:rekomed@localhost:5432/rekomed'
    }
  })
})
