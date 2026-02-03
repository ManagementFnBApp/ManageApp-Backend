/*
  Warnings:

  - The primary key for the `admins` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `admin_id` column on the `admins` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `manager_id` column on the `admins` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `customers` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `customer_id` column on the `customers` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `inventories` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `inventory_id` column on the `inventories` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `inventory_items` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `inventory_item_id` column on the `inventory_items` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `inventory_traits` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `inv_trait_id` column on the `inventory_traits` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `merchandise_redemptions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `merchandis_re_id` column on the `merchandise_redemptions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `merchandises` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `merchandise_id` column on the `merchandises` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `order_items` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `order_item_id` column on the `order_items` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `orders` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `order_id` column on the `orders` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `customer_id` column on the `orders` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `payments` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `payment_id` column on the `payments` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `product_categories` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `category_id` column on the `product_categories` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `par_category_id` column on the `product_categories` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `products` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `product_id` column on the `products` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `roles` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `role_id` column on the `roles` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `shift_cashiers` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `shifts` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `shift_id` column on the `shifts` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `shop_owners` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `owner_id` column on the `shop_owners` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `owner_manager_id` column on the `shop_owners` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `shops` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `shop_id` column on the `shops` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `subscription_payments` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `sub_payment_id` column on the `subscription_payments` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `subscription_tenants` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `sub_tenant_id` column on the `subscription_tenants` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `subscriptions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `subscription_id` column on the `subscriptions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `tenants` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `tenant_id` column on the `tenants` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `users` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `user_id` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `shop_id` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `tenant_id` on the `customers` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `shop_id` on the `inventories` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `product_id` on the `inventory_items` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `inventory_id` on the `inventory_items` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `inventory_item_id` on the `inventory_traits` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `created_by` on the `inventory_traits` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `customer_id` on the `merchandise_redemptions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `merchandise_id` on the `merchandise_redemptions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `shop_id` on the `merchandise_redemptions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `shop_id` on the `merchandises` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `product_id` on the `order_items` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `order_id` on the `order_items` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `shift_id` on the `orders` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `cashier_id` on the `orders` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `order_id` on the `payments` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `tenant_id` on the `product_categories` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `category_id` on the `products` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `shift_id` on the `shift_cashiers` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `cashier_id` on the `shift_cashiers` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `shop_id` on the `shifts` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `shop_id` on the `shop_owners` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `user_id` on the `shop_owners` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `tenant_id` on the `shops` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `sub_tenant_id` on the `subscription_payments` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `subscription_id` on the `subscription_tenants` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `tenant_id` on the `subscription_tenants` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `admin_id` on the `tenants` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `tenant_id` on the `users` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `role_id` on the `users` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "customers" DROP CONSTRAINT "customers_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "inventories" DROP CONSTRAINT "inventories_shop_id_fkey";

-- DropForeignKey
ALTER TABLE "inventory_items" DROP CONSTRAINT "inventory_items_inventory_id_fkey";

-- DropForeignKey
ALTER TABLE "inventory_items" DROP CONSTRAINT "inventory_items_product_id_fkey";

-- DropForeignKey
ALTER TABLE "inventory_traits" DROP CONSTRAINT "inventory_traits_inventory_item_id_fkey";

-- DropForeignKey
ALTER TABLE "merchandise_redemptions" DROP CONSTRAINT "merchandise_redemptions_customer_id_fkey";

-- DropForeignKey
ALTER TABLE "merchandise_redemptions" DROP CONSTRAINT "merchandise_redemptions_merchandise_id_fkey";

-- DropForeignKey
ALTER TABLE "merchandises" DROP CONSTRAINT "merchandises_shop_id_fkey";

-- DropForeignKey
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_order_id_fkey";

-- DropForeignKey
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_product_id_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_customer_id_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_shift_id_fkey";

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_order_id_fkey";

-- DropForeignKey
ALTER TABLE "product_categories" DROP CONSTRAINT "product_categories_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_category_id_fkey";

-- DropForeignKey
ALTER TABLE "shift_cashiers" DROP CONSTRAINT "shift_cashiers_shift_id_fkey";

-- DropForeignKey
ALTER TABLE "shifts" DROP CONSTRAINT "shifts_shop_id_fkey";

-- DropForeignKey
ALTER TABLE "shop_owners" DROP CONSTRAINT "shop_owners_shop_id_fkey";

-- DropForeignKey
ALTER TABLE "shop_owners" DROP CONSTRAINT "shop_owners_user_id_fkey";

-- DropForeignKey
ALTER TABLE "shops" DROP CONSTRAINT "shops_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "subscription_payments" DROP CONSTRAINT "subscription_payments_sub_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "subscription_tenants" DROP CONSTRAINT "subscription_tenants_subscription_id_fkey";

-- DropForeignKey
ALTER TABLE "subscription_tenants" DROP CONSTRAINT "subscription_tenants_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "tenants" DROP CONSTRAINT "tenants_admin_id_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_role_id_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_shop_id_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_tenant_id_fkey";

-- AlterTable
ALTER TABLE "admins" DROP CONSTRAINT "admins_pkey",
DROP COLUMN "admin_id",
ADD COLUMN     "admin_id" SERIAL NOT NULL,
DROP COLUMN "manager_id",
ADD COLUMN     "manager_id" INTEGER,
ADD CONSTRAINT "admins_pkey" PRIMARY KEY ("admin_id");

-- AlterTable
ALTER TABLE "customers" DROP CONSTRAINT "customers_pkey",
DROP COLUMN "customer_id",
ADD COLUMN     "customer_id" SERIAL NOT NULL,
DROP COLUMN "tenant_id",
ADD COLUMN     "tenant_id" INTEGER NOT NULL,
ADD CONSTRAINT "customers_pkey" PRIMARY KEY ("customer_id");

-- AlterTable
ALTER TABLE "inventories" DROP CONSTRAINT "inventories_pkey",
DROP COLUMN "inventory_id",
ADD COLUMN     "inventory_id" SERIAL NOT NULL,
DROP COLUMN "shop_id",
ADD COLUMN     "shop_id" INTEGER NOT NULL,
ADD CONSTRAINT "inventories_pkey" PRIMARY KEY ("inventory_id");

-- AlterTable
ALTER TABLE "inventory_items" DROP CONSTRAINT "inventory_items_pkey",
DROP COLUMN "inventory_item_id",
ADD COLUMN     "inventory_item_id" SERIAL NOT NULL,
DROP COLUMN "product_id",
ADD COLUMN     "product_id" INTEGER NOT NULL,
DROP COLUMN "inventory_id",
ADD COLUMN     "inventory_id" INTEGER NOT NULL,
ADD CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("inventory_item_id");

-- AlterTable
ALTER TABLE "inventory_traits" DROP CONSTRAINT "inventory_traits_pkey",
DROP COLUMN "inv_trait_id",
ADD COLUMN     "inv_trait_id" SERIAL NOT NULL,
DROP COLUMN "inventory_item_id",
ADD COLUMN     "inventory_item_id" INTEGER NOT NULL,
DROP COLUMN "created_by",
ADD COLUMN     "created_by" INTEGER NOT NULL,
ADD CONSTRAINT "inventory_traits_pkey" PRIMARY KEY ("inv_trait_id");

-- AlterTable
ALTER TABLE "merchandise_redemptions" DROP CONSTRAINT "merchandise_redemptions_pkey",
DROP COLUMN "merchandis_re_id",
ADD COLUMN     "merchandis_re_id" SERIAL NOT NULL,
DROP COLUMN "customer_id",
ADD COLUMN     "customer_id" INTEGER NOT NULL,
DROP COLUMN "merchandise_id",
ADD COLUMN     "merchandise_id" INTEGER NOT NULL,
DROP COLUMN "shop_id",
ADD COLUMN     "shop_id" INTEGER NOT NULL,
ADD CONSTRAINT "merchandise_redemptions_pkey" PRIMARY KEY ("merchandis_re_id");

-- AlterTable
ALTER TABLE "merchandises" DROP CONSTRAINT "merchandises_pkey",
DROP COLUMN "merchandise_id",
ADD COLUMN     "merchandise_id" SERIAL NOT NULL,
DROP COLUMN "shop_id",
ADD COLUMN     "shop_id" INTEGER NOT NULL,
ADD CONSTRAINT "merchandises_pkey" PRIMARY KEY ("merchandise_id");

-- AlterTable
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_pkey",
DROP COLUMN "order_item_id",
ADD COLUMN     "order_item_id" SERIAL NOT NULL,
DROP COLUMN "product_id",
ADD COLUMN     "product_id" INTEGER NOT NULL,
DROP COLUMN "order_id",
ADD COLUMN     "order_id" INTEGER NOT NULL,
ADD CONSTRAINT "order_items_pkey" PRIMARY KEY ("order_item_id");

-- AlterTable
ALTER TABLE "orders" DROP CONSTRAINT "orders_pkey",
DROP COLUMN "order_id",
ADD COLUMN     "order_id" SERIAL NOT NULL,
DROP COLUMN "shift_id",
ADD COLUMN     "shift_id" INTEGER NOT NULL,
DROP COLUMN "cashier_id",
ADD COLUMN     "cashier_id" INTEGER NOT NULL,
DROP COLUMN "customer_id",
ADD COLUMN     "customer_id" INTEGER,
ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("order_id");

-- AlterTable
ALTER TABLE "payments" DROP CONSTRAINT "payments_pkey",
DROP COLUMN "payment_id",
ADD COLUMN     "payment_id" SERIAL NOT NULL,
DROP COLUMN "order_id",
ADD COLUMN     "order_id" INTEGER NOT NULL,
ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("payment_id");

-- AlterTable
ALTER TABLE "product_categories" DROP CONSTRAINT "product_categories_pkey",
DROP COLUMN "category_id",
ADD COLUMN     "category_id" SERIAL NOT NULL,
DROP COLUMN "par_category_id",
ADD COLUMN     "par_category_id" INTEGER,
DROP COLUMN "tenant_id",
ADD COLUMN     "tenant_id" INTEGER NOT NULL,
ADD CONSTRAINT "product_categories_pkey" PRIMARY KEY ("category_id");

-- AlterTable
ALTER TABLE "products" DROP CONSTRAINT "products_pkey",
DROP COLUMN "product_id",
ADD COLUMN     "product_id" SERIAL NOT NULL,
DROP COLUMN "category_id",
ADD COLUMN     "category_id" INTEGER NOT NULL,
ADD CONSTRAINT "products_pkey" PRIMARY KEY ("product_id");

-- AlterTable
ALTER TABLE "roles" DROP CONSTRAINT "roles_pkey",
DROP COLUMN "role_id",
ADD COLUMN     "role_id" SERIAL NOT NULL,
ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("role_id");

-- AlterTable
ALTER TABLE "shift_cashiers" DROP CONSTRAINT "shift_cashiers_pkey",
DROP COLUMN "shift_id",
ADD COLUMN     "shift_id" INTEGER NOT NULL,
DROP COLUMN "cashier_id",
ADD COLUMN     "cashier_id" INTEGER NOT NULL,
ADD CONSTRAINT "shift_cashiers_pkey" PRIMARY KEY ("shift_id", "cashier_id");

-- AlterTable
ALTER TABLE "shifts" DROP CONSTRAINT "shifts_pkey",
DROP COLUMN "shift_id",
ADD COLUMN     "shift_id" SERIAL NOT NULL,
DROP COLUMN "shop_id",
ADD COLUMN     "shop_id" INTEGER NOT NULL,
ADD CONSTRAINT "shifts_pkey" PRIMARY KEY ("shift_id");

-- AlterTable
ALTER TABLE "shop_owners" DROP CONSTRAINT "shop_owners_pkey",
DROP COLUMN "owner_id",
ADD COLUMN     "owner_id" SERIAL NOT NULL,
DROP COLUMN "owner_manager_id",
ADD COLUMN     "owner_manager_id" INTEGER,
DROP COLUMN "shop_id",
ADD COLUMN     "shop_id" INTEGER NOT NULL,
DROP COLUMN "user_id",
ADD COLUMN     "user_id" INTEGER NOT NULL,
ADD CONSTRAINT "shop_owners_pkey" PRIMARY KEY ("owner_id");

-- AlterTable
ALTER TABLE "shops" DROP CONSTRAINT "shops_pkey",
DROP COLUMN "shop_id",
ADD COLUMN     "shop_id" SERIAL NOT NULL,
DROP COLUMN "tenant_id",
ADD COLUMN     "tenant_id" INTEGER NOT NULL,
ADD CONSTRAINT "shops_pkey" PRIMARY KEY ("shop_id");

-- AlterTable
ALTER TABLE "subscription_payments" DROP CONSTRAINT "subscription_payments_pkey",
DROP COLUMN "sub_payment_id",
ADD COLUMN     "sub_payment_id" SERIAL NOT NULL,
DROP COLUMN "sub_tenant_id",
ADD COLUMN     "sub_tenant_id" INTEGER NOT NULL,
ADD CONSTRAINT "subscription_payments_pkey" PRIMARY KEY ("sub_payment_id");

-- AlterTable
ALTER TABLE "subscription_tenants" DROP CONSTRAINT "subscription_tenants_pkey",
DROP COLUMN "sub_tenant_id",
ADD COLUMN     "sub_tenant_id" SERIAL NOT NULL,
DROP COLUMN "subscription_id",
ADD COLUMN     "subscription_id" INTEGER NOT NULL,
DROP COLUMN "tenant_id",
ADD COLUMN     "tenant_id" INTEGER NOT NULL,
ADD CONSTRAINT "subscription_tenants_pkey" PRIMARY KEY ("sub_tenant_id");

-- AlterTable
ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_pkey",
DROP COLUMN "subscription_id",
ADD COLUMN     "subscription_id" SERIAL NOT NULL,
ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("subscription_id");

-- AlterTable
ALTER TABLE "tenants" DROP CONSTRAINT "tenants_pkey",
DROP COLUMN "tenant_id",
ADD COLUMN     "tenant_id" SERIAL NOT NULL,
DROP COLUMN "admin_id",
ADD COLUMN     "admin_id" INTEGER NOT NULL,
ADD CONSTRAINT "tenants_pkey" PRIMARY KEY ("tenant_id");

-- AlterTable
ALTER TABLE "users" DROP CONSTRAINT "users_pkey",
DROP COLUMN "user_id",
ADD COLUMN     "user_id" SERIAL NOT NULL,
DROP COLUMN "tenant_id",
ADD COLUMN     "tenant_id" INTEGER NOT NULL,
DROP COLUMN "shop_id",
ADD COLUMN     "shop_id" INTEGER,
DROP COLUMN "role_id",
ADD COLUMN     "role_id" INTEGER NOT NULL,
ADD CONSTRAINT "users_pkey" PRIMARY KEY ("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "shop_owners_user_id_key" ON "shop_owners"("user_id");

-- AddForeignKey
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admins"("admin_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("shop_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("role_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shops" ADD CONSTRAINT "shops_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_owners" ADD CONSTRAINT "shop_owners_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("shop_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_owners" ADD CONSTRAINT "shop_owners_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("shop_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_cashiers" ADD CONSTRAINT "shift_cashiers_shift_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "shifts"("shift_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "product_categories"("category_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventories" ADD CONSTRAINT "inventories_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("shop_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("product_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_inventory_id_fkey" FOREIGN KEY ("inventory_id") REFERENCES "inventories"("inventory_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_traits" ADD CONSTRAINT "inventory_traits_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "inventories"("inventory_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merchandises" ADD CONSTRAINT "merchandises_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("shop_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merchandise_redemptions" ADD CONSTRAINT "merchandise_redemptions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("customer_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merchandise_redemptions" ADD CONSTRAINT "merchandise_redemptions_merchandise_id_fkey" FOREIGN KEY ("merchandise_id") REFERENCES "merchandises"("merchandise_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_shift_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "shifts"("shift_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("customer_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("product_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("order_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("order_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_tenants" ADD CONSTRAINT "subscription_tenants_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("subscription_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_tenants" ADD CONSTRAINT "subscription_tenants_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_payments" ADD CONSTRAINT "subscription_payments_sub_tenant_id_fkey" FOREIGN KEY ("sub_tenant_id") REFERENCES "admins"("admin_id") ON DELETE RESTRICT ON UPDATE CASCADE;
