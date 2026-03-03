/*
  Warnings:

  - You are about to drop the `ShopCategory` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ShopCategory" DROP CONSTRAINT "ShopCategory_category_id_fkey";

-- DropForeignKey
ALTER TABLE "ShopCategory" DROP CONSTRAINT "ShopCategory_shop_id_fkey";

-- DropTable
DROP TABLE "ShopCategory";

-- CreateTable
CREATE TABLE "shop_categories" (
    "shop_id" INTEGER NOT NULL,
    "category_id" INTEGER NOT NULL,

    CONSTRAINT "shop_categories_pkey" PRIMARY KEY ("shop_id","category_id")
);

-- AddForeignKey
ALTER TABLE "shop_categories" ADD CONSTRAINT "shop_categories_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_categories" ADD CONSTRAINT "shop_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
