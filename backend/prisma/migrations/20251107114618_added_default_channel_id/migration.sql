/*
  Warnings:

  - Added the required column `defaultChannelId` to the `Server` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Server" ADD COLUMN     "defaultChannelId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "RoleAssigned_expiryTime_idx" ON "RoleAssigned"("expiryTime");
