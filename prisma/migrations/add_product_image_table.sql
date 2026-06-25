-- Migration: add_product_image_table
-- Generated manually (no live DB connection available for prisma migrate dev).
-- Run EITHER:
--   npm run db:push          (dev only — applies schema without a migration file)
--   psql $DATABASE_URL -f prisma/migrations/add_product_image_table.sql   (tracked)
--
-- If you want Prisma's migration history going forward, after running this SQL:
--   npx prisma migrate resolve --applied add_product_image_table
-- That registers this file in the _prisma_migrations table so future
-- `prisma migrate dev` runs don't try to re-apply it.

-- 1. ProductStatus enum (used by the Product table)
DO $$ BEGIN
  CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'PUBLISHED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. New columns on Product
ALTER TABLE "Product"
  ADD COLUMN IF NOT EXISTS "sku"            TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS "status"         "ProductStatus" NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN IF NOT EXISTS "seoTitle"       TEXT,
  ADD COLUMN IF NOT EXISTS "seoDescription" TEXT,
  ADD COLUMN IF NOT EXISTS "deletedAt"      TIMESTAMP(3);

-- Drop the old flat image column (data already migrated to ProductImage rows
-- via npm run db:seed -- see prisma/seed.ts).
-- Uncomment only after confirming ProductImage rows exist for every product.
-- ALTER TABLE "Product" DROP COLUMN IF EXISTS "image";

-- 3. Indexes on Product
CREATE INDEX IF NOT EXISTS "Product_status_idx"    ON "Product"("status");
CREATE INDEX IF NOT EXISTS "Product_deletedAt_idx" ON "Product"("deletedAt");

-- 4. ProductImage table
CREATE TABLE IF NOT EXISTS "ProductImage" (
  "id"         TEXT         NOT NULL,
  "productId"  TEXT         NOT NULL,
  "url"        TEXT         NOT NULL,
  "sortOrder"  INTEGER      NOT NULL DEFAULT 0,
  "isFeatured" BOOLEAN      NOT NULL DEFAULT false,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ProductImage_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "ProductImage_productId_idx" ON "ProductImage"("productId");

-- 5. Backfill: create one ProductImage row per product that still has the
--    old flat image column but no ProductImage rows yet.
--    Safe to run multiple times (the WHERE NOT EXISTS guard).
INSERT INTO "ProductImage" ("id", "productId", "url", "sortOrder", "isFeatured", "createdAt")
SELECT
  gen_random_uuid()::text,
  p."id",
  p."image",          -- old column
  0,
  true,
  NOW()
FROM "Product" p
WHERE
  p."image" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "ProductImage" pi WHERE pi."productId" = p."id"
  );
