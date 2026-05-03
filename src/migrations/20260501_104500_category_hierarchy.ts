import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "parent_id" integer;
    ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "sort_order" numeric DEFAULT 1000;
    ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
    CREATE INDEX IF NOT EXISTS "categories_parent_idx" ON "categories" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "categories_sort_order_idx" ON "categories" USING btree ("sort_order");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "categories_sort_order_idx";
    DROP INDEX IF EXISTS "categories_parent_idx";
    ALTER TABLE "categories" DROP CONSTRAINT IF EXISTS "categories_parent_id_categories_id_fk";
    ALTER TABLE "categories" DROP COLUMN IF EXISTS "sort_order";
    ALTER TABLE "categories" DROP COLUMN IF EXISTS "parent_id";
  `)
}
