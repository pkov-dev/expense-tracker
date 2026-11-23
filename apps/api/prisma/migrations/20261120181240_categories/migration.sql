/*
  Warnings:

  - You are about to alter the column `color` on the `categories` table. The data in that column could be lost. The data in that column will be cast from `Text` to `Char(7)`.
  - Made the column `color` on table `categories` required. This step will fail if there are existing NULL values in that column.

*/
-- Backfill: existing categories had an optional color
UPDATE "categories" SET "color" = '#64748b' WHERE "color" IS NULL OR "color" !~ '^#[0-9a-fA-F]{6}$';

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "icon" VARCHAR(50),
ALTER COLUMN "color" SET NOT NULL,
ALTER COLUMN "color" SET DEFAULT '#64748b',
ALTER COLUMN "color" SET DATA TYPE CHAR(7);
