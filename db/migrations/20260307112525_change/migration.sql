/*
  Warnings:

  - You are about to drop the column `end_time` on the `shifts` table. All the data in the column will be lost.
  - You are about to drop the column `shift_status` on the `shifts` table. All the data in the column will be lost.
  - You are about to drop the column `shop_id` on the `shifts` table. All the data in the column will be lost.
  - You are about to drop the column `start_time` on the `shifts` table. All the data in the column will be lost.
  - You are about to drop the `shift_staffs` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[shift_name]` on the table `shifts` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `shift_name` to the `shifts` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "shift_staffs" DROP CONSTRAINT "shift_staffs_shift_id_fkey";

-- DropForeignKey
ALTER TABLE "shift_staffs" DROP CONSTRAINT "shift_staffs_user_id_fkey";

-- DropForeignKey
ALTER TABLE "shifts" DROP CONSTRAINT "shifts_shop_id_fkey";

-- AlterTable
ALTER TABLE "shifts" DROP COLUMN "end_time",
DROP COLUMN "shift_status",
DROP COLUMN "shop_id",
DROP COLUMN "start_time",
ADD COLUMN     "shift_name" TEXT NOT NULL;

-- DropTable
DROP TABLE "shift_staffs";

-- CreateTable
CREATE TABLE "shift_users" (
    "id" SERIAL NOT NULL,
    "shift_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "shop_id" INTEGER NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deactivated_at" TIMESTAMP(3),

    CONSTRAINT "shift_users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shifts_shift_name_key" ON "shifts"("shift_name");

-- AddForeignKey
ALTER TABLE "shift_users" ADD CONSTRAINT "shift_users_shift_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "shifts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_users" ADD CONSTRAINT "shift_users_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_users" ADD CONSTRAINT "shift_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
