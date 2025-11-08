/*
  Warnings:

  - The `roleApplicableTime` column on the `Channel` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Channel" DROP COLUMN "roleApplicableTime",
ADD COLUMN     "roleApplicableTime" INTEGER[];
