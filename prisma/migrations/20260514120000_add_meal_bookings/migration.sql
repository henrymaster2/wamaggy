CREATE TABLE "MealBooking" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "time" TEXT NOT NULL,
    "guests" INTEGER NOT NULL,
    "preferences" TEXT,
    "status" TEXT NOT NULL DEFAULT 'BOOKED',
    "customerName" TEXT,
    "customerPhone" TEXT,
    "customerEmail" TEXT,
    "userId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MealBooking_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "MealBooking" ADD CONSTRAINT "MealBooking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
