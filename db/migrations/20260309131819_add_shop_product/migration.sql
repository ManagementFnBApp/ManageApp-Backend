-- DropForeignKey
ALTER TABLE "inventory_items" DROP CONSTRAINT "inventory_items_product_id_fkey";

-- DropForeignKey
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_product_id_fkey";

-- AlterTable
ALTER TABLE "inventory_items" ADD COLUMN     "shop_product_id" INTEGER,
ALTER COLUMN "product_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "shop_product_id" INTEGER,
ALTER COLUMN "product_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "shop_products" (
    "id" SERIAL NOT NULL,
    "category_id" INTEGER NOT NULL,
    "shop_id" INTEGER NOT NULL,
    "product_name" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "barcode" TEXT,
    "description" TEXT,
    "measure_unit" TEXT,
    "import_price" DECIMAL(10,2) NOT NULL,
    "list_price" DECIMAL(10,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shop_products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shop_products_shop_id_image_key" ON "shop_products"("shop_id", "image");

-- CreateIndex
CREATE UNIQUE INDEX "shop_products_shop_id_barcode_key" ON "shop_products"("shop_id", "barcode");

-- AddForeignKey
ALTER TABLE "shop_products" ADD CONSTRAINT "shop_products_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_products" ADD CONSTRAINT "shop_products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_shop_product_id_fkey" FOREIGN KEY ("shop_product_id") REFERENCES "shop_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_shop_product_id_fkey" FOREIGN KEY ("shop_product_id") REFERENCES "shop_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
