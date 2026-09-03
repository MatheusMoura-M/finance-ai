-- CreateTable
CREATE TABLE "KeepAlive" (
    "id" TEXT NOT NULL,
    "pingCount" INTEGER NOT NULL DEFAULT 0,
    "pingedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT,

    CONSTRAINT "KeepAlive_pkey" PRIMARY KEY ("id")
);
