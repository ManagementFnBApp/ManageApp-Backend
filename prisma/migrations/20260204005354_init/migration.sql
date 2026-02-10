/*
  Warnings:

  - You are about to drop the column `cashier_id` on the `orders` table. All the data in the column will be lost.
  - The primary key for the `shift_cashiers` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `cashier_id` on the `shift_cashiers` table. All the data in the column will be lost.
  - You are about to drop the `shop_owners` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[tenant_id,email]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenant_id,username]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `user_id` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `shift_cashiers` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "inventory_traits" DROP CONSTRAINT "inventory_traits_inventory_item_id_fkey";

-- DropForeignKey
ALTER TABLE "shop_owners" DROP CONSTRAINT "shop_owners_shop_id_fkey";

-- DropForeignKey
ALTER TABLE "shop_owners" DROP CONSTRAINT "shop_owners_user_id_fkey";

-- DropForeignKey
ALTER TABLE "subscription_payments" DROP CONSTRAINT "subscription_payments_sub_tenant_id_fkey";

-- DropIndex
DROP INDEX "users_email_key";

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "cashier_id",
ADD COLUMN     "user_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "shift_cashiers" DROP CONSTRAINT "shift_cashiers_pkey",
DROP COLUMN "cashier_id",
ADD COLUMN     "user_id" INTEGER NOT NULL,
ADD CONSTRAINT "shift_cashiers_pkey" PRIMARY KEY ("shift_id", "user_id");

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "owner_manager_id" INTEGER;

-- DropTable
DROP TABLE "shop_owners";

-- CreateIndex
CREATE UNIQUE INDEX "users_tenant_id_email_key" ON "users"("tenant_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "users_tenant_id_username_key" ON "users"("tenant_id", "username");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_owner_manager_id_fkey" FOREIGN KEY ("owner_manager_id") REFERENCES "users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "shift_cashiers" ADD CONSTRAINT "shift_cashiers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_traits" ADD CONSTRAINT "inventory_traits_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("inventory_item_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_traits" ADD CONSTRAINT "inventory_traits_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_payments" ADD CONSTRAINT "subscription_payments_sub_tenant_id_fkey" FOREIGN KEY ("sub_tenant_id") REFERENCES "subscription_tenants"("sub_tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;
