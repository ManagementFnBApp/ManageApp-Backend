/*
  Warnings:

  - You are about to drop the column `sub_tenant_id` on the `subscription_payments` table. All the data in the column will be lost.
  - Added the required column `sub_shop_id` to the `subscription_payments` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "subscription_payments" DROP CONSTRAINT "subscription_payments_sub_tenant_id_fkey";

-- AlterTable
ALTER TABLE "subscription_payments" DROP COLUMN "sub_tenant_id",
ADD COLUMN     "sub_shop_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "subscription_payments" ADD CONSTRAINT "subscription_payments_sub_shop_id_fkey" FOREIGN KEY ("sub_shop_id") REFERENCES "shop_subscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
