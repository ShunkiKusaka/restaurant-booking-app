-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN     "geocodedAddress" TEXT,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;
