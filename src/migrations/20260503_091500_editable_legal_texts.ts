import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "privacy_text" varchar;
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "consent_text" varchar;
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "terms_text" varchar;
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "legal_text" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "legal_text";
    ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "terms_text";
    ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "consent_text";
    ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "privacy_text";
  `)
}
