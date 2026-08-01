-- AlterTable
ALTER TABLE "draw_winners" ADD COLUMN     "event_prize_id" UUID,
ADD COLUMN     "prize_id" UUID,
ADD COLUMN     "prize_name" TEXT;

-- CreateTable
CREATE TABLE "prizes" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image_url" TEXT,
    "value_cents" INTEGER,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "prizes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_prizes" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "prize_id" UUID NOT NULL,
    "rank" INTEGER NOT NULL,

    CONSTRAINT "event_prizes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "prizes_tenant_id_deleted_at_idx" ON "prizes"("tenant_id", "deleted_at");

-- CreateIndex
CREATE INDEX "event_prizes_tenant_id_event_id_idx" ON "event_prizes"("tenant_id", "event_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_prizes_event_id_rank_key" ON "event_prizes"("event_id", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "event_prizes_event_id_prize_id_key" ON "event_prizes"("event_id", "prize_id");

-- AddForeignKey
ALTER TABLE "event_prizes" ADD CONSTRAINT "event_prizes_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_prizes" ADD CONSTRAINT "event_prizes_prize_id_fkey" FOREIGN KEY ("prize_id") REFERENCES "prizes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draw_winners" ADD CONSTRAINT "draw_winners_event_prize_id_fkey" FOREIGN KEY ("event_prize_id") REFERENCES "event_prizes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draw_winners" ADD CONSTRAINT "draw_winners_prize_id_fkey" FOREIGN KEY ("prize_id") REFERENCES "prizes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
