-- CreateEnum
CREATE TYPE "TicketListView" AS ENUM ('GRID', 'COMPACT', 'SHOWCASE', 'TABLE');

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "ticket_design_id" UUID,
ADD COLUMN     "ticket_list_view_default" "TicketListView" NOT NULL DEFAULT 'GRID';

-- CreateTable
CREATE TABLE "ticket_design_presets" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "preview_url" TEXT,
    "theme" JSONB NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ticket_design_presets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ticket_design_presets_slug_key" ON "ticket_design_presets"("slug");

-- CreateIndex
CREATE INDEX "events_ticket_design_id_idx" ON "events"("ticket_design_id");

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_ticket_design_id_fkey" FOREIGN KEY ("ticket_design_id") REFERENCES "ticket_design_presets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
