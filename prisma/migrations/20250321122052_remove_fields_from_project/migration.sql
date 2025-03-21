/*
  Warnings:

  - You are about to drop the column `publicData` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `publicDocuments` on the `Project` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Project" DROP COLUMN "publicData",
DROP COLUMN "publicDocuments";
