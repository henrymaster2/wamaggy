ALTER TABLE "Order"
ADD COLUMN "paymentType" TEXT NOT NULL DEFAULT 'CASH',
ADD COLUMN "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN "mpesaCheckoutRequestId" TEXT,
ADD COLUMN "mpesaMerchantRequestId" TEXT,
ADD COLUMN "mpesaReceiptNumber" TEXT,
ADD COLUMN "mpesaPhone" TEXT;
