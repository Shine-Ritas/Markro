-- CreateEnum
CREATE TYPE "PosSaleStatus" AS ENUM ('DRAFT', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "pos_sales" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "status" "PosSaleStatus" NOT NULL DEFAULT 'DRAFT',
    "customer_name" TEXT,
    "customer_phone" TEXT,
    "customer_email" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "total_cents" INTEGER NOT NULL DEFAULT 0,
    "receipt_number" TEXT,
    "actor_id" UUID,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pos_sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_sale_lines" (
    "id" UUID NOT NULL,
    "pos_sale_id" UUID NOT NULL,
    "ticket_id" UUID NOT NULL,
    "price_cents" INTEGER NOT NULL,

    CONSTRAINT "pos_sale_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pos_sales_tenant_id_status_created_at_idx" ON "pos_sales"("tenant_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "pos_sales_tenant_id_event_id_idx" ON "pos_sales"("tenant_id", "event_id");

-- CreateIndex
CREATE INDEX "pos_sales_tenant_id_completed_at_idx" ON "pos_sales"("tenant_id", "completed_at");

-- CreateIndex
CREATE UNIQUE INDEX "pos_sale_lines_pos_sale_id_ticket_id_key" ON "pos_sale_lines"("pos_sale_id", "ticket_id");

-- CreateIndex
CREATE INDEX "pos_sale_lines_ticket_id_idx" ON "pos_sale_lines"("ticket_id");

-- AddForeignKey
ALTER TABLE "pos_sales" ADD CONSTRAINT "pos_sales_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_sales" ADD CONSTRAINT "pos_sales_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_sale_lines" ADD CONSTRAINT "pos_sale_lines_pos_sale_id_fkey" FOREIGN KEY ("pos_sale_id") REFERENCES "pos_sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_sale_lines" ADD CONSTRAINT "pos_sale_lines_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
