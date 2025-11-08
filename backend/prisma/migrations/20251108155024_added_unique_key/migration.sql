/*
  Warnings:

  - A unique constraint covering the columns `[userId,serverId,roleId]` on the table `Invoice` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Invoice_userId_serverId_roleId_key" ON "Invoice"("userId", "serverId", "roleId");
