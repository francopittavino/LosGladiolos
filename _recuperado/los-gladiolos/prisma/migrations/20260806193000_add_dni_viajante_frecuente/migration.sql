-- AlterTable
ALTER TABLE "ViajanteFrecuente" ADD COLUMN "numeroDni" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ViajanteFrecuente_numeroDni_key" ON "ViajanteFrecuente"("numeroDni");
