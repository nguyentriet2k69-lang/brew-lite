ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'STAFF';
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "isAvailable" BOOLEAN NOT NULL DEFAULT true;
CREATE TABLE IF NOT EXISTS "ProductOption" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "ProductOption_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ProductOption_productId_type_name_key" ON "ProductOption"("productId", "type", "name");
CREATE INDEX IF NOT EXISTS "ProductOption_productId_type_idx" ON "ProductOption"("productId", "type");
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ProductOption_productId_fkey'
  ) THEN
    ALTER TABLE "ProductOption"
      ADD CONSTRAINT "ProductOption_productId_fkey"
      FOREIGN KEY ("productId") REFERENCES "Product"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "provider" TEXT NOT NULL DEFAULT 'mock';
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "transactionId" TEXT;
