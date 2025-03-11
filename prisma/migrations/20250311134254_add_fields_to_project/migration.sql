/*
  Warnings:

  - The values [draft,in_progress,ready] on the enum `ProjectStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [private,public] on the enum `ProjectVisibility` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `description` on the `Project` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ProjectStatus_new" AS ENUM ('DRAFT', 'PROGRESS', 'PENDING', 'COMPLETED', 'ERROR');
ALTER TABLE "Project" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Project" ALTER COLUMN "status" TYPE "ProjectStatus_new" USING ("status"::text::"ProjectStatus_new");
ALTER TYPE "ProjectStatus" RENAME TO "ProjectStatus_old";
ALTER TYPE "ProjectStatus_new" RENAME TO "ProjectStatus";
DROP TYPE "ProjectStatus_old";
ALTER TABLE "Project" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "ProjectVisibility_new" AS ENUM ('PRIVATE', 'PUBLIC');
ALTER TABLE "Project" ALTER COLUMN "visibility" DROP DEFAULT;
ALTER TABLE "Project" ALTER COLUMN "visibility" TYPE "ProjectVisibility_new" USING ("visibility"::text::"ProjectVisibility_new");
ALTER TYPE "ProjectVisibility" RENAME TO "ProjectVisibility_old";
ALTER TYPE "ProjectVisibility_new" RENAME TO "ProjectVisibility";
DROP TYPE "ProjectVisibility_old";
ALTER TABLE "Project" ALTER COLUMN "visibility" SET DEFAULT 'PRIVATE';
COMMIT;

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "description",
ADD COLUMN     "ai_address" TEXT,
ADD COLUMN     "ai_city" TEXT,
ADD COLUMN     "ai_country" TEXT,
ADD COLUMN     "ai_zip_code" TEXT,
ADD COLUMN     "long_summary" TEXT,
ADD COLUMN     "short_summary" TEXT,
ALTER COLUMN "visibility" SET DEFAULT 'PRIVATE',
ALTER COLUMN "status" SET DEFAULT 'DRAFT';
