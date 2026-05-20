-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('AVAILABLE', 'SOLD', 'VALIDATED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TicketTransactionType" AS ENUM ('GENERATED', 'SALE', 'VALIDATION', 'REFUND');

-- CreateTable
CREATE TABLE "ticket_types" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "ticket_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_price_periods" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "ticket_type_id" UUID,
    "label" TEXT,
    "price_cents" INTEGER NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ticket_price_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "ticket_type_id" UUID,
    "ticket_number" TEXT NOT NULL,
    "price_cents" INTEGER NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'AVAILABLE',
    "qr_token" TEXT NOT NULL,
    "sold_at" TIMESTAMP(3),
    "validated_at" TIMESTAMP(3),
    "last_scanned_at" TIMESTAMP(3),
    "scan_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_transactions" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "ticket_id" UUID NOT NULL,
    "type" "TicketTransactionType" NOT NULL,
    "amount_cents" INTEGER,
    "note" TEXT,
    "actor_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ticket_types_tenant_id_event_id_idx" ON "ticket_types"("tenant_id", "event_id");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_types_event_id_slug_key" ON "ticket_types"("event_id", "slug");

-- CreateIndex
CREATE INDEX "ticket_price_periods_event_id_starts_at_ends_at_idx" ON "ticket_price_periods"("event_id", "starts_at", "ends_at");

-- CreateIndex
CREATE INDEX "ticket_price_periods_tenant_id_event_id_idx" ON "ticket_price_periods"("tenant_id", "event_id");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_qr_token_key" ON "tickets"("qr_token");

-- CreateIndex
CREATE INDEX "tickets_tenant_id_event_id_status_idx" ON "tickets"("tenant_id", "event_id", "status");

-- CreateIndex
CREATE INDEX "tickets_event_id_deleted_at_idx" ON "tickets"("event_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_event_id_ticket_number_key" ON "tickets"("event_id", "ticket_number");

-- CreateIndex
CREATE INDEX "ticket_transactions_ticket_id_created_at_idx" ON "ticket_transactions"("ticket_id", "created_at");

-- CreateIndex
CREATE INDEX "ticket_transactions_tenant_id_created_at_idx" ON "ticket_transactions"("tenant_id", "created_at");

-- AddForeignKey
ALTER TABLE "ticket_types" ADD CONSTRAINT "ticket_types_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_price_periods" ADD CONSTRAINT "ticket_price_periods_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_price_periods" ADD CONSTRAINT "ticket_price_periods_ticket_type_id_fkey" FOREIGN KEY ("ticket_type_id") REFERENCES "ticket_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_ticket_type_id_fkey" FOREIGN KEY ("ticket_type_id") REFERENCES "ticket_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_transactions" ADD CONSTRAINT "ticket_transactions_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_transactions" ADD CONSTRAINT "ticket_transactions_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
