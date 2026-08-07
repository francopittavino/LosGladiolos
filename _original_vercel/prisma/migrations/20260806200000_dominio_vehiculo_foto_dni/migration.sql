-- RenameColumn
ALTER TABLE "ViajanteFrecuente" RENAME COLUMN "claveIngresoFija" TO "dominioVehiculo";

-- AlterTable
ALTER TABLE "ViajanteFrecuente" ADD COLUMN "fotoDni" TEXT;
