/*
  Warnings:

  - You are about to drop the column `role` on the `roles` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[role_code]` on the table `roles` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `role_code` to the `roles` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "roles_role_key";

-- AlterTable
ALTER TABLE "roles" DROP COLUMN "role",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "permissions" JSONB,
ADD COLUMN     "role_code" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "roles_role_code_key" ON "roles"("role_code");
