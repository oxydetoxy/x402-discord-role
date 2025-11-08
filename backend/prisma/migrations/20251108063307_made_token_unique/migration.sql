/*
  Warnings:

  - You are about to drop the column `totalCostInUsdc` on the `Invoice` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[token]` on the table `Invoice` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "totalCostInUsdc";

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_token_key" ON "Invoice"("token");
