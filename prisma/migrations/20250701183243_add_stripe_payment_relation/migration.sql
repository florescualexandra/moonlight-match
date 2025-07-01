-- DropIndex
DROP INDEX "StripePayment_stripePaymentIntentId_key";

-- AlterTable
ALTER TABLE "StripePayment" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3);
