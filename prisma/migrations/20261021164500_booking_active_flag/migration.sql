/*
  Warnings:

  - A unique constraint covering the columns `[tableId,slotId,date,isActive]` on the table `Booking` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Booking_tableId_slotId_date_key";

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "isActive" BOOLEAN DEFAULT true;

-- CreateIndex
CREATE UNIQUE INDEX "Booking_tableId_slotId_date_isActive_key" ON "Booking"("tableId", "slotId", "date", "isActive");
