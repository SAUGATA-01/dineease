-- AlterTable
ALTER TABLE "Otp" ADD COLUMN     "email" TEXT;

-- CreateIndex
CREATE INDEX "Otp_email_idx" ON "Otp"("email");
