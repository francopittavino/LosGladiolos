-- AlterEnum
ALTER TYPE "EstadoReserva" ADD VALUE 'CANCELADA_MANUAL';

-- AlterTable
ALTER TABLE "Reserva" ADD COLUMN "motivoCancelacion" TEXT;

-- AlterTable: el plazo por defecto pasa de 24 hs a 1 hora.
ALTER TABLE "ConfiguracionGeneral" ALTER COLUMN "plazoVencimientoHoras" SET DEFAULT 1;

-- La fila singleton todavia tenia el default viejo: se pasa a 1 hora.
UPDATE "ConfiguracionGeneral" SET "plazoVencimientoHoras" = 1 WHERE "plazoVencimientoHoras" = 24;
