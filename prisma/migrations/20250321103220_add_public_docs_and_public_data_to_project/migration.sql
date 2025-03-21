-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "publicData" JSONB DEFAULT '{}',
ADD COLUMN     "publicDocuments" JSONB DEFAULT '{}';
