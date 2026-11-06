-- CreateTable
CREATE TABLE "AiReport" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiReport_userId_year_month_createdAt_idx" ON "AiReport"("userId", "year", "month", "createdAt");

-- CreateIndex
CREATE INDEX "AiReport_userId_createdAt_idx" ON "AiReport"("userId", "createdAt");

