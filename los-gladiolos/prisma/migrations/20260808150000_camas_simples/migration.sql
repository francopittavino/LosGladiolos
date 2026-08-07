-- AlterTable
ALTER TABLE "Reserva" ADD COLUMN "camasSimples" INTEGER;

-- Con 5 personas la distribucion es fija: 1 matrimonial + 3 simples.
UPDATE "Reserva" SET "camaMatrimonial" = true, "camasSimples" = 3 WHERE "cantPersonas" = 5;

-- El resto de las reservas anteriores a este cambio nunca eligio distribucion
-- con el criterio nuevo (el default viejo era "matrimonial" automatico para 2
-- personas). Se dejan sin dato en vez de inventarles una.
UPDATE "Reserva" SET "camaMatrimonial" = NULL, "camasSimples" = NULL WHERE "cantPersonas" <> 5;
