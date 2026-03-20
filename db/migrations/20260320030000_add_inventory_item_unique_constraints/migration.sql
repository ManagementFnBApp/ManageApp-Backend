-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_inventory_id_product_id_key" ON "inventory_items"("inventory_id", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_inventory_id_shop_product_id_key" ON "inventory_items"("inventory_id", "shop_product_id");
