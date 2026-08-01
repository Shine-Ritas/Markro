-- CreateEnum
CREATE TYPE "DrawSessionStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DrawSelectionMethod" AS ENUM ('RANDOM', 'MANUAL');

-- AlterEnum
ALTER TYPE "EventStatus" ADD VALUE 'COMPLETED';

-- AlterEnum
ALTER TYPE "TicketStatus" ADD VALUE 'WINNER';

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "draw_completed_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "draw_sessions" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "status" "DrawSessionStatus" NOT NULL DEFAULT 'PENDING',
    "winner_count" INTEGER NOT NULL,
    "eligible_count" INTEGER NOT NULL DEFAULT 0,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "actor_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "draw_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "draw_winners" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "draw_session_id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "ticket_id" UUID NOT NULL,
    "rank" INTEGER NOT NULL,
    "tier" INTEGER,
    "selection_method" "DrawSelectionMethod" NOT NULL,
    "user_id" UUID,
    "customer_id" UUID,
    "buyer_name" TEXT,
    "buyer_phone" TEXT,
    "buyer_email" TEXT,
    "selected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actor_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "draw_winners_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "draw_sessions_tenant_id_event_id_idx" ON "draw_sessions"("tenant_id", "event_id");

-- CreateIndex
CREATE INDEX "draw_sessions_event_id_status_idx" ON "draw_sessions"("event_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "draw_winners_ticket_id_key" ON "draw_winners"("ticket_id");

-- CreateIndex
CREATE INDEX "draw_winners_tenant_id_event_id_idx" ON "draw_winners"("tenant_id", "event_id");

-- CreateIndex
CREATE INDEX "draw_winners_tenant_id_selected_at_idx" ON "draw_winners"("tenant_id", "selected_at");

-- CreateIndex
CREATE UNIQUE INDEX "draw_winners_draw_session_id_rank_key" ON "draw_winners"("draw_session_id", "rank");

-- AddForeignKey
ALTER TABLE "draw_sessions" ADD CONSTRAINT "draw_sessions_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draw_sessions" ADD CONSTRAINT "draw_sessions_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draw_winners" ADD CONSTRAINT "draw_winners_draw_session_id_fkey" FOREIGN KEY ("draw_session_id") REFERENCES "draw_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draw_winners" ADD CONSTRAINT "draw_winners_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draw_winners" ADD CONSTRAINT "draw_winners_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draw_winners" ADD CONSTRAINT "draw_winners_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
