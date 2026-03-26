/*
  Warnings:

  - A unique constraint covering the columns `[payos_order_code]` on the table `payments` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "payos_order_code" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "payments_payos_order_code_key" ON "payments"("payos_order_code");
