-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE INDEX "Category_sortOrder_idx" ON "Category"("sortOrder");

-- Seed default categories
INSERT INTO "Category" ("id", "name", "sortOrder", "createdAt", "updatedAt")
VALUES
  ('cat_process', 'Process', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cat_product', 'Product', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cat_other', 'Other', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
