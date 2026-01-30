/*
  Warnings:

  - Added the required column `updatedAt` to the `Food` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Food" ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'Food',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "variations" JSONB,
ALTER COLUMN "status" SET DEFAULT 'Available';
