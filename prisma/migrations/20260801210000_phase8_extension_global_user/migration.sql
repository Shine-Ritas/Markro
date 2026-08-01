-- AlterTable
ALTER TABLE "users" ADD COLUMN "global_user_code" TEXT,
ADD COLUMN "phone" TEXT,
ADD COLUMN "phone_verified_at" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "users_global_user_code_key" ON "users"("global_user_code");

-- CreateIndex
CREATE INDEX "users_phone_idx" ON "users"("phone");

-- CreateTable
CREATE TABLE "phone_verifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "phone" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "phone_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "phone_verifications_user_id_phone_idx" ON "phone_verifications"("user_id", "phone");

-- CreateIndex
CREATE INDEX "phone_verifications_expires_at_idx" ON "phone_verifications"("expires_at");

-- AddForeignKey
ALTER TABLE "phone_verifications" ADD CONSTRAINT "phone_verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
