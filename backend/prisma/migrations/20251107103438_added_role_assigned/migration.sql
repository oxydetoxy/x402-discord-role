/*
  Warnings:

  - Added the required column `roleApplicableTime` to the `Channel` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Channel" ADD COLUMN     "roleApplicableTime" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "RoleAssigned" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "expiryTime" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoleAssigned_pkey" PRIMARY KEY ("id")
);
