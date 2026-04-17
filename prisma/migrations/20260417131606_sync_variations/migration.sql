/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Food` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Food" ALTER COLUMN "variations" SET DEFAULT '[]';

-- CreateIndex
CREATE UNIQUE INDEX "Food_name_key" ON "Food"("name");
