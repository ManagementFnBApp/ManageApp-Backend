/*
  Warnings:

  - You are about to drop the column `description` on the `roles` table. All the data in the column will be lost.
  - You are about to drop the column `permissions` on the `roles` table. All the data in the column will be lost.
  - You are about to drop the column `role_code` on the `roles` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[role]` on the table `roles` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `role` to the `roles` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "roles_role_code_key";

-- AlterTable
ALTER TABLE "roles" DROP COLUMN "description",
DROP COLUMN "permissions",
DROP COLUMN "role_code",
ADD COLUMN     "role" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "roles_role_key" ON "roles"("role");
