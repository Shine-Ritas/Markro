-- CreateEnum
CREATE TYPE "DrawOrder" AS ENUM ('HIGH_TO_LOW', 'LOW_TO_HIGH');

-- AlterTable
ALTER TABLE "events" ADD COLUMN "draw_order" "DrawOrder" NOT NULL DEFAULT 'HIGH_TO_LOW';

-- AlterTable
ALTER TABLE "draw_sessions" ADD COLUMN "draw_order" "DrawOrder" NOT NULL DEFAULT 'HIGH_TO_LOW';
