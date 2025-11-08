/*
  Warnings:

  - Added the required column `rpcUrl` to the `Network` table without a default value. This is not possible if the table is not empty.
  - Added the required column `usdcAddress` to the `Network` table without a default value. This is not possible if the table is not empty.
  - Added the required column `usdcDecimals` to the `Network` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Network" ADD COLUMN     "rpcUrl" TEXT NOT NULL,
ADD COLUMN     "usdcAddress" TEXT NOT NULL,
ADD COLUMN     "usdcDecimals" INTEGER NOT NULL;
