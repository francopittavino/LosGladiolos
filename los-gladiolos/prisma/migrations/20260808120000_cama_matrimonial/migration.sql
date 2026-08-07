-- AlterTable: solo aplica a reservas de 2 personas, por eso es nullable.
ALTER TABLE "Reserva" ADD COLUMN "camaMatrimonial" BOOLEAN;

-- Las reservas de 2 personas que ya existian quedan con el default acordado.
UPDATE "Reserva" SET "camaMatrimonial" = true WHERE "cantPersonas" = 2;
