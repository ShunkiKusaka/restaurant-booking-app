-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "code" TEXT,
ADD COLUMN     "guestName" TEXT,
ADD COLUMN     "guestPhone" TEXT,
ADD COLUMN     "note" TEXT,
ADD COLUMN     "occasion" TEXT,
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'web',
ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN     "bookingDeadlineMinutes" INTEGER NOT NULL DEFAULT 60,
ADD COLUMN     "cancelDeadlineHours" INTEGER NOT NULL DEFAULT 24,
ADD COLUMN     "closedWeekdays" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN     "genre" TEXT,
ADD COLUMN     "lastBookingTime" TEXT NOT NULL DEFAULT '21:00',
ADD COLUMN     "maxPartySize" INTEGER NOT NULL DEFAULT 8,
ADD COLUMN     "openTime" TEXT NOT NULL DEFAULT '17:00',
ADD COLUMN     "stayMinutes" INTEGER NOT NULL DEFAULT 120;

-- Backfill: 既存の予約にも予約番号を付ける
UPDATE "Reservation" SET "code" = upper(substr(md5(random()::text || "id"), 1, 8)) WHERE "code" IS NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_code_key" ON "Reservation"("code");

-- CreateIndex
CREATE INDEX "Reservation_restaurantId_reservationDate_idx" ON "Reservation"("restaurantId", "reservationDate");
