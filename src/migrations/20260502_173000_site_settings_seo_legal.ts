import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "consent" boolean DEFAULT true;

    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "yandex_metrika_id" varchar;
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "yandex_verification" varchar;
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "google_site_verification" varchar;
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "vk_url" varchar;
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "legal_name" varchar DEFAULT 'ООО "Остеомед-В"';
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "legal_inn" varchar;
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "legal_ogrn" varchar;
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "legal_address" varchar;
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "license_text" varchar;
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "license_file_id" integer;
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "cookie_banner_enabled" boolean DEFAULT true;
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "cookie_banner_text" varchar DEFAULT 'Мы используем cookie для аналитики и улучшения работы сайта. Вы можете принять или отклонить использование cookie.';
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "cookie_policy_path" varchar DEFAULT '/privacy/';
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "medical_disclaimer_enabled" boolean DEFAULT true;
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "medical_disclaimer_text" varchar DEFAULT 'Имеются противопоказания. Необходима консультация специалиста.';

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'site_settings_license_file_id_media_id_fk'
      ) THEN
        ALTER TABLE "site_settings"
          ADD CONSTRAINT "site_settings_license_file_id_media_id_fk"
          FOREIGN KEY ("license_file_id")
          REFERENCES "public"."media"("id")
          ON DELETE set null
          ON UPDATE no action;
      END IF;
    END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "site_settings" DROP CONSTRAINT IF EXISTS "site_settings_license_file_id_media_id_fk";
    ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "medical_disclaimer_text";
    ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "medical_disclaimer_enabled";
    ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "cookie_policy_path";
    ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "cookie_banner_text";
    ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "cookie_banner_enabled";
    ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "license_file_id";
    ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "license_text";
    ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "legal_address";
    ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "legal_ogrn";
    ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "legal_inn";
    ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "legal_name";
    ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "vk_url";
    ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "google_site_verification";
    ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "yandex_verification";
    ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "yandex_metrika_id";
    ALTER TABLE "leads" DROP COLUMN IF EXISTS "consent";
  `)
}
